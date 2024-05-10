import React, { useEffect } from 'react';
import {EmergentEntity, DynamicDoubleArrow, Camera } from './animationComponents';
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import * as THREE from 'three'
import { AnimationController } from './AnimationController';
//import { MotionCanvas } from "framer-motion-3d"
import { Physics } from '@react-three/rapier';
import useStore from './useStore';

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

  const usePhysics = useStore(state => state.usePhysics);

  const emergentEntityRadius = 3.5;

  // Initial and animated states for the camera
  const cameraInitialState = {
      position: [0, 0, 35],
      zoom: 35,
      left: window.innerWidth / -2,
      right: window.innerWidth / 2,
      top: window.innerHeight / 2,
      bottom: window.innerHeight / -2,
      near: -100,
      far: 100
  };

  const scene = (
    <>
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
          causation: "topdown",
        }} 
      />

      <DynamicDoubleArrow 
        id={"inter_emergent"}
        initialState={{
          fromId: "emergent1", 
          toId: "emergent2",
          visible: false,
        }}
      />
    </>
  )

  return (
    <Canvas orthographic >

      <AnimationController>

          {usePhysics ? (
            <Physics 
              gravity={[0, 0, 0]}
              // Need colliders to allow for impulse to work
              //colliders={false}
            >
              {scene}
            </Physics>
          ) : 
            scene
          }

          <OrbitControls />

          <Environment preset="sunset" />

          <Camera
            id={"camera"}
            initialState={cameraInitialState}
          />

      </AnimationController>

      <CameraAdjuster />

    </Canvas>
  )
}