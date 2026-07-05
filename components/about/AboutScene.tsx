import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Edges } from '@react-three/drei';
import * as THREE from 'three';
import { scrollProgress } from '@/lib/scrollProgress';

function MorphingStructure() {
  const groupRef = useRef<THREE.Group>(null);
  const solidRef = useRef<THREE.Mesh>(null);
  const wireRef = useRef<THREE.Mesh>(null);
  const smoothed = useRef(0);

  useFrame((state, delta) => {
    smoothed.current += (scrollProgress.about - smoothed.current) * Math.min(1, delta * 4);
    const p = smoothed.current;

    if (groupRef.current) {
      groupRef.current.rotation.y = p * Math.PI * 1.4 + state.clock.elapsedTime * 0.05;
      groupRef.current.rotation.x = 0.15 + p * 0.2;
      const scale = 0.7 + p * 0.5;
      groupRef.current.scale.setScalar(scale);
    }
    if (solidRef.current) {
      const mat = solidRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = p;
      mat.transparent = true;
    }
    if (wireRef.current) {
      const mat = wireRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 1 - p * 0.85;
      mat.transparent = true;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={solidRef}>
        <boxGeometry args={[1.6, 2.1, 1.6]} />
        <meshStandardMaterial color="#9aa0aa" metalness={0.6} roughness={0.35} transparent opacity={0} />
      </mesh>
      <mesh ref={wireRef}>
        <boxGeometry args={[1.62, 2.12, 1.62]} />
        <meshBasicMaterial color="#7fd9ff" wireframe transparent opacity={1} />
        <Edges color="#7fd9ff" />
      </mesh>
    </group>
  );
}

export default function AboutScene() {
  return (
    <Canvas camera={{ position: [2.4, 1.2, 3.4], fov: 40 }} dpr={[1, 1.6]}>
      <color attach="background" args={['#050506']} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 4, 2]} intensity={1.1} color="#c9d6ff" />
      <directionalLight position={[-3, -1, -2]} intensity={0.4} color="#ff6a3d" />
      <MorphingStructure />
    </Canvas>
  );
}
