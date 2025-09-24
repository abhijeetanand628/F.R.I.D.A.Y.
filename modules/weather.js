// WEATHER API MODULE
// Weather API integration and command parsing
// Weather API Key
const WEATHER_API_KEY = 'a5c0fae4b7fc460080481110251109';

// Weather function
async function getWeather(city) {
  try {
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${city}&days=1&aqi=no`;
    const res = await fetch(url);
    if (!res.ok) {
      return `Sorry, I couldn't find the weather for ${city}.`;
    }
    const data = await res.json();

    const location = data.location.name;
    const temp = data.current.temp_c;
    const condition = data.current.condition.text;
    const cityForecast = data.forecast.forecastday[0].day;
    const Maxtemp = cityForecast.maxtemp_c;
    const Mintemp = cityForecast.mintemp_c;
    const weatherReport = `The weather in ${location} is currently ${temp} degrees Celsius with ${condition}. The high for today is ${Maxtemp} degrees Celsius and the low is ${Mintemp} degrees Celsius.`;
    return weatherReport;
  } catch (error) {
    console.error("Weather fetch error:", error);
    return "Sorry, I'm having trouble connecting to the weather service.";
  }
}

// Weather command pattern matching
function isWeatherCommand(command) {
  return /what's the weather in (.+)|what is the weather in (.+)|weather in (.+)/i.test(command);
}

// Extract city from weather command
function extractCityFromCommand(command) {
  const weatherMatch = command.match(/what's the weather in (.+)|what is the weather in (.+)|weather in (.+)/i);
  if (weatherMatch) {
    return weatherMatch[1] || weatherMatch[2] || weatherMatch[3];
  }
  return null;
}

// Export functions
export {
  getWeather,
  isWeatherCommand,
  extractCityFromCommand
};
