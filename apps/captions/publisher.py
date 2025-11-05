import json
import logging
import re
from livekit import rtc
from .kafka_producer import KafkaProducer

logger = logging.getLogger(__name__)

KAFKA_TOPIC = "lk.transcriptions"


def extract_meeting_id(room_name: str) -> str:
    """Extract UUID from room name like 'meeting-uuid-here'"""
    # Remove 'meeting-' prefix if present
    if room_name.startswith("meeting-"):
        return room_name.replace("meeting-", "", 1)
    return room_name

async def publish_transcript(
    room: rtc.Room,
    participant: rtc.RemoteParticipant,
    track_sid: str,
    text: str,
    start_ms: int,
    end_ms: int,
):
    """Publish to LiveKit data channel + Kafka"""

    # Extract meeting UUID from room name
    meeting_id = extract_meeting_id(room.name)

    data = {
        "meeting_id": meeting_id,
        "participant_identity": participant.identity,
        "participant_name": participant.name or participant.identity,
        "track_sid": track_sid,
        "text": text,
        "start_ms": start_ms,
        "end_ms": end_ms,
        "final": True,
        "timestamp": start_ms,
    }

    # Publish to LiveKit data channel
    try:
        await room.local_participant.publish_data(
            payload=json.dumps(data).encode("utf-8"),
            topic="lk.transcription",
            reliable=True,
        )
        logger.info(f"✅ Published to LiveKit: {text[:50]}...")
    except Exception as e:
        logger.error(f"❌ LiveKit publish error: {e}", exc_info=True)

    # Publish to Kafka
    try:
        kafka_producer = KafkaProducer()
        kafka_producer.produce(
            topic=KAFKA_TOPIC,
            key=meeting_id,
            value=data,
        )
        logger.info(f"✅ Produced to Kafka: {text[:50]}...")
    except Exception as e:
        logger.error(f"❌ Kafka produce error: {e}", exc_info=True)
