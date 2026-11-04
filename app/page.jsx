"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import InstallPrompt from "./components/InstallPrompt";
import { getWeatherByCity, getWeatherByCoords, hasApiKey } from "@/lib/weather";

const STORAGE_KEY = "weatherpwa:last-query";

// Acento sutil según la condición meteorológica (adaptación visual discreta).
const CONDITION_ACCENTS = {
  Clear: "from-amber-400/10",
  Clouds: "from-sky-300/5",
  Rain: "from-blue-500/10",
  Drizzle: "from-blue-400/10",
  Thunderstorm: "from-violet-500/15",
  Snow: "from-cyan-200/10",
};
const DEFAULT_ACCENT = "from-slate-400/5";

function readLastQuery() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveLastQuery(query, data) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ query, data, savedAt: Date.now() })
    );
  } catch {
    // localStorage puede no estar disponible (modo privado); no es crítico.
  }
}

export default function Home() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Ejecuta cualquier consulta, gestiona estados y guarda el resultado.
  const executeFetch = useCallback(async (fetcher, query) => {
    setLoading(true);
    setError("");
    try {
      const data = await fetcher();
      setWeather(data);
      saveLastQuery(query, data);
    } catch (err) {
      setError(err.message || "Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Recupera la última consulta al volver a abrir la app:
  // muestra al instante el resultado guardado y lo actualiza en segundo plano.
  useEffect(() => {
    let cancelled = false;

    async function restore() {
      const saved = readLastQuery();
      if (!saved || cancelled) return;

      await Promise.resolve();
      if (cancelled) return;

      if (saved.data) setWeather(saved.data);
      if (saved.query?.type === "city") setCity(saved.query.value);

      if (!hasApiKey() || !navigator.onLine) return;

      const { query } = saved;
      if (query?.type === "city") {
        executeFetch(() => getWeatherByCity(query.value), query);
      } else if (query?.type === "coords") {
        executeFetch(() => getWeatherByCoords(query.lat, query.lon), query);
      }
    }

    restore();
    return () => {
      cancelled = true;
    };
  }, [executeFetch]);

  const handleSearch = (e) => {
    e.preventDefault();
    const value = city.trim();
    if (!value) {
      setError("Escribe el nombre de una ciudad.");
      return;
    }
    executeFetch(() => getWeatherByCity(value), { type: "city", value });
  };

  const handleGeoLocation = () => {
    if (!("geolocation" in navigator)) {
      setError("Tu navegador no admite geolocalización.");
      return;
    }

    setLoading(true);
    setError("");

    const onSuccess = ({ coords }) => {
      const lat = coords.latitude;
      const lon = coords.longitude;
      executeFetch(() => getWeatherByCoords(lat, lon), {
        type: "coords",
        lat,
        lon,
      });
    };

    const onFinalError = (geoError) => {
      setLoading(false);
      const messages = {
        1: "Permiso de ubicación denegado. Actívalo en tu navegador o busca una ciudad.",
        2: "No se pudo determinar tu ubicación. Revisa que los Servicios de localización de tu sistema estén activados para el navegador y que tengas Wi-Fi encendido.",
        3: "No se pudo obtener tu ubicación a tiempo. Revisa que los Servicios de localización de tu sistema estén activados para el navegador, o busca una ciudad.",
      };
      setError(messages[geoError.code] || "No se pudo obtener tu ubicación.");
    };

    // 1er intento: ubicación aproximada (Wi-Fi/red), acepta una posición
    // reciente en caché. Si se agota el tiempo o no hay posición, se hace un
    // 2º intento con alta precisión y más tiempo antes de mostrar el error.
    navigator.geolocation.getCurrentPosition(
      onSuccess,
      (geoError) => {
        if (geoError.code === 1) {
          onFinalError(geoError);
          return;
        }
        navigator.geolocation.getCurrentPosition(onSuccess, onFinalError, {
          enableHighAccuracy: true,
          timeout: 25000,
          maximumAge: 0,
        });
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 }
    );
  };

  const condition = weather?.weather?.[0];
  const accent = CONDITION_ACCENTS[condition?.main] || DEFAULT_ACCENT;

  return (
    <main className="mx-auto flex w-full max-w-[480px] flex-col gap-4 px-4 py-4 sm:py-8">
      <div className="flex justify-end empty:hidden">
        <InstallPrompt />
      </div>

      {/* Buscador */}
      <form onSubmit={handleSearch} className="flex gap-2" role="search">
        <label htmlFor="city" className="sr-only">
          Ciudad
        </label>
        <input
          id="city"
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Ejemplo: Oaxaca, Madrid..."
          autoComplete="off"
          enterKeyHint="search"
          className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-100 placeholder:text-slate-400 transition-colors focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-sky-500 px-4 py-2.5 font-bold text-white transition-colors hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Buscar
        </button>
      </form>

      {/* Ubicación actual */}
      <button
        type="button"
        onClick={handleGeoLocation}
        disabled={loading}
        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-sky-400 transition-colors hover:border-slate-600 hover:bg-slate-700/60 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span aria-hidden="true">📍</span> Usar mi ubicación actual
      </button>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="animate-fade-in rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-center text-sm text-red-300"
        >
          {error}
        </div>
      )}

      {/* Carga */}
      {loading && !weather && (
        <div className="mt-2 flex flex-col items-center gap-3 rounded-2xl border border-slate-700 bg-slate-800 p-10 text-slate-400">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-slate-600 border-t-sky-400" />
          <p className="text-sm">Consultando el clima…</p>
        </div>
      )}

      {/* Resultado */}
      {weather && condition && (
        <section
          aria-live="polite"
          aria-busy={loading}
          className={`animate-fade-in relative mt-2 overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 bg-gradient-to-b ${accent} to-transparent to-60% px-6 pb-7 pt-6 text-center shadow-xl shadow-black/30 transition-opacity ${
            loading ? "opacity-60" : "opacity-100"
          }`}
        >
          {loading && (
            <span
              className="absolute right-4 top-4 h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-sky-400"
              aria-label="Actualizando"
            />
          )}

          <h1 className="text-2xl font-bold text-balance text-white sm:text-3xl">
            {weather.name}
            {weather.sys?.country ? `, ${weather.sys.country}` : ""}
          </h1>

          <div className="my-4 flex items-center justify-center gap-2">
            <Image
              src={`https://openweathermap.org/img/wn/${condition.icon}@2x.png`}
              alt={condition.description}
              width={100}
              height={100}
              className="h-24 w-24 drop-shadow-lg"
              unoptimized
              priority
            />
            <p className="text-6xl font-black tracking-tight text-white">
              {Math.round(weather.main.temp)}°C
            </p>
          </div>

          <p className="capitalize text-slate-300">{condition.description}</p>

          <hr className="my-4 border-slate-700" />

          <div className="grid grid-cols-2 gap-4 text-sm text-slate-200">
            <p>
              Humedad: <strong className="font-bold text-white">{weather.main.humidity}%</strong>
            </p>
            <p>
              Viento: <strong className="font-bold text-white">{weather.wind.speed} m/s</strong>
            </p>
          </div>
        </section>
      )}

      {/* Estado inicial */}
      {!weather && !loading && !error && (
        <p className="mt-6 text-center text-sm text-slate-500">
          Busca una ciudad o usa tu ubicación para ver el clima actual.
        </p>
      )}
    </main>
  );
}
