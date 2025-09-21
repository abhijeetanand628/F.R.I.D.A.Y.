const mic = document.querySelector('.mic-icon');
const startBtn = document.querySelector('.btn-primary');
const settingBtn = document.querySelector('.btn-secondary');
const responseConatiner = document.querySelector('.output');


// SpeechRecognition setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

// Optional settings
recognition.continuous = false;   // stops after one result
recognition.finalResults = false; // only final results
recognition.lang = "en-US";     


// Start listening when mic is clicked
mic.addEventListener('click', function(){
    recognition.start();
    console.log("Mic started, listening...");
})

// Handle result    
recognition.addEventListener("result", (e) => {
  const transcript = e.results[0][0].transcript;
  responseConatiner.textContent = `You said: ${transcript}`;
  console.log("You said:", transcript);
});

// Handle end
recognition.addEventListener("end", () => {
  console.log("Mic stopped listening.");
});

// Handle error
recognition.addEventListener("error", (e) => {
  console.error("Speech recognition error:", e.error);
});

