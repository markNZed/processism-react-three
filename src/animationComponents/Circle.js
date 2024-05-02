import { useEffect, useRef, useState, useContext } from 'react'
import {  useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { DoubleSide } from 'three'
import {  a } from '@react-spring/three';
import { useSpring, animated } from '@react-spring/three';
import useStore from '../useStore';

function Circle({ id, initialPosition, ...props }) {
  const ref = useRef()

  const { positions, updatePosition, animationState } = useStore(state => ({
    positions: state.positions,
    updatePosition: state.updatePosition,
    animationState: state.animationStates[id] || { visible: true, opacity: 0.5, fadeInDuration: 1000 } // Provide default values
  }));

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
        //console.log("positions[id]", positions[id], ref.current.position)
        if (!ref.current.position.equals(positions[id])) {
          updatePosition(id, ref.current.position.clone());
        }
      }
  });

  // Extracting values from animationControl with default values
  const { visible = true, opacity = 0.5, fadeInDuration = 1000} = animationState || {};

  // React Spring animation for opacity
  const springProps = useSpring({
    to: { opacity: visible ? opacity : 0 },  // Animate to 'opacity' if visible, otherwise animate to 0
    from: { opacity: 0 },                   // Start from fully transparent
    config: { duration: fadeInDuration }
  });

  return (
    <a.mesh {...props} ref={ref} visible={true}>
      <circleGeometry args={[3.5, 32, 32]} />
      <animated.meshBasicMaterial color="green" transparent opacity={springProps.opacity} side={DoubleSide} />
    </a.mesh>
  );
}

export default Circle;