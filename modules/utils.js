// UTILITY FUNCTIONS MODULE
// Data storage, history management, and utility functions
// Data storage / History functions
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
function showHistory(responseContainer) {
  const history = JSON.parse(sessionStorage.getItem("qaHistory")) || [];
  responseContainer.innerHTML = ""; // clear old display
  
  // Reverse the order so newest Q&A appears at the top
  history.slice().reverse().forEach(item => {
    responseContainer.innerHTML += `
      <div>
        <p><strong>Q:</strong> ${item.question}</p>
        <p><strong>A:</strong> ${item.answer}</p>
        <small>${item.time}</small>
        <hr>
      </div>
    `;
  });
  
  // Auto-scroll to the top of the response container
  responseContainer.scrollTop = 0;
}

// Turn management
function beginTurn(currentTurnId, currentAbortController) {
  const newTurnId = currentTurnId + 1;
  const shouldSpeak = true;
  if (currentAbortController) {
    try { currentAbortController.abort(); } catch (_) {}
  }
  const newAbortController = new AbortController();
  return { newTurnId, shouldSpeak, newAbortController };
}

// Check if command is a stop command
function isStopCommand(command) {
  return command.includes("stop") || 
         command.includes("cancel") || 
         command.includes("quiet") || 
         command.includes("silence");
}

// Export functions
export {
  saveQA,
  showHistory,
  beginTurn,
  isStopCommand
};
