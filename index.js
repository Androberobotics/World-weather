const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());

const weatherDescriptions = {
  0: "☀️ Klart", 1: "🌤️ Mest klart", 2: "🌥️ Delvis skyet", 3: "☁️ Overskyet",
  45: "🌫️ Tåke", 48: "🌫️ Tåke (rim)", 51: "🌦️ Lett yr", 53: "🌦️ Yr",
  55: "🌧️ Kraftig yr", 61: "🌦️ Lett regn", 63: "🌧️ Regn", 65: "🌧️ Kraftig regn",
  71: "🌨️ Lett snø", 73: "🌨️ Snø", 75: "❄️ Kraftig snø", 80: "🌧️ Regnbyger", 95: "⛈️ Tordenvær"
};

app.post("/webhook", async (req, res) => {
  const location = req.body.queryResult.parameters["location"];

  if (!location) {
    return res.json({ fulfillmentText: "Kan du si hvilken by du ønsker vær for?" });
  }

  try {
    // 1. Få koordinater (lat/lon) for by
    const geoRes = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`);
    const geo = geoRes.data.results?.[0];

    if (!geo) {
      return res.json({ fulfillmentText: `Fant ikke posisjon for "${location}".` });
    }

    const { latitude, longitude, name, country } = geo;

    // 2. Hent sanntidsvær
    const weatherRes = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
    const weather = weatherRes.data.current_weather;
    const description = weatherDescriptions[weather.weathercode] || "🌈 Ukjent vær";

    const response = `📍 ${name}, ${country}\n${description}\n🌡️ ${weather.temperature} °C\n💨 ${weather.windspeed} m/s\n🕒 ${weather.time}`;
    return res.json({ fulfillmentText: response });

  } catch (error) {
    console.error("Feil i webhook:", error.message);
    return res.json({ fulfillmentText: "Beklager, noe gikk galt under henting av værdata." });
  }
});

app.get("/", (req, res) => res.send("Værboten kjører!"));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`✅ Server kjører på port ${port}`));
