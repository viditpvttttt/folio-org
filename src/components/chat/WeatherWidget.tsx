import { useEffect, useState } from "react";
import { MapPin, Locate, Pencil, Loader2, Cloud, CloudRain, CloudSnow, Sun, CloudLightning, CloudFog, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { TiltCard } from "./TiltCard";
import { cn } from "@/lib/utils";

const WMO: Record<number, string> = {
  0: "Clear", 1: "Mostly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Foggy", 48: "Rime fog", 51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle",
  61: "Light rain", 63: "Rain", 65: "Heavy rain", 71: "Light snow", 73: "Snow", 75: "Heavy snow",
  80: "Showers", 81: "Heavy showers", 82: "Violent showers", 95: "Thunderstorm", 96: "Thunderstorm", 99: "Severe storm",
};

const iconFor = (code: number, isDay = 1) => {
  if ([0, 1].includes(code)) return isDay ? Sun : Cloud;
  if ([2, 3].includes(code)) return Cloud;
  if ([45, 48].includes(code)) return CloudFog;
  if (code >= 51 && code <= 67) return CloudRain;
  if (code >= 71 && code <= 77) return CloudSnow;
  if (code >= 80 && code <= 82) return CloudRain;
  if (code >= 95) return CloudLightning;
  return Cloud;
};

const gradFor = (code: number, isDay = 1) => {
  if (!isDay) return "from-[#1a1a3e] via-[#2d2456] to-[#4a3b7a]";
  if ([0, 1].includes(code)) return "from-[#ffd24d] via-[#ff9a4d] to-[#ff4d8d]";
  if ([2, 3].includes(code)) return "from-[#b8c6db] via-[#8ea3c4] to-[#4d9bff]";
  if (code >= 51 && code <= 82) return "from-[#4d9bff] via-[#5d6dff] to-[#2d2456]";
  if (code >= 71 && code <= 77) return "from-[#e6f0ff] via-[#a8c5ff] to-[#4d9bff]";
  if (code >= 95) return "from-[#2d2456] via-[#6b3d99] to-[#ff4d8d]";
  return "from-[#b8c6db] via-[#8ea3c4] to-[#4d9bff]";
};

type Profile = { default_location: string | null; default_lat: number | null; default_lon: number | null };
type Forecast = {
  name: string; country: string;
  temp: number; feels: number; code: number; isDay: number;
  hi: number; lo: number;
  daily: { date: string; max: number; min: number; code: number }[];
};

async function geocode(q: string) {
  const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1`);
  const j = await r.json();
  return j?.results?.[0];
}
async function reverseGeocode(lat: number, lon: number) {
  try {
    const r = await fetch(`https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&count=1`);
    const j = await r.json();
    return j?.results?.[0];
  } catch { return null; }
}
async function fetchForecast(lat: number, lon: number, label: string, country = ""): Promise<Forecast> {
  const r = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,apparent_temperature,weather_code,is_day` +
    `&daily=temperature_2m_max,temperature_2m_min,weather_code` +
    `&timezone=auto&forecast_days=5`,
  );
  const w = await r.json();
  const cur = w.current;
  const today = w.daily;
  return {
    name: label, country,
    temp: cur.temperature_2m, feels: cur.apparent_temperature,
    code: cur.weather_code, isDay: cur.is_day,
    hi: today.temperature_2m_max[0], lo: today.temperature_2m_min[0],
    daily: today.time.map((date: string, i: number) => ({
      date, max: today.temperature_2m_max[i], min: today.temperature_2m_min[i], code: today.weather_code[i],
    })),
  };
}

export function WeatherWidget() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  // Load profile
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles")
      .select("default_location, default_lat, default_lon")
      .eq("id", user.id).maybeSingle()
      .then(({ data }) => setProfile(data as Profile | null));
  }, [user]);

  // First-time auto geolocate
  useEffect(() => {
    if (!profile || profile.default_lat || !user) return;
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const place = await reverseGeocode(latitude, longitude);
        const label = place?.name || "My location";
        await supabase.from("profiles").update({
          default_location: label,
          default_lat: latitude,
          default_lon: longitude,
        }).eq("id", user.id);
        setProfile({ default_location: label, default_lat: latitude, default_lon: longitude });
      },
      () => { /* silently ignore; user can type city */ },
      { timeout: 8000 },
    );
  }, [profile, user]);

  // Fetch forecast whenever lat/lon set
  useEffect(() => {
    if (!profile?.default_lat || !profile?.default_lon) return;
    setLoading(true);
    fetchForecast(profile.default_lat, profile.default_lon, profile.default_location || "Saved")
      .then(setForecast)
      .finally(() => setLoading(false));
  }, [profile?.default_lat, profile?.default_lon, profile?.default_location]);

  const saveCity = async () => {
    if (!draft.trim() || !user) return;
    setLoading(true);
    const place = await geocode(draft.trim());
    if (!place) { setLoading(false); return; }
    await supabase.from("profiles").update({
      default_location: place.name,
      default_lat: place.latitude,
      default_lon: place.longitude,
    }).eq("id", user.id);
    setProfile({ default_location: place.name, default_lat: place.latitude, default_lon: place.longitude });
    setEditing(false);
    setDraft("");
  };

  const useGeolocation = () => {
    if (!user || !("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      const place = await reverseGeocode(latitude, longitude);
      const label = place?.name || "My location";
      await supabase.from("profiles").update({
        default_location: label, default_lat: latitude, default_lon: longitude,
      }).eq("id", user.id);
      setProfile({ default_location: label, default_lat: latitude, default_lon: longitude });
    });
  };

  if (!profile) return null;

  if (!profile.default_lat || editing) {
    return (
      <div className="mx-3 mb-3 rounded-xl border border-border/60 bg-card/60 p-3 backdrop-blur space-y-2">
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Saved location</div>
        <div className="flex gap-1">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveCity()}
            placeholder="City e.g. Lisbon"
            className="flex-1 bg-background/60 border border-border/60 rounded-md px-2 py-1.5 text-sm outline-none focus:border-foreground/40"
            autoFocus
          />
          <button onClick={saveCity} className="rounded-md bg-foreground text-background px-2 hover:opacity-90" aria-label="Save">
            <Check className="h-4 w-4" />
          </button>
        </div>
        <button onClick={useGeolocation} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition">
          <Locate className="h-3 w-3" /> Use my location
        </button>
      </div>
    );
  }

  const Icon = forecast ? iconFor(forecast.code, forecast.isDay) : Cloud;
  const grad = forecast ? gradFor(forecast.code, forecast.isDay) : "from-slate-500 to-slate-700";

  return (
    <div className="mx-3 mb-3">
      <TiltCard max={6}>
        <div className={cn("relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br text-white shadow-lg", grad)}>
          <div className="absolute inset-0 paper-grain opacity-30 mix-blend-overlay" />
          <div className="relative p-3">
            <div className="flex items-start justify-between text-[10px]">
              <div className="inline-flex items-center gap-1 opacity-90">
                <MapPin className="h-3 w-3" />
                <span className="uppercase tracking-[0.18em]">{profile.default_location}</span>
              </div>
              <button onClick={() => { setEditing(true); setDraft(profile.default_location ?? ""); }} className="opacity-70 hover:opacity-100" aria-label="Edit location">
                <Pencil className="h-3 w-3" />
              </button>
            </div>
            {loading || !forecast ? (
              <div className="py-4 flex items-center gap-2 text-xs opacity-80">
                <Loader2 className="h-3 w-3 animate-spin" /> Loading…
              </div>
            ) : (
              <>
                <div className="mt-2 flex items-center justify-between">
                  <div>
                    <div className="font-serif text-4xl leading-none">{Math.round(forecast.temp)}°</div>
                    <div className="text-[11px] opacity-80 mt-1">{WMO[forecast.code] ?? "—"}</div>
                    <div className="text-[10px] opacity-70">H {Math.round(forecast.hi)}° · L {Math.round(forecast.lo)}°</div>
                  </div>
                  <Icon className="h-12 w-12 drop-shadow-lg float-soft" strokeWidth={1.4} />
                </div>
                <div className="mt-3 grid grid-cols-5 gap-1 border-t border-white/15 pt-2">
                  {forecast.daily.slice(1, 6).map((d) => {
                    const DI = iconFor(d.code, 1);
                    const day = new Date(d.date).toLocaleDateString(undefined, { weekday: "short" });
                    return (
                      <div key={d.date} className="flex flex-col items-center gap-0.5 text-center">
                        <span className="text-[9px] uppercase opacity-70">{day}</span>
                        <DI className="h-3.5 w-3.5" strokeWidth={1.5} />
                        <span className="text-[10px]">{Math.round(d.max)}°</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </TiltCard>
    </div>
  );
}
