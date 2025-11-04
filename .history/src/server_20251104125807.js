import express from "express";
import { Expo } from "expo-server-sdk";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());

// Create Expo client
const expo = new Expo();

// ✅ Health check
app.get("/", (_req, res) => res.send("Push server up ✅"));

// ✅ Register endpoint — called by your App.tsx
const devices = new Map();
app.post("/register", (req, res) => {
  const { token, latitude, longitude, platform } = req.body ?? {};
  if (!token || !Expo.isExpoPushToken(token)) {
    return res.status(400).json({ error: "Valid Expo push token required" });
  }
  devices.set(token, { token, latitude, longitude, platform });
  console.log("✅ Registered:", token);
  return res.json({ ok: true });
});

// ✅ Notify endpoint (manual or automated trigger)
app.post("/notify", async (req, res) => {
  try {
    const { to, threat, windMps, gustMps, pressureHpa, probability } = req.body ?? {};
    if (!to || typeof to !== "string") return res.status(400).json({ error: "`to` required" });
    if (!Expo.isExpoPushToken(to)) return res.status(400).json({ error: "Invalid Expo token" });

    const level = ["LOW", "MODERATE", "HIGH", "SEVERE"].includes(threat)
      ? threat
      : probToThreat(probability);
    const title =
      level === "HIGH" || level === "SEVERE"
        ? `⚠️ Tornado Alert: ${level}`
        : `Tornado Status: ${level}`;
    const body = [
      windMps ? `Wind ${(windMps * 2.237).toFixed(0)} mph` : "",
      gustMps ? `Gusts ${(gustMps * 2.237).toFixed(0)} mph` : "",
      pressureHpa ? `Pressure ${pressureHpa} hPa` : "",
    ]
      .filter(Boolean)
      .join(" • ");

    const message = {
      to,
      sound: 'default',
      title,
      body: body || "Stay safe and monitor local alerts.",
      priority: "high",
      channelId: "default",
      data: { threat: level, windMps, gustMps, pressureHpa, probability },
    };

    const tickets = await expo.sendPushNotificationsAsync([message]);
    res.json({ ok: true, tickets });
  } catch (e) {
    console.error("Push error:", e);
    res.status(500).json({ error: "Internal error", detail: String(e?.message || e) });
  }
});

// ✅ Periodic tornado check (optional automation)


function probToThreat(p) {
  if (typeof p !== "number") return "LOW";
  if (p >= 70) return "SEVERE";
  if (p >= 40) return "HIGH";
  if (p >= 20) return "MODERATE";
  return "LOW";
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Push server running at http://localhost:${PORT}`));
