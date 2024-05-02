import { useEffect, useRef, useState, useContext } from 'react'
import {  useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { DoubleSide } from 'three'
import {  a } from '@react-spring/three';
import { useSpring, animated } from '@react-spring/three';
import useStore from '../useStore';

function FatArrow({ id, from, to, color = 'red', headLength = 0.2, headWidth = 0.15, lineWidth = 0.03, margin = 0.6 }) {
  const ref = useRef();
  const { positions, updatePosition, animationState } = useStore(state => ({
    positions: state.positions,
    updatePosition: state.updatePosition,
    animationState: state.animationStates[id] || {}
  }));

  const { visible = true, opacity = 1.0, fadeInDuration = 1000 } = animationState;

  // React Spring animation for opacity
  const springProps = useSpring({
    to: { opacity: visible ? opacity : 0 },  // Animate to 'opacity' if visible, otherwise animate to 0
    from: { opacity: 0 },                   // Start from fully transparent
    config: { duration: fadeInDuration }
  });

  // Define geometry and material inline or as constants if they don't rely on props
  const direction = new THREE.Vector3().subVectors(to, from).normalize();
  const adjustedFrom = from.clone().add(direction.clone().multiplyScalar(margin));
  const adjustedTo = to.clone().sub(direction.clone().multiplyScalar(margin));
  const arrowLineLength = adjustedFrom.distanceTo(adjustedTo);

  const lineGeometry = new THREE.CylinderGeometry(lineWidth, lineWidth, arrowLineLength, 32);
  const coneGeometry = new THREE.ConeGeometry(headWidth, headLength, 32);

  return (
    <group ref={ref}>
      <a.mesh
        geometry={lineGeometry}
        position={adjustedFrom.clone().lerp(adjustedTo, 0.5)}
        quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction)}
      >
        <animated.meshBasicMaterial color={color} transparent={true} opacity={springProps.opacity} />
      </a.mesh>
      <a.mesh
        geometry={coneGeometry}
        position={adjustedTo}
        quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction)}
      >
        <animated.meshBasicMaterial color={color} transparent={true} opacity={springProps.opacity} />
      </a.mesh>
    </group>
  );
}

export default FatArrow;