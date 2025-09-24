// SPEECH RECOGNITION AND SYNTHESIS MODULE
// All voice recognition, text-to-speech, and voice selection
// Speech Recognition Setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.continuous = true; // Keep listening in background
recognition.interimResults = false; // Only final results
recognition.lang = "en-US";

// Speech synthesis helper
function cleanTextForSpeech(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // bold
    .replace(/\*(.*?)\*/g, '$1')     // italic
    .replace(/#+\s*/g, '')           // headers
    .replace(/^\s*[-*+]\s*/gm, '')   // lists
    .replace(/^\s*\d+\.\s*/gm, '')   // numbered lists
    .replace(/```[\s\S]*?```/g, '')  // code blocks
    .replace(/`([^`]+)`/g, '$1')     // inline code
    .replace(/[^\w\s.,!?;:()\-'"]/g, ' ') // emojis & special chars
    .replace(/\s+/g, ' ')
    .trim();
}

// Speech synthesis function
function speak(text, state) {
  if (!state.shouldSpeak) return;
  const cleanText = cleanTextForSpeech(text);

  // Cancel any ongoing speech first
  if (speechSynthesis.speaking) {
    speechSynthesis.cancel();
  }

  const utter = new SpeechSynthesisUtterance(cleanText);

  // Apply chosen voice if saved
  const savedVoice = localStorage.getItem('assistantVoice');
  if (savedVoice) {
    const match = speechSynthesis.getVoices().find(v => v.name === savedVoice);
    if (match) utter.voice = match;
  }

  state.currentUtterance = utter;
  state.isSpeaking = true;

  utter.onend = () => {
    state.isSpeaking = false;
    state.currentUtterance = null;
  };
  utter.onerror = () => {
    state.isSpeaking = false;
    state.currentUtterance = null;
  };
  speechSynthesis.speak(utter);
}

// Stop speaking function
function stopSpeaking(state) {
  if (speechSynthesis.speaking || state.isSpeaking) {
    try { speechSynthesis.cancel(); } catch (_) {}
  }
  state.isSpeaking = false;
  state.currentUtterance = null;
  state.shouldSpeak = false;
  // Invalidate current turn and abort any pending fetch
  state.currentTurnId += 1;
  if (state.currentAbortController) {
    try { state.currentAbortController.abort(); } catch (_) {}
    state.currentAbortController = null;
  }
}

// Voice selection functions
function loadVoices(voiceSelect) {
  const availableVoices = speechSynthesis.getVoices();
  voiceSelect.innerHTML = ''; // clear old options
  availableVoices.forEach(voice => {
    const opt = document.createElement('option');
    opt.value = voice.name;
    opt.textContent = `${voice.name} (${voice.lang})${voice.default ? ' — Default' : ''}`;
    voiceSelect.appendChild(opt);
  });

  // Restore saved voice if present
  const savedVoice = localStorage.getItem('assistantVoice');
  if (savedVoice && availableVoices.some(v => v.name === savedVoice)) {
    voiceSelect.value = savedVoice;
  }
}

// Export functions
export {
  recognition,
  cleanTextForSpeech,
  speak,
  stopSpeaking,
  loadVoices
};
