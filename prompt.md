# Audio Transcription Application

## Overview
Create a simple audio transcription application consisting of a Go backend server and a pure JavaScript frontend. The application allows users to record or upload WAV audio files, transcribe them using an OpenAI-compatible Whisper API, and generate summaries using an OpenAI-compatible LLM API.

## Architecture

### Backend - Go Server
- **Purpose**: 
  - Serve static files (HTML, CSS, JavaScript)
  - Act as a gateway/proxy to the transcription API
  - Act as a gateway/proxy to the LLM API for summarization
- **Requirements**:
  - Use only Go standard library (no external dependencies)
  - Keep code simple and concise (under 300 lines)
  - Handle WAV file uploads from the frontend
  - Forward transcription requests to the Whisper API endpoint: `v1/audio/transcriptions`
  - Forward summarization requests to the LLM API endpoint: `v1/chat/completions`
  - Return transcription and summarization results to the frontend
- **Environment Variables**:
  - `INFERENCE_URL`: The HTTP URL of the Whisper inference server (e.g., `http://localhost:8000`)
  - `MODEL_NAME`: The model name to use for transcription (default: `whisper-1`)
  - `LLM_URL`: The HTTP URL of the LLM server (e.g., `http://localhost:8001`)
  - `LLM_MODEL`: The LLM model name to use for summarization (default: `gpt-3.5-turbo`)

### Frontend - Pure JavaScript with PatternFly
- **Purpose**: Provide a professional, Red Hat-branded web interface for audio transcription and summarization
- **UI Framework**: PatternFly 5 (Red Hat's design system)
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
  5. **Summarization**:
     - Button to generate a summary of the transcribed text
     - Send transcription text to the Go server for LLM processing
     - Display summary results
     - Copy summary to clipboard
- **Requirements**:
  - Use only vanilla JavaScript (no frameworks)
  - Use PatternFly 5 CSS framework via CDN for Red Hat branding
  - Create a professional, enterprise-grade design
  - Follow Red Hat design patterns and guidelines
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

### LLM API Endpoint
- **Endpoint**: `/v1/chat/completions`
- **Method**: POST
- **Format**: OpenAI-compatible API
- **Input**: JSON with messages
- **Required fields**:
  - `model`: Model name (from LLM_MODEL env var)
  - `messages`: Array of message objects with role and content
- **Output**: JSON with summary in choices[0].message.content

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
4. `POST /summarize`: Proxy endpoint that:
   - Receives JSON with `text` field from frontend
   - Creates OpenAI-compatible chat completion request
   - Forwards to `{LLM_URL}/v1/chat/completions`
   - Includes model name from LLM_MODEL environment variable
   - Includes system and user prompts for summarization
   - Returns summary result

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

### Transcription Flow
1. User opens the web application
2. User either:
   - Clicks "Record" → records audio → stops recording → gets WAV file
   - Clicks "Upload" → selects a WAV file from their computer
3. User selects the audio language from dropdown (or leaves as "Auto-detect")
4. User clicks "Transcribe"
5. Frontend sends WAV file and language to Go server (`POST /transcribe`)
6. Go server forwards request with language parameter to Whisper API
7. Transcription result is returned and displayed to the user

### Summarization Flow
1. After transcription is displayed, user clicks "Summarize" button
2. Frontend sends transcription text as JSON to Go server (`POST /summarize`)
3. Go server creates OpenAI-compatible chat completion request with:
   - System prompt: Instructions for summarization task
   - User prompt: The transcription text to summarize
4. Go server forwards request to LLM API endpoint
5. LLM generates a concise summary of the transcription
6. Summary result is returned and displayed to the user
7. User can copy the summary to clipboard

