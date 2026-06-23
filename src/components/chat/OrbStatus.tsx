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

function SilkOrb({ state, amplitude }: { state: State; amplitude: number }) {
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
      // soft lavender → pink → white rim — matches reference
      uColorA: { value: new THREE.Color("#b89cff") },
      uColorB: { value: new THREE.Color("#e6d4ff") },
      uColorC: { value: new THREE.Color("#ffffff") },
    }),
    [],
  );

  useFrame((s, dt) => {
    const t = s.clock.elapsedTime;

    // critically-damped smoothing on amplitude for fluid physics
    const target = state === "listening" ? amplitude : state === "speaking" ? amplitude * 0.7 + 0.15 : 0;
    ampRef.current += (target - ampRef.current) * Math.min(1, dt * 8);

    // breathing scale — gentle on idle, stronger on activity
    const breath =
      state === "thinking" ? 1 + Math.sin(t * 2.2) * 0.04
      : state === "speaking" ? 1 + Math.sin(t * 6) * 0.025 + ampRef.current * 0.18
      : state === "listening" ? 1 + ampRef.current * 0.25
      : 1 + Math.sin(t * 1.1) * 0.015;
    scaleRef.current += (breath - scaleRef.current) * Math.min(1, dt * 6);

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
    uniforms.uListen.value += ((state === "listening" ? 1 : 0) - uniforms.uListen.value) * Math.min(1, dt * 4);
    uniforms.uSpeak.value += ((state === "speaking" ? 1 : 0) - uniforms.uSpeak.value) * Math.min(1, dt * 4);
    uniforms.uActive.value += ((state === "thinking" ? 1 : 0) - uniforms.uActive.value) * Math.min(1, dt * 4);

    // state-driven palette shift
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
      {/* Soft outer bloom halo */}
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

      {/* Silk orb */}
      <mesh ref={mesh}>
        <sphereGeometry args={[1, 128, 128]} />
        <shaderMaterial
          transparent
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
        />
      </mesh>
    </group>
  );
}

export function OrbStatus({
  active,
  amplitude = 0,
  listening = false,
  speaking = false,
  className = "h-9 w-9",
}: {
  active: boolean;
  amplitude?: number;
  listening?: boolean;
  speaking?: boolean;
  className?: string;
}) {
  const state: State = listening ? "listening" : speaking ? "speaking" : active ? "thinking" : "idle";

  return (
    <div className={`${className} shrink-0`}>
      <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 3.2], fov: 38 }} gl={{ alpha: true, antialias: true, premultipliedAlpha: false }}>
        <SilkOrb state={state} amplitude={amplitude} />
      </Canvas>
    </div>
  );
}
