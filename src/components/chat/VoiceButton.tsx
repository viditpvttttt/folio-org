import { useEffect, useRef, useState } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Props = {
  disabled?: boolean;
  onTranscript: (text: string) => void;
  onInterim?: (text: string) => void;
  onAmplitude?: (level: number) => void; // 0..1
  onListeningChange?: (listening: boolean) => void;
};

export function VoiceButton({ disabled, onTranscript, onInterim, onAmplitude, onListeningChange }: Props) {

  const [state, setState] = useState<"idle" | "recording" | "transcribing">("idle");
  const recRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const acRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => () => stopMeter(), []);

  const stopMeter = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    acRef.current?.close().catch(() => {});
    acRef.current = null;
    onAmplitude?.(0);
  };

  const start = async () => {
    if (disabled) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = ["audio/webm", "audio/mp4"].find((t) => MediaRecorder.isTypeSupported(t));
      if (!mime) throw new Error("No supported audio format in this browser.");
      const rec = new MediaRecorder(stream, { mimeType: mime });
      recRef.current = rec;
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      rec.onstop = handleStop;
      rec.start();

      // Amplitude meter
      const ac = new AudioContext();
      acRef.current = ac;
      const src = ac.createMediaStreamSource(stream);
      const analyser = ac.createAnalyser();
      analyser.fftSize = 512;
      src.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        onAmplitude?.(Math.min(1, rms * 3));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();

      setState("recording");
      onListeningChange?.(true);

    } catch (e) {
      toast.error((e as Error).message || "Microphone unavailable");
    }
  };

  const stop = () => {
    recRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    stopMeter();
  };

  const handleStop = async () => {
    onListeningChange?.(false);
    setState("transcribing");

    const rec = recRef.current;
    const blob = new Blob(chunksRef.current, { type: rec?.mimeType || "audio/webm" });
    if (blob.size < 1024) {
      toast.error("That recording was too short — try again.");
      setState("idle");
      return;
    }
    try {
      const fd = new FormData();
      const ext = (rec?.mimeType || "audio/webm").includes("mp4") ? "mp4" : "webm";
      fd.append("file", blob, `voice.${ext}`);
      const res = await fetch("/api/transcribe?stream=1", { method: "POST", body: fd });
      if (!res.ok || !res.body) throw new Error(await res.text());

      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let buf = "";
      let acc = "";
      let finalText = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += value;
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const evt = JSON.parse(payload);
            if (evt.type === "transcript.text.delta" && evt.delta) {
              acc += evt.delta;
              onInterim?.(acc);
            } else if (evt.type === "transcript.text.done" && evt.text) {
              finalText = evt.text;
            }
          } catch { /* ignore */ }
        }
      }
      const text = (finalText || acc).trim();
      onInterim?.("");
      if (text) onTranscript(text);
      else toast.error("I didn't catch that. Try again.");
    } catch (e) {
      onInterim?.("");
      toast.error((e as Error).message || "Couldn't transcribe");
    } finally {
      setState("idle");
    }
  };

  const recording = state === "recording";
  const transcribing = state === "transcribing";

  return (
    <button
      type="button"
      onClick={recording ? stop : start}
      disabled={disabled || transcribing}
      aria-label={recording ? "Stop recording" : "Speak to Folio"}
      className={cn(
        "relative inline-flex h-9 w-9 items-center justify-center rounded-full transition",
        recording
          ? "bg-gradient-to-br from-[#ff4d8d] to-[#b66dff] text-white shadow-[0_0_24px_-4px_rgba(255,77,141,0.7)]"
          : "bg-foreground/5 hover:bg-foreground/10 text-foreground/80",
        transcribing && "opacity-70",
      )}
    >
      {transcribing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : recording ? (
        <Square className="h-3.5 w-3.5 fill-current" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
      {recording && (
        <span className="absolute inset-0 rounded-full animate-ping bg-[#ff4d8d]/40" />
      )}
    </button>
  );
}

// Speak text via /api/speak (streaming PCM). Returns a cancel function.
export async function speak(text: string, signal?: AbortSignal): Promise<() => void> {
  const ac = new AudioContext({ sampleRate: 24000 });
  if (ac.state === "suspended") await ac.resume().catch(() => {});
  let playhead = 0;
  let pending = new Uint8Array(0);
  let stopped = false;

  const playChunk = (incoming: Uint8Array) => {
    const bytes = new Uint8Array(pending.length + incoming.length);
    bytes.set(pending);
    bytes.set(incoming, pending.length);
    const usable = bytes.length - (bytes.length % 2);
    pending = bytes.slice(usable);
    if (usable === 0) return;
    const samples = new Int16Array(bytes.buffer, 0, usable / 2);
    const floats = Float32Array.from(samples, (s) => s / 32768);
    const buffer = ac.createBuffer(1, floats.length, 24000);
    buffer.copyToChannel(floats, 0);
    const src = ac.createBufferSource();
    src.buffer = buffer;
    src.connect(ac.destination);
    if (playhead === 0) playhead = ac.currentTime + 0.05;
    else playhead = Math.max(playhead, ac.currentTime);
    src.start(playhead);
    playhead += buffer.duration;
  };

  const res = await fetch("/api/speak", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
    signal,
  });
  if (!res.ok || !res.body) {
    ac.close().catch(() => {});
    throw new Error(`Speech failed (${res.status})`);
  }

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buf = "";
  (async () => {
    try {
      while (!stopped) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += value;
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const evt = JSON.parse(payload);
            if (evt.type === "speech.audio.delta" && evt.audio) {
              const bin = atob(evt.audio);
              const u8 = new Uint8Array(bin.length);
              for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
              playChunk(u8);
            }
          } catch { /* ignore */ }
        }
      }
    } finally {
      setTimeout(() => ac.close().catch(() => {}), Math.max(0, (playhead - ac.currentTime) * 1000 + 200));
    }
  })();

  return () => {
    stopped = true;
    reader.cancel().catch(() => {});
    ac.close().catch(() => {});
  };
}
