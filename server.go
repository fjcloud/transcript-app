package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

var inferenceURL string
var modelName string
var llmURL string
var llmModel string

func main() {
	inferenceURL = os.Getenv("INFERENCE_URL")
	if inferenceURL == "" {
		log.Fatal("INFERENCE_URL environment variable is required")
	}

	inferenceURL = strings.TrimSuffix(inferenceURL, "/")

	modelName = os.Getenv("MODEL_NAME")
	if modelName == "" {
		modelName = "whisper-1"
	}

	llmURL = os.Getenv("LLM_URL")
	if llmURL == "" {
		log.Fatal("LLM_URL environment variable is required")
	}

	llmURL = strings.TrimSuffix(llmURL, "/")

	llmModel = os.Getenv("LLM_MODEL")
	if llmModel == "" {
		llmModel = "gpt-3.5-turbo"
	}

	http.HandleFunc("/", serveIndex)
	http.HandleFunc("/static/", serveStatic)
	http.HandleFunc("/transcribe", transcribeHandler)
	http.HandleFunc("/summarize", summarizeHandler)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	log.Printf("Inference URL: %s", inferenceURL)
	log.Printf("Model name: %s", modelName)
	log.Printf("LLM URL: %s", llmURL)
	log.Printf("LLM model: %s", llmModel)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatal(err)
	}
}

func serveIndex(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}
	http.ServeFile(w, r, "static/index.html")
}

func serveStatic(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Path[len("/static/"):]
	if path == "" {
		http.NotFound(w, r)
		return
	}

	// Prevent directory traversal
	if strings.Contains(path, "..") {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}

	fullPath := filepath.Join("static", path)

	// Set content type based on extension
	ext := filepath.Ext(path)
	switch ext {
	case ".html":
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
	case ".css":
		w.Header().Set("Content-Type", "text/css; charset=utf-8")
	case ".js":
		w.Header().Set("Content-Type", "application/javascript; charset=utf-8")
	}

	http.ServeFile(w, r, fullPath)
}

func transcribeHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse multipart form (max 100MB)
	if err := r.ParseMultipartForm(100 << 20); err != nil {
		http.Error(w, "Failed to parse form: "+err.Error(), http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "Failed to get file: "+err.Error(), http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Validate WAV file
	if !strings.HasSuffix(strings.ToLower(header.Filename), ".wav") {
		http.Error(w, "Only WAV files are supported", http.StatusBadRequest)
		return
	}

	// Create a new multipart form for the API request
	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)

	// Create form file
	formFile, err := writer.CreateFormFile("file", header.Filename)
	if err != nil {
		http.Error(w, "Failed to create form: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Copy file content
	if _, err := io.Copy(formFile, file); err != nil {
		http.Error(w, "Failed to copy file: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Add model field (required by OpenAI API)
	if err := writer.WriteField("model", modelName); err != nil {
		http.Error(w, "Failed to write field: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Add language field if provided
	language := r.FormValue("language")
	if language != "" {
		if err := writer.WriteField("language", language); err != nil {
			http.Error(w, "Failed to write language field: "+err.Error(), http.StatusInternalServerError)
			return
		}
	}

	if err := writer.Close(); err != nil {
		http.Error(w, "Failed to close writer: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Forward request to inference server
	apiURL := fmt.Sprintf("%s/v1/audio/transcriptions", inferenceURL)
	req, err := http.NewRequest("POST", apiURL, &buf)
	if err != nil {
		http.Error(w, "Failed to create request: "+err.Error(), http.StatusInternalServerError)
		return
	}

	req.Header.Set("Content-Type", writer.FormDataContentType())

	// Send request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, "Failed to call API: "+err.Error(), http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	// Read response
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		http.Error(w, "Failed to read response: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Forward response status and body
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	w.Write(body)
}

func summarizeHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Read request body
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Failed to read request body: "+err.Error(), http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	// Parse JSON to extract text
	var requestData map[string]interface{}
	if err := json.Unmarshal(body, &requestData); err != nil {
		http.Error(w, "Invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}

	text, ok := requestData["text"].(string)
	if !ok || text == "" {
		http.Error(w, "Text field is required", http.StatusBadRequest)
		return
	}

	// Prepare LLM request in OpenAI format
	llmRequest := map[string]interface{}{
		"model": llmModel,
		"messages": []map[string]string{
			{
				"role":    "system",
				"content": "You are a helpful assistant that summarizes transcribed audio. Provide a clear, concise summary of the main points.",
			},
			{
				"role":    "user",
				"content": fmt.Sprintf("Please summarize the following transcription:\n\n%s", text),
			},
		},
		"temperature": 0.7,
	}

	llmRequestBody, err := json.Marshal(llmRequest)
	if err != nil {
		http.Error(w, "Failed to create LLM request: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Forward request to LLM API
	apiURL := fmt.Sprintf("%s/v1/chat/completions", llmURL)
	req, err := http.NewRequest("POST", apiURL, bytes.NewReader(llmRequestBody))
	if err != nil {
		http.Error(w, "Failed to create request: "+err.Error(), http.StatusInternalServerError)
		return
	}

	req.Header.Set("Content-Type", "application/json")

	// Send request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, "Failed to call LLM API: "+err.Error(), http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	// Read response
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		http.Error(w, "Failed to read LLM response: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Forward response status and body
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	w.Write(respBody)
}

