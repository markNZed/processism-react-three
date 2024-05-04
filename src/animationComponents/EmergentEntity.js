import * as THREE from 'three'
import {FatArrow, Circle, Sphere, DynamicDoubleArrow } from './';
import React from 'react';
import withAnimationAndPosition from '../withAnimationAndPosition';

const EmergentEntity = React.forwardRef(({ id, initialPosition, animationState, causation, ...props }, ref) => {

  const firstSpherePosition = new THREE.Vector3(initialPosition.x - 1, initialPosition.y + 1, initialPosition.z - 2)
  const causationPosition = new THREE.Vector3(initialPosition.x - 1, initialPosition.y - 1, initialPosition.z - 2)

  const causationArrows = (id, start, end) => (
    <>
      <FatArrow id={`${id}.FatArrow1`} from={start} to={end} />
      <FatArrow id={`${id}.FatArrow2`} from={new THREE.Vector3(start.x + 2, start.y, start.z)} to={new THREE.Vector3(end.x + 2, end.y, end.z)} />
      <FatArrow id={`${id}.FatArrow3`} from={new THREE.Vector3(start.x + 2, start.y + 2, start.z)} to={new THREE.Vector3(end.x + 2, end.y + 2, end.z)} />
      <FatArrow id={`${id}.FatArrow4`} from={new THREE.Vector3(start.x, start.y + 2, start.z)} to={new THREE.Vector3(end.x, end.y + 2, end.z)} />
    </>
  );

  return (
    <group ref={ref} initialPosition={initialPosition}>
      <Circle id={`${id}.Circle`} initialPosition={initialPosition} />
      <Sphere id={`${id}.Sphere1`} initialPosition={firstSpherePosition} radius={0.5}/>
      <Sphere id={`${id}.Sphere2`} initialPosition={new THREE.Vector3(firstSpherePosition.x + 2, firstSpherePosition.y, firstSpherePosition.z)} radius={0.5} />
      <Sphere id={`${id}.Sphere3`} initialPosition={new THREE.Vector3(firstSpherePosition.x, firstSpherePosition.y - 2, firstSpherePosition.z)} radius={0.5} />
      <Sphere id={`${id}.Sphere4`} initialPosition={new THREE.Vector3(firstSpherePosition.x + 2, firstSpherePosition.y - 2, firstSpherePosition.z)} radius={0.5} />
      <DynamicDoubleArrow id={`${id}.DynamicDoubleArrow1`} fromId={`${id}.Sphere1`} toId={`${id}.Sphere2`} />
      <DynamicDoubleArrow id={`${id}.DynamicDoubleArrow2`} fromId={`${id}.Sphere3`} toId={`${id}.Sphere4`} />
      <DynamicDoubleArrow id={`${id}.DynamicDoubleArrow3`} fromId={`${id}.Sphere1`} toId={`${id}.Sphere3`} />
      <DynamicDoubleArrow id={`${id}.DynamicDoubleArrow4`} fromId={`${id}.Sphere2`} toId={`${id}.Sphere4`} />
      <DynamicDoubleArrow id={`${id}.DynamicDoubleArrow5`} fromId={`${id}.Sphere1`} toId={`${id}.Sphere4`} />
      <DynamicDoubleArrow id={`${id}.DynamicDoubleArrow6`} fromId={`${id}.Sphere2`} toId={`${id}.Sphere3`} />
       {
        causation === "bottomup" ?
        causationArrows(`${id}.bottomup`, causationPosition, new THREE.Vector3(causationPosition.x, causationPosition.y, causationPosition.z + 2.5)) :
        causationArrows(`${id}.topdown`, new THREE.Vector3(causationPosition.x, causationPosition.y, causationPosition.z + 2.5), causationPosition)
      }
    </group>
  );
});

// Automatically wrap EmergentEntity with the HOC before export
export default withAnimationAndPosition(EmergentEntity);