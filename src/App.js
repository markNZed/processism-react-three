import React, { useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import useStore from './useStore';
import SceneManager from './SceneManager';
import SceneSelector from './SceneSelector';

/**
 * Handles camera adjustments on window resize for react-three-fiber.
 */
function CameraAdjuster() {
  const { camera, gl } = useThree();

  useEffect(() => {
    const handleResize = () => {
      // Set camera bounds based on window dimensions
      camera.left = window.innerWidth / -2;
      camera.right = window.innerWidth / 2;
      camera.top = window.innerHeight / 2;
      camera.bottom = window.innerHeight / -2;

      // Update the camera projection matrix and renderer size
      camera.updateProjectionMatrix();
      gl.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [camera, gl]);

  return null; // Component only handles side effects
}

/**
 * Main component that renders the 3D scene.
 */
export default function App() {
  const usePhysics = useStore(state => state.usePhysics);

  return (
    <>
    <SceneSelector />
    <Canvas orthographic>
      {/* Conditional rendering based on whether physics are enabled */}
      {usePhysics ? (
        <Physics gravity={[0, 0, 0]}>
          <SceneManager />
        </Physics>
      ) : (
        <SceneManager />
      )}

      <OrbitControls />
      <Environment preset="sunset" />
      <CameraAdjuster />
    </Canvas>
    </>
  );
}
