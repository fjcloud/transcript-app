# Build stage
FROM registry.access.redhat.com/ubi9/go-toolset:1.23 AS builder

# Copy Go source (default workdir is /opt/app-root/src with correct permissions)
COPY --chown=1001:0 server.go .

# Build the Go binary
RUN go build -o server server.go

# Final stage
FROM registry.access.redhat.com/ubi9/ubi-minimal:latest

WORKDIR /app

# Copy the binary from builder
COPY --from=builder /opt/app-root/src/server .

# Copy static files
COPY static/ ./static/

# Expose port
EXPOSE 8080

# Run the server
CMD ["./server"]

