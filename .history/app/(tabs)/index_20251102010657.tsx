import axios from "axios";

/**
 * Fetch live wind / gust / pressure near a point and derive a continuous tornado risk percentage (0–100%).
 * Works on-device (React Native) since there is no browser CORS.
 */
export async function fetchTornadoIndicators(lat, lon) {
  const username = "universityofcentraloklahoma_minh_alex";
  const password = "m19DxHTDPmymY4J7yGR7";

  const parameters = [
    "wind_speed_10m:ms",
    "wind_gusts_10m_1h:ms",
    "msl_pressure:hPa",
  ];

  const nowISO = new Date().toISOString().split(".")[0] + "Z";
  const url = `https://api.meteomatics.com/${nowISO}/${parameters.join(
    ","
  )}/${lat},${lon}/json`;

  try {
    const res = await axios.get(url, { auth: { username, password } });

    const pick = (param) =>
      res.data?.data
        ?.find((d) => d.parameter === param)
        ?.coordinates?.[0]?.dates?.[0]?.value ?? null;

    const wind = pick("wind_speed_10m:ms") ?? 0;
    const gusts = pick("wind_gusts_10m_1h:ms") ?? 0;
    const pressure = pick("msl_pressure:hPa") ?? 1013;

    // ---------- 🌪 continuous risk formula (bounded 0–100%) ----------
    // Normalize each input and ensure no negative contribution
    const windFactor = Math.min(Math.max(wind / 30, 0), 1);        // 0–1
    const gustFactor = Math.min(Math.max(gusts / 40, 0), 1);       // 0–1
    const pressureFactor = Math.min(Math.max((1015 - pressure) / 20, 0), 1); // only if pressure < 1015

    // Weighted influence: wind (40%), gusts (40%), pressure (20%)
    const score = 0.4 * windFactor + 0.4 * gustFactor + 0.2 * pressureFactor;

    // Convert to percentage and clamp strictly between 0–100
    const probability = Math.min(Math.max(Math.round(score * 100), 0), 100);

    // Determine qualitative threat label
    let threat;
    if (probability >= 75) threat = "SEVERE";
    else if (probability >= 50) threat = "HIGH";
    else if (probability >= 25) threat = "MODERATE";
    else threat = "LOW";

    console.log("🌀 Tornado risk data:", {
      wind,
      gusts,
      pressure,
      probability,
      threat,
    });

    return { wind, gusts, pressure, threat, probability };
  } catch (err) {
    if (err.response) {
      console.error(
        "Meteomatics error:",
        err.response.status,
        err.response.data
      );
    } else {
      console.error("Meteomatics error:", err.message || err);
    }
    return null;
  }
}
