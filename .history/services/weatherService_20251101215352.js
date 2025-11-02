// services/weatherService.js
import axios from "axios";
import base64 from "base-64";

export async function fetchTornadoIndicators(lat, lon) {
  const username = "universityofcentraloklahoma_minh_alex";
  const password = "m19DxHTDPmymY4J7yGR7";
  const authHeader = "Basic " + base64.encode(`${username}:${password}`);

  // parameters we can access on the free plan
  const parameters = [
    "wind_speed_10m:ms",
    "wind_gusts_10m_1h:ms",
    "msl_pressure:hPa"
  ];

  const now = new Date().toISOString().split(".")[0] + "Z";
  const url = `https://api.meteomatics.com/${now}/${parameters.join(",")}/${lat},${lon}/json`;

  try {
    const res = await axios.get(url, {
      headers: { Authorization: authHeader },
    });

    const extract = (param) =>
      res.data.data.find((d) => d.parameter === param)?.coordinates?.[0]?.dates?.[0]?.value ?? null;

    const wind = extract("wind_speed_10m:ms") ?? 0;
    const gusts = extract("wind_gusts_10m_1h:ms") ?? 0;
    const pressure = extract("msl_pressure:hPa") ?? 1013;

    // simple scoring
    let score = 0;
    if (wind > 15) score += 1;
    if (gusts > 25) score += 2;
    if (pressure < 1000) score += 2;

    const threat =
      score >= 5 ? "SEVERE" :
      score >= 3 ? "HIGH" :
      score >= 2 ? "MODERATE" :
      "LOW";

    return { wind, gusts, pressure, score, threat };
  } catch (err) {
    console.error("⚠️ Meteomatics API error:", err?.message || err);
    return null;
  }
}
