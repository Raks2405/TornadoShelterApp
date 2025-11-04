import express from "express";
import { Expo } from "expo-server-sdk";
import dotenv from "dotenv";
import fetch from "node-fetch";
import { onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// ---------- INIT ----------
dotenv.config();
initializeApp();
const db = getFirestore();
const app = express();
app.use(express.json());
const expo = new Expo();

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

// ---------- SCHEDULED FUNCTION ----------
export const tornadoScheduler = onSchedule(
  { schedule: "every 15 minutes", region: "us-central1" },
  async () => {
    logger.info("🌪️ Running scheduled tornado check...");

    const lat = 36.12;
    const lon = -97.07;
    const username = "universityofcentraloklahoma_minh_alex";
    const password = "m19DxHTDPmymY4J7yGR7";
    const parameters = ["wind_speed_10m:ms", "wind_gusts_10m_1h:ms", "msl_pressure:hPa"];
    const nowISO = new Date().toISOString().split(".")[0] + "Z";
    const url = `https://api.meteomatics.com/${nowISO}/${parameters.join(",")}/${lat},${lon}/json`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: "Basic " + Buffer.from(`${username}:${password}`).toString("base64"),
        },
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
      const probability = Math.min(
        Math.max(Math.round((0.4 * windFactor + 0.4 * gustFactor + 0.2 * pressureFactor) * 100), 0),
        100
      );
      const threat = probToThreat(probability);

      logger.info(
        `Weather Check → wind:${wind} gusts:${gusts} pressure:${pressure} prob:${probability} threat:${threat}`
      );

      // ---- Deduplication logic ----
      const configRef = db.collection("config").doc("last_alert");
      const lastData = (await configRef.get()).data();
      const lastThreat = lastData?.level || "LOW";

      if ((threat === "HIGH" || threat === "SEVERE") && lastThreat !== threat) {
        logger.info(`⚠️ Alert escalation: ${lastThreat} → ${threat}`);

        // Fetch device tokens
        const snapshot = await db.collection("devices").get();
        const tokens = snapshot.docs.map((doc) => doc.id);
        if (tokens.length === 0) {
          logger.info("No registered devices found");
          return;
        }

        const messages = tokens.map((token) => ({
          to: token,
          sound: "default",
          title: `⚠️ Tornado Alert: ${threat}`,
          body: `Wind ${(wind * 2.237).toFixed(0)} mph | Gusts ${(gusts * 2.237).toFixed(
            0
          )} mph | Pressure ${pressure} hPa`,
          priority: "high",
          channelId: "default",
          data: { threat, wind, gusts, pressure, probability },
        }));

        await expo.sendPushNotificationsAsync(messages);
        await configRef.set({ level: threat, updatedAt: new Date().toISOString() });
        logger.info(`✅ Alert sent and state saved: ${threat}`);
      } else if (threat === "LOW" || threat === "MODERATE") {
        // Reset so next severe event will trigger again
        await configRef.set({ level: "LOW", updatedAt: new Date().toISOString() });
        logger.info("Threat normalized — reset alert level");
      } else {
        logger.info("No change in threat — skipping alert");
      }
    } catch (e) {
      logger.error("Scheduler error:", e);
    }
  }
);

// ---------- MAIN API ----------
export const api = onRequest({ region: "us-central1" }, app);
