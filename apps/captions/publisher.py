import json
import logging
from livekit import rtc
from .kafka_producer import KafkaProducer

logger = logging.getLogger(__name__)

KAFKA_TOPIC = "lk.transcriptions"


async def publish_transcript(
    room: rtc.Room,
    participant: rtc.RemoteParticipant,
    track_sid: str,
    text: str,
    start_ms: int,
    end_ms: int,
):
    """Publish to LiveKit data channel + Kafka"""

    meeting_id = room.metadata or room.name.replace("meeting-", "")

    data = {
        "meeting_id": meeting_id,
        "participant_identity": participant.identity,
        "text": text,
        "start_ms": start_ms,
        "end_ms": end_ms,
        "final": True,
    }

    try:
        await room.local_participant.publish_data(
            payload=json.dumps(data).encode("utf-8"),
            topic="lk.transcription",
            reliable=True,
        )
        logger.info(f"✓ Published to LiveKit data channel")
    except Exception as e:
        logger.error(f"✗ LiveKit publish error: {e}")

    try:
        KafkaProducer().produce(
            topic=KAFKA_TOPIC,
            key=meeting_id,
            value=data,
        )
        logger.info(f"✓ Produced to Kafka: {text[:50]}...")
    except Exception as e:
        logger.error(f"✗ Kafka produce error: {e}")
