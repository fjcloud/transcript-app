# Audio Transcription Application

A simple and elegant web application for audio transcription using Whisper AI. Record audio directly from your microphone or upload WAV files to get instant transcriptions.

## Features

- 🎙️ **Audio Recording**: Record audio directly from your browser
- 📁 **File Upload**: Upload existing WAV files
- 🌍 **Language Selection**: Choose the audio language for better transcription accuracy
- ✨ **AI Transcription**: Powered by OpenAI-compatible Whisper API
- 📝 **AI Summarization**: Get concise summaries of transcribed text using LLM
- 🎨 **Modern UI**: Clean, responsive design with great UX
- 🐳 **Container-Ready**: Easy deployment with Podman/Docker

## Architecture

- **Backend**: Go server (standard library only, ~300 lines)
  - Serves static files
  - Acts as a gateway to the transcription API
  - Acts as a gateway to the LLM API for summarization
- **Frontend**: Pure JavaScript with PatternFly UI
  - Red Hat PatternFly design system for professional UI
  - Audio recording with MediaRecorder API
  - WAV file conversion and upload
  - Real-time transcription display
  - AI-powered summarization

## Prerequisites

- Podman or Docker
- An OpenAI-compatible Whisper API endpoint (e.g., faster-whisper, whisper.cpp)
- An OpenAI-compatible LLM API endpoint (e.g., vLLM, Ollama, OpenAI API)

## Quick Start

### 1. Set the environment variables

```bash
export AUDIO_INFERENCE_URL=http://your-whisper-server:8000
export AUDIO_MODEL_NAME=whisper-1  # Optional, defaults to whisper-1
export LLM_INFERENCE_URL=http://your-llm-server:8000
export LLM_MODEL_NAME=gpt-3.5-turbo  # Optional, defaults to gpt-3.5-turbo
```

### 2. Build the application

```bash
make build
```

### 3. Run the application

```bash
make run
```

The application will be available at `http://localhost:8080`

## Makefile Commands

| Command | Description |
|---------|-------------|
| `make build` | Build the container image |
| `make run` | Run the application |
| `make stop` | Stop and remove the container |
| `make clean` | Stop container and remove image |
| `make logs` | Show application logs |
| `make restart` | Restart the application |
| `make help` | Show available commands |

## Configuration

### Environment Variables

- **AUDIO_INFERENCE_URL** (required): URL of the OpenAI-compatible Whisper API server
  - Example: `http://localhost:8000`
  - The server expects the API to be available at `/v1/audio/transcriptions`

- **AUDIO_MODEL_NAME** (optional): Model name to use for transcription
  - Default: `whisper-1`
  - Example: `whisper-large-v3`, `whisper-medium`, etc.

- **LLM_INFERENCE_URL** (required): URL of the OpenAI-compatible LLM API server
  - Example: `http://localhost:8001`
  - The server expects the API to be available at `/v1/chat/completions`

- **LLM_MODEL_NAME** (optional): LLM model name to use for summarization
  - Default: `gpt-3.5-turbo`
  - Example: `gpt-4`, `llama3`, `mistral`, etc.

- **PORT** (optional): Port for the application (default: 8080)

## Usage

### Recording Audio

1. Click **"Start Recording"** to begin capturing audio
2. Click **"Stop Recording"** when finished
3. Review the recording using the playback controls
4. Optionally select the audio language from the dropdown (or leave as "Auto-detect")
5. Click **"Transcribe Audio"** to get the transcription

### Uploading Files

1. Click **"Choose WAV File"**
2. Select a WAV file from your computer
3. Optionally select the audio language from the dropdown (or leave as "Auto-detect")
4. Click **"Transcribe Audio"** to get the transcription

### Audio Language Selection (Optional Hint)

The language dropdown serves as an **optional hint** to improve transcription accuracy:
- **Auto-detect (default)**: Whisper automatically detects and transcribes in the original language
- **Specific language**: Provide a hint about the audio's spoken language for better accuracy

**Important**: 
- This parameter does **NOT translate** the audio
- The transcription will always be in the **same language as the audio**
- Whisper can only translate TO English (not implemented in this app)
- The language hint simply helps Whisper recognize the correct language faster and more accurately

### Viewing Results

- The transcription appears in a text box (plain text format)
- Click **"Summarize"** to generate an AI summary of the transcription
- The summary displays with rich Markdown formatting:
  - **Bold text**, *italic text*
  - Headers and subheaders
  - Bullet lists and numbered lists
  - Inline code formatting
- Click **"Copy to Clipboard"** to copy the transcription text
- Click **"Copy Summary"** to copy the summary text (plain text)
- Click **"New Transcription"** to start over

## API Endpoints

The Go server exposes the following endpoints:

- `GET /` - Main application page
- `GET /static/*` - Static files (CSS, JS)
- `POST /transcribe` - Transcription endpoint (proxy to Whisper API)
- `POST /summarize` - Summarization endpoint (proxy to LLM API)

## File Structure

```
transcript-app/
├── Dockerfile         # Multi-stage Docker build with Red Hat UBI9
├── Makefile          # Build and run commands
├── README.md         # This file
├── prompt.md         # Application specification
├── server.go         # Go backend server
└── static/
    ├── index.html    # Web interface
    ├── style.css     # Styling
    └── app.js        # Frontend logic
```

## Development

### Local Development (without container)

If you want to run the Go server locally without containers:

```bash
# Install Go 1.23+
# Set environment variables
export AUDIO_INFERENCE_URL=http://localhost:8000
export AUDIO_MODEL_NAME=whisper-1  # Optional
export LLM_INFERENCE_URL=http://localhost:8001
export LLM_MODEL_NAME=gpt-3.5-turbo  # Optional

# Run the server
go run server.go
```

### Testing with a Whisper API

You can use various Whisper API implementations:

1. **faster-whisper**: High-performance implementation
2. **whisper.cpp**: C++ implementation with HTTP server
3. **OpenAI Whisper API**: Official OpenAI API

Make sure your API is compatible with the OpenAI transcription endpoint format:

```bash
POST /v1/audio/transcriptions
Content-Type: multipart/form-data

file: <audio.wav>
model: whisper-1
```

### Testing with an LLM API

You can use various LLM API implementations:

1. **vLLM**: High-performance LLM serving
2. **Ollama**: Local LLM with OpenAI-compatible API
3. **LM Studio**: Local LLM with API server
4. **OpenAI API**: Official OpenAI API

Make sure your API is compatible with the OpenAI chat completions endpoint format:

```bash
POST /v1/chat/completions
Content-Type: application/json

{
  "model": "gpt-3.5-turbo",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant..."},
    {"role": "user", "content": "Summarize this text..."}
  ]
}
```

## Technical Details

### Backend (Go)

- Uses only Go standard library
- Handles multipart form uploads
- Proxies requests to Whisper API
- Serves static files efficiently

### Frontend (JavaScript)

- Pure vanilla JavaScript (no dependencies)
- MediaRecorder API for audio capture
- WAV encoding for browser compatibility
- Modern async/await patterns

### Container (Dockerfile)

- Multi-stage build with Red Hat UBI9 images
  - Build stage: `registry.access.redhat.com/ubi9/go-toolset:1.23`
  - Runtime stage: `registry.access.redhat.com/ubi9/ubi-minimal:latest`
- Handles UBI9 non-root user permissions correctly (UID 1001)
- Go 1.23 toolset for building
- Minimal runtime image for production
- No local Go development required

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (may need HTTPS for microphone)

**Note**: Microphone access requires HTTPS in production environments.

## Troubleshooting

### "AUDIO_INFERENCE_URL environment variable is required"

Make sure to set the required environment variables before running:
```bash
export AUDIO_INFERENCE_URL=http://your-whisper-server:8000
export LLM_INFERENCE_URL=http://your-llm-server:8001
make run
```

### Microphone not working

- Check browser permissions for microphone access
- Ensure you're using HTTPS (required by most browsers)
- Try a different browser

### Transcription fails

- Verify the Whisper API is running and accessible
- Check the API endpoint format is correct
- Review logs with `make logs`

### Summarization fails

- Verify the LLM API is running and accessible
- Check that the LLM API endpoint supports the OpenAI chat completions format
- Ensure the LLM_URL is correctly set
- Review logs with `make logs`

### File upload fails

- Ensure the file is in WAV format
- Check file size (limit: 500MB)
- Verify the API server is responding

## License

MIT License - Feel free to use and modify as needed.

## Contributing

This is a simple application built with standard libraries only. Feel free to fork and customize for your needs!

