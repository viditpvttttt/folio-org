import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";
import { useRef } from "react";
import type { Mesh } from "three";

function FloatingBlob({ position, color, speed = 0.4 }: { position: [number, number, number]; color: string; speed?: number }) {
  const ref = useRef<Mesh>(null);
  useFrame((s) => {
    if (!ref.current) return;
    ref.current.rotation.x = s.clock.elapsedTime * speed * 0.3;
    ref.current.rotation.y = s.clock.elapsedTime * speed * 0.4;
  });
  return (
    <Float speed={1.2} rotationIntensity={0.4} floatIntensity={1.4}>
      <mesh ref={ref} position={position}>
        <icosahedronGeometry args={[1, 4]} />
        <MeshDistortMaterial color={color} distort={0.45} speed={1.6} roughness={0.15} metalness={0.2} />
      </mesh>
    </Float>
  );
}

export function AmbientScene() {
  return (
    <div className="absolute inset-0 -z-10 opacity-70 pointer-events-none">
      <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 7], fov: 50 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 3, 5]} intensity={1} />
        <FloatingBlob position={[-3.5, 1.4, -1]} color="#ff4d8d" speed={0.5} />
        <FloatingBlob position={[3.6, -1.2, -2]} color="#4d9bff" speed={0.35} />
        <FloatingBlob position={[0.4, 2.2, -3]} color="#b66dff" speed={0.45} />
        <FloatingBlob position={[-1.8, -2.4, -1.5]} color="#7dffb4" speed={0.4} />
        <FloatingBlob position={[2.4, 1.6, -2.5]} color="#ffd24d" speed={0.55} />
      </Canvas>
    </div>
  );
}
