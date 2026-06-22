import { Canvas, useFrame } from "@react-three/fiber";
import { MeshDistortMaterial } from "@react-three/drei";
import { useRef } from "react";
import type { Mesh } from "three";

function Orb({ active, amplitude, listening }: { active: boolean; amplitude: number; listening: boolean }) {
  const ref = useRef<Mesh>(null);
  const ampRef = useRef(0);
  useFrame((s) => {
    if (!ref.current) return;
    const t = s.clock.elapsedTime;
    // smooth amplitude
    ampRef.current += (amplitude - ampRef.current) * 0.2;
    ref.current.rotation.y = t * (listening ? 1.2 : 0.6);
    ref.current.rotation.x = Math.sin(t * 0.4) * 0.3;
    const baseline = active ? 1 + Math.sin(t * 6) * 0.08 : 1;
    const voiceBoost = listening ? ampRef.current * 0.6 : 0;
    ref.current.scale.setScalar(baseline + voiceBoost);
  });
  const color = listening ? "#7dffb4" : active ? "#ff4d8d" : "#7a5cff";
  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[1, 5]} />
      <MeshDistortMaterial
        color={color}
        distort={listening ? 0.55 + amplitude * 0.4 : active ? 0.6 : 0.35}
        speed={listening ? 5 : active ? 4 : 1.5}
        roughness={0.1}
        metalness={0.4}
      />
    </mesh>
  );
}

export function OrbStatus({
  active,
  amplitude = 0,
  listening = false,
  className = "h-9 w-9",
}: {
  active: boolean;
  amplitude?: number;
  listening?: boolean;
  className?: string;
}) {
  return (
    <div className={`${className} shrink-0`}>
      <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 2.6], fov: 45 }} gl={{ alpha: true, antialias: true }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[2, 2, 2]} intensity={1.4} color="#ff4d8d" />
        <pointLight position={[-2, -1, 2]} intensity={1} color="#4d9bff" />
        <pointLight position={[0, 2, -1]} intensity={0.8} color="#7dffb4" />
        <Orb active={active} amplitude={amplitude} listening={listening} />
      </Canvas>
    </div>
  );
}
