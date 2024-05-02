import React, { useEffect } from 'react';
import {EmergentEntity, DynamicDoubleArrow } from './components';
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { PositionProvider } from './PositionContext';
import { AnimationController } from './AnimationContext';

function CameraAdjuster() {
  const { camera, gl } = useThree(); // Access R3F context

  useEffect(() => {
    function handleResize() {
      // Calculate new dimensions
      camera.left = window.innerWidth / -2;
      camera.right = window.innerWidth / 2;
      camera.top = window.innerHeight / 2;
      camera.bottom = window.innerHeight / -2;
      
      // Update camera and renderer
      camera.updateProjectionMatrix();
      gl.setSize(window.innerWidth, window.innerHeight);
    }

    // Add and clean up the resize listener
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [camera, gl]); // Depend on camera and gl objects

  return null; // This component does not render anything itself
}

export default function App() {
  return (
    <Canvas style={{ background: '#a8a7b5' }} 
      camera={{ 
        position: [0, 0, 1],
        zoom: 20,
        left: window.innerWidth / -2,
        right: window.innerWidth / 2,
        top: window.innerHeight / 2,
        bottom: window.innerHeight / -2,
        near: -100,
        far: 100
      }}
      orthographic
    > 
      <CameraAdjuster />
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