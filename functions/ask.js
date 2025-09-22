// ✅ Netlify functions run in a CommonJS context by default
// Use the global fetch available in Node 18+ (Netlify runtime)
// Avoid ESM imports that can cause runtime syntax errors
exports.handler = async function(event) {
  try {
    // ✅ Safe parse (no crash if body is empty)
    const { prompt } = JSON.parse(event.body || "{}");
    if (!prompt) throw new Error("No prompt provided");

    // ✅ Check for API key (prefer server env var)
    let key = process.env.OPENROUTER_API_KEY;
    // Optional: allow passing key from client in dev only
    if (!key && process.env.ALLOW_CLIENT_API_KEY === '1') {
      try {
        const bodyObj = JSON.parse(event.body || '{}');
        key = event.headers?.['x-openrouter-api-key'] || event.headers?.['X-OpenRouter-Api-Key'] || bodyObj.apiKey || '';
      } catch (_) {}
    }

    if (!key) {
      // Offline intents so the app stays functional without a key
      const lowerOriginal = String(prompt || "").toLowerCase();
      // Detect concise phrasing like "in one word" / "short answer"
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
        const capitalMatch2 = lower.match(/capital(?:\s+city)?\s+of\s+(.+)/);
        if (capitalMatch2?.[1]) {
          const countryName = capitalMatch2[1].replace(/\?+$/, "").trim();
          try {
            const rc = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(countryName)}?fields=capital`);
            if (rc.ok) {
              const rcJson = await rc.json();
              const capital = rcJson?.[0]?.capital?.[0];
              if (capital) {
                demoAnswer = capital;
              }
            }
          } catch (rcErr) {
            console.warn("RestCountries capital lookup failed:", rcErr);
          }
        }
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
        if (topic) {
          try {
            const urlTopic = encodeURIComponent(topic);
            const wikiRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${urlTopic}`);
            if (wikiRes.ok) {
              const wiki = await wikiRes.json();
              if (wiki.extract) {
                demoAnswer = wiki.extract;
                if (conciseMode) {
                  // Keep just the first sentence or up to ~8 words
                  const firstSentence = String(demoAnswer).split(/(?<=[.!?])\s+/)[0];
                  demoAnswer = firstSentence.split(/\s+/).slice(0, 8).join(" ");
                }
              }
            }
          } catch (wErr) {
            console.warn("Wikipedia summary fetch failed:", wErr);
          }
        }

        // If that failed, do a quick search and take the first hit
        if (!demoAnswer) {
          try {
            const q = encodeURIComponent(topic || lower);
            const searchRes = await fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&search=${q}&limit=1&namespace=0&format=json&origin=*`);
            if (searchRes.ok) {
              const searchJson = await searchRes.json();
              const firstTitle = searchJson?.[1]?.[0];
              if (firstTitle) {
                const sRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(firstTitle)}`);
                if (sRes.ok) {
                  const sJson = await sRes.json();
                  if (sJson.extract) {
                    demoAnswer = sJson.extract;
                    if (conciseMode) {
                      const firstSentence = String(demoAnswer).split(/(?<=[.!?])\s+/)[0];
                      demoAnswer = firstSentence.split(/\s+/).slice(0, 8).join(" ");
                    }
                  }
                }
              }
            }
          } catch (sErr) {
            console.warn("Wikipedia search fallback failed:", sErr);
          }
        }
      }

      if (!demoAnswer) {
        demoAnswer = "I'm in offline demo mode and couldn't answer that. Ask me for a joke, time, date, or try questions like 'who is ...', 'what is ...', or 'capital of ...'.";
      }

      console.warn(
        "OPENROUTER_API_KEY missing. For real AI replies, set it and run `netlify dev`. " +
        "Steps: 1) Get a key at https://openrouter.ai 2) $env:OPENROUTER_API_KEY='your_key' 3) netlify dev"
      );
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: demoAnswer })
      };
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

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer }),
    };
  } catch (err) {
    console.error("Function error:", err);
    // Always return JSON so the client can safely parse
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: err.message })
    };
  }
}
