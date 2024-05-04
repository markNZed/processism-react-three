import * as THREE from 'three'
import {FatArrow, Circle, Sphere, DynamicDoubleArrow } from './';
import React from 'react';
import withAnimationAndPosition from '../withAnimationAndPosition';

const EmergentEntity = React.forwardRef(({ id, initialPosition, animationState, causation, initialRadius, ...props }, ref) => {

  const sphereRadius = initialRadius / 4;
  const causationLength = initialRadius / 2;
  const sphereOffset = initialRadius/3;

  const causationArrows = (id, start, end) => (
    <>
      <FatArrow id={`${id}.FatArrow2`} from={new THREE.Vector3(start.x - sphereOffset, start.y + sphereOffset, start.z)} to={new THREE.Vector3(end.x - sphereOffset, end.y + sphereOffset, end.z)} />
      <FatArrow id={`${id}.FatArrow2`} from={new THREE.Vector3(start.x + sphereOffset, start.y + sphereOffset, start.z)} to={new THREE.Vector3(end.x + sphereOffset, end.y + sphereOffset, end.z)} />
      <FatArrow id={`${id}.FatArrow3`} from={new THREE.Vector3(start.x - sphereOffset, start.y - sphereOffset, start.z)} to={new THREE.Vector3(end.x - sphereOffset, end.y - sphereOffset, end.z)} />
      <FatArrow id={`${id}.FatArrow4`} from={new THREE.Vector3(start.x + sphereOffset, start.y - sphereOffset, start.z)} to={new THREE.Vector3(end.x + sphereOffset, end.y - sphereOffset, end.z)} />
    </>
  );

  return (
    <group ref={ref} initialPosition={initialPosition}>
      <Circle id={`${id}.Circle`} initialPosition={initialPosition} initialRadius={initialRadius} />
      <Sphere id={`${id}.Sphere1`} initialPosition={new THREE.Vector3(initialPosition.x - sphereOffset, initialPosition.y + sphereOffset, initialPosition.z - causationLength)} initialRadius={sphereRadius} />
      <Sphere id={`${id}.Sphere2`} initialPosition={new THREE.Vector3(initialPosition.x + sphereOffset, initialPosition.y + sphereOffset, initialPosition.z - causationLength)} initialRadius={sphereRadius} />
      <Sphere id={`${id}.Sphere3`} initialPosition={new THREE.Vector3(initialPosition.x - sphereOffset, initialPosition.y - sphereOffset, initialPosition.z - causationLength)} initialRadius={sphereRadius} />
      <Sphere id={`${id}.Sphere4`} initialPosition={new THREE.Vector3(initialPosition.x + sphereOffset, initialPosition.y - sphereOffset, initialPosition.z - causationLength)} initialRadius={sphereRadius} />
      <DynamicDoubleArrow id={`${id}.DynamicDoubleArrow1`} fromId={`${id}.Sphere1`} toId={`${id}.Sphere2`} margin={sphereRadius} />
      <DynamicDoubleArrow id={`${id}.DynamicDoubleArrow2`} fromId={`${id}.Sphere3`} toId={`${id}.Sphere4`} margin={sphereRadius} />
      <DynamicDoubleArrow id={`${id}.DynamicDoubleArrow3`} fromId={`${id}.Sphere1`} toId={`${id}.Sphere3`} margin={sphereRadius} />
      <DynamicDoubleArrow id={`${id}.DynamicDoubleArrow4`} fromId={`${id}.Sphere2`} toId={`${id}.Sphere4`} margin={sphereRadius} />
      <DynamicDoubleArrow id={`${id}.DynamicDoubleArrow5`} fromId={`${id}.Sphere1`} toId={`${id}.Sphere4`} margin={sphereRadius} />
      <DynamicDoubleArrow id={`${id}.DynamicDoubleArrow6`} fromId={`${id}.Sphere2`} toId={`${id}.Sphere3`} margin={sphereRadius} />
       {
        causation === "bottomup" ?
        causationArrows(`${id}.bottomup`, initialPosition, new THREE.Vector3(initialPosition.x, initialPosition.y, initialPosition.z - causationLength)) :
        causationArrows(`${id}.topdown`, new THREE.Vector3(initialPosition.x, initialPosition.y, initialPosition.z - causationLength), initialPosition)
      }
    </group>
  );
});

// Automatically wrap EmergentEntity with the HOC before export
export default withAnimationAndPosition(EmergentEntity);