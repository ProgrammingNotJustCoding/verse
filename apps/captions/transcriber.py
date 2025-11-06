import asyncio
import logging
from livekit import rtc
from livekit.agents import stt
from livekit.plugins import deepgram
from .publisher import publish_transcript
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("transcriber")

# Initialize Deepgram STT
deepgram_stt = deepgram.STT()


async def transcribe_track(
    audio_track: rtc.RemoteAudioTrack,
    room: rtc.Room,
    participant: rtc.RemoteParticipant,
    kafka_producer,
):
    logger.info(f"Audio track subscribed – {audio_track.sid}")
    
    audio_stream = rtc.AudioStream(audio_track)
    stt_stream = deepgram_stt.stream()
    
    try:
        async def process_audio():
            """Process audio frames and push to STT"""
            async for frame in audio_stream:
                if stt_stream.closed:
                    logger.warning("STT stream closed, stopping audio processing")
                    break
                try:
                    stt_stream.push_frame(frame.frame)
                except RuntimeError as e:
                    if "is closed" in str(e):
                        logger.warning("STT stream closed while pushing frame")
                        break
                    raise
        
        async def process_transcriptions():
            """Process transcription events"""
            async for event in stt_stream:
                if event.alternatives:
                    text = event.alternatives[0].text
                    if text.strip():
                        logger.info(f"Transcription: {text}")
                        await publish_transcript(
                            room=room,
                            participant=participant,
                            track_sid=audio_track.sid,
                            text=text,
                            timestamp=event.end_time,
                        )
        
        # Run both tasks concurrently
        await asyncio.gather(
            process_audio(),
            process_transcriptions(),
            return_exceptions=True
        )
    
    except Exception as e:
        logger.error(f"Error in transcription: {e}", exc_info=True)
    finally:
        # Ensure proper cleanup
        try:
            await stt_stream.aclose()
        except:
            pass
        logger.info(f"Transcription ended for track {audio_track.sid}")