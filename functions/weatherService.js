// functions/weatherService.js
const axios = require("axios");
const logger = require("firebase-functions/logger");

async function fetchTornadoIndicators(lat, lon) {
  try {
    const username = process.env.METEO_USERNAME;
    const password = process.env.METEO_PASSWORD;

    const now = new Date().toISOString().split(".")[0] + "Z";
    const url = `https://api.meteomatics.com/${now}/wind_speed_10m:ms,wind_gusts_10m_1h:ms,msl_pressure:hPa/${lat},${lon}/json`;

    const response = await axios.get(url, {
      auth: { username, password },
      timeout: 8000,
    });

    const data = response.data?.data;
    if (!data) throw new Error("No data from Meteomatics");

    const wind = data[0].coordinates[0].dates[0].value || 0;
    const gusts = data[1].coordinates[0].dates[0].value || 0;
    const pressure = data[2].coordinates[0].dates[0].value || 1013;

    const probability = Math.min(100, Math.max(0, ((gusts - wind) * 4 + (1013 - pressure)) / 2));
    const threat =
      probability >= 70
        ? "SEVERE"
        : probability >= 40
        ? "HIGH"
        : probability >= 20
        ? "MODERATE"
        : "LOW";

    return { wind, gusts, pressure, probability, threat };
  } catch (err) {
    logger.error("⚠️ Meteomatics fetch failed:", err.message);
    return { wind: 0, gusts: 0, pressure: 0, probability: 0, threat: "LOW" };
  }
}

module.exports = { fetchTornadoIndicators };
