import React from 'react';
import { Canvas } from '@react-three/fiber';
import CameraRig from './CameraRig';
import MissionPanel from './MissionPanel';

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#050505', overflow: 'hidden' }}>
      <Canvas camera={{ position: [0, 0, 15], fov: 45 }}>
        <CameraRig />
      </Canvas>
      <MissionPanel />
    </div>
  );
}