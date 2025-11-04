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
    timestamp: float,
):
    """Publish to LiveKit data channel + Kafka"""
    data = {
        "room": room.name,
        "meeting_id": room.name,  # For database storage
        "participant_identity": participant.identity,
        "track_sid": track_sid,
        "text": text,
        "final": True,
        "timestamp": timestamp,
        "start_ms": None,  # TODO: Calculate from timestamp
        "end_ms": None,  # TODO: Calculate from timestamp
    }

    try:
        await room.local_participant.publish_data(
            payload=json.dumps(data).encode("utf-8"),
            topic="lk.transcription",
            reliable=True,
        )
        logger.info(f"Published to LiveKit data channel")
    except Exception as e:
        logger.error(f"LiveKit publish error: {e}")

    try:
        KafkaProducer().produce(
            topic=KAFKA_TOPIC,
            key=room.name,
            value=data,
        )
        logger.info(f"Produced to Kafka topic {KAFKA_TOPIC}")
    except Exception as e:
        logger.error(f"Kafka produce error: {e}")
