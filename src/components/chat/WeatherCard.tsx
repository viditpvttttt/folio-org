import { Cloud, CloudRain, CloudSnow, Sun, CloudLightning, CloudFog, Wind, Droplets } from "lucide-react";

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

const gradientFor = (code: number, isDay = 1) => {
  if (!isDay) return "from-[#1a1a3e] via-[#2d2456] to-[#4a3b7a]";
  if ([0, 1].includes(code)) return "from-[#ffd24d] via-[#ff9a4d] to-[#ff4d8d]";
  if ([2, 3].includes(code)) return "from-[#b8c6db] via-[#8ea3c4] to-[#4d9bff]";
  if (code >= 51 && code <= 82) return "from-[#4d9bff] via-[#5d6dff] to-[#2d2456]";
  if (code >= 71 && code <= 77) return "from-[#e6f0ff] via-[#a8c5ff] to-[#4d9bff]";
  if (code >= 95) return "from-[#2d2456] via-[#6b3d99] to-[#ff4d8d]";
  return "from-[#b8c6db] via-[#8ea3c4] to-[#4d9bff]";
};

export function WeatherCard({ data }: { data: WeatherData }) {
  const Icon = iconFor(data.weatherCode, data.isDay);
  const grad = gradientFor(data.weatherCode, data.isDay);

  return (
    <div className="my-2 w-full max-w-md overflow-hidden rounded-2xl border border-border/60 shadow-lg">
      <div className={`relative bg-gradient-to-br ${grad} p-5 text-white`}>
        <div className="absolute inset-0 opacity-30 mix-blend-overlay paper-grain" />
        <div className="relative flex items-start justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] opacity-80">
              {data.country ? `${data.location}, ${data.country}` : data.location}
            </div>
            <div className="mt-1 flex items-baseline gap-1 font-serif">
              <span className="text-6xl leading-none">{Math.round(data.temperature)}</span>
              <span className="text-2xl opacity-80">{data.units.temp}</span>
            </div>
            <div className="mt-1 text-sm opacity-90">{data.description}</div>
            <div className="text-xs opacity-75">Feels like {Math.round(data.apparent)}{data.units.temp}</div>
          </div>
          <Icon className="h-16 w-16 drop-shadow-lg float-soft" strokeWidth={1.5} />
        </div>
        <div className="relative mt-4 flex gap-4 text-xs">
          <span className="inline-flex items-center gap-1 opacity-90">
            <Droplets className="h-3.5 w-3.5" /> {data.humidity}%
          </span>
          <span className="inline-flex items-center gap-1 opacity-90">
            <Wind className="h-3.5 w-3.5" /> {Math.round(data.windSpeed)} {data.units.wind}
          </span>
        </div>
      </div>

      {data.daily.length > 0 && (
        <div className="grid grid-cols-5 gap-1 bg-card/80 p-3 backdrop-blur">
          {data.daily.slice(0, 5).map((d) => {
            const DIcon = iconFor(d.code, 1);
            const day = new Date(d.date).toLocaleDateString(undefined, { weekday: "short" });
            return (
              <div key={d.date} className="flex flex-col items-center gap-1 text-center">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{day}</span>
                <DIcon className="h-5 w-5 text-foreground/80" strokeWidth={1.5} />
                <span className="text-xs font-medium">{Math.round(d.max)}°</span>
                <span className="text-[10px] text-muted-foreground">{Math.round(d.min)}°</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
