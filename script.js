const mic = document.querySelector('.mic-icon');
const startBtn = document.querySelector('.btn-start');
const stopBtn = document.querySelector('.btn-stop');
const settingBtn = document.querySelector('.btn-secondary');
const responseContainer = document.querySelector('.response-content');
const msg = document.querySelector('.command-display');
const commandForm = document.getElementById('text-command-form');
const commandInput = document.getElementById('command-input');

// WEATHER API
const apiKey = 'a5c0fae4b7fc460080481110251109';

// SpeechRecognition setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
// Optional settings
recognition.continuous = true; // Keep listening in background
recognition.interimResults = false; // Only final results
recognition.lang = "en-US";     


// State variables
let isActivated = false;   // Is assistant "awake"?
let wakeWord = "friday";   // Default wake word
let isSpeaking = false;     // Is TTS currently speaking?
let currentUtterance = null; // Active SpeechSynthesisUtterance
let currentTurnId = 0;      // Increment per command to invalidate old replies
let shouldSpeak = true;     // Block speaking when user says stop
let currentAbortController = null; // Abort in-flight fetch

function beginTurn() {
  currentTurnId += 1;
  shouldSpeak = true;
  if (currentAbortController) {
    try { currentAbortController.abort(); } catch (_) {}
  }
  currentAbortController = new AbortController();
  return currentTurnId;
}


// Mic click (manual trigger to start listening)
mic.addEventListener('click', function(){
  if (isSpeaking) 
    return stopSpeaking();
  recognition.start();
  
  console.log("Mic started, waiting for wake word...");
  msg.innerHTML = `Listening for "${wakeWord}"...`;
})


// Start Listening button (alternative manual start)
startBtn.addEventListener('click', function(){
  if (isSpeaking) 
    return stopSpeaking();

  recognition.start();
  console.log("Started listening manually.");
  msg.innerHTML = `Listening for "${wakeWord}"...`;
})


// Stop Listening button (alternative manual stop)
stopBtn.addEventListener('click', function(){
  if(isSpeaking)
    return stopSpeaking();

  recognition.stop();
  recognition.continuous = false;
  isActivated = false;
  console.log("Stopped listening manually.");
  msg.innerHTML = `Stopped listening.`;
})



async function askAssistant(prompt) {
  try {
    const apiKey = localStorage.getItem('OPENROUTER_API_KEY') || '';
    const res = await fetch("/.netlify/functions/ask", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        ...(apiKey ? { "X-OpenRouter-Api-Key": apiKey } : {})
      },
      body: JSON.stringify({ prompt, ...(apiKey ? { apiKey } : {}) }),
      signal: currentAbortController ? currentAbortController.signal : undefined
    });

    // Try to parse JSON; if server returns text/html on error, handle gracefully
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (_) {
      throw new Error(text.slice(0, 200) || "Non-JSON response from server");
    }

    if (!res.ok) {
      throw new Error(data.error || `Request failed with ${res.status}`);
    }

    return data.answer || "Sorry, I couldn't get a response.";
  } catch (err) {
    console.error("askAssistant error:", err);
    throw err;
  }
}




// Handle result    
recognition.addEventListener("result", (e) => {
  let transcript = e.results[e.results.length - 1][0].transcript.toLowerCase().trim();
  console.log("Transcript:", transcript);

  // Global voice interrupt while speaking
  if (isSpeaking && (transcript.includes("stop") || transcript.includes("cancel") || transcript.includes("quiet") || transcript.includes("silence"))) {
    stopSpeaking();
    responseContainer.innerHTML = `Stopped.`;
    isActivated = false;
    return;
  }

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
async function processCommand(command) {
  console.log("Processing command:", command);
  responseContainer.innerHTML = `Command: ${command}`;
  const thisTurn = beginTurn();

  if (command.includes("stop") || command.includes("cancel") || command.includes("quiet") || command.includes("silence")) {
    stopSpeaking();
    responseContainer.innerHTML = `Stopped.`;
    return;
  }

  const weatherMatch = command.match(/what's the weather in (.+)|what is the weather in (.+)|weather in (.+)/i);
  if (weatherMatch) {
    const city = weatherMatch[1] || weatherMatch[2] || weatherMatch[3];
    responseContainer.innerHTML = `Fetching weather for ${city}...`;
    
    const weatherReport = await getWeather(city.trim());
    
    saveQA(command, weatherReport);
    showHistory();
    speak(weatherReport);
    return;
  }

  responseContainer.innerHTML = `Thinking...`;
  try {
    const answer = await askAssistant(command);
    if (thisTurn !== currentTurnId || !shouldSpeak) return;
    saveQA(command, answer);
    showHistory();
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
  if (!shouldSpeak) return;
  const cleanText = cleanTextForSpeech(text);

  // Cancel any ongoing speech first
  if (speechSynthesis.speaking) {
    speechSynthesis.cancel();
  }

  const utter = new SpeechSynthesisUtterance(cleanText);
  currentUtterance = utter;
  isSpeaking = true;

  utter.onend = () => {
    isSpeaking = false;
    currentUtterance = null;
  };
  utter.onerror = () => {
    isSpeaking = false;
    currentUtterance = null;
  };

  speechSynthesis.speak(utter);
}

function stopSpeaking() {
  if (speechSynthesis.speaking || isSpeaking) {
    try { speechSynthesis.cancel(); } catch (_) {}
  }
  isSpeaking = false;
  currentUtterance = null;
  shouldSpeak = false;
  // Invalidate current turn and abort any pending fetch
  currentTurnId += 1;
  if (currentAbortController) {
    try { currentAbortController.abort(); } catch (_) {}
    currentAbortController = null;
  }
}

// Additionally stop speech immediately when the page loses focus (safety)
window.addEventListener('blur', stopSpeaking);

// Settings button: prompt to save OpenRouter API key for dev
settingBtn.addEventListener('click', () => {
  const current = localStorage.getItem('OPENROUTER_API_KEY') || '';
  const key = prompt('Enter your OpenRouter API key (stored locally):', current);
  if (key !== null) {
    if (key.trim()) {
      localStorage.setItem('OPENROUTER_API_KEY', key.trim());
      alert('Saved. Ask something to get real AI responses.');
    } else {
      localStorage.removeItem('OPENROUTER_API_KEY');
      alert('Removed saved key. Using offline mode.');
    }
  }
});

// Handle end
recognition.addEventListener("end", () => {
  console.log("Mic stopped.");
  // Prevent automatic restart
  recognition.continuous = false; // Ensure continuous mode is disabled
  isActivated = false; // Reset activation state
  msg.innerHTML = "Recognition has stopped. Click the mic icon or start button to resume.";
});

// Handle error
recognition.addEventListener("error", (e) => {
  console.error("Speech recognition error:", e.error);
});






// Save Q&A in sessionStorage
function saveQA(question, answer) {
  let history = JSON.parse(sessionStorage.getItem("qaHistory")) || [];
  history.push({
    question,
    answer,
    time: new Date().toLocaleTimeString()
  });
  sessionStorage.setItem("qaHistory", JSON.stringify(history));
}




// Show Q&A history inside responseContainer
function showHistory() {
  const history = JSON.parse(sessionStorage.getItem("qaHistory")) || [];

  responseContainer.innerHTML = ""; // clear old display

  history.forEach(item => {
    responseContainer.innerHTML += `
      <div>
        <p><strong>Q:</strong> ${item.question}</p>
        <p><strong>A:</strong> ${item.answer}</p>
        <small>${item.time}</small>
        <hr>
      </div>
    `;
  });
}



commandForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const command = commandInput.value.trim();

  if (command) {
    processCommand(command);
    commandInput.value = '';
  }
});

async function getWeather(city)
{
  try {
    const url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${city}&aqi=no`;
    const res = await fetch(url);

    if (!res.ok) {
      return `Sorry, I couldn't find the weather for ${city}.`;
    }

    const data = await res.json();

    const location = data.location.name;
    const temp = data.current.temp_c;
    const condition = data.current.condition.text;

    const weatherReport = `The weather in ${location} is currently ${temp} degrees Celsius with ${condition}.`;
    
    return weatherReport;

  } catch (error) {
    console.error("Weather fetch error:", error);
    return "Sorry, I'm having trouble connecting to the weather service.";
  }
}