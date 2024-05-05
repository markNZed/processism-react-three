import React, { useEffect } from 'react';
import {EmergentEntity, DynamicDoubleArrow } from './animationComponents';
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import * as THREE from 'three'
import { AnimationController } from './AnimationController';

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

  const emergentEntityRadius = 3.5;

  return (
    <Canvas
      camera={{ 
        position: [0, 0, 1],
        zoom: 35,
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
          
          <EmergentEntity 
            id="emergent1" 
            initialState={{
              position: new THREE.Vector3(-emergentEntityRadius*2, 0, 0), 
              radius: emergentEntityRadius,
              causation: "bottomup",
            }} 
          />
          <EmergentEntity 
            id="emergent2" 
            initialState={{
              position: new THREE.Vector3(emergentEntityRadius*2, 0, 0), 
              radius: emergentEntityRadius,
              causation: "bottomup",
            }} 
            causation={"topdown"} 
          />

          <DynamicDoubleArrow 
            id={"inter_emergent"} 
            fromId={"emergent1"} 
            toId={"emergent2"} 
            margin={emergentEntityRadius}
          />

          <OrbitControls />

          <Environment preset="sunset" />

      </AnimationController>
    </Canvas>
  )
}