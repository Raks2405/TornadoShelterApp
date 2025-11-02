// services/weatherService.js
import axios from "axios";

/**
 * Fetch live wind / gust / pressure near a point and derive a simple tornado risk.
 * Works on-device (React Native) since there is no browser CORS.
 */
export async function fetchTornadoIndicators(lat, lon) {
    // ⚠️ move these into secure config when you’re ready (Expo config/Secrets)
    const username = "universityofcentraloklahoma_minh_alex";
    const password = "m19DxHTDPmymY4J7yGR7";

    const parameters = [
        "wind_speed_10m:ms",
        "wind_gusts_10m_1h:ms",
        "msl_pressure:hPa",
    ];
    console.log("📍 Geocoded shelter:", g.name, loc);

    // use the current hour in ISO (Meteomatics expects ISO8601)
    const nowISO = new Date().toISOString().split(".")[0] + "Z";
    const url = `https://api.meteomatics.com/${nowISO}/${parameters.join(",")}/${lat},${lon}/json`;

    try {
        const res = await axios.get(url, {
            auth: { username, password }, // ✅ no base-64 needed
        });
        console.log("📍 Geocoded shelter:", g.name, loc);

        const pick = (param) => {
            console.log("🧭 Meteomatics raw:", JSON.stringify(res.data, null, 2));
            res.data?.data?.find((d) => d.parameter === param)?.coordinates?.[0]?.dates?.[0]?.value ?? null;
        }

        const wind = pick("wind_speed_10m:ms") ?? 0;
        const gusts = pick("wind_gusts_10m_1h:ms") ?? 0;
        const pressure = pick("msl_pressure:hPa") ?? 1013;

        // simple risk scoring
        let score = 0;
        if (wind > 15) score += 1;
        if (gusts > 25) score += 2;
        if (pressure < 1000) score += 2;

        const threat =
            score >= 5 ? "SEVERE" :
                score >= 3 ? "HIGH" :
                    score >= 2 ? "MODERATE" : "LOW";

        return { wind, gusts, pressure, score, threat };
    } catch (err) {
        // Helpful diagnostics
        if (err.response) {
            console.error("Meteomatics error:", err.response.status, err.response.data);
        } else {
            console.error("Meteomatics error:", err.message || err);
        }
        return null;
    }
}
