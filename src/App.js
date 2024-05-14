import { Environment, OrbitControls } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import React, { useEffect } from 'react';
//import { MotionCanvas } from "framer-motion-3d"
import { Physics } from '@react-three/rapier';
import useStore from './useStore';
import SceneManager from './SceneManager';

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

  return (
    <Canvas orthographic >

        {usePhysics ? (
          <Physics
            gravity={[0, 0, 0]}
          // Need colliders to allow for impulse to work
          //colliders={false}
          >
            <SceneManager />
          </Physics>
        ) :
          <SceneManager />
        }

        <OrbitControls />

        <Environment preset="sunset" />

      <CameraAdjuster />

    </Canvas>
  )
}