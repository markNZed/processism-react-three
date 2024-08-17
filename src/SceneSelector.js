// SceneSelector.js
import React, { useEffect } from 'react'
import useStore from './useStore' // Make sure the path is correct

const SceneSelector = () => {
  const setCurrentScene = useStore((state) => state.setCurrentScene)
  const setReloadScene = useStore((state) => state.setReloadScene)
  const clearAllAnimationStates = useStore((state) => state.clearAllAnimationStates)
  const defaultScene = 'SceneThree';

  const initializeScene = (sceneName) => {
    clearAllAnimationStates()
    setCurrentScene(sceneName) // Set the current scene
    setReloadScene(true)
  }

  useEffect(() => {
    initializeScene(defaultScene);
  },[])

  return (
    <div style={{ zIndex: 10 }}>
      {/*
      <button onClick={() => initializeScene('SceneOne')}>Go to Scene One</button>
      <button onClick={() => initializeScene('SceneTwo')}>Go to Scene Two</button>
      <button onClick={() => initializeScene('SceneThree')}>Go to Scene Three</button>
      */}
      <button onClick={() => initializeScene(defaultScene)}>Reload</button>
    </div>
  )
}

export default SceneSelector
