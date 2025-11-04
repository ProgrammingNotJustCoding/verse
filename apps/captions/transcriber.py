import asyncio
import logging
import os

from dotenv import load_dotenv
from livekit import rtc
from livekit.agents import stt
from livekit.plugins import deepgram

from .publisher import publish_transcript

load_dotenv()

logger = logging.getLogger("transcriber")

# Check Deepgram API key
deepgram_key = os.getenv("DEEPGRAM_API_KEY")
if not deepgram_key or deepgram_key == "your_deepgram_api_key_here":
    logger.error("❌ DEEPGRAM_API_KEY not set or using placeholder value!")
    logger.error("   Please set a valid Deepgram API key in .env file")
else:
    logger.info(f"✓ DEEPGRAM_API_KEY found (length: {len(deepgram_key)})")

# Initialize Deepgram STT
logger.info("🔧 Initializing Deepgram STT...")
try:
    # Configure Deepgram with explicit options
    deepgram_stt = deepgram.STT(
        model="nova-2",
        language="en-US",
        interim_results=True,
        punctuate=True,
        smart_format=True,
    )
    logger.info("✅ Deepgram STT initialized successfully")
    logger.info("   Model: nova-2")
    logger.info("   Language: en-US")
    logger.info("   Interim results: True")
except Exception as e:
    logger.error(f"❌ Failed to initialize Deepgram STT: {e}", exc_info=True)
    raise


async def transcribe_track(
    audio_track: rtc.RemoteAudioTrack,
    room: rtc.Room,
    participant: rtc.RemoteParticipant,
    kafka_producer,
):
    logger.info(f"🎤 Audio track subscribed – {audio_track.sid}")
    logger.info(f"   Participant: {participant.identity} ({participant.name})")
    logger.info(f"   Room: {room.name}")

    # Check track state
    logger.info(f"   Track kind: {audio_track.kind}")
    logger.info(f"   Track SID: {audio_track.sid}")

    # Wait a bit for the track to become active
    await asyncio.sleep(0.5)

    audio_stream = rtc.AudioStream(audio_track)
    logger.info(f"✓ Audio stream created")

    try:
        logger.info("🔄 Creating Deepgram STT stream...")
        stt_stream = deepgram_stt.stream()
        logger.info(f"✓ Deepgram STT stream created")

        # Wait a moment for stream to initialize
        await asyncio.sleep(0.1)

        # Check stream state
        logger.info(f"   Stream object type: {type(stt_stream)}")
        logger.info(f"   Stream has 'closed' attr: {hasattr(stt_stream, 'closed')}")
        if hasattr(stt_stream, "closed"):
            logger.info(f"   Stream state: closed={stt_stream.closed}")
        if hasattr(stt_stream, "_closed"):
            logger.info(f"   Stream state: _closed={stt_stream._closed}")

        # Try to get more stream info
        logger.info(
            f"   Stream attributes: {[a for a in dir(stt_stream) if not a.startswith('_')]}"
        )
    except Exception as e:
        logger.error(f"❌ Failed to create Deepgram STT stream: {e}", exc_info=True)
        raise

    frame_count = 0
    transcription_count = 0

    try:

        async def process_audio():
            """Process audio frames and push to STT"""
            nonlocal frame_count
            logger.info("📡 Starting audio processing loop...")
            logger.info("   Waiting for audio frames...")

            # Add timeout check
            start_time = asyncio.get_event_loop().time()
            timeout = 5.0  # 5 seconds to receive first frame
            first_frame_received = False

            async for frame in audio_stream:
                if not first_frame_received:
                    elapsed = asyncio.get_event_loop().time() - start_time
                    logger.info(f"🎉 First audio frame received after {elapsed:.2f}s")
                    first_frame_received = True

                frame_count += 1
                if frame_count % 100 == 0:
                    logger.info(f"📊 Processed {frame_count} audio frames")

                try:
                    if frame_count == 1:
                        logger.info(f"🔄 Pushing first frame to Deepgram...")
                        logger.info(f"   Frame sample rate: {frame.frame.sample_rate}")
                        logger.info(f"   Frame channels: {frame.frame.num_channels}")
                        logger.info(
                            f"   Frame samples per channel: {frame.frame.samples_per_channel}"
                        )
                        logger.info(f"   Frame data size: {len(frame.frame.data)}")

                    stt_stream.push_frame(frame.frame)

                    if frame_count == 1:
                        logger.info(f"✅ First frame pushed to Deepgram successfully!")
                except RuntimeError as e:
                    if "is closed" in str(e):
                        logger.warning(
                            f"⚠️ STT stream closed while pushing frame #{frame_count}"
                        )
                        logger.warning(f"   Error message: {str(e)}")
                        break
                    logger.error(
                        f"❌ RuntimeError pushing frame #{frame_count}: {e}",
                        exc_info=True,
                    )
                    raise
                except Exception as e:
                    logger.error(
                        f"❌ Error pushing frame #{frame_count} to Deepgram: {e}",
                        exc_info=True,
                    )
                    raise

            if not first_frame_received:
                logger.error(
                    "❌ No audio frames received! Audio stream ended without data."
                )
            logger.info(f"✓ Audio processing ended. Total frames: {frame_count}")

        async def process_transcriptions():
            """Process transcription events"""
            nonlocal transcription_count
            logger.info("👂 Starting transcription processing loop...")
            logger.info(f"   Waiting for Deepgram events...")
            event_count = 0
            try:
                async for event in stt_stream:
                    event_count += 1
                    logger.info(f"📥 Received STT event #{event_count} from Deepgram")
                    logger.info(f"   Event type: {type(event)}")
                    logger.info(f"   Event attributes: {dir(event)}")

                    if hasattr(event, "alternatives") and event.alternatives:
                        logger.info(
                            f"   Number of alternatives: {len(event.alternatives)}"
                        )
                        text = event.alternatives[0].text
                        logger.info(f"   Raw text: '{text}'")
                        logger.info(f"   Text length: {len(text)}")
                        logger.info(f"   Is final: {getattr(event, 'is_final', 'N/A')}")

                        if text.strip():
                            transcription_count += 1
                            logger.info(
                                f"💬 Transcription #{transcription_count}: {text}"
                            )
                            await publish_transcript(
                                room=room,
                                participant=participant,
                                track_sid=audio_track.sid,
                                text=text,
                                timestamp=event.end_time
                                if hasattr(event, "end_time")
                                else 0.0,
                            )
                        else:
                            logger.warning(
                                f"⚠️ Empty transcription text received (only whitespace)"
                            )
                    else:
                        logger.warning(f"⚠️ No alternatives in STT event")
                        logger.info(f"   Event content: {event}")
            except Exception as e:
                logger.error(
                    f"❌ Error in transcription processing loop: {e}", exc_info=True
                )

            logger.info(
                f"✓ Transcription processing ended. Events received: {event_count}, Transcriptions: {transcription_count}"
            )

        # Run both tasks concurrently
        logger.info("🚀 Starting concurrent audio and transcription tasks...")
        results = await asyncio.gather(
            process_audio(), process_transcriptions(), return_exceptions=True
        )

        # Check if any task returned an exception
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(
                    f"❌ Task {i} failed with exception: {result}", exc_info=result
                )

    except Exception as e:
        logger.error(f"❌ Error in transcription: {e}", exc_info=True)
    finally:
        # Ensure proper cleanup
        logger.info(f"🧹 Cleaning up transcription resources...")
        try:
            await stt_stream.aclose()
            logger.info(f"✓ STT stream closed")
        except Exception as cleanup_error:
            logger.error(f"Error closing STT stream: {cleanup_error}")
        logger.info(f"✅ Transcription ended for track {audio_track.sid}")
        logger.info(f"   Total audio frames: {frame_count}")
        logger.info(f"   Total transcriptions: {transcription_count}")
