import asyncio
import logging
import json
import os
from pathlib import Path
from dotenv import load_dotenv
from livekit import rtc
from livekit.agents import JobContext, WorkerOptions, cli, AutoSubscribe, stt
from livekit.plugins import deepgram
from .publisher import publish_transcript

# Load environment variables from .env file
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("caption-agent")


async def entrypoint(job: JobContext):
    logger.info(f"Caption agent connecting to room: {job.room.name}")

    stt_provider = deepgram.STT()
    tasks = []
    start_time = asyncio.get_event_loop().time()

    async def _forward_transcription(
        stt_stream: stt.SpeechStream,
        participant: rtc.RemoteParticipant,
        track: rtc.Track,
    ):
        """Forward the transcription and publish to LiveKit + Kafka"""
        async for ev in stt_stream:
            try:
                # Check if alternatives list is empty
                if not ev.alternatives or len(ev.alternatives) == 0:
                    continue

                alt = ev.alternatives[0]

                if ev.type == stt.SpeechEventType.INTERIM_TRANSCRIPT:
                    print(f"[{participant.identity}] {alt.text}", end="\r")

                elif ev.type == stt.SpeechEventType.FINAL_TRANSCRIPT:
                    print(f"\n🎤 [{participant.identity}]: {alt.text}\n")
                    logger.info(f"📝 Final transcription: {alt.text[:50]}...")

                    current_time = asyncio.get_event_loop().time()
                    relative_ms = int((current_time - start_time) * 1000)

                    # Publish to LiveKit data channel + Kafka
                    await publish_transcript(
                        room=job.room,
                        participant=participant,
                        track_sid=track.sid,
                        text=alt.text,
                        start_ms=relative_ms,
                        end_ms=relative_ms + len(alt.text.split()) * 200,
                    )

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
            logger.info(f"🎙️ Starting transcription for {participant.identity}")
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
            logger.info(f"🔊 Subscribed to audio track from {participant.identity}")
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

    logger.info(f"✅ Caption agent ready in room: {job.room.name}")
    print(f"\n✅ Caption agent is now listening in room: {job.room.name}\n")


async def request_fnc(req):
    """Accept all room requests automatically"""
    logger.info(f"📥 Received job request for room: {req.room.name}")
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
