// MAIN VOICE ASSISTANT APPLICATION
// Main application logic that orchestrates everything
// Import all modules
import { recognition, speak, stopSpeaking, loadVoices } from './modules/speech.js';
import { getWeather, isWeatherCommand, extractCityFromCommand } from './modules/weather.js';
import { askAssistant } from './modules/ai.js';
import { saveQA, showHistory, beginTurn, isStopCommand } from './modules/utils.js';
import { setupFileUpload, setupVoiceSelection, setupSettingsModal, setupTextCommandForm, setupButtonHandlers } from './modules/ui.js';

// DOM Element Selection
const mic = document.querySelector('.mic-icon');
const startBtn = document.querySelector('.btn-start');
const stopBtn = document.querySelector('.btn-stop');
const settingBtn = document.querySelector('.btn-secondary');  
const responseContainer = document.querySelector('.response-content');
const msg = document.querySelector('.command-display');
const commandForm = document.getElementById('text-command-form');
const commandInput = document.getElementById('command-input');
const uploadBtn = document.querySelector('.upload-btn');
const fileInput = document.querySelector('#file-upload-input');
const previewContainer = document.querySelector('#file-preview-container');
const imagePreview = document.querySelector('#image-preview');
const fileNamePreview = document.querySelector('#file-preview-name');
const removeFileBtn = document.querySelector('#remove-file-btn');
const voiceSelect = document.getElementById('voice');

// State object to hold all application state
const state = {
  isActivated: false,   // Is assistant "awake"?
  wakeWord: "friday",   // Default wake word
  isSpeaking: false,     // Is TTS currently speaking?
  currentUtterance: null, // Active SpeechSynthesisUtterance
  currentTurnId: 0,      // Increment per command to invalidate old replies
  shouldSpeak: true,     // Block speaking when user says stop
  currentAbortController: null, // Abort in-flight fetch
  availableVoices: []
};

// Command handler function
async function processCommand(command) {
  console.log("Processing command:", command);
  responseContainer.innerHTML = `Command: ${command}`;
  const { newTurnId, shouldSpeak: newShouldSpeak, newAbortController } = beginTurn(state.currentTurnId, state.currentAbortController);
  state.currentTurnId = newTurnId;
  state.shouldSpeak = newShouldSpeak;
  state.currentAbortController = newAbortController;

  if (isStopCommand(command)) {
    stopSpeaking(state);
    responseContainer.innerHTML = `Stopped.`;
    return;
  }

  if (isWeatherCommand(command)) {
    const city = extractCityFromCommand(command);
    responseContainer.innerHTML = `Fetching weather for ${city}...`;
    const weatherReport = await getWeather(city.trim());
    saveQA(command, weatherReport);
    showHistory(responseContainer);
    // Auto-scroll to response container (position it higher in view)
    responseContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Add slight offset to scroll a bit higher
    setTimeout(() => {
      window.scrollBy(0, -15);
    }, 100);
    speak(weatherReport, state);
    return;
  }

  responseContainer.innerHTML = `Thinking...`;
  try {
    const answer = await askAssistant(command, state.currentAbortController);
    if (newTurnId !== state.currentTurnId || !state.shouldSpeak) return;
    saveQA(command, answer);
    showHistory(responseContainer);
    // Auto-scroll to response container (position it higher in view)
    responseContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Add slight offset to scroll a bit higher
    setTimeout(() => {
      window.scrollBy(0, -15);
    }, 100);
    speak(answer, state);
  } catch (err) {
    console.error("Error talking to AI:", err);
    responseContainer.innerHTML = "Sorry, I couldn't get a response.";
  }
}

// Speech Recognition Event Handlers
function setupSpeechRecognition() {
  // Handle result    
  recognition.addEventListener("result", (e) => {
    let transcript = e.results[e.results.length - 1][0].transcript.toLowerCase().trim();
    console.log("Transcript:", transcript);

    // Global voice interrupt while speaking
    if (state.isSpeaking && isStopCommand(transcript)) {
      stopSpeaking(state);
      responseContainer.innerHTML = `Stopped.`;
      state.isActivated = false;
      return;
    }
    if (!state.isActivated) {
      if (transcript.includes(state.wakeWord)) {
        state.isActivated = true;
        responseContainer.innerHTML = `Wake word detected! Listening for command...`;

        // Remove the wake word from transcript
        let command = transcript.replace(state.wakeWord, "").trim();

        // If user spoke wake word + command together
        if (command) {
          processCommand(command);
          state.isActivated = false; // reset after processing
        }
      }
    } else {
      // Already activated → process whatever comes
      processCommand(transcript);
      state.isActivated = false; // reset after command
    }
  });

  // Handle end
  recognition.addEventListener("end", () => {
    console.log("Mic stopped.");
    // Prevent automatic restart
    recognition.continuous = false; // Ensure continuous mode is disabled
    state.isActivated = false; // Reset activation state
    msg.innerHTML = "Recognition has stopped. Click the mic icon or start button to resume.";
  });

  // Handle error
  recognition.addEventListener("error", (e) => {
    console.error("Speech recognition error:", e.error);
  });
}

// Initialize the application
function initializeApp() {
  // Auto-scroll to top when page loads/refreshes - multiple methods for reliability
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  
  // Force scroll to top after a small delay to ensure it works
  setTimeout(() => {
    window.scrollTo(0, 0);
  }, 10);

  // Setup speech recognition
  setupSpeechRecognition();

  // Setup UI components
  setupButtonHandlers(startBtn, stopBtn, mic, msg, state.wakeWord, state, stopSpeaking, recognition);
  setupTextCommandForm(commandForm, commandInput, processCommand);
  setupSettingsModal(settingBtn);
  setupFileUpload(uploadBtn, fileInput, previewContainer, imagePreview, fileNamePreview, removeFileBtn);
  setupVoiceSelection(voiceSelect);

  // Load voices
  loadVoices(voiceSelect);
  speechSynthesis.onvoiceschanged = () => loadVoices(voiceSelect);

  // Stop speech when page loses focus (safety)
  window.addEventListener('blur', () => stopSpeaking(state));
}

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);
