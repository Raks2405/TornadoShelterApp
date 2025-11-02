import axios from "axios";

/**
 * Fetch live wind/gust/pressure near a point and derive a continuous tornado risk (0–100%).
 * Works on-device (React Native) since there is no browser CORS.
 */
export async function fetchTornadoIndicators(lat, lon) {
  const username = process.env.METEOMATICS_USER;
  const password = process.env.METEROMATICS_PASS;

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

    const pick = (param) => {
      const found = res.data?.data?.find((d) => d.parameter === param);
      return (
        found?.coordinates?.[0]?.dates?.[0]?.value ?? null
      );
    };

    const wind = pick("wind_speed_10m:ms") ?? 0;
    const gusts = pick("wind_gusts_10m_1h:ms") ?? 0;
    const pressure = pick("msl_pressure:hPa") ?? 1013;

    // ---------- 🌪 continuous risk formula (bounded 0–100%) ----------
    const windFactor = Math.min(Math.max(wind / 30, 0), 1);
    const gustFactor = Math.min(Math.max(gusts / 40, 0), 1);
    const pressureFactor = Math.min(Math.max((1015 - pressure) / 20, 0), 1); // only counts if <1015

    const score =
      0.4 * windFactor + 0.4 * gustFactor + 0.2 * pressureFactor;

    const probability = Math.min(Math.max(Math.round(score * 100), 0), 100);

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
    } else if (err.message) {
      console.error("Meteomatics error:", err.message);
    } else {
      console.error("Meteomatics unknown error:", err);
    }
    return null;
  }
}
