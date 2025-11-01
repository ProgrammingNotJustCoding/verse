Nice — below you’ll get a practical, copy-pasteable setup:

1. a `docker-compose.yml` that runs a whisper.cpp-based transcription server (one of the community Docker images that exposes a simple HTTP/WebSocket API), plus instructions to place the ggml model file; and
2. a Node.js WebSocket client that streams 16 kHz mono PCM (the format whisper servers expect) and prints streaming transcripts. I also explain exactly how to swap the mic stream with decoded LiveKit audio frames (so you can plug this into your LiveKit Agent).

I looked up the common community servers and docs for whisper.cpp + whisper servers (whisper.cpp repo and community Docker images / whisper-server). ([GitHub][1])

---

# 1) Docker Compose for whisper.cpp transcription server

This example uses a community Docker image that wraps `whisper.cpp` into an HTTP/WebSocket transcription server (many projects do this; one popular is `evilfreelancer/whisper-server`). Change the image if you prefer another server (e.g., `hognir/whisper-cpp`, `asif18061996/whisper-cpp-server`, or build your own from ggml/whisper.cpp). You must download a ggml model file and mount it into the container.

Create `docker-compose.yml`:

```yaml
version: "3.8"

services:
  whisper-server:
    image: evilfreelancer/whisper-server:latest
    container_name: whisper-server
    restart: unless-stopped
    # change published port if you like
    ports:
      - "9000:9000"
    volumes:
      # where you'll place the ggml model file(s)
      - ./models:/models
    environment:
      # adjust model filename to whatever you download
      WHISPER_MODEL: "/models/ggml-base.en.bin"
      # optional: set CPU/GPU flags according to image docs
      # WHISPER_THREADS: "4"
      # WHISPER_USE_GPU: "1"
    shm_size: "1g"
```

Steps to prepare & run:

1. make a directory next to the compose file: `mkdir models`
2. download a ggml whisper model (examples: `ggml-base.en.bin`, `ggml-small.bin`, `ggml-large.binf16` etc) and put it in `./models/`. Official repo + releases: `https://github.com/ggerganov/whisper.cpp` — pick a model from community links / releases (smaller models = less RAM/CPU). ([GitHub][1])
   Example (pseudo): `wget -O ./models/ggml-base.en.bin https://huggingface.co/…/ggml-base.en.bin` (source depends on model host)
3. `docker compose up -d`
4. server should be reachable at `http://localhost:9000/` (check server README for exact endpoints — many provide a `/transcribe` HTTP endpoint and a `/ws` or `/stream` WebSocket endpoint).

> Note: If you prefer building your own server image from `whisper.cpp` (for full control), see the whisper.cpp repo and community guides on creating a container image. ([GitHub][1])

---

# 2) Node.js example — streaming PCM to the whisper server via WebSocket

This example will:

* read 16 kHz, 16-bit, signed PCM from stdin (but I also show how to capture a mic stream),
* open a WebSocket to the whisper server, stream audio chunks, and log transcripts as they come back.

Install dependencies:

```bash
npm init -y
npm i ws node-record-lpcm16
```

`client_stream_to_whisper.js`:

```js




const fs = require('fs');
const WebSocket = require('ws');
const record = require('node-record-lpcm16');


const WS_URL = 'ws://localhost:9000/ws'; 

const ws = new WebSocket(WS_URL);

ws.on('open', () => {
  console.log('WS connected to whisper server', WS_URL);

  
  
  const mic = record.start({
    sampleRate: 16000,
    channels: 1,
    
    
  });

  mic.on('data', (chunk) => {
    
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(chunk);
    }
  });

  mic.on('error', (err) => {
    console.error('mic error', err);
  });

  
  
  

  
  
});

ws.on('message', (msg) => {
  
  let parsed;
  try {
    parsed = JSON.parse(msg.toString());
  } catch (e) {
    console.log('raw msg', msg.toString());
    return;
  }
  
  if (parsed.text) {
    console.log(`[${parsed.type || 'transcript'}]`, parsed.text);
  } else {
    console.log('server:', parsed);
  }
});

ws.on('close', () => console.log('WS closed'));
ws.on('error', (err) => console.error('WS err', err));
```

How to run:

```bash
node client_stream_to_whisper.js
# speak into mic — you should see partial and final transcript messages printed
```

**Important:** different whisper server wrappers expect different WS APIs and control messages. Inspect your chosen server's README for the exact handshake messages and finalization control (some require JSON control frames to start/stop, others accept raw PCM and return transcripts). I used a generic approach here — adapt per your server.

(If your server expects HTTP streaming instead of WS, same idea: POST audio chunks on a streaming request, parse SSE/response.)

Sources for similar community servers and WS approaches: community dockerized “whisper-server” wrappers and guides. ([Docker Hub][2])

---

# 3) How to wire this into your LiveKit agent (the key changes)

You said you already run LiveKit locally in Docker. The agent’s job is to:

1. join the LiveKit room as a headless participant,
2. subscribe to the *published audio track(s)*,
3. decode track audio (often encoded as Opus in RTP) into 16 kHz mono PCM16LE,
4. forward PCM chunks into the whisper server WS (exact same streaming logic as the mic example),
5. receive transcripts and publish them into the room (via data messages or a text track).

Concretely:

* Replace the microphone source in the Node example (`node-record-lpcm16`) with a PCM stream you get by decoding the LiveKit audio track. On the Node agent you can decode Opus to PCM using `prism-media` or `@discordjs/opus`/`opusscript` + `prism-media`. Example flow:

  * use LiveKit SDK to subscribe to audio track frames,
  * pipe the frames into `prism-media` `OpusDecorder` → resample to 16k (Prism can decode to PCM but you may need `sox`/`ffmpeg` or `prism-media`'s `FFmpeg` transform to resample).
* Use the same WS client (opened once per agent/session) to send decoded PCM to your whisper server and parse the JSON transcripts returned.
* Publish transcripts back to LiveKit as `localParticipant.publishData()` or send them to your app backend.

Example pseudo for the replace-mic step (very condensed):

```js

const { OpusDecorder } = require('prism-media');

const opusStream = getOpusReadableFromLiveKitTrack(track); 

const decoder = new OpusDecorder({ frameSize: 960, channels: 1, rate: 48000 }); 
const ffmpeg = new FFmpeg({ args: ['-ar', '16000', '-ac', '1', '-f', 's16le'] }); 

opusStream.pipe(decoder).pipe(ffmpeg).on('data', (pcmChunk) => {
  ws.send(pcmChunk);
});
```

I kept that as pseudo because exact LiveKit SDK APIs and how audio frames are exposed vary by SDK and version. But the guaranteed steps are: **get opus frames -> decode -> resample -> send 16k PCM**.

If you want, I can:

* produce a **full Node LiveKit Agent example** (with exact package names, using `livekit-client` / `livekit-server-sdk` and `prism-media` + a tested pipeline that decodes a subscribed track and streams to the whisper-server WS) — I’ll pick specific package versions and produce runnable code; **or**
* produce a **full example that uses a specific whisper server implementation** (I can use `evilfreelancer/whisper-server` or `faster-whisper-server`) and tailor the WS control messages exactly to that server.

Which do you want me to produce now? (I recommend the full LiveKit Agent example + V1 whisper-server integration so you can run end-to-end.)

[1]: https://github.com/ggml-org/whisper.cpp?utm_source=chatgpt.com "ggml-org/whisper.cpp"
[2]: https://hub.docker.com/r/evilfreelancer/whisper-server?utm_source=chatgpt.com "evilfreelancer/whisper-server - Docker Image"
