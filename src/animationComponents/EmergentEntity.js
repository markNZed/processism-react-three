import * as THREE from 'three'
import {FatArrow, Circle, Sphere, DynamicDoubleArrow } from './';
import React, { useEffect } from 'react';
import withAnimationAndPosition from '../withAnimationAndPosition';
import useStore from '../useStore';

const EmergentEntity = React.forwardRef(({ id, initialState, animationState, causation, ...props }, ref) => {

  const { updateAnimationState } = useStore();

  const { radius, position } = { ...initialState, ...animationState };

  const sphereRadius = radius / 4;
  const causationLength = radius / 2;
  const sphereOffset = radius/3;

  // Effect to update child component's animation state based on the parent's variant
  useEffect(() => {
    switch (animationState.variant) {
      // Add additional cases as needed
      case 'oneSphere':
        updateAnimationState(`${id}.Circle`, { visible: false });
        updateAnimationState(`${id}.causation.FatArrow1`, { visible: false });
        updateAnimationState(`${id}.causation.FatArrow2`, { visible: false });
        updateAnimationState(`${id}.causation.FatArrow3`, { visible: false });
        updateAnimationState(`${id}.causation.FatArrow4`, { visible: false });
        updateAnimationState(`${id}.Sphere2`, { visible: false });
        updateAnimationState(`${id}.Sphere3`, { visible: false });
        updateAnimationState(`${id}.Sphere4`, { visible: false });
        updateAnimationState(`${id}.DynamicDoubleArrow1`, { variant: "hidden" });
        updateAnimationState(`${id}.DynamicDoubleArrow2`, { visible: false });
        updateAnimationState(`${id}.DynamicDoubleArrow3`, { visible: false });
        updateAnimationState(`${id}.DynamicDoubleArrow4`, { visible: false });
        updateAnimationState(`${id}.DynamicDoubleArrow5`, { visible: false });
        updateAnimationState(`${id}.DynamicDoubleArrow6`, { visible: false });
        break;
      default:
        break;
    }
  }, [animationState.variant, updateAnimationState, id]);
  
  // Define animation variants
  const variants = {
    hidden: { opacity: 0 },
    visible: { opacity: animationState.opacity ?? 1.0 },
    oneSphere : {},
  };

  const spherePosition1 = new THREE.Vector3(
    position.x - sphereOffset, 
    position.y + sphereOffset, 
    position.z - causationLength
  );
  const spherePosition2 = new THREE.Vector3(
    position.x + sphereOffset, 
    position.y + sphereOffset, 
    position.z - causationLength
  );
  const spherePosition3 = new THREE.Vector3(
    position.x - sphereOffset, 
    position.y - sphereOffset, 
    position.z - causationLength
  );
  const spherePosition4 = new THREE.Vector3(
    position.x + sphereOffset, 
    position.y - sphereOffset, 
    position.z - causationLength
  );

  const causationArrows = (id, start, end) => (
    <>
      <FatArrow id={`${id}.FatArrow1`} from={new THREE.Vector3(start.x - sphereOffset, start.y + sphereOffset, start.z)} to={new THREE.Vector3(end.x - sphereOffset, end.y + sphereOffset, end.z)} />
      <FatArrow id={`${id}.FatArrow2`} from={new THREE.Vector3(start.x + sphereOffset, start.y + sphereOffset, start.z)} to={new THREE.Vector3(end.x + sphereOffset, end.y + sphereOffset, end.z)} />
      <FatArrow id={`${id}.FatArrow3`} from={new THREE.Vector3(start.x - sphereOffset, start.y - sphereOffset, start.z)} to={new THREE.Vector3(end.x - sphereOffset, end.y - sphereOffset, end.z)} />
      <FatArrow id={`${id}.FatArrow4`} from={new THREE.Vector3(start.x + sphereOffset, start.y - sphereOffset, start.z)} to={new THREE.Vector3(end.x + sphereOffset, end.y - sphereOffset, end.z)} />
    </>
  );

  return (
    <group ref={ref} position={position}>
      <Circle id={`${id}.Circle`} initialState={{position: position, radius: radius}} />
      <Sphere id={`${id}.Sphere1`} initialState={{position: spherePosition1, radius: sphereRadius, text: "Entity"}} />
      <Sphere id={`${id}.Sphere2`} initialState={{position: spherePosition2, radius: sphereRadius}} />
      <Sphere id={`${id}.Sphere3`} initialState={{position: spherePosition3, radius: sphereRadius}} />
      <Sphere id={`${id}.Sphere4`} initialState={{position: spherePosition4, radius: sphereRadius}} />
      <DynamicDoubleArrow id={`${id}.DynamicDoubleArrow1`} fromId={`${id}.Sphere1`} toId={`${id}.Sphere2`} margin={sphereRadius} />
      <DynamicDoubleArrow id={`${id}.DynamicDoubleArrow2`} fromId={`${id}.Sphere3`} toId={`${id}.Sphere4`} margin={sphereRadius} />
      <DynamicDoubleArrow id={`${id}.DynamicDoubleArrow3`} fromId={`${id}.Sphere1`} toId={`${id}.Sphere3`} margin={sphereRadius} />
      <DynamicDoubleArrow id={`${id}.DynamicDoubleArrow4`} fromId={`${id}.Sphere2`} toId={`${id}.Sphere4`} margin={sphereRadius} />
      <DynamicDoubleArrow id={`${id}.DynamicDoubleArrow5`} fromId={`${id}.Sphere1`} toId={`${id}.Sphere4`} margin={sphereRadius} />
      <DynamicDoubleArrow id={`${id}.DynamicDoubleArrow6`} fromId={`${id}.Sphere2`} toId={`${id}.Sphere3`} margin={sphereRadius} />
       {
        causation === "bottomup" ?
        causationArrows(`${id}.causation`, position, new THREE.Vector3(position.x, position.y, position.z - causationLength)) :
        causationArrows(`${id}.causation`, new THREE.Vector3(position.x, position.y, position.z - causationLength), position)
      }
    </group>
  );
});

// Automatically wrap EmergentEntity with the HOC before export
export default withAnimationAndPosition(EmergentEntity);