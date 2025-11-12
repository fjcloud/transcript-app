.PHONY: build run stop clean logs restart help

IMAGE_NAME := transcript-app
CONTAINER_NAME := transcript-app-container
PORT := 8080

build:
	@echo "Building Docker image..."
	podman build -t $(IMAGE_NAME) .

run:
	@echo "Starting application..."
	@if [ -z "$$AUDIO_INFERENCE_URL" ]; then \
		echo "Error: AUDIO_INFERENCE_URL environment variable is required"; \
		echo "Example: export AUDIO_INFERENCE_URL=http://localhost:8000"; \
		exit 1; \
	fi
	@if [ -z "$$LLM_INFERENCE_URL" ]; then \
		echo "Error: LLM_INFERENCE_URL environment variable is required"; \
		echo "Example: export LLM_INFERENCE_URL=http://localhost:8001"; \
		exit 1; \
	fi
	podman run -d \
		--name $(CONTAINER_NAME) \
		-p $(PORT):8080 \
		-e AUDIO_INFERENCE_URL=$$AUDIO_INFERENCE_URL \
		-e AUDIO_MODEL_NAME=$${AUDIO_MODEL_NAME:-whisper-1} \
		-e LLM_INFERENCE_URL=$$LLM_INFERENCE_URL \
		-e LLM_MODEL_NAME=$${LLM_MODEL_NAME:-gpt-3.5-turbo} \
		$(IMAGE_NAME)
	@echo "Application started on http://localhost:$(PORT)"

stop:
	@echo "Stopping application..."
	@podman stop $(CONTAINER_NAME) 2>/dev/null || true
	@podman rm $(CONTAINER_NAME) 2>/dev/null || true
	@echo "Application stopped"

clean: stop
	@echo "Removing image..."
	@podman rmi $(IMAGE_NAME) 2>/dev/null || true
	@echo "Cleanup complete"

logs:
	@podman logs -f $(CONTAINER_NAME)

restart: stop run

help:
	@echo "Available commands:"
	@echo "  make build    - Build the Docker image"
	@echo "  make run      - Run the application (requires env vars)"
	@echo "  make stop     - Stop and remove the container"
	@echo "  make clean    - Stop container and remove image"
	@echo "  make logs     - Show application logs"
	@echo "  make restart  - Restart the application"
	@echo ""
	@echo "Required environment variables:"
	@echo "  AUDIO_INFERENCE_URL - URL of the Whisper inference server"
	@echo "  LLM_INFERENCE_URL   - URL of the LLM inference server"
	@echo ""
	@echo "Optional environment variables:"
	@echo "  AUDIO_MODEL_NAME    - Model name for transcription (default: whisper-1)"
	@echo "  LLM_MODEL_NAME      - Model name for summarization (default: gpt-3.5-turbo)"
	@echo ""
	@echo "Example usage:"
	@echo "  export AUDIO_INFERENCE_URL=http://localhost:8000"
	@echo "  export AUDIO_MODEL_NAME=whisper-large-v3"
	@echo "  export LLM_INFERENCE_URL=http://localhost:8001"
	@echo "  export LLM_MODEL_NAME=llama3"
	@echo "  make build"
	@echo "  make run"

