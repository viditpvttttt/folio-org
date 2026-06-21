import { Canvas, useFrame } from "@react-three/fiber";
import { MeshDistortMaterial } from "@react-three/drei";
import { useRef } from "react";
import type { Mesh } from "three";

function Orb({ active }: { active: boolean }) {
  const ref = useRef<Mesh>(null);
  useFrame((s) => {
    if (!ref.current) return;
    const t = s.clock.elapsedTime;
    ref.current.rotation.y = t * 0.6;
    ref.current.rotation.x = Math.sin(t * 0.4) * 0.3;
    const pulse = active ? 1 + Math.sin(t * 6) * 0.08 : 1;
    ref.current.scale.setScalar(pulse);
  });
  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[1, 5]} />
      <MeshDistortMaterial
        color={active ? "#ff4d8d" : "#7a5cff"}
        distort={active ? 0.6 : 0.35}
        speed={active ? 4 : 1.5}
        roughness={0.1}
        metalness={0.4}
      />
    </mesh>
  );
}

export function OrbStatus({ active, className = "h-9 w-9" }: { active: boolean; className?: string }) {
  return (
    <div className={`${className} shrink-0`}>
      <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 2.6], fov: 45 }} gl={{ alpha: true, antialias: true }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[2, 2, 2]} intensity={1.4} color="#ff4d8d" />
        <pointLight position={[-2, -1, 2]} intensity={1} color="#4d9bff" />
        <Orb active={active} />
      </Canvas>
    </div>
  );
}
