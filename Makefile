.PHONY: build run stop clean logs

IMAGE_NAME := transcript-app
CONTAINER_NAME := transcript-app-container
PORT := 8080

build:
	@echo "Building Docker image..."
	podman build -t $(IMAGE_NAME) .

run:
	@echo "Starting application..."
	@if [ -z "$$INFERENCE_URL" ]; then \
		echo "Error: INFERENCE_URL environment variable is required"; \
		echo "Example: export INFERENCE_URL=http://localhost:8000"; \
		exit 1; \
	fi
	podman run -d \
		--name $(CONTAINER_NAME) \
		-p $(PORT):8080 \
		-e INFERENCE_URL=$$INFERENCE_URL \
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
	@echo "  make run      - Run the application (requires INFERENCE_URL)"
	@echo "  make stop     - Stop and remove the container"
	@echo "  make clean    - Stop container and remove image"
	@echo "  make logs     - Show application logs"
	@echo "  make restart  - Restart the application"
	@echo ""
	@echo "Environment variables:"
	@echo "  INFERENCE_URL - URL of the inference server (required)"
	@echo ""
	@echo "Example usage:"
	@echo "  export INFERENCE_URL=http://localhost:8000"
	@echo "  make build"
	@echo "  make run"

