import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export type ServiceKind =
  | 'architecture'
  | 'engineering'
  | 'construction'
  | 'consulting'
  | 'management'
  | 'urban';

function Geometry({ kind, hovered }: { kind: ServiceKind; hovered: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const speed = hovered ? 0.6 : 0.18;
    groupRef.current.rotation.y += delta * speed;
    const target = hovered ? 1.12 : 1;
    groupRef.current.scale.lerp(new THREE.Vector3(target, target, target), 0.08);
  });

  const material = (color: string, emissive = '#000000', emissiveIntensity = 0) => (
    <meshStandardMaterial
      color={color}
      metalness={0.75}
      roughness={0.28}
      emissive={emissive}
      emissiveIntensity={emissiveIntensity}
      toneMapped={false}
    />
  );

  switch (kind) {
    case 'architecture':
      return (
        <group ref={groupRef}>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[0, i * 0.42 - 0.4, 0]} scale={[1 - i * 0.16, 0.4, 1 - i * 0.16]}>
              <boxGeometry args={[1, 1, 1]} />
              {material('#c9ccd2')}
            </mesh>
          ))}
        </group>
      );
    case 'engineering':
      return (
        <group ref={groupRef}>
          <mesh>
            <torusKnotGeometry args={[0.55, 0.16, 128, 16]} />
            {material('#8a8f98', '#7fd9ff', 0.3)}
          </mesh>
        </group>
      );
    case 'construction':
      return (
        <group ref={groupRef}>
          <mesh position={[0, 0.3, 0]}>
            <coneGeometry args={[0.75, 1.1, 4]} />
            {material('#e8e9ec')}
          </mesh>
          <mesh position={[0, -0.5, 0]} rotation={[0, Math.PI / 4, 0]}>
            <boxGeometry args={[1.2, 0.2, 1.2]} />
            {material('#8a8f98')}
          </mesh>
        </group>
      );
    case 'consulting':
      return (
        <group ref={groupRef}>
          <mesh>
            <icosahedronGeometry args={[0.62, 0]} />
            {material('#e8e9ec', '#ffffff', 0.15)}
          </mesh>
          <mesh rotation={[Math.PI / 2.4, 0, 0]}>
            <torusGeometry args={[0.95, 0.012, 8, 80]} />
            {material('#7fd9ff', '#7fd9ff', 0.6)}
          </mesh>
          <mesh rotation={[Math.PI / 1.6, 0.6, 0]}>
            <torusGeometry args={[1.1, 0.01, 8, 80]} />
            {material('#8a8f98')}
          </mesh>
        </group>
      );
    case 'management':
      return (
        <group ref={groupRef}>
          {[
            [0, 0, 0],
            [0.9, 0.5, 0],
            [-0.9, -0.4, 0.3],
            [0.3, -0.7, -0.5],
          ].map((pos, i) => (
            <mesh key={i} position={pos as [number, number, number]}>
              <octahedronGeometry args={[0.24, 0]} />
              {material(i === 0 ? '#7fd9ff' : '#c9ccd2', i === 0 ? '#7fd9ff' : '#000000', i === 0 ? 0.5 : 0)}
            </mesh>
          ))}
        </group>
      );
    case 'urban':
    default:
      return (
        <group ref={groupRef}>
          {[
            [-0.5, -0.2, 0.3, 0.9],
            [0.1, 0.1, -0.2, 1.3],
            [0.55, -0.35, 0.1, 0.7],
            [-0.1, -0.5, -0.4, 0.5],
          ].map(([x, , z, h], i) => (
            <mesh key={i} position={[x, h / 2 - 0.5, z]}>
              <boxGeometry args={[0.28, h, 0.28]} />
              {material('#c9ccd2')}
            </mesh>
          ))}
        </group>
      );
  }
}

export default function ServiceObject({ kind, hovered }: { kind: ServiceKind; hovered: boolean }) {
  return (
    <Canvas dpr={[1, 1.5]} camera={{ position: [1.6, 1.1, 2.2], fov: 40 }} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 2]} intensity={1.1} color="#c9d6ff" />
      <directionalLight position={[-3, -2, -2]} intensity={0.5} color="#ff6a3d" />
      <Geometry kind={kind} hovered={hovered} />
    </Canvas>
  );
}
