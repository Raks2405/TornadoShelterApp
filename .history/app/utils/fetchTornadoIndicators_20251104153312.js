export async function fetchTornadoIndicators(lat, lon) {
  const serverUrl = "https://api-mrtrdt727a-uc.a.run.app"; // your deployed backend URL
  const res = await fetch(`${serverUrl}/weather?lat=${lat}&lon=${lon}`);
  if (!res.ok) throw new Error("Failed to fetch tornado data");
  return await res.json();
}
