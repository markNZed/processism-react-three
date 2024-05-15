import React, { useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import SceneManager from './SceneManager';
import SceneSelector from './SceneSelector';

/**
 * Handles camera adjustments on window resize for react-three-fiber.
 */
function CameraAdjuster({ isOrthographic }) {
  const { camera, gl } = useThree();

  useEffect(() => {
    const handleResize = () => {
      if (isOrthographic) {
        camera.left = window.innerWidth / -2;
        camera.right = window.innerWidth / 2;
        camera.top = window.innerHeight / 2;
        camera.bottom = window.innerHeight / -2;
      } else {
        camera.aspect = window.innerWidth / window.innerHeight;
      }
      camera.updateProjectionMatrix();
      gl.setSize(window.innerWidth, window.innerHeight);
    };

    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [camera, gl, isOrthographic]);

  return null; // Component only handles side effects
}

export default function App() {
  const { sceneComponent, isOrthographic, key } = SceneManager();

  return (
    <>
      <SceneSelector />
      <Canvas key={key} orthographic={isOrthographic}>
        {sceneComponent}
        <CameraAdjuster isOrthographic={isOrthographic} />
      </Canvas>
    </>
  );
}
