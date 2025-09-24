import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Real OpenRouter API function
app.post('/.netlify/functions/ask', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    // Check if API key is set
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey || apiKey === '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') {
      return res.json({
        answer: `I heard you say: "${prompt}". 

To get real AI responses:
1. Get your API key from https://openrouter.ai
2. Stop this server (Ctrl+C)
3. Run: set OPENROUTER_API_KEY=your_real_key_here && npm start
4. Or create a .env file with: OPENROUTER_API_KEY=your_real_key_here

Then restart the server!`
      });
    }
    
    // Call OpenRouter API
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat",
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();
    
    if (data.choices && data.choices[0]) {
      let answer = data.choices[0].message.content;
      
      // Clean up the response for better display and speech
      answer = answer
        // Remove excessive markdown formatting
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        // Remove emojis and special characters that don't speak well
        .replace(/[^\w\s.,!?;:()\-'"\n]/g, ' ')
        // Clean up multiple spaces
        .replace(/\s+/g, ' ')
        .trim();
      
      res.json({ answer });
    } else {
      res.json({ answer: "Sorry, I couldn't process that request." });
    }
  } catch (error) {
    console.error("OpenRouter API error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('Open your browser and go to http://localhost:3000');
});
