// AI ASSISTANT MODULE
// OpenRouter API communication and AI responses
// OpenRouter API call
async function askAssistant(prompt, currentAbortController) {
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

// Export functions
export {
  askAssistant
};
