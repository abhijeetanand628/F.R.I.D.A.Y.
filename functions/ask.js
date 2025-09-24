// Netlify function for AI assistant
const jsonResponse = (status, body) => ({ 
  statusCode: status, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) 
});
const getBody = (event) => { 
  try { 
    return JSON.parse(event.body || "{}"); 
  } catch { 
    return {}; 
  } 
};
const sentenceClamp = (text) => 
  String(text).split(/(?<=[.!?])\s+/)[0].split(/\s+/).slice(0, 8).join(" ");

// Helper functions
const capitalLookup = async (name) => {
  try {
    const res = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(name)}?fields=capital`);
    return res.ok ? (await res.json())?.[0]?.capital?.[0] || "" : "";
  } catch { return ""; }
};

const wikiSummary = async (topic) => {
  try {
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`);
    return res.ok ? (await res.json()).extract || "" : "";
  } catch { return ""; }
};

const wikiSearch = async (query) => {
  try {
    const res = await fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=1&namespace=0&format=json&origin=*`);
    if (!res.ok) return "";
    const data = await res.json();
    const title = data?.[1]?.[0];
    return title ? await wikiSummary(title) : "";
  } catch { return ""; }
};

// Offline demo responses
const getDemoAnswer = async (prompt) => {
  const lower = prompt.toLowerCase();
  const conciseMode = /(in\s+one\s+word|one\s+word|in\s*short|short\s*answer)/g.test(lower);
  const cleanPrompt = lower.replace(/(in\s+one\s+word|one\s+word|in\s*short|short\s*answer)/g, "").trim();
  
  // Built-in responses
  if (cleanPrompt.includes("joke")) 
    return "Why did the developer go broke? Because they used up all their cache.";
  
  if (cleanPrompt.includes("hello") || cleanPrompt.includes("hi")) 
    return "Hello! I'm up and listening. Ask me anything.";
  
  if (cleanPrompt.includes("time")) 
    return `The time is ${new Date().toLocaleTimeString()}.`;
 
  if (cleanPrompt.includes("date")) 
    return `Today's date is ${new Date().toLocaleDateString()}.`;
  
  // Capital lookup
  const capitalMatch = cleanPrompt.match(/capital(?:\s+city)?\s+of\s+(.+)/);
  if (capitalMatch?.[1]) 
  {
    const capital = await capitalLookup(capitalMatch[1].replace(/\?+$/, "").trim());
    if (capital) 
      return capital;
  }
  
  // Wikipedia lookup
  let topic = "";
  const whoMatch = cleanPrompt.match(/^(?:who\s+is|who's)\s+(.+)/);
  const whatMatch = cleanPrompt.match(/^(?:what\s+is|what's)\s+(.+)/);
  const tellMeMatch = cleanPrompt.match(/^tell\s+me\s+(?:about\s+)?(.+)/);
  
  if (whoMatch?.[1] || whatMatch?.[1]) 
    topic = (whoMatch?.[1] || whatMatch?.[1]).replace(/\?+$/, "");
  
  else if (tellMeMatch?.[1]) topic = tellMeMatch[1].replace(/\?+$/, "");
  
  if (topic) 
  {
    let answer = await wikiSummary(topic);
    if (!answer) 
      answer = await wikiSearch(topic);
    
    if (answer && conciseMode) 
      answer = sentenceClamp(answer);
    
    if (answer) 
      return answer;
  }
  
  return "I'm in offline demo mode. Please try again later.";
};

export const handler = async (event) => {
  try {
    const { prompt } = getBody(event);
    if (!prompt) 
      throw new Error("No prompt provided");

    // Get API key
    let key = process.env.OPENROUTER_API_KEY;
    if (!key && process.env.ALLOW_CLIENT_API_KEY === '1') 
    {
      const bodyObj = getBody(event);
      key = event.headers?.['x-openrouter-api-key'] || event.headers?.['X-OpenRouter-Api-Key'] || bodyObj.apiKey || '';
    }

    // Offline mode if no key
    if (!key) 
    {
      console.warn("OPENROUTER_API_KEY missing. For real AI replies, set it and run `netlify dev`.");
      return jsonResponse(200, { answer: await getDemoAnswer(prompt) });
    }

    // Call OpenRouter API
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", 
    {
      method: "POST",
      headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "deepseek/deepseek-chat", messages: [{ role: "user", content: prompt }] })
    });

    if (!response.ok) 
      throw new Error(`OpenRouter error ${response.status}: ${await response.text()}`);
    
    const data = await response.json();
    return jsonResponse(200, { answer: data?.choices?.[0]?.message?.content || "No reply received" });
    
  } catch (err) {
    console.error("Function error:", err);
    return jsonResponse(500, { error: err.message });
  }
};