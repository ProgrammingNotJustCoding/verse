import asyncio
import logging
import os
import json
from typing import Dict

from livekit import rtc
from livekit.agents import (
    AutoSubscribe,
    JobContext,
    WorkerOptions,
    cli,
    stt,
)
from livekit.plugins import deepgram
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("caption-agent")

async def entrypoint(job: JobContext):
    logger.info(f"Caption agent connecting to room: {job.room.name}")

    stt_provider = deepgram.STT()

    tasks = []

    async def _forward_transcription(
        stt_stream: stt.SpeechStream,
        participant: rtc.RemoteParticipant,
        track: rtc.Track,
    ):
        """Forward the transcription and log the transcript in the console"""
        async for ev in stt_stream:
            try:
                if ev.type == stt.SpeechEventType.INTERIM_TRANSCRIPT:
                    text = ev.alternatives[0].text
                    print(f"[{participant.identity}] {text}", end="\r")

                elif ev.type == stt.SpeechEventType.FINAL_TRANSCRIPT:
                    text = ev.alternatives[0].text
                    print(f"\n🎤 [{participant.identity}]: {text}\n")
                    logger.info(f"📝 Publishing transcription for {participant.identity}: {text}")

                    transcription_data = {
                        "participant_identity": participant.identity,
                        "track_sid": track.sid,
                        "text": text,
                        "final": True,
                        "timestamp": asyncio.get_event_loop().time(),
                    }

                    logger.info(f"📤 Publishing to topic: lk.transcription")
                    await job.room.local_participant.publish_data(
                        payload=json.dumps(transcription_data).encode('utf-8'),
                        topic="lk.transcription",
                        reliable=True,
                    )
                    logger.info(f"✅ Data published successfully")

            except Exception as e:
                logger.error(f"❌ Error publishing transcription: {e}", exc_info=True)

    async def transcribe_track(participant: rtc.RemoteParticipant, track: rtc.Track):
        """Transcribe audio from a track"""
        audio_stream = rtc.AudioStream(track)
        stt_stream = stt_provider.stream()

        stt_task = asyncio.create_task(
            _forward_transcription(stt_stream, participant, track)
        )
        tasks.append(stt_task)

        try:
            logger.info(f"Starting transcription for {participant.identity}")
            async for ev in audio_stream:
                stt_stream.push_frame(ev.frame)
        except Exception as e:
            logger.error(f"Error transcribing track: {e}", exc_info=True)
        finally:
            await stt_stream.aclose()
            logger.info(f"Stopped transcription for {participant.identity}")

    @job.room.on("track_subscribed")
    def on_track_subscribed(
        track: rtc.Track,
        publication: rtc.TrackPublication,
        participant: rtc.RemoteParticipant,
    ):
        if track.kind == rtc.TrackKind.KIND_AUDIO:
            logger.info(f"Subscribed to audio track from {participant.identity}")
            print(f"🔊 New audio track from {participant.identity}")
            tasks.append(asyncio.create_task(transcribe_track(participant, track)))

    @job.room.on("track_unsubscribed")
    def on_track_unsubscribed(
        track: rtc.Track,
        publication: rtc.TrackPublication,
        participant: rtc.RemoteParticipant,
    ):
        logger.info(f"Unsubscribed from audio track: {participant.identity}")

    await job.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    logger.info(f"Caption agent ready in room: {job.room.name}")
    print(f"\n✅ Caption agent is now listening in room: {job.room.name}\n")
    logger.info(f"🔑 Local participant identity: {job.room.local_participant.identity}")

async def request_fnc(req):
    """Accept all room requests automatically"""
    logger.info(f"Received job request for room: {req.room.name}")
    await req.accept(
        name="caption-agent",
        identity="caption-agent",
    )

if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            request_fnc=request_fnc,
        )
    )
