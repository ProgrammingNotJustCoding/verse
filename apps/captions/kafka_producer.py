import os
import json
import logging
from typing import Dict, Any
from confluent_kafka import Producer

logger = logging.getLogger(__name__)


class KafkaProducer:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            bootstrap = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
            cls._producer = Producer(
                {
                    "bootstrap.servers": bootstrap,
                    "message.max.bytes": 2_000_000,
                    "linger.ms": 10,  # Small delay to batch messages
                    "compression.type": "snappy",  # Compress messages
                }
            )
            logger.info(f"Kafka producer initialized – {bootstrap}")
        return cls._instance

    def produce(self, topic: str, key: str, value: Dict[str, Any]):
        """Produce a message to Kafka"""
        try:
            payload = json.dumps(value).encode("utf-8")
            self._producer.produce(
                topic,
                key=key.encode("utf-8"),
                value=payload,
                on_delivery=self._delivery_report,
            )
            # Poll to trigger delivery callbacks
            self._producer.poll(0)
        except Exception as e:
            logger.error(f"Failed to produce message: {e}", exc_info=True)

    def flush(self):
        """Flush pending messages"""
        self._producer.flush()

    @staticmethod
    def _delivery_report(err, msg):
        if err:
            logger.error(f"❌ Kafka delivery failed: {err}")
        else:
            logger.debug(
                f"✅ Kafka message delivered to {msg.topic()} [{msg.partition()}] @ offset {msg.offset()}"
            )
