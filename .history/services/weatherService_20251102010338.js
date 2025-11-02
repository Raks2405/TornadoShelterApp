import axios from "axios";

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

    // ---------- 🌪 continuous risk formula ----------
    // Weighted influence of each variable
    const windFactor = Math.min(wind / 30, 1);        // 0–1 for 0–30 m/s
    const gustFactor = Math.min(gusts / 40, 1);       // 0–1 for 0–40 m/s
    const pressureFactor = Math.min((1015 - pressure) / 20, 1); // lower pressure → higher risk

    // Combine with relative weights
    const score =
      0.4 * windFactor + 0.4 * gustFactor + 0.2 * pressureFactor;

    // Convert to 0–100 %
    const probability = Math.round(score * 100);

    let threat;
    if (probability >= 75) threat = "SEVERE";
    else if (probability >= 50) threat = "HIGH";
    else if (probability >= 25) threat = "MODERATE";
    else threat = "LOW";

    return { wind, gusts, pressure, threat, probability };
  } catch (err) {
    if (err.response) {
      console.error("Meteomatics error:", err.response.status, err.response.data);
    } else {
      console.error("Meteomatics error:", err.message || err);
    }
    return null;
  }
}
