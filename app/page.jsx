
"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import InstallPrompt from "./components/InstallPrompt";
import {
  getWeatherByCity,
  getWeatherByCoords,
  hasApiKey,
} from "@/lib/weather";

const STORAGE_KEY = "weatherpwa:last-query";

const CONDITION_ACCENTS = {
  Clear: "from-amber-300/10",
  Clouds: "from-slate-300/10",
  Rain: "from-blue-300/10",
  Drizzle: "from-sky-300/10",
  Thunderstorm: "from-violet-300/10",
  Snow: "from-cyan-200/10",
};

const DEFAULT_ACCENT = "from-slate-300/5";

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
    // El almacenamiento local no es obligatorio.
  }
}

export default function Home() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  useEffect(() => {
    let cancelled = false;

    async function restore() {
      const saved = readLastQuery();

      if (!saved || cancelled) return;

      await Promise.resolve();

      if (cancelled) return;

      if (saved.data) setWeather(saved.data);

      if (saved.query?.type === "city") {
        setCity(saved.query.value);
      }

      if (!hasApiKey() || !navigator.onLine) return;

      const { query } = saved;

      if (query?.type === "city") {
        executeFetch(
          () => getWeatherByCity(query.value),
          query
        );
      } else if (query?.type === "coords") {
        executeFetch(
          () => getWeatherByCoords(query.lat, query.lon),
          query
        );
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

    executeFetch(
      () => getWeatherByCity(value),
      { type: "city", value }
    );
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

      executeFetch(
        () => getWeatherByCoords(lat, lon),
        { type: "coords", lat, lon }
      );
    };

    const onFinalError = (geoError) => {
      setLoading(false);

      const messages = {
        1: "Permiso de ubicación denegado. Actívalo en tu navegador o busca una ciudad.",
        2: "No se pudo determinar tu ubicación. Revisa los servicios de localización.",
        3: "No se pudo obtener tu ubicación a tiempo. Intenta nuevamente.",
      };

      setError(
        messages[geoError.code] ||
        "No se pudo obtener tu ubicación."
      );
    };

    navigator.geolocation.getCurrentPosition(
      onSuccess,
      (geoError) => {
        if (geoError.code === 1) {
          onFinalError(geoError);
          return;
        }

        navigator.geolocation.getCurrentPosition(
          onSuccess,
          onFinalError,
          {
            enableHighAccuracy: true,
            timeout: 25000,
            maximumAge: 0,
          }
        );
      },
      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 600000,
      }
    );
  };

  const condition = weather?.weather?.[0];
  const accent =
    CONDITION_ACCENTS[condition?.main] || DEFAULT_ACCENT;

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-[480px] flex-col gap-6 overflow-hidden px-5 py-6 text-slate-100 sm:py-10">

      {/* Fondo decorativo */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-[#08090d]"
        aria-hidden="true"
      />

      <div
        className="pointer-events-none fixed -right-32 -top-32 -z-10 h-96 w-96 rounded-full bg-violet-300/[0.04] blur-[120px]"
        aria-hidden="true"
      />

      <div
        className="pointer-events-none fixed -bottom-32 -left-32 -z-10 h-96 w-96 rounded-full bg-sky-300/[0.04] blur-[120px]"
        aria-hidden="true"
      />

      {/* Encabezado */}
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.35em] text-slate-500">
            Weather
          </p>

          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-100">
            Atmosphere
          </h2>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-2.5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#c4b5fd"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="m4.93 4.93 1.42 1.42" />
            <path d="m17.65 17.65 1.42 1.42" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="m6.35 17.65-1.42 1.42" />
            <path d="m19.07 4.93-1.42 1.42" />
          </svg>
        </div>
      </header>

      {/* Instalación PWA */}
      <div className="flex justify-end empty:hidden">
        <InstallPrompt />
      </div>

      {/* Buscador */}
      <section className="space-y-3">
        <form
          onSubmit={handleSearch}
          className="flex gap-2"
          role="search"
        >
          <label htmlFor="city" className="sr-only">
            Ciudad
          </label>

          <div className="relative flex-1">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>

            <input
              id="city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Buscar ciudad..."
              autoComplete="off"
              enterKeyHint="search"
              className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] py-4 pl-11 pr-4 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-violet-300/30 focus:bg-white/[0.06] focus:ring-2 focus:ring-violet-300/10"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl border border-violet-300/20 bg-violet-300/[0.12] px-5 text-sm font-semibold text-violet-200 transition-all hover:bg-violet-300/[0.2] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Buscar
          </button>
        </form>

        {/* Ubicación */}
        <button
          type="button"
          onClick={handleGeoLocation}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.025] py-3 text-sm text-slate-400 transition-all hover:border-sky-200/20 hover:bg-white/[0.05] hover:text-sky-200 disabled:opacity-50"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 10c0 5-8 12-8 12s-8-7-8-12a8 8 0 1 1 16 0Z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>

          Usar mi ubicación actual
        </button>
      </section>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="animate-fade-in rounded-xl border border-rose-300/15 bg-rose-300/[0.06] px-4 py-3 text-center text-sm text-rose-200"
        >
          {error}
        </div>
      )}

      {/* Carga */}
      {loading && !weather && (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-white/[0.07] bg-white/[0.025] p-12 text-slate-400">
          <span className="h-9 w-9 animate-spin rounded-full border-2 border-white/10 border-t-violet-300" />

          <p className="text-sm tracking-wide">
            Consultando el clima...
          </p>
        </div>
      )}

      {/* Tarjeta meteorológica */}
      {weather && condition && (
        <section
          aria-live="polite"
          aria-busy={loading}
          className={`animate-fade-in relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-gradient-to-b ${accent} to-[#11131a] px-6 pb-6 pt-8 shadow-2xl shadow-black/40 transition-opacity ${
            loading ? "opacity-60" : "opacity-100"
          }`}
        >
          {/* Decoración */}
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/[0.025] blur-3xl"
            aria-hidden="true"
          />

          {loading && (
            <span
              className="absolute right-5 top-5 h-4 w-4 animate-spin rounded-full border-2 border-white/10 border-t-violet-300"
              aria-label="Actualizando"
            />
          )}

          {/* Ubicación */}
          <div className="relative text-center">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-500">
              Ubicación actual
            </p>

            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {weather.name}
              {weather.sys?.country
                ? `, ${weather.sys.country}`
                : ""}
            </h1>
          </div>

          {/* Temperatura */}
          <div className="relative my-8 flex flex-col items-center">
            <Image
              src={`https://openweathermap.org/img/wn/${condition.icon}@2x.png`}
              alt={condition.description}
              width={140}
              height={140}
              className="h-32 w-32 drop-shadow-[0_0_25px_rgba(255,255,255,0.08)]"
              unoptimized
              priority
            />

            <p className="mt-1 text-7xl font-light tracking-[-0.06em] text-white sm:text-8xl">
              {Math.round(weather.main.temp)}
              <span className="align-top text-4xl font-light text-slate-400">
                °
              </span>
              <span className="ml-1 text-4xl font-light text-slate-400">
                C
              </span>
            </p>

            <p className="mt-4 rounded-full border border-white/[0.06] bg-white/[0.03] px-4 py-2 text-sm font-medium capitalize text-slate-300">
              {condition.description}
            </p>
          </div>

          {/* Separador */}
          <div className="mb-5 h-px bg-gradient-to-r from-transparent via-white/[0.12] to-transparent" />

          {/* Datos meteorológicos */}
          <div className="grid grid-cols-2 gap-3">

            {/* Humedad */}
            <div className="rounded-2xl border border-white/[0.06] bg-black/[0.12] p-4">
              <div className="mb-3 flex items-center gap-2">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#a5d8ff"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22a7 7 0 0 0 7-7c0-4-7-13-7-13S5 11 5 15a7 7 0 0 0 7 7Z" />
                </svg>

                <span className="text-xs text-slate-500">
                  Humedad
                </span>
              </div>

              <p className="text-2xl font-medium text-sky-200">
                {weather.main.humidity}
                <span className="ml-1 text-sm text-slate-500">
                  %
                </span>
              </p>
            </div>

            {/* Viento */}
            <div className="rounded-2xl border border-white/[0.06] bg-black/[0.12] p-4">
              <div className="mb-3 flex items-center gap-2">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#d8b4fe"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 8h12a3 3 0 1 0-3-3" />
                  <path d="M2 12h17a3 3 0 1 1-3 3" />
                  <path d="M4 16h5a3 3 0 1 1-3 3" />
                </svg>

                <span className="text-xs text-slate-500">
                  Viento
                </span>
              </div>

              <p className="text-2xl font-medium text-violet-200">
                {weather.wind.speed}
                <span className="ml-1 text-sm text-slate-500">
                  m/s
                </span>
              </p>
            </div>

          </div>
        </section>
      )}

      {/* Estado inicial */}
      {!weather && !loading && !error && (
        <div className="mt-8 flex flex-col items-center text-center">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.025]">
            <svg
              width="38"
              height="38"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2v2" />
              <path d="M12 20v2" />
              <path d="M4.93 4.93l1.42 1.42" />
              <path d="m17.65 17.65 1.42 1.42" />
              <path d="M2 12h2" />
              <path d="M20 12h2" />
              <path d="m6.35 17.65-1.42 1.42" />
              <path d="m19.07 4.93-1.42 1.42" />
              <circle cx="12" cy="12" r="4" />
            </svg>
          </div>

          <p className="text-sm font-medium text-slate-300">
            El clima, en otro lugar.
          </p>

          <p className="mt-2 max-w-xs text-xs leading-6 text-slate-500">
            Busca una ciudad o utiliza tu ubicación para descubrir
            las condiciones meteorológicas.
          </p>
        </div>
      )}

      {/* Pie */}
      <footer className="mt-auto pt-6 text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-slate-600">
          Atmosphere · Weather Experience
        </p>
      </footer>

    </main>
  );
}
