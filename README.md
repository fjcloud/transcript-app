# Audio Transcription Application

A simple and elegant web application for audio transcription using Whisper AI. Record audio directly from your microphone or upload WAV files to get instant transcriptions.

## Features

- 🎙️ **Audio Recording**: Record audio directly from your browser
- 📁 **File Upload**: Upload existing WAV files
- 🌍 **Language Selection**: Choose the audio language for better transcription accuracy
- ✨ **AI Transcription**: Powered by OpenAI-compatible Whisper API
- 🎨 **Modern UI**: Clean, responsive design with great UX
- 🐳 **Container-Ready**: Easy deployment with Podman/Docker

## Architecture

- **Backend**: Go server (standard library only, <200 lines)
  - Serves static files
  - Acts as a gateway to the transcription API
- **Frontend**: Pure JavaScript (no frameworks)
  - Audio recording with MediaRecorder API
  - WAV file conversion and upload
  - Real-time transcription display

## Prerequisites

- Podman or Docker
- An OpenAI-compatible Whisper API endpoint (e.g., faster-whisper, whisper.cpp)

## Quick Start

### 1. Set the environment variables

```bash
export INFERENCE_URL=http://your-whisper-server:8000
export MODEL_NAME=whisper-1  # Optional, defaults to whisper-1
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

- **INFERENCE_URL** (required): URL of the OpenAI-compatible Whisper API server
  - Example: `http://localhost:8000`
  - The server expects the API to be available at `/v1/audio/transcriptions`

- **MODEL_NAME** (optional): Model name to use for transcription
  - Default: `whisper-1`
  - Example: `whisper-large-v3`, `whisper-medium`, etc.

- **PORT** (optional): Port for the application (default: 8080)

## Usage

### Recording Audio

1. Click **"Start Recording"** to begin capturing audio
2. Click **"Stop Recording"** when finished
3. Review the recording using the playback controls
4. Select the audio language from the dropdown (or leave as "Auto-detect")
5. Click **"Transcribe Audio"** to get the transcription

### Uploading Files

1. Click **"Choose WAV File"**
2. Select a WAV file from your computer
3. Select the audio language from the dropdown (or leave as "Auto-detect")
4. Click **"Transcribe Audio"** to get the transcription

### Language Selection

The application supports selecting the source language of your audio for more accurate transcription:
- **Auto-detect**: Let Whisper automatically detect the language
- **Specific language**: Choose from 15+ supported languages including English, French, Spanish, German, Chinese, Japanese, and more

Selecting the correct language helps avoid automatic translation and ensures the transcription is in the original language.

### Viewing Results

- The transcription appears in a text box
- Click **"Copy to Clipboard"** to copy the text
- Click **"New Transcription"** to start over

## API Endpoint

The Go server exposes the following endpoints:

- `GET /` - Main application page
- `GET /static/*` - Static files (CSS, JS)
- `POST /transcribe` - Transcription endpoint (proxy to Whisper API)

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
export INFERENCE_URL=http://localhost:8000
export MODEL_NAME=whisper-1  # Optional

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

### "INFERENCE_URL environment variable is required"

Make sure to set the `INFERENCE_URL` before running:
```bash
export INFERENCE_URL=http://your-server:8000
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

### File upload fails

- Ensure the file is in WAV format
- Check file size (limit: 100MB)
- Verify the API server is responding

## License

MIT License - Feel free to use and modify as needed.

## Contributing

This is a simple application built with standard libraries only. Feel free to fork and customize for your needs!

