// const mic = document.querySelector('.mic-icon');
// const startBtn = document.querySelector('.btn-start');
// const stopBtn = document.querySelector('.btn-stop');
// const settingBtn = document.querySelector('.btn-secondary');
// const responseContainer = document.querySelector('.response-content');
// const msg = document.querySelector('.command-display');
// const commandForm = document.getElementById('text-command-form');
// const commandInput = document.getElementById('command-input');
// const uploadBtn = document.querySelector('.upload-btn');
// const fileInput = document.querySelector('#file-upload-input');
// const previewContainer = document.querySelector('#file-preview-container');
// const imagePreview = document.querySelector('#image-preview');
// const fileNamePreview = document.querySelector('#file-preview-name');
// const removeFileBtn = document.querySelector('#remove-file-btn');
// const voiceSelect = document.getElementById('voice');


// // State variables
// let isActivated = false;   // Is assistant "awake"?
// let wakeWord = "friday";   // Default wake word
// let isSpeaking = false;     // Is TTS currently speaking?
// let currentUtterance = null; // Active SpeechSynthesisUtterance
// let currentTurnId = 0;      // Increment per command to invalidate old replies
// let shouldSpeak = true;     // Block speaking when user says stop
// let currentAbortController = null; // Abort in-flight fetch
// let availableVoices = [];


// // WEATHER API
// const apiKey = 'a5c0fae4b7fc460080481110251109';


// // SPEECH RECOGNITION SETUP
// const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
// const recognition = new SpeechRecognition();
// recognition.continuous = true; // Keep listening in background
// recognition.interimResults = false; // Only final results
// recognition.lang = "en-US";     


// // SPEECH SYNTHESIS HELPERS
// // Clean text for speech (remove markdown, emojis, special chars)
// function cleanTextForSpeech(text) {
//   return text
//     .replace(/\*\*(.*?)\*\*/g, '$1') // bold
//     .replace(/\*(.*?)\*/g, '$1')     // italic
//     .replace(/#+\s*/g, '')           // headers
//     .replace(/^\s*[-*+]\s*/gm, '')   // lists
//     .replace(/^\s*\d+\.\s*/gm, '')   // numbered lists
//     .replace(/```[\s\S]*?```/g, '')  // code blocks
//     .replace(/`([^`]+)`/g, '$1')     // inline code
//     .replace(/[^\w\s.,!?;:()\-'"]/g, ' ') // emojis & special chars
//     .replace(/\s+/g, ' ')
//     .trim();
// }

// // Speech synthesis helper
// function speak(text) {
//   if (!shouldSpeak) return;
//   const cleanText = cleanTextForSpeech(text);

//   // Cancel any ongoing speech first
//   if (speechSynthesis.speaking) {
//     speechSynthesis.cancel();
//   }

//   const utter = new SpeechSynthesisUtterance(cleanText);

// // Apply chosen voice if saved
//   const savedVoice = localStorage.getItem('assistantVoice');
//   if (savedVoice) {
//     const match = speechSynthesis.getVoices().find(v => v.name === savedVoice);
//     if (match) utter.voice = match;
//   }

//   currentUtterance = utter;
//   isSpeaking = true;

//   utter.onend = () => {
//     isSpeaking = false;
//     currentUtterance = null;
//   };
//   utter.onerror = () => {
//     isSpeaking = false;
//     currentUtterance = null;
//   };
//   speechSynthesis.speak(utter);
// }

// function stopSpeaking() {
//   if (speechSynthesis.speaking || isSpeaking) {
//     try { speechSynthesis.cancel(); } catch (_) {}
//   }
//   isSpeaking = false;
//   currentUtterance = null;
//   shouldSpeak = false;
//   // Invalidate current turn and abort any pending fetch
//   currentTurnId += 1;
//   if (currentAbortController) {
//     try { currentAbortController.abort(); } catch (_) {}
//     currentAbortController = null;
//   }
// }


// // DATA STORAGE / HISTORY
// // Save Q&A in sessionStorage
// function saveQA(question, answer) {
//   let history = JSON.parse(sessionStorage.getItem("qaHistory")) || [];
//   history.push({
//     question,
//     answer,
//     time: new Date().toLocaleTimeString()
//   });
//   sessionStorage.setItem("qaHistory", JSON.stringify(history));
// }

// // Show Q&A history inside responseContainer
// function showHistory() {
//   const history = JSON.parse(sessionStorage.getItem("qaHistory")) || [];
//   responseContainer.innerHTML = ""; // clear old display
//   history.forEach(item => {
//     responseContainer.innerHTML += `
//       <div>
//         <p><strong>Q:</strong> ${item.question}</p>
//         <p><strong>A:</strong> ${item.answer}</p>
//         <small>${item.time}</small>
//         <hr>
//       </div>
//     `;
//   });
// }

// function beginTurn() {
//   currentTurnId += 1;
//   shouldSpeak = true;
//   if (currentAbortController) {
//     try { currentAbortController.abort(); } catch (_) {}
//   }
//   currentAbortController = new AbortController();
//   return currentTurnId;
// }


// // WEATHER FUNCTION
// async function getWeather(city)
// {
//   try {
//     const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${city}&days=1&aqi=no`;
//     const res = await fetch(url);
//     if (!res.ok) {
//       return `Sorry, I couldn't find the weather for ${city}.`;
//     }
//     const data = await res.json();
//     // console.log(data);

//     const location = data.location.name;
//     const temp = data.current.temp_c;
//     const condition = data.current.condition.text;
//     const cityForecast = data.forecast.forecastday[0].day;
//     const Maxtemp = cityForecast.maxtemp_c;
//     const Mintemp = cityForecast.mintemp_c;
//     const weatherReport = `The weather in ${location} is currently ${temp} degrees Celsius with ${condition}. The high for today is ${Maxtemp} degrees Celsius and the low is ${Mintemp} degrees Celsius.`;
//     return weatherReport;
//   } catch (error) 
//   {
//     console.error("Weather fetch error:", error);
//     return "Sorry, I'm having trouble connecting to the weather service.";
//   }
// }


// // OPENROUTER API CALL
// async function askAssistant(prompt) {
//   try {
//     const apiKey = localStorage.getItem('OPENROUTER_API_KEY') || '';
//     const res = await fetch("/.netlify/functions/ask", {
//       method: "POST",
//       headers: { 
//         "Content-Type": "application/json",
//         ...(apiKey ? { "X-OpenRouter-Api-Key": apiKey } : {})
//       },
//       body: JSON.stringify({ prompt, ...(apiKey ? { apiKey } : {}) }),
//       signal: currentAbortController ? currentAbortController.signal : undefined
//     });

//     // Try to parse JSON; if server returns text/html on error, handle gracefully
//     const text = await res.text();
//     let data;
//     try {
//       data = JSON.parse(text);
//     } catch (_) {
//       throw new Error(text.slice(0, 200) || "Non-JSON response from server");
//     }
//     if (!res.ok) {
//       throw new Error(data.error || `Request failed with ${res.status}`);
//     }
//     return data.answer || "Sorry, I couldn't get a response.";
//   } catch (err) 
//   {
//     console.error("askAssistant error:", err);
//     throw err;
//   }
// }


// // Command handler function
// async function processCommand(command) {
//   console.log("Processing command:", command);
//   responseContainer.innerHTML = `Command: ${command}`;
//   const thisTurn = beginTurn();
//   if (command.includes("stop") || command.includes("cancel") || command.includes("quiet") || command.includes("silence")) {
//     stopSpeaking();
//     responseContainer.innerHTML = `Stopped.`;
//     return;
//   }
//   const weatherMatch = command.match(/what's the weather in (.+)|what is the weather in (.+)|weather in (.+)/i);
//   if (weatherMatch) {
//     const city = weatherMatch[1] || weatherMatch[2] || weatherMatch[3];
//     responseContainer.innerHTML = `Fetching weather for ${city}...`;
//     const weatherReport = await getWeather(city.trim());
//     saveQA(command, weatherReport);
//     showHistory();
//     speak(weatherReport);
//     return;
//   }
//   responseContainer.innerHTML = `Thinking...`;
//   try {
//     const answer = await askAssistant(command);
//     if (thisTurn !== currentTurnId || !shouldSpeak) return;
//     saveQA(command, answer);
//     showHistory();
//     speak(answer);
//   } catch (err) {
//     console.error("Error talking to AI:", err);
//     responseContainer.innerHTML = "Sorry, I couldn't get a response.";
//   }
// } 


// // EVENT LISTENERS – SPEECH
// // Handle result    
// recognition.addEventListener("result", (e) => {
//   let transcript = e.results[e.results.length - 1][0].transcript.toLowerCase().trim();
//   console.log("Transcript:", transcript);

//   // Global voice interrupt while speaking
//   if (isSpeaking && (transcript.includes("stop") || transcript.includes("cancel") || transcript.includes("quiet") || transcript.includes("silence"))) {
//     stopSpeaking();
//     responseContainer.innerHTML = `Stopped.`;
//     isActivated = false;
//     return;
//   }
//   if (!isActivated) {
//     if (transcript.includes(wakeWord)) {
//       isActivated = true;
//       responseContainer.innerHTML = `Wake word detected! Listening for command...`;

//       // Remove the wake word from transcript
//       let command = transcript.replace(wakeWord, "").trim();

//       // If user spoke wake word + command together
//       if (command) {
//         processCommand(command);
//         isActivated = false; // reset after processing
//       }
//     }
//   } else {
//     // Already activated → process whatever comes
//     processCommand(transcript);
//     isActivated = false; // reset after command
//   }
// });


// // Handle end
// recognition.addEventListener("end", () => {
//   console.log("Mic stopped.");
//   // Prevent automatic restart
//   recognition.continuous = false; // Ensure continuous mode is disabled
//   isActivated = false; // Reset activation state
//   msg.innerHTML = "Recognition has stopped. Click the mic icon or start button to resume.";
// });

// // Handle error
// recognition.addEventListener("error", (e) => {
//   console.error("Speech recognition error:", e.error);
// });


// // EVENT LISTENERS – UI CONTROLS
// // Start Listening button (alternative manual start)
// startBtn.addEventListener('click', function(){
//   if (isSpeaking) 
//     return stopSpeaking();

//   recognition.start();
//   console.log("Started listening manually.");
//   msg.innerHTML = `Listening for "${wakeWord}"...`;
// })


// // Stop Listening button (alternative manual stop)
// stopBtn.addEventListener('click', function(){
//   if(isSpeaking)
//     return stopSpeaking();

//   recognition.stop();
//   recognition.continuous = false;
//   isActivated = false;
//   console.log("Stopped listening manually.");
//   msg.innerHTML = `Stopped listening.`;
// })

// // Mic click (manual trigger to start listening)
// mic.addEventListener('click', function(){
//   if (isSpeaking) 
//     return stopSpeaking();

//   recognition.start();
//   console.log("Mic started, waiting for wake word...");
//   msg.innerHTML = `Listening for "${wakeWord}"...`;
// })


// commandForm.addEventListener('submit', (e) => {
//   e.preventDefault();
//   const command = commandInput.value.trim();
//   if (command) {
//     processCommand(command);
//     commandInput.value = '';
//   }
// });

// // Instead of prompt
// settingBtn.addEventListener('click', () => {
//   document.getElementById('settingsModal').style.display = 'block';
// });

// // close button inside the modal
// document.querySelector('#settingsModal .close').addEventListener('click', () => {
//   document.getElementById('settingsModal').style.display = 'none';
// });

// // Additionally stop speech immediately when the page loses focus (safety)
// window.addEventListener('blur', stopSpeaking);


// // VOICE SELECTION 
// // Populate the dropdown with system voices
// function loadVoices() {
//   availableVoices = speechSynthesis.getVoices();
//   voiceSelect.innerHTML = ''; // clear old options
//   availableVoices.forEach(voice => {
//     const opt = document.createElement('option');
//     opt.value = voice.name;
//     opt.textContent = `${voice.name} (${voice.lang})${voice.default ? ' — Default' : ''}`;
//     voiceSelect.appendChild(opt);
//   });

//   // Restore saved voice if present
//   const savedVoice = localStorage.getItem('assistantVoice');
//   if (savedVoice && availableVoices.some(v => v.name === savedVoice)) 
//   {
//     voiceSelect.value = savedVoice;
//   }
// }

// // Some browsers load voices asynchronously
// speechSynthesis.onvoiceschanged = loadVoices;
// loadVoices(); // call once in case voices are already ready

// // Save user choice
// voiceSelect.addEventListener('change', () => 
// {
//   localStorage.setItem('assistantVoice', voiceSelect.value);
// });


// // FILE UPLOAD PREVIEW
// // UPLOAD BTN LOGIC
// uploadBtn.addEventListener('click', function()
// {
//   console.log("clicked");
//   fileInput.click();
// })

// fileInput.addEventListener('change', function() 
// {
//   const file = fileInput.files[0];

//   if (file && file.type.startsWith('image/')) 
//   {
//     const reader = new FileReader();

//     reader.onload = function(e) 
//     {
//       imagePreview.src = e.target.result;
//       fileNamePreview.textContent = file.name;
//       previewContainer.style.display = 'flex';
//     };

//     reader.readAsDataURL(file);
//   }
// });

// removeFileBtn.addEventListener('click', function() 
// {
//   previewContainer.style.display = 'none';
//   imagePreview.src = '#';
//   fileInput.value = '';
// });