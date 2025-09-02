# Features

This document lists the core and extended features of the meeting application.

---

## Core Features

- **Real-Time Meetings**: Audio, video, and screen sharing via LiveKit SFU.
- **Cross-Network Connectivity**: Reliable peer connections using STUN/TURN (CoTURN).
- **Desktop Client**: Built with Tauri + React for a native-like experience.

---

## Intelligence & Automation

- **Live Transcription**: Speech-to-text captions powered by Whisper (edge-based).
- **Meeting Summaries**: Automatic post-meeting summaries stored in the database.
- **OCR on Snapshots**: Extracts text from shared screen snapshots for searchable records.
- **Tagged Moments**: Users can flag and store important moments during meetings.

---

## Data & Storage

- **Persistent History**: All transcripts, summaries, and OCR results stored in Postgres.
- **Searchable Records**: Query across meeting history for quick reference.
- **Secure Storage**: Data is stored with access controls via backend APIs.

---

## Developer-Friendly

- **Local Simulation**: Full setup with Docker Compose (LiveKit, CoTURN, Postgres, Backend).
- **Modular Services**: Clear separation of media, processing, and storage layers.
- **Extensible Design**: Add new workers (e.g., sentiment analysis, keyword detection) easily.

---
