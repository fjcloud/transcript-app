# Audio Transcription Application

## Overview
Create a simple audio transcription application consisting of a Go backend server and a pure JavaScript frontend. The application allows users to record or upload WAV audio files and transcribe them using an OpenAI-compatible Whisper API.

## Architecture

### Backend - Go Server
- **Purpose**: 
  - Serve static files (HTML, CSS, JavaScript)
  - Act as a gateway/proxy to the transcription API
- **Requirements**:
  - Use only Go standard library (no external dependencies)
  - Keep code simple and concise (under 200 lines)
  - Handle WAV file uploads from the frontend
  - Forward transcription requests to the Whisper API endpoint: `v1/audio/transcriptions`
  - Set HTTP client timeout to 3 minutes for long transcriptions
  - Return transcription results to the frontend
- **Environment Variables**:
  - `INFERENCE_URL`: The HTTP URL of the inference server (e.g., `http://localhost:8000`)
  - `MODEL_NAME`: The model name to use for transcription (default: `whisper-1`)

### Frontend - Pure JavaScript
- **Purpose**: Provide a simple, beautiful web interface for audio transcription
- **Features**:
  1. **Audio Recording**:
     - Request microphone permissions from the user
     - Record audio directly from the computer's microphone
     - Save recording as WAV format locally
  2. **File Upload**:
     - Allow users to upload existing WAV files
  3. **Language Selection**:
     - Dropdown menu to select the source language of the audio
     - Option to auto-detect language (default)
     - Support for major languages (English, French, Spanish, etc.)
  4. **Transcription**:
     - Send WAV files to the Go server with selected language
     - Display transcription results
- **Requirements**:
  - Use only vanilla JavaScript (no frameworks or libraries)
  - Create a clean, modern, and user-friendly design
  - Keep the code simple and maintainable

## Build and Deployment

### Dockerfile
- Use Red Hat UBI9 images:
  - Build stage: `registry.access.redhat.com/ubi9/go-toolset:1.23`
  - Runtime stage: `registry.access.redhat.com/ubi9/ubi-minimal:latest`
- Build the Go server entirely within the container
- No local Go development required
- Multi-stage build for optimization
- Handle UBI9 permissions correctly (non-root user 1001)
- Final image should contain:
  - Compiled Go binary
  - Static files (HTML, CSS, JavaScript)

### Makefile
- Provide simple commands to:
  - `make build`: Build the container image
  - `make run`: Run the application
  - Include any other useful targets (clean, stop, etc.)

## API Integration

### Whisper API Endpoint
- **Endpoint**: `/v1/audio/transcriptions`
- **Method**: POST
- **Format**: OpenAI-compatible API
- **Input**: WAV audio file
- **Required fields**: 
  - `file`: WAV audio file
  - `model`: Model name (from MODEL_NAME env var)
- **Output**: JSON with transcription text

### Go Server Routes
1. `GET /`: Serve the main HTML page
2. `GET /static/*`: Serve static assets (CSS, JS)
3. `POST /transcribe`: Proxy endpoint that:
   - Receives WAV file from frontend
   - Receives optional language parameter from frontend
   - Forwards to `{INFERENCE_URL}/v1/audio/transcriptions`
   - Includes model name from MODEL_NAME environment variable
   - Includes language code if provided by user
   - Returns transcription result

## Technical Specifications

### Audio Format
- Format: WAV (Waveform Audio File Format)
- Encoding: PCM (recommended)
- Sample rate: Standard audio sample rates (16kHz, 44.1kHz, or 48kHz)

### Error Handling
- Handle network errors gracefully
- Display user-friendly error messages
- Validate file types (WAV only)
- Handle microphone permission denials

### Security Considerations
- Validate file size limits
- Sanitize user inputs
- Use appropriate CORS headers if needed
- Environment variable validation

## Development Guidelines

1. **Simplicity First**: Keep the codebase minimal and easy to understand
2. **No External Dependencies**: Use only standard libraries for both Go and JavaScript
3. **Container-Only Build**: All Go compilation happens inside the container
4. **Modern UI**: Create an attractive, responsive interface with good UX
5. **Clear Error Messages**: Provide helpful feedback to users

## Expected File Structure
```
transcript-app/
├── Dockerfile
├── Makefile
├── server.go
├── static/
│   ├── index.html
│   ├── style.css
│   └── app.js
└── README.md
```

## Usage Flow
1. User opens the web application
2. User either:
   - Clicks "Record" → records audio → stops recording → gets WAV file
   - Clicks "Upload" → selects a WAV file from their computer
3. User selects the audio language from dropdown (or leaves as "Auto-detect")
4. User clicks "Transcribe"
5. Frontend sends WAV file and language to Go server (`POST /transcribe`)
6. Go server forwards request with language parameter to Whisper API
7. Transcription result is returned and displayed to the user

