// UI AND FILE UPLOAD MODULE
// File uploads, settings, and user interface components
// File upload preview functions
function setupFileUpload(uploadBtn, fileInput, previewContainer, imagePreview, fileNamePreview, removeFileBtn) {
  // Upload button click handler
  uploadBtn.addEventListener('click', function() {
    console.log("clicked");
    fileInput.click();
  });

  // File input change handler
  fileInput.addEventListener('change', function() {
    const file = fileInput.files[0];

    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();

      reader.onload = function(e) {
        imagePreview.src = e.target.result;
        fileNamePreview.textContent = file.name;
        previewContainer.style.display = 'flex';
      };

      reader.readAsDataURL(file);
    }
  });

  // Remove file button handler
  removeFileBtn.addEventListener('click', function() {
    previewContainer.style.display = 'none';
    imagePreview.src = '#';
    fileInput.value = '';
  });
}

// Voice selection setup
function setupVoiceSelection(voiceSelect) {
  // Save user choice
  voiceSelect.addEventListener('change', () => {
    localStorage.setItem('assistantVoice', voiceSelect.value);
  });
}

// Settings modal handlers
function setupSettingsModal(settingBtn) {
  const modal = document.getElementById('settingsModal');
  const saveBtn = document.getElementById('saveSettings');
  
  // Settings button click handler
  settingBtn.addEventListener('click', () => {
    modal.classList.add('show');
  });

  // Close button inside the modal
  document.querySelector('#settingsModal .close').addEventListener('click', () => {
    modal.classList.remove('show');
  });

  // Save Settings button handler
  saveBtn.addEventListener('click', () => {
    // Save settings logic can go here
    console.log('Settings saved');
    modal.classList.remove('show');
  });

  // Close modal when clicking outside of it
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('show');
    }
  });
}

// Text command form handler
function setupTextCommandForm(commandForm, commandInput, processCommand) {
  commandForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const command = commandInput.value.trim();
    if (command) {
      processCommand(command);
      commandInput.value = '';
    }
  });
}

// Button event handlers
function setupButtonHandlers(startBtn, stopBtn, mic, msg, wakeWord, state, stopSpeaking, recognition) {
  // Start Listening button (alternative manual start)
  startBtn.addEventListener('click', function() {
    if (state.isSpeaking) 
      return stopSpeaking(state);

    recognition.start();
    console.log("Started listening manually.");
    msg.innerHTML = `Listening for "${wakeWord}"...`;
  });

  // Stop Listening button (alternative manual stop)
  stopBtn.addEventListener('click', function() {
    if (state.isSpeaking)
      return stopSpeaking(state);

    recognition.stop();
    recognition.continuous = false;
    state.isActivated = false;
    console.log("Stopped listening manually.");
    msg.innerHTML = `Stopped listening.`;
  });

  // Mic click (manual trigger to start listening)
  mic.addEventListener('click', function() {
    if (state.isSpeaking) 
      return stopSpeaking(state);

    recognition.start();
    console.log("Mic started, waiting for wake word...");
    msg.innerHTML = `Listening for "${wakeWord}"...`;
  });
}

// Export functions
export {
  setupFileUpload,
  setupVoiceSelection,
  setupSettingsModal,
  setupTextCommandForm,
  setupButtonHandlers
};
