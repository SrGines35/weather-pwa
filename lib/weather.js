const API_KEY = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
const BASE_URL = "https://api.openweathermap.org/data/2.5";

const PLACEHOLDER_KEY = "tu_clave_de_api_aqui";

/**
 * Indica si hay una API Key configurada (no vacía ni el valor de ejemplo).
 */
export function hasApiKey() {
  return Boolean(API_KEY && API_KEY.trim() && API_KEY.trim() !== PLACEHOLDER_KEY);
}

const MISSING_KEY_MESSAGE =
  "Falta configurar la API Key de OpenWeatherMap. Agrégala en el archivo .env.local (NEXT_PUBLIC_WEATHER_API_KEY) y reinicia el servidor.";

async function request(url, notFoundMessage) {
  if (!hasApiKey()) {
    throw new Error(MISSING_KEY_MESSAGE);
  }

  let res;
  try {
    res = await fetch(url);
  } catch {
    throw new Error("No hay conexión a internet o el servicio no responde. Inténtalo de nuevo.");
  }

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error(
        "La API Key de OpenWeatherMap no es válida o aún no está activa (las claves nuevas pueden tardar unas horas en activarse)."
      );
    }
    if (res.status === 429) {
      throw new Error("Se superó el límite de consultas de la API. Espera un momento e inténtalo de nuevo.");
    }
    throw new Error(notFoundMessage);
  }

  return res.json();
}

export async function getWeatherByCity(city) {
  return request(
    `${BASE_URL}/weather?q=${encodeURIComponent(city)}&units=metric&lang=es&appid=${API_KEY}`,
    "No se encontró la ciudad solicitada."
  );
}

export async function getWeatherByCoords(lat, lon) {
  return request(
    `${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&lang=es&appid=${API_KEY}`,
    "Error al consultar el clima para tu ubicación."
  );
}
