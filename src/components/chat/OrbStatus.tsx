import { Canvas, useFrame } from "@react-three/fiber";
import { MeshDistortMaterial, Sphere } from "@react-three/drei";
import { useRef } from "react";
import type { Group, Mesh } from "three";

function SiriOrb({ active, amplitude, listening }: { active: boolean; amplitude: number; listening: boolean }) {
  const core = useRef<Mesh>(null);
  const shellA = useRef<Mesh>(null);
  const shellB = useRef<Mesh>(null);
  const halo = useRef<Group>(null);
  const ampRef = useRef(0);

  useFrame((s) => {
    const t = s.clock.elapsedTime;
    ampRef.current += (amplitude - ampRef.current) * 0.2;
    const a = ampRef.current;

    const baseline = active ? 1 + Math.sin(t * 6) * 0.08 : 1;
    const voiceBoost = listening ? a * 0.55 : 0;

    if (core.current) {
      core.current.rotation.y = t * (listening ? 1.4 : 0.6);
      core.current.rotation.x = Math.sin(t * 0.5) * 0.4;
      core.current.scale.setScalar(baseline + voiceBoost);
    }
    if (shellA.current) {
      shellA.current.rotation.y = -t * 0.5;
      shellA.current.rotation.z = Math.cos(t * 0.4) * 0.3;
      shellA.current.scale.setScalar(1.18 + voiceBoost * 0.7 + Math.sin(t * 2) * 0.02);
    }
    if (shellB.current) {
      shellB.current.rotation.x = t * 0.4;
      shellB.current.rotation.y = t * 0.3;
      shellB.current.scale.setScalar(1.35 + voiceBoost * 0.9 + Math.cos(t * 1.6) * 0.025);
    }
    if (halo.current) {
      halo.current.rotation.z = t * 0.25;
      halo.current.scale.setScalar(1 + voiceBoost * 0.4);
    }
  });

  return (
    <group>
      {/* Halo rings — Siri-like glow */}
      <group ref={halo}>
        <mesh rotation={[Math.PI / 2.4, 0, 0]}>
          <torusGeometry args={[1.55, 0.012, 16, 128]} />
          <meshBasicMaterial color="#ff4d8d" transparent opacity={0.55} />
        </mesh>
        <mesh rotation={[Math.PI / 1.8, 0.6, 0]}>
          <torusGeometry args={[1.7, 0.008, 16, 128]} />
          <meshBasicMaterial color="#4d9bff" transparent opacity={0.45} />
        </mesh>
        <mesh rotation={[Math.PI / 3, -0.4, 0.3]}>
          <torusGeometry args={[1.85, 0.006, 16, 128]} />
          <meshBasicMaterial color="#7dffb4" transparent opacity={0.35} />
        </mesh>
      </group>

      {/* Outer translucent shell */}
      <Sphere ref={shellB} args={[1, 64, 64]}>
        <MeshDistortMaterial
          color={listening ? "#7dffb4" : "#4d9bff"}
          distort={0.45 + amplitude * 0.4}
          speed={listening ? 4 : 2}
          roughness={0.05}
          metalness={0.2}
          transparent
          opacity={0.18}
        />
      </Sphere>

      {/* Mid shell */}
      <Sphere ref={shellA} args={[1, 64, 64]}>
        <MeshDistortMaterial
          color={listening ? "#b66dff" : active ? "#ff4d8d" : "#7a5cff"}
          distort={0.55 + amplitude * 0.35}
          speed={listening ? 5 : 3}
          roughness={0.1}
          metalness={0.35}
          transparent
          opacity={0.45}
        />
      </Sphere>

      {/* Core */}
      <Sphere ref={core} args={[1, 96, 96]}>
        <MeshDistortMaterial
          color={listening ? "#7dffb4" : active ? "#ff4d8d" : "#b66dff"}
          distort={listening ? 0.55 + amplitude * 0.5 : active ? 0.6 : 0.4}
          speed={listening ? 6 : active ? 4 : 1.8}
          roughness={0.05}
          metalness={0.5}
        />
      </Sphere>
    </group>
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
      <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 4], fov: 45 }} gl={{ alpha: true, antialias: true }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[3, 3, 3]} intensity={1.6} color="#ff4d8d" />
        <pointLight position={[-3, -2, 3]} intensity={1.2} color="#4d9bff" />
        <pointLight position={[0, 3, -2]} intensity={1} color="#7dffb4" />
        <pointLight position={[0, -3, 2]} intensity={0.8} color="#b66dff" />
        <SiriOrb active={active} amplitude={amplitude} listening={listening} />
      </Canvas>
    </div>
  );
}
