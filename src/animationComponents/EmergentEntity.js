import * as THREE from 'three'
import {FatArrow, Circle, Sphere, DynamicDoubleArrow } from './';
import React, { useEffect } from 'react';
import withAnimationAndPosition from '../withAnimationAndPosition';
import useStore from '../useStore';

const EmergentEntity = React.forwardRef(({ id, initialState, animationState, ...props }, ref) => {

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
        const updates = {};
        const defaultInvisibleIds = [
            `${id}.Circle`,
            `${id}.causation.FatArrow1`,
            `${id}.causation.FatArrow2`,
            `${id}.causation.FatArrow3`,
            `${id}.causation.FatArrow4`,
            `${id}.Sphere2`,
            `${id}.Sphere3`,
            `${id}.Sphere4`,
            `${id}.DynamicDoubleArrow2`,
            `${id}.DynamicDoubleArrow3`,
            `${id}.DynamicDoubleArrow4`,
            `${id}.DynamicDoubleArrow5`,
            `${id}.DynamicDoubleArrow6`
        ];

        // Set the default visible: false
        defaultInvisibleIds.forEach(id => {
            updates[id] = { visible: false };
        });

        // Handle special cases
        updates[`${id}.DynamicDoubleArrow1`] = { variant: "hidden" };

        // Perform batch update
        useStore.getState().batchUpdateAnimationStates(updates);
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
    - sphereOffset, 
    + sphereOffset, 
    - causationLength
  );
  const spherePosition2 = new THREE.Vector3(
    + sphereOffset, 
    + sphereOffset, 
    - causationLength
  );
  const spherePosition3 = new THREE.Vector3(
    - sphereOffset, 
    - sphereOffset, 
    - causationLength
  );
  const spherePosition4 = new THREE.Vector3(
    + sphereOffset, 
    - sphereOffset, 
    - causationLength
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
    <group ref={ref} position={position} >
      <Circle id={`${id}.Circle`} initialState={{radius: radius}} />
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
        initialState.causation === "bottomup" ?
        causationArrows(`${id}.causation`, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -causationLength)) :
        causationArrows(`${id}.causation`, new THREE.Vector3(0, 0, -causationLength), new THREE.Vector3(0, 0, 0))
      }
    </group>
  );
});

// Automatically wrap EmergentEntity with the HOC before export
export default withAnimationAndPosition(EmergentEntity);