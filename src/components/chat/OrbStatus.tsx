import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

type State = "idle" | "listening" | "thinking" | "speaking";

// GLSL silk-orb shader: layered fbm noise rotated around the sphere creates
// the flowing striations from the reference, with a soft fresnel rim glow.
const vertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPos;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  varying vec3 vNormal;
  varying vec3 vPos;

  uniform float uTime;
  uniform float uAmp;       // 0..1 smoothed audio amplitude
  uniform float uActive;    // 0..1 thinking pulse
  uniform float uListen;    // 0..1 listening blend
  uniform float uSpeak;     // 0..1 speaking blend
  uniform vec3  uColorA;    // core color
  uniform vec3  uColorB;    // silk highlight
  uniform vec3  uColorC;    // rim glow

  // hash + value noise
  float hash(vec3 p){ return fract(sin(dot(p, vec3(17.1,113.5,71.7))) * 43758.5453); }
  float noise(vec3 p){
    vec3 i = floor(p); vec3 f = fract(p);
    f = f*f*(3.0-2.0*f);
    float n = mix(mix(mix(hash(i+vec3(0,0,0)),hash(i+vec3(1,0,0)),f.x),
                     mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
                 mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),
                     mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
    return n;
  }
  float fbm(vec3 p){
    float v = 0.0; float a = 0.5;
    for(int i=0;i<5;i++){ v += a*noise(p); p *= 2.02; a *= 0.5; }
    return v;
  }

  void main(){
    vec3 n = normalize(vNormal);
    vec3 p = normalize(vPos);

    // swirl coords — rotate sample point around Y over time for flowing silk
    float t = uTime * (0.15 + uSpeak*0.55 + uListen*0.35 + uActive*0.2);
    float c = cos(t), s = sin(t);
    vec3 q = vec3(c*p.x + s*p.z, p.y, -s*p.x + c*p.z);

    // base silk striations: high-frequency fbm stretched along one axis
    float silk = fbm(vec3(q.x*5.0, q.y*1.6 + uTime*0.3, q.z*5.0));
    silk = pow(silk, 1.4);

    // secondary slow swell driven by amplitude
    float swell = fbm(q*1.8 + vec3(uTime*0.2));
    float amp = mix(0.0, 1.0, uAmp);

    // fresnel rim
    float fres = pow(1.0 - max(dot(n, vec3(0.0,0.0,1.0)), 0.0), 2.2);

    // color mix
    vec3 col = mix(uColorA, uColorB, silk);
    col = mix(col, uColorB * 1.15, swell * 0.5);
    col += uColorC * fres * (0.55 + amp*0.6);

    // soft inner light
    float core = smoothstep(0.95, 0.0, length(p.xy));
    col += uColorB * core * 0.18;

    // breathing alpha — softer at edges for the bloomy look
    float alpha = mix(0.85, 1.0, 1.0 - fres) + fres*0.15;
    gl_FragColor = vec4(col, alpha);
  }
`;

/**
 * Antigravity orbit — a shell of particles held in tilted orbits around the
 * core. They lift outward with amplitude (the "antigravity" push) and settle
 * back with damping, plus a thin luminous equator ring.
 */
function OrbitField({ state, amp }: { state: State; amp: React.RefObject<number> }) {
  const points = useRef<THREE.Points>(null);
  const ring = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);
  const lift = useRef(0);

  const { positions, radii, speeds, phases, tilts } = useMemo(() => {
    const N = 420;
    const positions = new Float32Array(N * 3);
    const radii = new Float32Array(N);
    const speeds = new Float32Array(N);
    const phases = new Float32Array(N);
    const tilts = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      radii[i] = 1.35 + Math.random() * 0.75;
      speeds[i] = 0.12 + Math.random() * 0.5;
      phases[i] = Math.random() * Math.PI * 2;
      tilts[i] = (Math.random() - 0.5) * 1.5;
    }
    return { positions, radii, speeds, phases, tilts };
  }, []);

  useFrame((s, dt) => {
    const t = s.clock.elapsedTime;
    const a = amp.current ?? 0;
    const target = (state === "idle" ? 0.06 : 0.2) + a * 0.9;
    lift.current += (target - lift.current) * Math.min(1, dt * 3.2);

    const geo = points.current?.geometry as THREE.BufferGeometry | undefined;
    if (geo) {
      const arr = geo.attributes.position.array as Float32Array;
      for (let i = 0; i < radii.length; i++) {
        const r = radii[i] * (1 + lift.current * 0.42);
        const ang = phases[i] + t * speeds[i] * (state === "thinking" ? 1.5 : 1);
        const x = Math.cos(ang) * r;
        const z = Math.sin(ang) * r;
        const y = Math.sin(ang * 0.5 + phases[i]) * tilts[i] * r * 0.55;
        arr[i * 3] = x;
        arr[i * 3 + 1] = y;
        arr[i * 3 + 2] = z;
      }
      geo.attributes.position.needsUpdate = true;
    }

    if (points.current) {
      points.current.rotation.z = Math.sin(t * 0.18) * 0.22;
      const m = points.current.material as THREE.PointsMaterial;
      m.opacity = 0.35 + lift.current * 0.5;
      m.size = 0.018 + lift.current * 0.02;
    }
    if (ring.current) {
      ring.current.rotation.x = Math.PI / 2 + Math.sin(t * 0.3) * 0.25;
      ring.current.rotation.z = t * 0.15;
      ring.current.scale.setScalar(1 + lift.current * 0.3);
    }
    if (ring2.current) {
      ring2.current.rotation.x = Math.PI / 2.6 + Math.cos(t * 0.24) * 0.3;
      ring2.current.rotation.y = -t * 0.12;
      ring2.current.scale.setScalar(1.14 + lift.current * 0.34);
    }
  });

  const color =
    state === "listening" ? "#ffd1ec"
    : state === "speaking" ? "#ffe6f5"
    : state === "thinking" ? "#d9c8ff"
    : "#e6d4ff";

  return (
    <group>
      <points ref={points}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          color={color}
          size={0.02}
          sizeAttenuation
          opacity={0.5}
        />
      </points>
      <mesh ref={ring}>
        <torusGeometry args={[1.5, 0.006, 8, 160]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh ref={ring2}>
        <torusGeometry args={[1.5, 0.004, 8, 160]} />
        <meshBasicMaterial color="#b89cff" transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}

function SilkOrb({
  state,
  amplitude,
  fluidity,
  damping,
  distort,
}: {
  state: State;
  amplitude: number;
  fluidity: number;
  damping: number;
  distort: number;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Mesh>(null);
  const ampRef = useRef(0);
  const scaleRef = useRef(1);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAmp: { value: 0 },
      uActive: { value: 0 },
      uListen: { value: 0 },
      uSpeak: { value: 0 },
      uFluidity: { value: fluidity },
      uDistort: { value: distort },
      uColorA: { value: new THREE.Color("#b89cff") },
      uColorB: { value: new THREE.Color("#e6d4ff") },
      uColorC: { value: new THREE.Color("#ffffff") },
    }),
    [],
  );

  useFrame((s, dt) => {
    const t = s.clock.elapsedTime;
    // damping: 0 = sluggish, 1 = snappy. Map to a smoothing rate.
    const rate = 2 + damping * 14; // 2..16

    const target = state === "listening" ? amplitude : state === "speaking" ? amplitude * 0.7 + 0.15 : 0;
    ampRef.current += (target - ampRef.current) * Math.min(1, dt * rate);

    const breath =
      state === "thinking" ? 1 + Math.sin(t * 2.2) * 0.04
      : state === "speaking" ? 1 + Math.sin(t * 6) * 0.025 + ampRef.current * (0.12 + fluidity * 0.18)
      : state === "listening" ? 1 + ampRef.current * (0.15 + fluidity * 0.25)
      : 1 + Math.sin(t * 1.1) * 0.015;
    scaleRef.current += (breath - scaleRef.current) * Math.min(1, dt * (rate * 0.6));

    if (mesh.current) {
      mesh.current.scale.setScalar(scaleRef.current);
      mesh.current.rotation.y = t * 0.12;
      mesh.current.rotation.x = Math.sin(t * 0.25) * 0.15;
    }
    if (halo.current) {
      const hs = scaleRef.current * (1.45 + ampRef.current * 0.35);
      halo.current.scale.setScalar(hs);
    }

    uniforms.uTime.value = t;
    uniforms.uAmp.value = ampRef.current;
    uniforms.uFluidity.value = fluidity;
    uniforms.uDistort.value = distort;
    uniforms.uListen.value += ((state === "listening" ? 1 : 0) - uniforms.uListen.value) * Math.min(1, dt * 4);
    uniforms.uSpeak.value += ((state === "speaking" ? 1 : 0) - uniforms.uSpeak.value) * Math.min(1, dt * 4);
    uniforms.uActive.value += ((state === "thinking" ? 1 : 0) - uniforms.uActive.value) * Math.min(1, dt * 4);

    const a = uniforms.uColorA.value;
    const b = uniforms.uColorB.value;
    if (state === "listening") {
      a.lerp(new THREE.Color("#9d7bff"), Math.min(1, dt * 2));
      b.lerp(new THREE.Color("#ffd1ec"), Math.min(1, dt * 2));
    } else if (state === "speaking") {
      a.lerp(new THREE.Color("#a78bff"), Math.min(1, dt * 2));
      b.lerp(new THREE.Color("#ffe6f5"), Math.min(1, dt * 2));
    } else if (state === "thinking") {
      a.lerp(new THREE.Color("#8f78ff"), Math.min(1, dt * 2));
      b.lerp(new THREE.Color("#d9c8ff"), Math.min(1, dt * 2));
    } else {
      a.lerp(new THREE.Color("#b89cff"), Math.min(1, dt * 2));
      b.lerp(new THREE.Color("#e6d4ff"), Math.min(1, dt * 2));
    }
  });

  return (
    <group>
      <mesh ref={halo}>
        <sphereGeometry args={[1.1, 64, 64]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          uniforms={{ uColor: { value: new THREE.Color("#c9a8ff") } }}
          vertexShader={`varying vec3 vN; void main(){ vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`}
          fragmentShader={`varying vec3 vN; uniform vec3 uColor; void main(){ float f = pow(1.0 - max(dot(vN, vec3(0.0,0.0,1.0)),0.0), 2.0); gl_FragColor = vec4(uColor, f*0.55); }`}
        />
      </mesh>

      <mesh ref={mesh}>
        <sphereGeometry args={[1, 128, 128]} />
        <shaderMaterial
          transparent
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
        />
      </mesh>

      <OrbitField state={state} amp={ampRef} />
    </group>
  );
}

export function OrbStatus({
  active,
  amplitude = 0,
  listening = false,
  speaking = false,
  fluidity = 0.5,
  damping = 0.5,
  distort = 0.4,
  className = "h-9 w-9",
}: {
  active: boolean;
  amplitude?: number;
  listening?: boolean;
  speaking?: boolean;
  fluidity?: number;
  damping?: number;
  distort?: number;
  className?: string;
}) {
  const state: State = listening ? "listening" : speaking ? "speaking" : active ? "thinking" : "idle";
  const glow =
    state === "listening" ? "shadow-[0_0_60px_-8px_rgba(157,123,255,0.55),0_0_120px_-20px_rgba(255,209,236,0.4)]"
    : state === "speaking" ? "shadow-[0_0_60px_-8px_rgba(167,139,255,0.55),0_0_120px_-20px_rgba(255,230,245,0.4)]"
    : state === "thinking" ? "shadow-[0_0_50px_-8px_rgba(143,120,255,0.5),0_0_100px_-20px_rgba(217,200,255,0.35)]"
    : "shadow-[0_0_40px_-10px_rgba(184,156,255,0.4)]";
  return (
    <div className={`${className} shrink-0 relative`}>
      <div aria-hidden className={`absolute inset-0 rounded-full ${glow} transition-shadow duration-500 pointer-events-none`} />
      <div aria-hidden className="absolute inset-[-8%] rounded-full pointer-events-none opacity-70 mix-blend-screen"
        style={{ background: "conic-gradient(from 0deg, rgba(184,156,255,0.0), rgba(230,212,255,0.35), rgba(184,156,255,0.0))", filter: "blur(8px)", animation: "spin 12s linear infinite" }}
      />
      <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 4.2], fov: 38 }} gl={{ alpha: true, antialias: true, premultipliedAlpha: false }}>
        <SilkOrb state={state} amplitude={amplitude} fluidity={fluidity} damping={damping} distort={distort} />
      </Canvas>
    </div>
  );
}

