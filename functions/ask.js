// ✅ Netlify functions run in a CommonJS context by default
// Use the global fetch available in Node 18+ (Netlify runtime)
// Avoid ESM imports that can cause runtime syntax errors
function jsonResponse(statusCode, bodyObj) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bodyObj)
  };
}

function getBody(event) {
  try { return JSON.parse(event.body || "{}"); } catch { return {}; }
}

function sentenceClamp(text) {
  const firstSentence = String(text).split(/(?<=[.!?])\s+/)[0];
  return firstSentence.split(/\s+/).slice(0, 8).join(" ");
}

async function capitalLookup(name) {
  try {
    const rc = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(name)}?fields=capital`);
    if (!rc.ok) return "";
    const j = await rc.json();
    return j?.[0]?.capital?.[0] || "";
  } catch { return ""; }
}

async function wikiSummary(topic) {
  try {
    const urlTopic = encodeURIComponent(topic);
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${urlTopic}`);
    if (!res.ok) return "";
    const j = await res.json();
    return j.extract || "";
  } catch { return ""; }
}

async function wikiSearch(lower, topic) {
  try {
    const q = encodeURIComponent(topic || lower);
    const r = await fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&search=${q}&limit=1&namespace=0&format=json&origin=*`);
    if (!r.ok) return "";
    const sj = await r.json();
    const firstTitle = sj?.[1]?.[0];
    if (!firstTitle) return "";
    return await wikiSummary(firstTitle);
  } catch { return ""; }
}

exports.handler = async function(event) {
  try {
    // ✅ Safe parse (no crash if body is empty)
    const { prompt } = getBody(event);
    if (!prompt) throw new Error("No prompt provided");

    // ✅ Check for API key (prefer server env var)
    let key = process.env.OPENROUTER_API_KEY;
    // Optional: allow passing key from client in dev only
    if (!key && process.env.ALLOW_CLIENT_API_KEY === '1') {
      const bodyObj = getBody(event);
      key = event.headers?.['x-openrouter-api-key'] || event.headers?.['X-OpenRouter-Api-Key'] || bodyObj.apiKey || '';
    }

    if (!key) {
      // Offline intents so the app stays functional without a key
      const lowerOriginal = String(prompt || "").toLowerCase();
      const concisePattern = /(in\s+one\s+word|one\s+word|in\s*short|short\s*answer)/g;
      const conciseMode = concisePattern.test(lowerOriginal);
      const lower = lowerOriginal.replace(concisePattern, "").trim();
      let demoAnswer = "";

      // 1) Simple built-ins
      if (lower.includes("joke")) {
        demoAnswer = "Why did the developer go broke? Because they used up all their cache.";
      } else if (lower.includes("hello") || lower.includes("hi")) {
        demoAnswer = "Hello! I'm up and listening. Ask me anything.";
      } else if (lower.includes("time")) {
        demoAnswer = `The time is ${new Date().toLocaleTimeString()}.`;
      } else if (lower.includes("date")) {
        demoAnswer = `Today's date is ${new Date().toLocaleDateString()}.`;
      }

      // 2) Capital of <country|state> via RestCountries (concise and reliable)
      if (!demoAnswer) {
        const m = lower.match(/capital(?:\s+city)?\s+of\s+(.+)/);
        if (m?.[1]) demoAnswer = await capitalLookup(m[1].replace(/\?+$/, "").trim());
      }

      // 3) Basic Q&A via Wikipedia summaries (no key needed)
      if (!demoAnswer) {
        // Normalize some common phrasings
        let topic = "";
        const whoMatch = lower.match(/^(?:who\s+is|who's)\s+(.+)/);
        const whatMatch = lower.match(/^(?:what\s+is|what's)\s+(.+)/);
        const tellMeMatch = lower.match(/^tell\s+me\s+(?:about\s+)?(.+)/);
        const capitalMatch = lower.match(/capital(?:\s+city)?\s+of\s+(.+)/);

        if (capitalMatch?.[1]) {
          topic = `Capital of ${capitalMatch[1].replace(/\?+$/, "")}`;
        } else if (whoMatch?.[1] || whatMatch?.[1]) {
          topic = (whoMatch?.[1] || whatMatch?.[1]).replace(/\?+$/, "");
        } else if (tellMeMatch?.[1]) {
          topic = tellMeMatch[1].replace(/\?+$/, "");
        }

        // If we have a topic, try the direct summary API first
        if (topic) demoAnswer = await wikiSummary(topic) || "";
        if (demoAnswer && conciseMode) demoAnswer = sentenceClamp(demoAnswer);

        // If that failed, do a quick search and take the first hit
        if (!demoAnswer) demoAnswer = await wikiSearch(lower, topic) || "";
        if (demoAnswer && conciseMode) demoAnswer = sentenceClamp(demoAnswer);
      }

      if (!demoAnswer) {
        demoAnswer = "I'm in offline demo mode and couldn't answer that. Ask me for a joke, time, date, or try questions like 'who is ...', 'what is ...', or 'capital of ...'.";
      }

      console.warn(
        "OPENROUTER_API_KEY missing. For real AI replies, set it and run `netlify dev`. " +
        "Steps: 1) Get a key at https://openrouter.ai 2) $env:OPENROUTER_API_KEY='your_key' 3) netlify dev"
      );
      return jsonResponse(200, { answer: demoAnswer });
    }

    // ✅ Call OpenRouter API
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    // ✅ Check HTTP status
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenRouter error ${response.status}: ${text}`);
    }

    const data = await response.json();
    const answer = data?.choices?.[0]?.message?.content || "No reply received";

    return jsonResponse(200, { answer });
  } catch (err) {
    console.error("Function error:", err);
    // Always return JSON so the client can safely parse
    return jsonResponse(500, { error: err.message });
  }
}
