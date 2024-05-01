import React from 'react';
import {EmergentEntity, DynamicDoubleArrow } from './components';
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { PositionProvider } from './PositionContext';
import { AnimationController } from './AnimationContext';

export default function App() {
  return (
    <Canvas style={{ background: '#a8a7b5' }} camera={{ type: 'orthographic', position: [0, 0.5, -20] }}>
      <AnimationController>
        <PositionProvider>
          <ambientLight intensity={Math.PI / 2} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={1.0} />
          <pointLight position={[-10, -10, -10]} decay={0} intensity={1.0} />
          
          <EmergentEntity id="emergent1" position={new THREE.Vector3(-3, 0, 0)} causation={"bottomup"} />
          <EmergentEntity id="emergent2" position={new THREE.Vector3(3, 0, 0)} causation={"topdown"} />

          <DynamicDoubleArrow 
            id={"inter_emergent"} 
            fromId={"emergent1"} 
            fromOffset={new THREE.Vector3(-4, 1.0, 0)} 
            toId={"emergent2"} 
            toOffset={new THREE.Vector3(-4, 1.0, 0)}/>

          <OrbitControls />
        </PositionProvider>
      </AnimationController>
    </Canvas>
  )
}