// SceneSelector.js
import React from 'react'
import useStore from './useStore' // Make sure the path is correct

const SceneSelector = () => {
  const setCurrentScene = useStore((state) => state.setCurrentScene)
  const setReloadScene = useStore((state) => state.setReloadScene)
  const clearAllAnimationStates = useStore((state) => state.clearAllAnimationStates)

  const initializeScene = (sceneName) => {
    clearAllAnimationStates() // Clear all animation states
    setCurrentScene(sceneName) // Set the current scene
    setReloadScene(true)
  }

  return (
    <div style={{ zIndex: 10 }}>
      <button onClick={() => initializeScene('SceneOne')}>Go to Scene One</button>
      <button onClick={() => initializeScene('SceneTwo')}>Go to Scene Two</button>
      <button onClick={() => initializeScene('SceneThree')}>Go to Scene Three</button>
      <button onClick={() => initializeScene('SceneJoints')}>Go to Scene Joints</button>
    </div>
  )
}

export default SceneSelector
