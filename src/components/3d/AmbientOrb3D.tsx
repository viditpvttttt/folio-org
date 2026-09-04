import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sphere } from "@react-three/drei";
import { useRef, useMemo } from "react";
import * as THREE from "three";

function OrbMesh({ isHovered = false }: { isHovered?: boolean }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const meshRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const materialRef = useRef<any>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.x = time * 0.15;
      meshRef.current.rotation.y = time * 0.22;
    }
    if (materialRef.current) {
      materialRef.current.distort = THREE.MathUtils.lerp(
        materialRef.current.distort,
        isHovered ? 0.6 : 0.38,
        0.05
      );
      materialRef.current.speed = THREE.MathUtils.lerp(
        materialRef.current.speed,
        isHovered ? 3.5 : 2.0,
        0.05
      );
    }
  });

  const customShaderColor = useMemo(() => new THREE.Color("#7b6bd6"), []);

  return (
    <Float speed={2.5} rotationIntensity={1.2} floatIntensity={1.5}>
      <Sphere ref={meshRef} args={[1.35, 64, 64]}>
        <MeshDistortMaterial
          ref={materialRef}
          color={customShaderColor}
          roughness={0.12}
          metalness={0.88}
          distort={0.4}
          speed={2.2}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
          reflectivity={0.95}
        />
      </Sphere>
    </Float>
  );
}

interface AmbientOrb3DProps {
  className?: string;
  isHovered?: boolean;
}

/**
 * 3D Ambient Silk Shader Orb using React Three Fiber.
 * Adds interactive WebGL depth, distortion physics and reflections.
 */
export function AmbientOrb3D({ className, isHovered = false }: AmbientOrb3DProps) {
  return (
    <div className={className || "h-full w-full relative"}>
      <Canvas
        camera={{ position: [0, 0, 3.8], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={1.2} />
        <directionalLight position={[5, 5, 5]} intensity={2.5} color="#e0574a" />
        <directionalLight position={[-5, -5, -3]} intensity={3.0} color="#7b6bd6" />
        <pointLight position={[0, 3, 2]} intensity={2.0} color="#5f8c6a" />
        <OrbMesh isHovered={isHovered} />
      </Canvas>
    </div>
  );
}
