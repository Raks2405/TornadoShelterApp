import express from "express";
import { Expo } from "expo-server-sdk";
import { onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { defineSecret } from "firebase-functions/params";
import { fetchTornadoIndicators } from "./weatherService.js";  // ✅ import your helper

// ---------- INIT ----------
initializeApp();
const db = getFirestore();
const app = express();
app.use(express.json());
const expo = new Expo();

// ---------- SECRETS (used only by scheduler) ----------
const METEO_USERNAME = defineSecret("METEO_USERNAME");
const METEO_PASSWORD = defineSecret("METEO_PASSWORD");

// ---------- UTILS ----------
function probToThreat(p) {
  if (typeof p !== "number") return "LOW";
  if (p >= 70) return "SEVERE";
  if (p >= 40) return "HIGH";
  if (p >= 20) return "MODERATE";
  return "LOW";
}

// ---------- ROUTES ----------
app.get("/", (_req, res) => res.send("Push server up ✅"));

app.post("/register", async (req, res) => {
  try {
    const { token, latitude, longitude, platform } = req.body ?? {};
    if (!token || !Expo.isExpoPushToken(token))
      return res.status(400).json({ error: "Valid Expo push token required" });

    await db.collection("devices").doc(token).set({
      latitude,
      longitude,
      platform,
      updatedAt: new Date().toISOString(),
    });

    logger.info(`✅ Registered device: ${token}`);
    return res.json({ ok: true });
  } catch (e) {
    logger.error("Registration error:", e);
    res.status(500).json({ error: "Failed to register token" });
  }
});

// ---------- MANUAL PUSH ----------
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
      sound: "default",
      title,
      body: body || "Stay safe and monitor local alerts.",
      priority: "high",
      channelId: "default",
      data: { threat: level, windMps, gustMps, pressureHpa, probability },
    };

    const tickets = await expo.sendPushNotificationsAsync([message]);
    res.json({ ok: true, tickets });
  } catch (e) {
    logger.error("Push error:", e);
    res.status(500).json({ error: "Internal error", detail: String(e?.message || e) });
  }
});

// ---------- WEATHER ENDPOINT ----------
app.get("/weather", async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);
    if (!lat || !lon) return res.status(400).json({ error: "lat & lon required" });

    const data = await fetchTornadoIndicators(lat, lon);
    return res.json(data);
  } catch (e) {
    logger.error("Weather endpoint error:", e);
    res.status(500).json({ error: "Internal" });
  }
});

// ---------- SCHEDULED ALERT ----------
export const tornadoScheduler = onSchedule(
  {
    schedule: "every 15 minutes",
    region: "us-central1",
    secrets: [METEO_USERNAME, METEO_PASSWORD],  // ✅ keep here only
  },
  async () => {
    logger.info("🌪️ Running personalized tornado check...");

    const devicesSnap = await db.collection("devices").get();
    if (devicesSnap.empty) {
      logger.info("No registered devices found");
      return;
    }

    let severeCount = 0;

    for (const doc of devicesSnap.docs) {
      const { latitude, longitude } = doc.data();
      const token = doc.id;
      if (!latitude || !longitude) continue;

      const data = await fetchTornadoIndicators(latitude, longitude);
      if (!data) continue;

      const { wind, gusts, pressure, probability, threat } = data;

      if (probability >= 70) {
        severeCount++;
        const message = {
          to: token,
          sound: "default",
          title: `⚠️ Tornado Alert: ${threat}`,
          body: `Wind ${(wind * 2.237).toFixed(0)} mph | Gusts ${(gusts * 2.237).toFixed(
            0
          )} mph | Pressure ${pressure} hPa`,
          priority: "high",
          channelId: "default",
          data: { threat, wind, gusts, pressure, probability },
        };

        await expo.sendPushNotificationsAsync([message]);
        logger.info(`⚠️ Sent alert to ${token} (${latitude},${longitude}) → ${probability}%`);
      }
    }

    logger.info(`✅ Completed personalized check — ${severeCount} users alerted.`);
  }
);

// ---------- MAIN API ----------
export const api = onRequest(
  { region: "us-central1" },  // ✅ no secrets here
  app
);
