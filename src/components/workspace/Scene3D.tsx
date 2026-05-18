import { useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text, Float, OrbitControls, RoundedBox, Html, Environment } from "@react-three/drei";
import type { Group } from "three";
import type { Page } from "@/lib/workspace";

interface SceneProps {
  pages: Page[];
  tasksSummary: { todo: number; doing: number; done: number };
  onSelectPage: (p: Page) => void;
  onOpenKanban: () => void;
  onOpenDashboard: () => void;
}

function PageCard({ page, onClick }: { page: Page; onClick: () => void }) {
  const ref = useRef<Group>(null);
  const [hover, setHover] = useState(false);
  useFrame((s) => {
    if (!ref.current) return;
    const t = s.clock.elapsedTime + page.pos_x;
    ref.current.position.y = page.pos_y + Math.sin(t * 0.6) * 0.15;
    ref.current.rotation.y += hover ? 0.01 : 0.002;
  });

  return (
    <group
      ref={ref}
      position={[page.pos_x, page.pos_y, page.pos_z]}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { setHover(false); document.body.style.cursor = "default"; }}
      scale={hover ? 1.08 : 1}
    >
      <RoundedBox args={[1.4, 1.9, 0.08]} radius={0.05} smoothness={4} castShadow>
        <meshStandardMaterial color={page.color} roughness={0.6} metalness={0.05} />
      </RoundedBox>
      <Text position={[0, 0.7, 0.05]} fontSize={0.28} color="#f5f3ee" anchorX="center">
        {page.icon}
      </Text>
      <Text
        position={[0, 0.2, 0.05]}
        fontSize={0.13}
        color="#f5f3ee"
        anchorX="center"
        anchorY="top"
        maxWidth={1.2}
        textAlign="center"
      >
        {page.title.length > 40 ? page.title.slice(0, 40) + "…" : page.title}
      </Text>
      <Text
        position={[0, -0.78, 0.05]}
        fontSize={0.06}
        color="#f5f3ee"
        anchorX="center"
        fillOpacity={0.5}
      >
        PAGE
      </Text>
    </group>
  );
}

function PedestalCard({
  position, label, subtitle, onClick, color = "#0d0d0d",
}: { position: [number, number, number]; label: string; subtitle: string; onClick: () => void; color?: string }) {
  const ref = useRef<Group>(null);
  const [hover, setHover] = useState(false);
  useFrame((s) => {
    if (!ref.current) return;
    ref.current.rotation.y = Math.sin(s.clock.elapsedTime * 0.3) * 0.15;
  });
  return (
    <group
      ref={ref}
      position={position}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { setHover(false); document.body.style.cursor = "default"; }}
      scale={hover ? 1.06 : 1}
    >
      <mesh castShadow>
        <cylinderGeometry args={[0.7, 0.7, 0.15, 48]} />
        <meshStandardMaterial color={color} roughness={0.4} />
      </mesh>
      <Text position={[0, 0.25, 0]} fontSize={0.14} color="#f5f3ee" anchorX="center">{label}</Text>
      <Text position={[0, 0.08, 0]} fontSize={0.07} color="#f5f3ee" anchorX="center" fillOpacity={0.6}>{subtitle}</Text>
    </group>
  );
}

function GroundDisc() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]} receiveShadow>
      <circleGeometry args={[12, 64]} />
      <meshStandardMaterial color="#e8e4dd" roughness={1} />
    </mesh>
  );
}

export function Scene3D({ pages, tasksSummary, onSelectPage, onOpenKanban, onOpenDashboard }: SceneProps) {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 2.5, 8], fov: 50 }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={["#f5f3ee"]} />
      <fog attach="fog" args={["#f5f3ee", 10, 22]} />

      <ambientLight intensity={0.6} />
      <directionalLight
        position={[5, 8, 3]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <Environment preset="apartment" />

      <GroundDisc />

      {/* Center title */}
      <Float speed={1} rotationIntensity={0.1} floatIntensity={0.3}>
        <Text
          position={[0, 3.5, 0]}
          fontSize={0.5}
          color="#0d0d0d"
          anchorX="center"
          font="https://fonts.gstatic.com/s/instrumentserif/v4/jizDREVNn1dOx-zrZ2X3pZvkTi182zI.woff"
        >
          your room
        </Text>
      </Float>

      <PedestalCard
        position={[-2.2, -1.35, 0]}
        label="Tasks"
        subtitle={`${tasksSummary.doing} doing · ${tasksSummary.todo} todo`}
        onClick={onOpenKanban}
        color="#2d2d2d"
      />
      <PedestalCard
        position={[2.2, -1.35, 0]}
        label="Dashboard"
        subtitle="this week"
        onClick={onOpenDashboard}
        color="#5c2018"
      />

      {pages.map((p) => (
        <PageCard key={p.id} page={p} onClick={() => onSelectPage(p)} />
      ))}

      {pages.length === 0 && (
        <Html position={[0, 0, 0]} center>
          <div className="pointer-events-none text-center text-muted-foreground text-sm font-serif italic">
            Press <kbd className="not-italic font-sans rounded border border-border px-1.5 py-0.5 bg-card">N</kbd> to add a page
          </div>
        </Html>
      )}

      <OrbitControls
        enablePan={false}
        minDistance={5}
        maxDistance={14}
        maxPolarAngle={Math.PI / 2 - 0.1}
        minPolarAngle={Math.PI / 6}
      />
    </Canvas>
  );
}

export function SceneShell({ children }: { children: ReactNode }) {
  return <div className="absolute inset-0">{children}</div>;
}
