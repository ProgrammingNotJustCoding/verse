import asyncio
import logging
from livekit import rtc
from livekit.agents import stt
from livekit.plugins import deepgram
from .publisher import publish_transcript
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("transcriber")


async def transcribe_track(
    participant: rtc.RemoteParticipant,
    track: rtc.Track,
    room: rtc.Room,
):
    stt_provider = deepgram.STT()
    audio_stream = rtc.AudioStream(track)
    stt_stream = stt_provider.stream()

    start_time = asyncio.get_event_loop().time()

    async def _forward(ev: stt.SpeechEvent):
        alt = ev.alternatives[0]

        if ev.type == stt.SpeechEventType.INTERIM_TRANSCRIPT:
            print(f"[{participant.identity}] {alt.text}", end="\r")
        elif ev.type == stt.SpeechEventType.FINAL_TRANSCRIPT:
            print(f"\n[{participant.identity}]: {alt.text}\n")

            current_time = asyncio.get_event_loop().time()
            relative_ms = int((current_time - start_time) * 1000)

            await publish_transcript(
                room=room,
                participant=participant,
                track_sid=track.sid,
                text=alt.text,
                start_ms=relative_ms,
                end_ms=relative_ms + len(alt.text.split()) * 200,
            )

    async def _forward_transcription(stt_stream, participant, track):
        async for ev in stt_stream:
            await _forward(ev)

    stt_task = asyncio.create_task(
        _forward_transcription(stt_stream, participant, track)
    )

    try:
        async for frame in audio_stream:
            stt_stream.push_frame(frame.frame)
    finally:
        await stt_stream.aclose()
        stt_task.cancel()
