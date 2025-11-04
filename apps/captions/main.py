import sys
import asyncio
import logging
from livekit import rtc
from livekit.agents import JobContext, WorkerOptions, cli, AutoSubscribe

from .transcriber import transcribe_track

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("caption-agent")


async def entrypoint(job: JobContext):
    logger.info(f"Connecting to room: {job.room.name}")

    @job.room.on("track_subscribed")
    def on_track_subscribed(
        track: rtc.Track,
        publication: rtc.TrackPublication,
        participant: rtc.RemoteParticipant,
    ):
        if track.kind == rtc.TrackKind.KIND_AUDIO:
            logger.info(f"Audio track subscribed – {participant.identity}")
            asyncio.create_task(transcribe_track(participant, track, job.room))

    @job.room.on("track_unsubscribed")
    def on_track_unsubscribed(*args):
        logger.info("Audio track unsubscribed")

    await job.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    logger.info("Caption agent ready")


async def request_fnc(req):
    await req.accept(name="caption-agent", identity="caption-agent")


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, request_fnc=request_fnc))
