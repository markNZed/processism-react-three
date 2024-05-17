import React, { useEffect, useState } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
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
  const [isAnimating, setIsAnimating] = useState(true); // Animation state

  const toggleAnimation = () => {
    setIsAnimating(!isAnimating); // Toggle animation state
  };

  // This is not stopping physics - would need to set value in Zustand and stop physics too
  const DisableRender = () => useFrame(() => null, 1000)

  return (
    <>
      <SceneSelector />
      <button onClick={toggleAnimation}>
        {isAnimating ? 'Stop Animation' : 'Start Animation'}
      </button>
      <Canvas key={key} orthographic={isOrthographic} >
        {!isAnimating && <DisableRender />}
        {sceneComponent}
        <CameraAdjuster isOrthographic={isOrthographic} />
      </Canvas>
    </>
  );
}
