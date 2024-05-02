import { useEffect, useRef, useState, useContext } from 'react'
import {  useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { DoubleSide } from 'three'
import {  a } from '@react-spring/three';
import { useSpring, animated } from '@react-spring/three';
import useStore from '../useStore';
import {FatArrow, Circle, Sphere, DynamicDoubleArrow } from './';

function EmergentEntity({ id, initialPosition, causation, ...props }) {

  const ref = useRef()
  const { positions, updatePosition } = useStore(state => ({
    positions: state.positions,
    updatePosition: state.updatePosition
  }));

  // Set initial position
  useEffect(() => {
    if (ref.current) {
        ref.current.position.copy(initialPosition|| new THREE.Vector3(0, 0, 0));
        const newPosition = initialPosition || new THREE.Vector3(0, 0, 0);
        //console.log("newPosition", newPosition)
        if (!positions[id] || !newPosition.equals(positions[id])) {
          updatePosition(id, newPosition);
        }
    }
}, [initialPosition]);

  // Update global state whenever the position changes
  useFrame(() => {
    if (ref.current && positions[id]) {
      if (!ref.current.position.equals(positions[id])) {
        updatePosition(id, ref.current.position.clone());
      }
    }
  });

  const firstSpherePosition = new THREE.Vector3(initialPosition.x - 5, initialPosition.y + 2, initialPosition.z - 2)
  const causationPosition = new THREE.Vector3(initialPosition.x - 5, initialPosition.y, initialPosition.z - 2)

  const causationArrows = (id, start, end) => (
    <>
      <FatArrow id={`${id}_causation1`} from={start} to={end} />
      <FatArrow id={`${id}_causation2`} from={new THREE.Vector3(start.x + 2, start.y, start.z)} to={new THREE.Vector3(end.x + 2, end.y, end.z)} />
      <FatArrow id={`${id}_causation3`} from={new THREE.Vector3(start.x + 2, start.y + 2, start.z)} to={new THREE.Vector3(end.x + 2, end.y + 2, end.z)} />
      <FatArrow id={`${id}_causation4`} from={new THREE.Vector3(start.x, start.y + 2, start.z)} to={new THREE.Vector3(end.x, end.y + 2, end.z)} />
    </>
  );

  return (
    <group ref={ref} initialPosition={initialPosition}>
      <Circle id={`${id}.boundary`} initialPosition={new THREE.Vector3(initialPosition.x - 4, initialPosition.y + 1, initialPosition.z)} />
      <Sphere id={`${id}.sphere1`} initialPosition={firstSpherePosition} radius={0.5}/>
      <Sphere id={`${id}.sphere2`} initialPosition={new THREE.Vector3(firstSpherePosition.x + 2, firstSpherePosition.y, firstSpherePosition.z)} radius={0.5} />
      <Sphere id={`${id}.sphere3`} initialPosition={new THREE.Vector3(firstSpherePosition.x, firstSpherePosition.y - 2, firstSpherePosition.z)} radius={0.5} />
      <Sphere id={`${id}.sphere4`} initialPosition={new THREE.Vector3(firstSpherePosition.x + 2, firstSpherePosition.y - 2, firstSpherePosition.z)} radius={0.5} />
      <DynamicDoubleArrow id={`${id}_1`} fromId={`${id}.sphere1`} toId={`${id}.sphere2`} />
      <DynamicDoubleArrow id={`${id}_2`} fromId={`${id}.sphere3`} toId={`${id}.sphere4`} />
      <DynamicDoubleArrow id={`${id}_1`} fromId={`${id}.sphere1`} toId={`${id}.sphere3`} />
      <DynamicDoubleArrow id={`${id}_2`} fromId={`${id}.sphere2`} toId={`${id}.sphere4`} />
      <DynamicDoubleArrow id={`${id}_1`} fromId={`${id}.sphere1`} toId={`${id}.sphere4`} />
      <DynamicDoubleArrow id={`${id}_2`} fromId={`${id}.sphere2`} toId={`${id}.sphere3`} />
       {
        causation === "bottomup" ?
        causationArrows(`${id}_bottomup`, causationPosition, new THREE.Vector3(causationPosition.x, causationPosition.y, causationPosition.z + 2.5)) :
        causationArrows(`${id}_bottomup`, new THREE.Vector3(causationPosition.x, causationPosition.y, causationPosition.z + 2.5), causationPosition)
      }
    </group>
  );
};

export default EmergentEntity;