import axios from 'axios';
import { METEOMATICS_USER, METEOMATICS_PASS } from '@env';

export const fetchTornadoIndicators = async (lat, lon) => {
  const startTime = new Date().toISOString().split('.')[0] + 'Z';
  const timeRange = 'P3D:PT1H';
  const parameters = [
    'wind_speed_10m:ms',
    'wind_gusts_10m_1h:ms',
    't_2m:C',
    'msl_pressure:hPa',
    'precip_1h:mm',
    'weather_symbol_1h:idx'
  ].join(',');

  const url = `https://api.meteomatics.com/${startTime}--${timeRange}/${parameters}/${lat},${lon}/json`;

  try {
    const res = await axios.get(url, {
      auth: {
        username: METEOMATICS_USER,
        password: METEOMATICS_PASS,
      },
    });

    // Parse indicators
    let riskScore = 0;
    const data = res.data.data;
    const latest = data.map(p => ({
      name: p.parameter,
      value: p.coordinates[0].dates[0].value
    }));

    const getVal = (key) => latest.find(d => d.name === key)?.value || 0;

    const wind = getVal('wind_speed_10m:ms');
    const gusts = getVal('wind_gusts_10m_1h:ms');
    const pressure = getVal('msl_pressure:hPa');

    if (wind > 15) riskScore += 1;
    if (gusts > 25) riskScore += 2;
    if (pressure < 1000) riskScore += 2;

    let threat = 'LOW';
    if (riskScore >= 5) threat = 'SEVERE';
    else if (riskScore >= 3) threat = 'HIGH';
    else if (riskScore >= 2) threat = 'MODERATE';

    return { wind, gusts, pressure, riskScore, threat };
  } catch (err) {
    console.error('Meteomatics API error:', err.response?.data || err.message);
    return null;
  }
};
