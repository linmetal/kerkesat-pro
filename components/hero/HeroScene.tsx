import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, Float } from '@react-three/drei';
import { EffectComposer, Bloom, DepthOfField, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

function CoreStructure() {
  const shellRef = useRef<THREE.Mesh>(null);
  const frameRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const coreLightRef = useRef<THREE.PointLight>(null);

  useFrame((state, delta) => {
    if (shellRef.current) {
      shellRef.current.rotation.y += delta * 0.09;
      shellRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.12) * 0.15;
    }
    if (frameRef.current) {
      frameRef.current.rotation.y -= delta * 0.14;
      frameRef.current.rotation.z += delta * 0.05;
    }
    if (coreRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.4) * 0.06;
      coreRef.current.scale.setScalar(pulse);
    }
    if (coreLightRef.current) {
      coreLightRef.current.intensity = 6 + Math.sin(state.clock.elapsedTime * 1.4) * 2;
    }
  });

  return (
    <group>
      {/* Outer glass shell */}
      <mesh ref={shellRef}>
        <icosahedronGeometry args={[1.7, 1]} />
        <meshPhysicalMaterial
          color="#dfe6ee"
          transmission={1}
          roughness={0.06}
          thickness={1.2}
          ior={1.45}
          metalness={0}
          clearcoat={1}
          envMapIntensity={1.4}
        />
      </mesh>

      {/* Metal architectural frame */}
      <group ref={frameRef}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.05, 0.02, 16, 100]} />
          <meshStandardMaterial color="#c9ccd2" metalness={1} roughness={0.25} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 3]}>
          <torusGeometry args={[2.05, 0.015, 16, 100]} />
          <meshStandardMaterial color="#8a8f98" metalness={1} roughness={0.3} />
        </mesh>
        <mesh rotation={[0, 0, -Math.PI / 3]}>
          <torusGeometry args={[2.05, 0.015, 16, 100]} />
          <meshStandardMaterial color="#8a8f98" metalness={1} roughness={0.3} />
        </mesh>
      </group>

      {/* Glowing core */}
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[0.55, 2]} />
        <meshStandardMaterial
          color="#7fd9ff"
          emissive="#7fd9ff"
          emissiveIntensity={2.2}
          toneMapped={false}
        />
      </mesh>
      <pointLight ref={coreLightRef} color="#7fd9ff" intensity={6} distance={8} decay={2} />
    </group>
  );
}

function OrbitParticles({ count = 220 }: { count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    return new Array(count).fill(0).map(() => ({
      radius: 2.6 + Math.random() * 2.4,
      speed: 0.05 + Math.random() * 0.12,
      phase: Math.random() * Math.PI * 2,
      tilt: (Math.random() - 0.5) * 1.4,
      scale: 0.01 + Math.random() * 0.025,
    }));
  }, [count]);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = state.clock.elapsedTime;
    particles.forEach((p, i) => {
      const angle = p.phase + t * p.speed;
      const x = Math.cos(angle) * p.radius;
      const z = Math.sin(angle) * p.radius;
      const y = Math.sin(angle * 2 + p.phase) * p.tilt;
      dummy.position.set(x, y, z);
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshStandardMaterial color="#e8e9ec" emissive="#7fd9ff" emissiveIntensity={0.6} toneMapped={false} />
    </instancedMesh>
  );
}

function CameraRig() {
  const { camera, pointer } = useThree();
  const target = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const autoX = Math.sin(t * 0.05) * 0.6;
    const targetX = autoX + pointer.x * 0.9;
    const targetY = 0.3 + pointer.y * 0.5;
    camera.position.x += (targetX - camera.position.x) * 0.03;
    camera.position.y += (targetY - camera.position.y) * 0.03;
    camera.position.z += (5.6 - camera.position.z) * 0.03;
    camera.lookAt(target.current);
  });

  return null;
}

export default function HeroScene() {
  return (
    <Canvas
      dpr={[1, 1.8]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0.3, 5.6], fov: 42 }}
    >
      <color attach="background" args={['#050506']} />
      <fog attach="fog" args={['#050506', 6, 15]} />

      <ambientLight intensity={0.25} />
      <directionalLight position={[4, 5, 3]} intensity={1.2} color="#c9d6ff" />
      <directionalLight position={[-5, -2, -3]} intensity={0.6} color="#ff6a3d" />

      <Environment resolution={256}>
        <Lightformer intensity={4} color="#7fd9ff" position={[0, 4, -4]} scale={[10, 4, 1]} />
        <Lightformer intensity={2} color="#ff6a3d" position={[-6, -2, 2]} scale={[6, 3, 1]} />
        <Lightformer intensity={2.5} color="#ffffff" position={[6, 2, 4]} scale={[4, 6, 1]} />
      </Environment>

      <Float speed={1.2} rotationIntensity={0.25} floatIntensity={0.6}>
        <CoreStructure />
      </Float>

      <OrbitParticles />

      <CameraRig />

      <EffectComposer multisampling={0}>
        <Bloom intensity={0.65} luminanceThreshold={0.15} luminanceSmoothing={0.4} mipmapBlur radius={0.7} />
        <DepthOfField focusDistance={0.015} focalLength={0.04} bokehScale={2.5} height={480} />
        <Vignette eskil={false} offset={0.25} darkness={0.85} />
      </EffectComposer>
    </Canvas>
  );
}
