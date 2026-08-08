import { Wind, Droplets, Sunrise, Gauge } from "lucide-react";

export type WeatherData = {
  location: string;
  country?: string;
  temperature: number;
  apparent: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  isDay: number;
  description: string;
  daily: { date: string; max: number; min: number; code: number; description: string }[];
  units: { temp: string; wind: string };
};

type Kind = "clear" | "cloud" | "fog" | "rain" | "snow" | "storm";

export function kindFor(code: number): Kind {
  if ([0, 1].includes(code)) return "clear";
  if ([2, 3].includes(code)) return "cloud";
  if ([45, 48].includes(code)) return "fog";
  if (code >= 71 && code <= 77) return "snow";
  if (code >= 95) return "storm";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  return "cloud";
}

const SKY: Record<Kind, { day: string; night: string }> = {
  clear: { day: "from-[#ffcf4d] via-[#ff9a5a] to-[#ff5f8d]", night: "from-[#101736] via-[#1d2a5c] to-[#3d3a7a]" },
  cloud: { day: "from-[#a9c2e8] via-[#8ba3cc] to-[#5f7bb5]", night: "from-[#151a30] via-[#242c4c] to-[#3c4468]" },
  fog: { day: "from-[#cfd6df] via-[#a9b3c2] to-[#7d8899]", night: "from-[#1b1f2a] via-[#2b3040] to-[#464c5e]" },
  rain: { day: "from-[#5f8ecb] via-[#41639f] to-[#26386b]", night: "from-[#0f1730] via-[#1b2748] to-[#2a3763]" },
  snow: { day: "from-[#e8f1ff] via-[#b9cdf0] to-[#7f9ed6]", night: "from-[#1a2138] via-[#2b3550] to-[#4a5877]" },
  storm: { day: "from-[#3b3568] via-[#5b3d84] to-[#a33f79]", night: "from-[#14102b] via-[#2c2050] to-[#5b2f6b]" },
};

/** Layered, animated SVG sky — the card's centrepiece. */
function SkyScene({ kind, isDay }: { kind: Kind; isDay: boolean }) {
  return (
    <svg viewBox="0 0 200 120" className="h-full w-full" aria-hidden>
      <defs>
        <radialGradient id="wc-sun" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#fff8d6" />
          <stop offset="60%" stopColor={isDay ? "#ffd964" : "#dfe7ff"} />
          <stop offset="100%" stopColor={isDay ? "#ffb347" : "#aab6e6"} stopOpacity="0.2" />
        </radialGradient>
        <linearGradient id="wc-cloud" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.6" />
        </linearGradient>
      </defs>

      {/* halo / celestial body */}
      <circle cx="150" cy="38" r="30" fill="url(#wc-sun)" opacity={kind === "storm" ? 0.25 : 0.85}>
        <animate attributeName="r" values="28;32;28" dur="6s" repeatCount="indefinite" />
      </circle>
      {!isDay && <circle cx="141" cy="32" r="22" fill="currentColor" className="text-transparent" opacity="0" />}

      {/* stars at night */}
      {!isDay &&
        [
          [24, 20], [58, 14], [96, 30], [40, 46], [176, 74], [12, 66],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="1.2" fill="#fff" opacity="0.8">
            <animate attributeName="opacity" values="0.25;0.9;0.25" dur={`${2 + i * 0.6}s`} repeatCount="indefinite" />
          </circle>
        ))}

      {/* clouds */}
      {kind !== "clear" && (
        <g fill="url(#wc-cloud)" opacity={kind === "fog" ? 0.55 : 0.9}>
          <g>
            <ellipse cx="70" cy="58" rx="34" ry="17" />
            <ellipse cx="96" cy="62" rx="26" ry="13" />
            <ellipse cx="48" cy="64" rx="22" ry="12" />
            <animateTransform attributeName="transform" type="translate" values="0 0; 10 -3; 0 0" dur="12s" repeatCount="indefinite" />
          </g>
          <g opacity="0.55">
            <ellipse cx="150" cy="76" rx="28" ry="13" />
            <ellipse cx="172" cy="80" rx="20" ry="10" />
            <animateTransform attributeName="transform" type="translate" values="0 0; -12 2; 0 0" dur="16s" repeatCount="indefinite" />
          </g>
        </g>
      )}

      {/* precipitation */}
      {(kind === "rain" || kind === "storm") &&
        Array.from({ length: 14 }).map((_, i) => (
          <line
            key={i}
            x1={30 + i * 11}
            y1={72}
            x2={26 + i * 11}
            y2={86}
            stroke="#dbe9ff"
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity="0.75"
          >
            <animate attributeName="y1" values="70;104" dur={`${0.7 + (i % 4) * 0.15}s`} repeatCount="indefinite" />
            <animate attributeName="y2" values="84;118" dur={`${0.7 + (i % 4) * 0.15}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.9;0" dur={`${0.7 + (i % 4) * 0.15}s`} repeatCount="indefinite" />
          </line>
        ))}

      {kind === "snow" &&
        Array.from({ length: 12 }).map((_, i) => (
          <circle key={i} cx={26 + i * 14} cy={72} r="2" fill="#fff" opacity="0.9">
            <animate attributeName="cy" values="70;116" dur={`${2.4 + (i % 3) * 0.7}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.95;0" dur={`${2.4 + (i % 3) * 0.7}s`} repeatCount="indefinite" />
          </circle>
        ))}

      {kind === "storm" && (
        <polygon points="98,64 88,88 98,88 90,110 112,82 100,82 108,64" fill="#ffe680">
          <animate attributeName="opacity" values="0;1;0.2;1;0" dur="3.2s" repeatCount="indefinite" />
        </polygon>
      )}

      {kind === "fog" &&
        [82, 92, 102].map((y, i) => (
          <rect key={y} x="0" y={y} width="200" height="4" rx="2" fill="#fff" opacity="0.35">
            <animate attributeName="x" values={i % 2 ? "-20;20;-20" : "20;-20;20"} dur={`${8 + i * 3}s`} repeatCount="indefinite" />
          </rect>
        ))}
    </svg>
  );
}

export function WeatherCard({ data }: { data: WeatherData }) {
  const kind = kindFor(data.weatherCode);
  const isDay = !!data.isDay;
  const sky = SKY[kind][isDay ? "day" : "night"];
  const temps = data.daily.slice(0, 5);
  const lo = Math.min(...temps.map((d) => d.min), data.temperature);
  const hi = Math.max(...temps.map((d) => d.max), data.temperature);
  const pct = (v: number) => (hi === lo ? 50 : ((v - lo) / (hi - lo)) * 100);

  return (
    <div className="my-2 w-full max-w-md overflow-hidden rounded-3xl border border-border/60 shadow-xl">
      <div className={`relative bg-gradient-to-br ${sky} text-white`}>
        <div className="pointer-events-none absolute inset-0 opacity-90">
          <SkyScene kind={kind} isDay={isDay} />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_20%_0%,transparent,rgba(0,0,0,0.35))]" />

        <div className="relative p-5">
          <div className="text-[10px] uppercase tracking-[0.28em] opacity-85">
            {data.country ? `${data.location}, ${data.country}` : data.location}
          </div>
          <div className="mt-1 flex items-start gap-1 font-serif">
            <span className="text-[4.25rem] leading-[0.85] drop-shadow-sm">{Math.round(data.temperature)}</span>
            <span className="mt-2 text-xl opacity-80">{data.units.temp}</span>
          </div>
          <div className="mt-2 text-sm opacity-95">{data.description}</div>
          <div className="text-xs opacity-75">Feels like {Math.round(data.apparent)}{data.units.temp}</div>

          <div className="mt-5 grid grid-cols-3 gap-2 text-[11px]">
            {[
              { icon: Droplets, label: "Humidity", value: `${data.humidity}%` },
              { icon: Wind, label: "Wind", value: `${Math.round(data.windSpeed)} ${data.units.wind}` },
              { icon: isDay ? Sunrise : Gauge, label: isDay ? "Daylight" : "Night", value: isDay ? "Clear view" : "Resting" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-xl border border-white/20 bg-white/10 px-2.5 py-2 backdrop-blur-sm">
                <Icon className="h-3.5 w-3.5 opacity-90" />
                <div className="mt-1 opacity-70">{label}</div>
                <div className="font-medium">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {temps.length > 0 && (
        <div className="space-y-2 bg-card/85 p-4 backdrop-blur">
          {temps.map((d) => {
            const day = new Date(d.date).toLocaleDateString(undefined, { weekday: "short" });
            const left = pct(d.min);
            const width = Math.max(6, pct(d.max) - pct(d.min));
            return (
              <div key={d.date} className="flex items-center gap-3 text-xs">
                <span className="w-9 uppercase tracking-wider text-muted-foreground">{day}</span>
                <span className="w-8 text-right tabular-nums text-muted-foreground">{Math.round(d.min)}°</span>
                <div className="relative h-1.5 flex-1 rounded-full bg-foreground/10">
                  <span
                    className="absolute inset-y-0 rounded-full rgb-line"
                    style={{ left: `${left}%`, width: `${width}%` }}
                  />
                </div>
                <span className="w-8 tabular-nums font-medium">{Math.round(d.max)}°</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
