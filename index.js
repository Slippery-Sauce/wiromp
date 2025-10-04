import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.WEATHER_API_KEY;

// ES Module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files (HTML, CSS)
app.use(express.static(__dirname));

// Classify conditions
function classifyWeather(temp, wind, rain, humidity) {
  if (temp > 35) return "🔥 Very Hot";
  if (temp < 5) return "❄️ Very Cold";
  if (wind > 10) return "💨 Very Windy";
  if (rain > 5) return "🌧️ Very Wet";
  if (temp > 28 && humidity > 70) return "🥵 Very Uncomfortable";
  return "😎 Good Weather";
}

// Calculate rain probability based on conditions
function calculateRainProbability(weather, clouds, humidity) {
  let probability = 0;
  
  // Check weather condition
  const weatherMain = weather[0].main.toLowerCase();
  if (weatherMain.includes('rain')) {
    probability = 80;
  } else if (weatherMain.includes('drizzle')) {
    probability = 60;
  } else if (weatherMain.includes('thunderstorm')) {
    probability = 90;
  } else if (weatherMain.includes('cloud')) {
    // Cloud coverage and humidity-based probability
    if (clouds > 80 && humidity > 70) {
      probability = 50;
    } else if (clouds > 60 && humidity > 60) {
      probability = 30;
    } else if (clouds > 40) {
      probability = 15;
    } else {
      probability = 5;
    }
  } else if (weatherMain.includes('clear')) {
    probability = 0;
  } else {
    probability = 10;
  }
  
  return `${probability}%`;
}

// Weather API route with city parameter
app.get("/weather/:city", async (req, res) => {
  const city = req.params.city;

  try {
    // Get current weather
    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;
    const currentResponse = await axios.get(currentUrl);
    const data = currentResponse.data;

    const temp = data.main.temp;
    const wind = data.wind.speed;
    const rain = data.rain ? data.rain["1h"] : 0;
    const humidity = data.main.humidity;
    const clouds = data.clouds.all;

    // Calculate rain probability
    const rainProbability = calculateRainProbability(data.weather, clouds, humidity);

    // Add classification and rain probability to response
    data.classification = classifyWeather(temp, wind, rain, humidity);
    data.rainProbability = rainProbability;

    res.json(data);
  } catch (err) {
    if (err.response?.data?.message) {
      res.status(404).json({ error: err.response.data.message });
    } else {
      res.status(500).json({ error: "Failed to fetch weather data" });
    }
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🌤️ Weather server running on http://localhost:${PORT}`);
});
