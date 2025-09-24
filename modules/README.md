# Voice Assistant Modules

This directory contains the modular JavaScript files for the F.R.I.D.A.Y. voice assistant application.

## File Structure

### `speech.js`
Contains all speech recognition and synthesis functionality:
- Speech recognition setup and configuration
- Text-to-speech functions
- Voice selection and management
- Speech cleaning utilities

### `weather.js`
Handles weather API integration:
- Weather data fetching from WeatherAPI
- Weather command pattern matching
- City extraction from voice commands

### `ai.js`
Manages AI assistant interactions:
- OpenRouter API communication
- AI response handling
- Error management for AI requests

### `utils.js`
Utility functions and data management:
- Q&A history storage and retrieval
- Turn management for command processing
- Command validation utilities

### `ui.js`
User interface and file upload functionality:
- File upload and preview handling
- Voice selection setup
- Settings modal management
- Button event handlers
- Form submission handling

## Usage

All modules are imported and used in `main.js`, which serves as the main application entry point. The modules use ES6 import/export syntax for clean separation of concerns.

## Benefits of This Structure

1. **Maintainability**: Each module has a single responsibility
2. **Readability**: Code is organized by functionality
3. **Reusability**: Modules can be easily reused or modified
4. **Debugging**: Easier to locate and fix issues in specific areas
5. **Testing**: Individual modules can be tested in isolation
