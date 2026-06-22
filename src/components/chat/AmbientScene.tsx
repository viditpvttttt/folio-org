import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Stars, Sparkles } from "@react-three/drei";
import { useRef } from "react";
import type { Mesh, Group } from "three";

function FloatingBlob({
  position, color, speed = 0.4, scale = 1,
}: { position: [number, number, number]; color: string; speed?: number; scale?: number }) {
  const ref = useRef<Mesh>(null);
  useFrame((s) => {
    if (!ref.current) return;
    ref.current.rotation.x = s.clock.elapsedTime * speed * 0.3;
    ref.current.rotation.y = s.clock.elapsedTime * speed * 0.4;
  });
  return (
    <Float speed={1.2} rotationIntensity={0.4} floatIntensity={1.4}>
      <mesh ref={ref} position={position} scale={scale}>
        <icosahedronGeometry args={[1, 4]} />
        <MeshDistortMaterial color={color} distort={0.5} speed={1.8} roughness={0.1} metalness={0.35} />
      </mesh>
    </Float>
  );
}

function ParallaxRig({ children }: { children: React.ReactNode }) {
  const group = useRef<Group>(null);
  const { mouse } = useThree();
  useFrame(() => {
    if (!group.current) return;
    group.current.rotation.y += (mouse.x * 0.3 - group.current.rotation.y) * 0.05;
    group.current.rotation.x += (-mouse.y * 0.22 - group.current.rotation.x) * 0.05;
  });
  return <group ref={group}>{children}</group>;
}

export function AmbientScene() {
  return (
    <div className="absolute inset-0 -z-10 opacity-90 pointer-events-none">
      <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 7], fov: 50 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.55} />
        <directionalLight position={[3, 3, 5]} intensity={1.1} />
        <pointLight position={[-4, -2, 3]} intensity={0.9} color="#ff4d8d" />
        <pointLight position={[4, 2, 3]} intensity={0.9} color="#4d9bff" />
        <pointLight position={[0, -3, 2]} intensity={0.7} color="#7dffb4" />
        <Stars radius={50} depth={40} count={1600} factor={3.5} fade speed={0.6} />
        <Sparkles count={80} scale={[12, 8, 8]} size={2.4} speed={0.35} color="#ffd2f0" opacity={0.7} />
        <ParallaxRig>
          <FloatingBlob position={[-3.8, 1.4, -1]} color="#ff4d8d" speed={0.5} />
          <FloatingBlob position={[3.8, -1.2, -2]} color="#4d9bff" speed={0.35} />
          <FloatingBlob position={[0.4, 2.4, -3]} color="#b66dff" speed={0.45} scale={0.8} />
          <FloatingBlob position={[-1.8, -2.6, -1.5]} color="#7dffb4" speed={0.4} scale={0.7} />
          <FloatingBlob position={[2.6, 1.8, -2.5]} color="#ffd24d" speed={0.55} scale={0.6} />
          <FloatingBlob position={[-2.6, 0.2, -3.5]} color="#5d6dff" speed={0.3} scale={0.55} />
        </ParallaxRig>
      </Canvas>
    </div>
  );
}
