import dotenv from "dotenv";
import { Expo } from "expo-server-sdk";
import express from "express";
import * as logger from "firebase-functions/logger";
import { onSchedule } from "firebase-functions/scheduler";
import { onRequest } from "firebase-functions/v2/https";
import fetch from "node-fetch"; // native in Node 20 but explicit import works

dotenv.config();
const app = express();
app.use(express.json());

// ✅ Create Expo client
const expo = new Expo();

// ✅ In-memory device store
const devices = new Map();

// ---------- API Routes ----------

// Health check
app.get("/", (_req, res) => res.send("Push server up ✅"));

// Register endpoint
app.post("/register", (req, res) => {
  const { token, latitude, longitude, platform } = req.body ?? {};
  if (!token || !Expo.isExpoPushToken(token)) {
    return res.status(400).json({ error: "Valid Expo push token required" });
  }
  devices.set(token, { token, latitude, longitude, platform });
  logger.info("✅ Registered:", token);
  return res.json({ ok: true });
});

// Manual notify endpoint
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
      pressureHpa ? `Pressure ${pressureHpa} hPa` : ""
    ]
      .filter(Boolean)
      .join(" • ");

    const message = {
      to,
      sound: "default",
      title,
      body: body || "Stay safe and monitor local alerts.",
      priority: "high",
      channelId: "default",
      data: { threat: level, windMps, gustMps, pressureHpa, probability }
    };

    const tickets = await expo.sendPushNotificationsAsync([message]);
    res.json({ ok: true, tickets });
  } catch (e) {
    logger.error("Push error:", e);
    res.status(500).json({ error: "Internal error", detail: String(e?.message || e) });
  }
});

// ---------- Utility ----------
function probToThreat(p) {
  if (typeof p !== "number") return "LOW";
  if (p >= 70) return "SEVERE";
  if (p >= 40) return "HIGH";
  if (p >= 20) return "MODERATE";
  return "LOW";
}

// ---------- Tornado Auto Scheduler ----------
export const tornadoScheduler = onSchedule(
  { schedule: "every 15 minutes", region: "us-central1" },
  async () => {
    logger.info("🌪️ Running scheduled tornado check...");

    // Example: check weather at a central point (you can customize)
    const lat = 36.12;
    const lon = -97.07;
    const username = "universityofcentraloklahoma_minh_alex";
    const password = "m19DxHTDPmymY4J7yGR7";

    const parameters = [
      "wind_speed_10m:ms",
      "wind_gusts_10m_1h:ms",
      "msl_pressure:hPa"
    ];
    const nowISO = new Date().toISOString().split(".")[0] + "Z";
    const url = `https://api.meteomatics.com/${nowISO}/${parameters.join(",")}/${lat},${lon}/json`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization:
            "Basic " + Buffer.from(`${username}:${password}`).toString("base64")
        }
      });
      const res = await response.json();

      const pick = (param) =>
        res?.data?.find((d) => d.parameter === param)?.coordinates?.[0]?.dates?.[0]?.value ?? 0;

      const wind = pick("wind_speed_10m:ms");
      const gusts = pick("wind_gusts_10m_1h:ms");
      const pressure = pick("msl_pressure:hPa");
      const windFactor = Math.min(Math.max(wind / 30, 0), 1);
      const gustFactor = Math.min(Math.max(gusts / 40, 0), 1);
      const pressureFactor = Math.min(Math.max((1015 - pressure) / 20, 0), 1);
      const probability = Math.min(Math.max(Math.round((0.4 * windFactor + 0.4 * gustFactor + 0.2 * pressureFactor) * 100), 0), 100);
      const threat = probToThreat(probability);

      logger.info(`Weather Check → wind:${wind} gusts:${gusts} pressure:${pressure} prob:${probability} threat:${threat}`);

      if (probability >= 70 && devices.size > 0) {
        logger.info(`⚠️ Sending alert to ${devices.size} devices`);
        const messages = Array.from(devices.values()).map((d) => ({
          to: d.token,
          sound: "default",
          title: `⚠️ Tornado Alert: ${threat}`,
          body: `Wind ${(wind * 2.237).toFixed(0)} mph | Gusts ${(gusts * 2.237).toFixed(0)} mph | Pressure ${pressure} hPa`,
          priority: "high",
          channelId: "default",
          data: { threat, wind, gusts, pressure, probability }
        }));
        await expo.sendPushNotificationsAsync(messages);
      } else {
        logger.info("No severe alert — no push sent");
      }
    } catch (e) {
      logger.error("Scheduler error:", e);
    }
  }
);

// ---------- Main API ----------
export const api = onRequest({ region: "us-central1" }, app);
