import { useEffect, useRef, useState, useContext } from 'react'
import {  useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { DoubleSide } from 'three'
import {  a } from '@react-spring/three';
import { useSpring, animated } from '@react-spring/three';
import useStore from '../useStore';

function Sphere({ id, initialPosition, radius = 0.5, finalOpacity = 1.0, ...props }) {
  const ref = useRef()
  const [hovered, hover] = useState(false)
  const [clicked, click] = useState(false)

  const { positions, updatePosition, animationState } = useStore(state => ({
    positions: state.positions,
    updatePosition: state.updatePosition,
    animationState: state.animationStates[id]
  }));

  const animationControl = animationState || { scale: 1 }; // Default or fallback state

  // Set initial position
  useEffect(() => {
      if (ref.current) {
          ref.current.position.copy(initialPosition|| new THREE.Vector3(0, 0, 0));
          const newPosition = initialPosition || new THREE.Vector3(0, 0, 0);
          if (!positions[id] || !newPosition.equals(positions[id])) {
              updatePosition(id, newPosition);
          }
      }
  }, [initialPosition]);

  // Update global state whenever the position changes
  useFrame(() => {
    if (ref.current && positions[id]) {
      if (!ref.current.position.equals(positions[id])) {
        updatePosition(id, initialPosition|| new THREE.Vector3(0, 0, 0));
      }
    }
  });

  // Extracting values from animationControl with default values
  const { visible = true, opacity = 1, fadeInDuration = 2000} = animationControl || {};

  useFrame(() => {
    if (ref.current) {
      const newPosition = ref.current.position.clone();
      updatePosition(id, newPosition);
    }
  });

  // React Spring animation for opacity
  const springProps = useSpring({
    to: { opacity: visible ? opacity : 0 },  // Animate to 'opacity' if visible, otherwise animate to 0
    from: { opacity: 0 },                   // Start from fully transparent
    config: { duration: fadeInDuration }
  });

  return (
    <a.mesh
      {...props}
      ref={ref}
      scale={clicked ? animationControl.scale * 2 : animationControl.scale}
      onClick={(event) => click(!clicked)}
      onPointerOver={(event) => (event.stopPropagation(), hover(true))}
      onPointerOut={(event) => hover(false)}
      visible={visible}
      material-opacity={opacity}
      depthWrite={false} // crucial for correct rendering of inner objects
      >
      <sphereGeometry args={[radius, 32, 32]} />
      <animated.meshStandardMaterial color={hovered ? 'hotpink' : 'blue'} opacity={springProps.opacity} transparent />
    </a.mesh>
  )
}

export default Sphere;