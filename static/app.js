// State
let mediaRecorder = null;
let audioChunks = [];
let audioBlob = null;
let recordingInterval = null;
let recordingSeconds = 0;

// DOM Elements
const recordBtn = document.getElementById('recordBtn');
const recordingStatus = document.getElementById('recordingStatus');
const recordingTime = document.getElementById('recordingTime');
const audioPlayback = document.getElementById('audioPlayback');
const uploadBtn = document.getElementById('uploadBtn');
const fileInput = document.getElementById('fileInput');
const fileName = document.getElementById('fileName');
const transcribeSection = document.getElementById('transcribeSection');
const languageSelect = document.getElementById('languageSelect');
const transcribeBtn = document.getElementById('transcribeBtn');
const loadingSection = document.getElementById('loadingSection');
const resultSection = document.getElementById('resultSection');
const transcriptionText = document.getElementById('transcriptionText');
const summarizeBtn = document.getElementById('summarizeBtn');
const summaryLoadingSection = document.getElementById('summaryLoadingSection');
const summarySection = document.getElementById('summarySection');
const summaryText = document.getElementById('summaryText');
const copySummaryBtn = document.getElementById('copySummaryBtn');
const copyBtn = document.getElementById('copyBtn');
const newTranscriptionBtn = document.getElementById('newTranscriptionBtn');
const errorSection = document.getElementById('errorSection');
const errorMessage = document.getElementById('errorMessage');
const dismissErrorBtn = document.getElementById('dismissErrorBtn');

// Recording functionality
recordBtn.addEventListener('click', async () => {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        await startRecording();
    } else {
        stopRecording();
    }
});

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Use audio/wav if supported, otherwise fall back to webm
        const mimeType = MediaRecorder.isTypeSupported('audio/wav') ? 'audio/wav' : 'audio/webm';
        mediaRecorder = new MediaRecorder(stream, { mimeType });
        
        audioChunks = [];
        recordingSeconds = 0;
        
        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };
        
        mediaRecorder.onstop = async () => {
            const blob = new Blob(audioChunks, { type: mimeType });
            
            // Convert to WAV if needed
            if (mimeType !== 'audio/wav') {
                audioBlob = await convertToWav(blob, stream);
            } else {
                audioBlob = blob;
            }
            
            const url = URL.createObjectURL(audioBlob);
            audioPlayback.src = url;
            audioPlayback.style.display = 'block';
            
            // Stop all tracks
            stream.getTracks().forEach(track => track.stop());
            
            showTranscribeButton();
        };
        
        mediaRecorder.start();
        
        recordBtn.classList.add('recording');
        recordBtn.querySelector('.btn-text').textContent = 'Stop Recording';
        recordBtn.querySelector('.btn-icon').textContent = '⏹';
        recordingStatus.textContent = 'Recording...';
        
        // Update recording time
        recordingInterval = setInterval(() => {
            recordingSeconds++;
            const minutes = Math.floor(recordingSeconds / 60);
            const seconds = recordingSeconds % 60;
            recordingTime.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }, 1000);
        
    } catch (error) {
        showError('Failed to access microphone: ' + error.message);
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        recordBtn.classList.remove('recording');
        recordBtn.querySelector('.btn-text').textContent = 'Start Recording';
        recordBtn.querySelector('.btn-icon').textContent = '⏺';
        recordingStatus.textContent = 'Recording stopped';
        
        clearInterval(recordingInterval);
    }
}

// Convert audio to WAV format
async function convertToWav(blob, stream) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Create WAV file
    const wav = audioBufferToWav(audioBuffer);
    return new Blob([wav], { type: 'audio/wav' });
}

// Convert AudioBuffer to WAV format
function audioBufferToWav(buffer) {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    
    const data = [];
    for (let i = 0; i < buffer.numberOfChannels; i++) {
        data.push(buffer.getChannelData(i));
    }
    
    const interleaved = interleave(data);
    const dataLength = interleaved.length * bytesPerSample;
    const headerLength = 44;
    const totalLength = headerLength + dataLength;
    
    const arrayBuffer = new ArrayBuffer(totalLength);
    const view = new DataView(arrayBuffer);
    
    // Write WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, totalLength - 8, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);
    
    // Write audio data
    let offset = 44;
    for (let i = 0; i < interleaved.length; i++) {
        const sample = Math.max(-1, Math.min(1, interleaved[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
    }
    
    return arrayBuffer;
}

function interleave(channels) {
    const length = channels[0].length;
    const result = new Float32Array(length * channels.length);
    
    let offset = 0;
    for (let i = 0; i < length; i++) {
        for (let channel = 0; channel < channels.length; channel++) {
            result[offset++] = channels[channel][i];
        }
    }
    
    return result;
}

function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

// File upload functionality
uploadBtn.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        if (!file.name.toLowerCase().endsWith('.wav')) {
            showError('Please select a WAV file');
            return;
        }
        
        audioBlob = file;
        fileName.textContent = `Selected: ${file.name}`;
        
        // Hide recording elements
        audioPlayback.style.display = 'none';
        recordingStatus.textContent = '';
        recordingTime.textContent = '';
        
        showTranscribeButton();
    }
});

// Transcription functionality
transcribeBtn.addEventListener('click', async () => {
    if (!audioBlob) {
        showError('No audio file available');
        return;
    }
    
    hideError();
    transcribeSection.style.display = 'none';
    loadingSection.style.display = 'block';
    resultSection.style.display = 'none';
    
    try {
        const formData = new FormData();
        formData.append('file', audioBlob, 'audio.wav');
        
        // Add language if selected
        const language = languageSelect.value;
        if (language) {
            formData.append('language', language);
        }
        
        const response = await fetch('/transcribe', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Transcription failed: ${errorText}`);
        }
        
        const result = await response.json();
        
        loadingSection.style.display = 'none';
        resultSection.style.display = 'block';
        transcriptionText.textContent = result.text || 'No transcription available';
        
    } catch (error) {
        loadingSection.style.display = 'none';
        showError(error.message);
    }
});

// Summarize functionality
summarizeBtn.addEventListener('click', async () => {
    const text = transcriptionText.textContent;
    
    if (!text || text === 'No transcription available') {
        showError('No transcription text to summarize');
        return;
    }
    
    hideError();
    summaryLoadingSection.style.display = 'block';
    summarySection.style.display = 'none';
    
    try {
        const response = await fetch('/summarize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: text })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Summarization failed: ${errorText}`);
        }
        
        const result = await response.json();
        
        // Extract summary from OpenAI/Harmony response format
        let summary = '';
        if (result.choices && result.choices.length > 0 && result.choices[0].message) {
            summary = result.choices[0].message.content;
        } else if (result.response) {
            // Harmony format
            summary = result.response;
        } else if (result.text) {
            summary = result.text;
        } else {
            summary = 'No summary available';
        }
        
        // Clean and format the summary
        summary = summary.trim();
        
        summaryLoadingSection.style.display = 'none';
        summarySection.style.display = 'block';
        
        // Parse Markdown and display
        const formattedSummary = parseMarkdown(summary);
        summaryText.innerHTML = formattedSummary;
        
    } catch (error) {
        summaryLoadingSection.style.display = 'none';
        showError(error.message);
    }
});

// Copy to clipboard
copyBtn.addEventListener('click', async () => {
    const text = transcriptionText.textContent;
    try {
        await navigator.clipboard.writeText(text);
        const originalText = copyBtn.querySelector('.btn-text').textContent;
        copyBtn.querySelector('.btn-text').textContent = 'Copied!';
        setTimeout(() => {
            copyBtn.querySelector('.btn-text').textContent = originalText;
        }, 2000);
    } catch (error) {
        showError('Failed to copy to clipboard');
    }
});

// Copy summary to clipboard
copySummaryBtn.addEventListener('click', async () => {
    // Get text content without HTML tags
    const text = summaryText.innerText || summaryText.textContent;
    try {
        await navigator.clipboard.writeText(text);
        const originalText = copySummaryBtn.querySelector('.btn-text').textContent;
        copySummaryBtn.querySelector('.btn-text').textContent = 'Copied!';
        setTimeout(() => {
            copySummaryBtn.querySelector('.btn-text').textContent = originalText;
        }, 2000);
    } catch (error) {
        showError('Failed to copy to clipboard');
    }
});

// New transcription
newTranscriptionBtn.addEventListener('click', () => {
    resetApp();
});

// Helper functions
function showTranscribeButton() {
    transcribeSection.style.display = 'block';
    resultSection.style.display = 'none';
}

function showError(message) {
    errorSection.style.display = 'block';
    errorMessage.textContent = message;
}

function hideError() {
    errorSection.style.display = 'none';
}

dismissErrorBtn.addEventListener('click', hideError);

// Helper function to escape HTML and prevent XSS attacks
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Markdown parser using marked.js (supports Harmony format)
function parseMarkdown(text) {
    // Configure marked options
    marked.setOptions({
        breaks: true,        // Convert \n to <br>
        gfm: true,          // GitHub Flavored Markdown
        headerIds: false,   // Don't add IDs to headers
        mangle: false,      // Don't escape email addresses
        sanitize: false     // marked v5+ doesn't sanitize by default
    });
    
    // Parse markdown to HTML
    return marked.parse(text);
}

function resetApp() {
    audioBlob = null;
    audioChunks = [];
    recordingSeconds = 0;
    
    audioPlayback.style.display = 'none';
    audioPlayback.src = '';
    recordingStatus.textContent = '';
    recordingTime.textContent = '';
    fileName.textContent = '';
    fileInput.value = '';
    
    transcribeSection.style.display = 'none';
    loadingSection.style.display = 'none';
    resultSection.style.display = 'none';
    summaryLoadingSection.style.display = 'none';
    summarySection.style.display = 'none';
    hideError();
    
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        stopRecording();
    }
}

