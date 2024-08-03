import React, { useEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import useStore from './useStore'
import useSceneManager from './useSceneManager';
import SceneSelector from './SceneSelector';
import { EntityStoreDemo } from './animationComponents';

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
  // This is a bit convoluted. One issue is that the button needs to be outside of the <Canvas>
  const { sceneComponent, isOrthographic, key } = useSceneManager();
  const pausePhysics = useStore((state) => state.pausePhysics);
  const setPausePhysics = useStore((state) => state.setPausePhysics);
  const setOption = useStore((state) => state.setOption);
  const fixParticles = useStore((state) => state.getOption("fixParticles"));
  const physicsDebug = useStore((state) => state.getOption("physicsDebug"));
  const showParticles = useStore((state) => state.getOption("showParticles"));
  const hideBlobs = useStore((state) => state.getOption("hideBlobs"));
  
  const toggleAnimation = () => {
    setPausePhysics(!pausePhysics); // Toggle animation state
  };

  const toggleOption = (option, value) => {
    setOption(option, !value);
 };

  return (
    <>
      { false && (
        //Added here as a hack for interactive testing
        <EntityStoreDemo />
      )}
      <SceneSelector />
      <button onClick={toggleAnimation}>
        {pausePhysics ? 'Play physics' : 'Pause physics'}
      </button>
      <button onClick={() => {toggleOption("fixParticles", fixParticles)}}>
        {fixParticles ? 'Dynamic particles' : 'Fix particles'}
      </button>
      <button onClick={() => {toggleOption("physicsDebug", physicsDebug)}}>
        {physicsDebug ? 'Physics debug off' : 'Physics debug on'}
      </button>
      <button onClick={() => {toggleOption("showParticles", showParticles)}}>
        {showParticles ? 'Hide Particles' : 'Show Particles'}
      </button>
      <button onClick={() => {toggleOption("hideBlobs", hideBlobs)}}>
        {hideBlobs ? 'Show Blobs' : 'Hide Blobs'}
      </button>
      <Canvas key={key} orthographic={isOrthographic} >
        {sceneComponent}
        <CameraAdjuster isOrthographic={isOrthographic} />
      </Canvas>
    </>
  );
}
