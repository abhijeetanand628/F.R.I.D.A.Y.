const mic = document.querySelector('.mic-icon');
const startBtn = document.querySelector('.btn-primary');
const settingBtn = document.querySelector('.btn-secondary');
const responseContainer = document.querySelector('.response-content');
const msg = document.querySelector('.command-display');


// SpeechRecognition setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

// Optional settings
recognition.continuous = true;   // Keep listening in background
recognition.interimResults = false; // Only final results
recognition.lang = "en-US";     


// State variables
let isActivated = false;   // Is assistant "awake"?
let wakeWord = "friday";   // Default wake word


// Mic click (manual trigger to start listening)
mic.addEventListener('click', function(){
    recognition.start();
    console.log("Mic started, waiting for wake word...");
    msg.innerHTML = `Listening for "${wakeWord}"...`;
})


// Start Listening button (alternative manual start)
startBtn.addEventListener('click', function(){
  recognition.start();
  console.log("Started listening manually.");
  msg.innerHTML = `Listening for "${wakeWord}"...`;
})




async function askAssistant(prompt) {
  const res = await fetch("/.netlify/functions/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt })
  });

  const data = await res.json();
  return data.answer || "Sorry, something went wrong.";
}




// Handle result    
recognition.addEventListener("result", (e) => {
  let transcript = e.results[e.results.length - 1][0].transcript.toLowerCase().trim();
  console.log("Transcript:", transcript);

  if (!isActivated) {
    if (transcript.includes(wakeWord)) {
      isActivated = true;
      responseContainer.innerHTML = `Wake word detected! Listening for command...`;

      // Remove the wake word from transcript
      let command = transcript.replace(wakeWord, "").trim();

      // If user spoke wake word + command together
      if (command) {
        processCommand(command);
        isActivated = false; // reset after processing
      }
    }
  } else {
    // Already activated → process whatever comes
    processCommand(transcript);
    isActivated = false; // reset after command
  }
});

// Command handler function
// Command handler function
async function processCommand(command) {
  console.log("Processing command:", command);
  responseContainer.innerHTML = `Command: ${command}`;

  if (command.includes("time")) {
    const now = new Date().toLocaleTimeString();
    responseContainer.innerHTML = `Current time is ${now}`;
    speak(`The time is ${now}`);
    return;
  }

  if (command.includes("date")) {
    const today = new Date().toLocaleDateString();
    responseContainer.innerHTML = `Today's date is ${today}`;
    speak(`Today's date is ${today}`);
    return;
  }

  if (command.includes("open google")) {
    window.open("https://www.google.com", "_blank");
    speak("Opening Google");
    return;
  }

  // 👇 If command doesn’t match built-in ones → ask DeepSeek
  responseContainer.innerHTML = `Thinking...`;
  try {
    const answer = await askAssistant(command);
    responseContainer.innerHTML = answer;
    speak(answer);
  } catch (err) {
    console.error("Error talking to AI:", err);
    responseContainer.innerHTML = "Sorry, I couldn't get a response.";
  }
}



// Clean text for speech (remove markdown, emojis, special chars)
function cleanTextForSpeech(text) {
  return text
    // Remove markdown bold/italic
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    // Remove markdown headers
    .replace(/#+\s*/g, '')
    // Remove markdown lists
    .replace(/^\s*[-*+]\s*/gm, '')
    .replace(/^\s*\d+\.\s*/gm, '')
    // Remove code blocks and inline code
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    // Remove emojis and special characters
    .replace(/[^\w\s.,!?;:()\-'"]/g, ' ')
    // Clean up multiple spaces
    .replace(/\s+/g, ' ')
    .trim();
}

// Speech synthesis helper
function speak(text) {
  const cleanText = cleanTextForSpeech(text);
  const utter = new SpeechSynthesisUtterance(cleanText);
  speechSynthesis.speak(utter);
}

// Handle end
recognition.addEventListener("end", () => {
  console.log("Mic stopped, restarting...");
  recognition.start();
});

// Handle error
recognition.addEventListener("error", (e) => {
  console.error("Speech recognition error:", e.error);
});

