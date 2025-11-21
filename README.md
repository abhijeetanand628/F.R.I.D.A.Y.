# F.R.I.D.A.Y. - AI-Powered Voice Assistant

A browser-based AI-powered smart voice assistant that responds to voice commands and text input. Built with vanilla JavaScript, Express.js, and integrated with OpenRouter API for AI responses.

## Features

- 🎤 **Voice Recognition**: Speak commands using your browser's built-in speech recognition
- 🔊 **Text-to-Speech**: AI responses are spoken aloud using the Web Speech API
- 🤖 **AI Integration**: Powered by OpenRouter API with DeepSeek Chat model
- 🌤️ **Weather Commands**: Get weather information for any city
- 📝 **Text Input**: Type commands directly if you prefer not to use voice
- 📁 **File Upload**: Upload images and videos for processing
- ⚙️ **Customizable Settings**: Adjust voice selection and other preferences
- 💾 **Command History**: View your conversation history with the assistant

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)
- A modern web browser with microphone access
- OpenRouter API key (get one at [https://openrouter.ai](https://openrouter.ai))

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Friday
```

2. Install dependencies:
```bash
npm install
```

3. Set up your environment variables:
   - Create a `.env` file in the root directory
   - Add your OpenRouter API key:
   ```
   OPENROUTER_API_KEY=your_api_key_here
   ```

   Alternatively, you can set it as an environment variable:
   - **Windows (PowerShell)**:
     ```powershell
     $env:OPENROUTER_API_KEY="your_api_key_here"
     ```
   - **Windows (CMD)**:
     ```cmd
     set OPENROUTER_API_KEY=your_api_key_here
     ```
   - **Linux/Mac**:
     ```bash
     export OPENROUTER_API_KEY=your_api_key_here
     ```

## Usage

### Starting the Server

Run the development server:
```bash
npm start
```

Or:
```bash
npm run dev
```

The server will start on `http://localhost:3000`. Open this URL in your browser.

### Using the Assistant

1. **Voice Commands**:
   - Click the "Start Listening" button or the microphone icon
   - Say "Hey Friday" (or just "Friday") to activate the assistant
   - Speak your command after the wake word
   - The assistant will process and respond to your command

2. **Text Commands**:
   - Type your command in the text input field
   - Click "Send" or press Enter
   - The assistant will process and respond

3. **Weather Queries**:
   - Ask for weather information: "What's the weather in [city name]?"
   - The assistant will fetch and display current weather conditions

4. **Stop Speaking**:
   - Say "stop" or "stop speaking" to interrupt the assistant's speech

### Settings

Click the "Settings" button to:
- Select different voice options for text-to-speech
- Configure auto-start listening on page load

## Project Structure

```
Friday/
├── functions/          # Netlify serverless functions
│   └── ask.js         # API endpoint handler
├── modules/           # Modular JavaScript components
│   ├── ai.js         # AI/OpenRouter API integration
│   ├── speech.js     # Speech recognition and synthesis
│   ├── weather.js    # Weather API integration
│   ├── ui.js         # UI components and handlers
│   └── utils.js      # Utility functions
├── index.html         # Main HTML file
├── main.js           # Main application entry point
├── server.js         # Express server
├── style.css         # Stylesheet
├── netlify.toml      # Netlify deployment configuration
└── package.json      # Project dependencies
```

## Technologies Used

- **Frontend**:
  - Vanilla JavaScript (ES6 modules)
  - Web Speech API (Speech Recognition & Synthesis)
  - HTML5 & CSS3

- **Backend**:
  - Node.js
  - Express.js
  - CORS middleware

- **APIs**:
  - OpenRouter API (AI responses)
  - WeatherAPI (weather information)

- **Deployment**:
  - Netlify (serverless functions support)

## Configuration

### API Keys

The application requires an OpenRouter API key to function properly. Without it, the assistant will only echo back your commands with setup instructions.

1. Sign up at [OpenRouter.ai](https://openrouter.ai)
2. Get your API key from the dashboard
3. Add it to your `.env` file or set it as an environment variable

### Environment Variables

- `OPENROUTER_API_KEY`: Your OpenRouter API key (required)

## Deployment

### Netlify

This project is configured for Netlify deployment:

1. Push your code to a Git repository
2. Connect the repository to Netlify
3. Set the `OPENROUTER_API_KEY` environment variable in Netlify's dashboard
4. Deploy!

The `netlify.toml` file is already configured for serverless functions.

## Development

### Module Structure

The project uses a modular architecture:

- **`modules/ai.js`**: Handles all AI-related API calls
- **`modules/speech.js`**: Manages speech recognition and text-to-speech
- **`modules/weather.js`**: Weather command detection and API integration
- **`modules/ui.js`**: UI component setup and event handlers
- **`modules/utils.js`**: Utility functions for history, turn management, etc.

### Adding New Features

1. Create or modify the appropriate module in the `modules/` directory
2. Import and use the module in `main.js`
3. Update the UI in `index.html` and `style.css` if needed

## Browser Compatibility

- Chrome/Edge: Full support (recommended)
- Firefox: Full support
- Safari: Limited support (may require additional permissions)
- Mobile browsers: Varies by platform

**Note**: Speech recognition requires HTTPS in production (localhost works for development).

## Troubleshooting

### Microphone Not Working
- Ensure you've granted microphone permissions in your browser
- Check that your microphone is connected and working
- Try refreshing the page and granting permissions again

### API Errors
- Verify your OpenRouter API key is correctly set
- Check that the API key has sufficient credits
- Review the browser console for detailed error messages

### Voice Not Speaking
- Check your browser's text-to-speech settings
- Try selecting a different voice in Settings
- Ensure your system volume is not muted

## License

This project is open source and available for personal and educational use.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

- Built with OpenRouter API for AI capabilities
- Weather data provided by WeatherAPI
- Inspired by voice assistant technologies

---

**Enjoy using F.R.I.D.A.Y.!** 🚀

