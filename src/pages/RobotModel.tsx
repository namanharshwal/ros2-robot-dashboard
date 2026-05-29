import { useRos } from '@/contexts/RosContext';
import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Text } from '@react-three/drei';
import * as THREE from 'three';
import {
  Box,
  Cylinder,
  RotateCw,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

// GT100 3D Robot Model
function Robot3DModel({ yaw }: { yaw: number }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = yaw;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Main chassis */}
      <mesh position={[0, 0.075, 0]} castShadow>
        <boxGeometry args={[0.6, 0.15, 0.4]} />
        <meshStandardMaterial color="#21262D" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Chassis top plate */}
      <mesh position={[0, 0.155, 0]} castShadow>
        <boxGeometry args={[0.58, 0.01, 0.38]} />
        <meshStandardMaterial color="#1C2128" metalness={0.5} roughness={0.3} />
      </mesh>

      {/* Orange accent stripe front */}
      <mesh position={[0.301, 0.075, 0]}>
        <boxGeometry args={[0.002, 0.08, 0.35]} />
        <meshStandardMaterial color="#F0883E" emissive="#F0883E" emissiveIntensity={0.3} />
      </mesh>

      {/* LED status bar */}
      <mesh position={[0.302, 0.1, 0]}>
        <boxGeometry args={[0.002, 0.02, 0.25]} />
        <meshStandardMaterial color="#3FB950" emissive="#3FB950" emissiveIntensity={0.5} />
      </mesh>

      {/* Left main drive wheel */}
      <group position={[0, 0.075, -0.22]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.075, 0.075, 0.06, 32]} />
          <meshStandardMaterial color="#484F58" metalness={0.4} roughness={0.7} />
        </mesh>
        {/* Wheel hub */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.065, 16]} />
          <meshStandardMaterial color="#388BFD" metalness={0.7} roughness={0.2} />
        </mesh>
        {/* Tire tread */}
        {Array.from({ length: 8 }, (_, i) => (
          <mesh key={i} rotation={[Math.PI / 2, 0, (i / 8) * Math.PI * 2]} position={[0, 0, 0]}>
            <boxGeometry args={[0.005, 0.065, 0.08]} />
            <meshStandardMaterial color="#30363D" />
          </mesh>
        ))}
      </group>

      {/* Right main drive wheel */}
      <group position={[0, 0.075, 0.22]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.075, 0.075, 0.06, 32]} />
          <meshStandardMaterial color="#484F58" metalness={0.4} roughness={0.7} />
        </mesh>
        {/* Wheel hub */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.065, 16]} />
          <meshStandardMaterial color="#388BFD" metalness={0.7} roughness={0.2} />
        </mesh>
      </group>

      {/* Caster wheels (4 corners) */}
      {[
        [-0.25, -0.18],
        [-0.25, 0.18],
        [0.25, -0.18],
        [0.25, 0.18],
      ].map(([x, z], i) => (
        <group key={i} position={[x, 0.025, z]}>
          {/* Caster mount */}
          <mesh>
            <cylinderGeometry args={[0.02, 0.02, 0.03, 16]} />
            <meshStandardMaterial color="#484F58" />
          </mesh>
          {/* Caster wheel */}
          <mesh position={[0, -0.01, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.015, 16]} />
            <meshStandardMaterial color="#30363D" />
          </mesh>
        </group>
      ))}

      {/* LiDAR dome */}
      <group position={[0.05, 0.2, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.05, 0.06, 0.06, 32]} />
          <meshStandardMaterial color="#1C2128" metalness={0.5} roughness={0.3} />
        </mesh>
        {/* LiDAR window */}
        <mesh position={[0, 0.01, 0.051]}>
          <boxGeometry args={[0.08, 0.03, 0.002]} />
          <meshStandardMaterial color="#3FB950" emissive="#3FB950" emissiveIntensity={0.4} transparent opacity={0.7} />
        </mesh>
        {/* Spinning LiDAR ring */}
        <LiDARRing />
      </group>

      {/* Direction arrow */}
      <group position={[0.35, 0.08, 0]}>
        <mesh rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.04, 0.1, 8]} />
          <meshStandardMaterial color="#F0883E" emissive="#F0883E" emissiveIntensity={0.3} />
        </mesh>
      </group>

      {/* GT100 label */}
      <mesh position={[-0.15, 0.161, 0.1]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.2, 0.08]} />
        <meshBasicMaterial color="#484F58" />
      </mesh>
    </group>
  );
}

// Spinning LiDAR ring animation
function LiDARRing() {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.y += delta * 10;
    }
  });

  return (
    <mesh ref={ringRef} position={[0, 0.035, 0]}>
      <torusGeometry args={[0.055, 0.003, 8, 32]} />
      <meshStandardMaterial color="#3FB950" emissive="#3FB950" emissiveIntensity={0.6} transparent opacity={0.8} />
    </mesh>
  );
}

// Scene setup
function Scene({ robotYaw }: { robotYaw: number }) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 5]} intensity={0.8} castShadow />
      <directionalLight position={[-3, 4, -3]} intensity={0.3} />
      <pointLight position={[0, 3, 0]} intensity={0.2} color="#58A6FF" />

      <Robot3DModel yaw={robotYaw} />

      {/* Floor grid */}
      <Grid
        position={[0, 0, 0]}
        args={[20, 20]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#30363D"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#484F58"
        fadeDistance={15}
        fadeStrength={1}
        infiniteGrid
      />

      {/* Floor plane for shadows */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#0D1117" transparent opacity={0} />
      </mesh>

      <OrbitControls
        makeDefault
        enablePan
        enableZoom
        enableRotate
        minDistance={0.5}
        maxDistance={10}
        target={[0, 0.1, 0]}
      />
    </>
  );
}

export default function RobotModel() {
  const { connected, odometry, jointState, tfFrames } = useRos();

  const robotYaw = useMemo(() => {
    const q = odometry.orientation;
    const siny = 2 * (q.w * q.z + q.x * q.y);
    const cosy = 1 - 2 * (q.y * q.y + q.z * q.z);
    return Math.atan2(siny, cosy);
  }, [odometry.orientation]);

  return (
    <div
      style={{
        padding: 16,
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gridTemplateRows: '1fr auto',
        gap: 12,
        height: 'calc(100vh - 48px)',
        overflow: 'hidden',
      }}
    >
      {/* 3D Viewer */}
      <div className="panel" style={{ gridColumn: 'span 9', padding: 0, overflow: 'hidden' }}>
        <Canvas
          camera={{ position: [1.2, 1.0, 1.2], fov: 50 }}
          shadows
          style={{ background: '#0D1117' }}
        >
          <Scene robotYaw={robotYaw} />
        </Canvas>
      </div>

      {/* Right Panel */}
      <div style={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto' }}>
        {/* URDF Info */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 14, color: '#E6EDF3', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Box size={16} color="#8B949E" />
            URDF Info
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <div style={{ fontSize: 10, color: '#484F58' }}>Robot Name</div>
              <div style={{ fontSize: 12, color: '#E6EDF3' }}>gt100_diff</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#484F58' }}>Links</div>
              <div style={{ fontSize: 12, color: '#E6EDF3' }}>8</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#484F58' }}>Joints</div>
              <div style={{ fontSize: 12, color: '#E6EDF3' }}>7</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#484F58' }}>ROS Distro</div>
              <div style={{ fontSize: 12, color: '#E6EDF3' }}>Humble</div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, color: '#484F58' }}>Base Controller</div>
            <div style={{ fontSize: 12, color: '#58A6FF', fontFamily: 'var(--font-mono)' }}>diff_drive_controller</div>
          </div>

          <div>
            <div style={{ fontSize: 10, color: '#484F58' }}>HW Interface</div>
            <div style={{ fontSize: 12, color: '#58A6FF', fontFamily: 'var(--font-mono)' }}>GT100SystemHardware</div>
          </div>
        </div>

        {/* Joint States */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 14, color: '#E6EDF3', display: 'flex', alignItems: 'center', gap: 8 }}>
            <RotateCw size={16} color="#8B949E" />
            Joint States
          </div>

          {jointState.name.map((name, idx) => (
            <div key={name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: '#8B949E', fontFamily: 'var(--font-mono)' }}>
                  {name}
                </span>
                <span style={{ fontSize: 11, color: '#E6EDF3', fontFamily: 'var(--font-mono)' }}>
                  {(jointState.velocity[idx] || 0).toFixed(1)} rad/s
                </span>
              </div>
              <div style={{ height: 6, background: '#21262D', borderRadius: 3, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(Math.abs(jointState.position[idx] || 0) / (2 * Math.PI) * 100, 100)}%`,
                    background: idx === 0 ? '#388BFD' : '#F0883E',
                    borderRadius: 3,
                    transition: 'width 0.1s',
                  }}
                />
              </div>
              <div style={{ fontSize: 10, color: '#484F58', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                Pos: {((jointState.position[idx] || 0) % (2 * Math.PI)).toFixed(2)} rad
              </div>
            </div>
          ))}
        </div>

        {/* TF Tree */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 14, color: '#E6EDF3' }}>
            TF Frames
          </div>
          <ScrollArea style={{ flex: 1 }}>
            {tfFrames.map((frame, idx) => (
              <div key={idx} style={{ padding: '4px 0', borderBottom: '1px solid #21262D' }}>
                <div style={{ fontSize: 10, color: '#484F58', fontFamily: 'var(--font-mono)' }}>
                  {frame.frame_id} → {frame.child_frame_id}
                </div>
                <div style={{ fontSize: 10, color: '#8B949E', fontFamily: 'var(--font-mono)' }}>
                  t: ({frame.translation.x.toFixed(2)}, {frame.translation.y.toFixed(2)}, {frame.translation.z.toFixed(2)})
                </div>
              </div>
            ))}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
