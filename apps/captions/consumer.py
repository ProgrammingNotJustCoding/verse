import asyncio
import json
import logging
import os
from dotenv import load_dotenv
from confluent_kafka import Consumer, KafkaError
import psycopg2
from psycopg2.extras import execute_values

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

KAFKA_BOOTSTRAP = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
KAFKA_TOPIC = "lk.transcriptions"
KAFKA_GROUP_ID = "captions-consumer"

DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "database": "verse_db",
    "user": "verse",
    "password": "verse_secret",
}


def get_db_connection():
    """Get PostgreSQL connection"""
    return psycopg2.connect(**DB_CONFIG)


def ensure_table_exists():
    """Verify captions table exists (managed by Drizzle migrations)"""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Just check if table exists, don't create it
    # The schema is managed by Drizzle ORM
    cursor.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_name = 'captions'
        );
    """)

    exists = cursor.fetchone()[0]

    if not exists:
        logger.error("❌ 'captions' table does not exist. Run database migrations first!")
        raise Exception("Database table 'captions' not found")

    cursor.close()
    conn.close()
    logger.info("✅ Database table verified")


def insert_caption(data):
    """Insert caption into database"""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Match the Drizzle schema: id, meeting_id, participant_identity, text, start_ms, end_ms, final, created_at
        cursor.execute("""
            INSERT INTO captions (
                meeting_id, participant_identity, text, start_ms, end_ms, final
            ) VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            data.get("meeting_id"),
            data.get("participant_identity"),
            data.get("text"),
            data.get("start_ms"),
            data.get("end_ms"),
            data.get("final", True),
        ))

        conn.commit()
        logger.info(f"✅ Inserted caption: {data.get('text', '')[:50]}...")

    except Exception as e:
        logger.error(f"❌ Failed to insert caption: {e}")
        conn.rollback()

    finally:
        cursor.close()
        conn.close()


def consume_messages():
    """Consume messages from Kafka and insert into database"""
    consumer = Consumer({
        'bootstrap.servers': KAFKA_BOOTSTRAP,
        'group.id': KAFKA_GROUP_ID,
        'auto.offset.reset': 'latest',
        'enable.auto.commit': True,
    })

    consumer.subscribe([KAFKA_TOPIC])
    logger.info(f"🎧 Listening to topic: {KAFKA_TOPIC}")

    try:
        while True:
            msg = consumer.poll(timeout=1.0)

            if msg is None:
                continue

            if msg.error():
                if msg.error().code() == KafkaError._PARTITION_EOF:
                    continue
                else:
                    logger.error(f"❌ Kafka error: {msg.error()}")
                    continue

            try:
                data = json.loads(msg.value().decode('utf-8'))
                logger.info(f"📩 Received: {data.get('text', '')[:50]}...")
                insert_caption(data)

            except Exception as e:
                logger.error(f"❌ Failed to process message: {e}")

    except KeyboardInterrupt:
        logger.info("👋 Shutting down consumer")

    finally:
        consumer.close()


if __name__ == "__main__":
    logger.info("🚀 Starting captions consumer")
    ensure_table_exists()
    consume_messages()
