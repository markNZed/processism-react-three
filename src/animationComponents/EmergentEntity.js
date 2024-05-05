import * as THREE from 'three'
import {FatArrow, Circle, Sphere, DynamicDoubleArrow } from './';
import React, { useEffect } from 'react';
import withAnimationAndPosition from '../withAnimationAndPosition';
import useStore from '../useStore';

const EmergentEntity = React.forwardRef(({ id, initialState, animationState, ...props }, ref) => {

  const { updateAnimationState } = useStore();

  const { radius, position, visible } = { ...initialState, ...animationState };
  
  useEffect(() => {
    // causation is not a Component but a group
    updateAnimationState(`${id}.causation`, initialState);
    updateAnimationState(`${id}.relations`, initialState);
  }, []);

  const causationAnimationState = useStore(state => state.animationStates[`${id}.causation`] || {});
  const relationsAnimationState = useStore(state => state.animationStates[`${id}.relations`] || {});

  const sphereRadius = radius / 4;
  const causationLength = radius / 2;
  const sphereOffset = radius/3;

  // Effect to update child component's animation state based on the this variant
  useEffect(() => {
    switch (animationState.variant) {
      // Add additional cases as needed
      case 'oneSphere':
        updateAnimationState(`${id}.Circle`, { visible: false });
        updateAnimationState(`${id}.causation`, { visible: false });
        updateAnimationState(`${id}.Sphere2`, { visible: false });
        updateAnimationState(`${id}.Sphere3`, { visible: false });
        updateAnimationState(`${id}.Sphere4`, { visible: false });
        updateAnimationState(`${id}.relations`, { visible: false });
        break;
      case 'twoSphere':
        updateAnimationState(`${id}.Sphere2`, { visible: true });
        break;
      case 'relation':
        updateAnimationState(`${id}.relations`, { visible: true });
        updateAnimationState(`${id}.relations.1`, { visible: true });
        updateAnimationState(`${id}.relations.2`, { visible: false });
        updateAnimationState(`${id}.relations.3`, { visible: false });
        updateAnimationState(`${id}.relations.4`, { visible: false });
        updateAnimationState(`${id}.relations.5`, { visible: false });
        updateAnimationState(`${id}.relations.6`, { visible: false });
        break;
      case 'allRelations':
        updateAnimationState(`${id}.relations.1`, { visible: true });
        updateAnimationState(`${id}.relations.2`, { visible: true });
        updateAnimationState(`${id}.relations.3`, { visible: true });
        updateAnimationState(`${id}.relations.4`, { visible: true });
        updateAnimationState(`${id}.relations.5`, { visible: true });
        updateAnimationState(`${id}.relations.6`, { visible: true });
        updateAnimationState(`${id}.Sphere1`, { visible: true });
        updateAnimationState(`${id}.Sphere2`, { visible: true });
        updateAnimationState(`${id}.Sphere3`, { visible: true });
        updateAnimationState(`${id}.Sphere4`, { visible: true });
        break;
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
    <group visible={causationAnimationState.visible}>
      <FatArrow id={`${id}.FatArrow1`} from={new THREE.Vector3(start.x - sphereOffset, start.y + sphereOffset, start.z)} to={new THREE.Vector3(end.x - sphereOffset, end.y + sphereOffset, end.z)} />
      <FatArrow id={`${id}.FatArrow2`} from={new THREE.Vector3(start.x + sphereOffset, start.y + sphereOffset, start.z)} to={new THREE.Vector3(end.x + sphereOffset, end.y + sphereOffset, end.z)} />
      <FatArrow id={`${id}.FatArrow3`} from={new THREE.Vector3(start.x - sphereOffset, start.y - sphereOffset, start.z)} to={new THREE.Vector3(end.x - sphereOffset, end.y - sphereOffset, end.z)} />
      <FatArrow id={`${id}.FatArrow4`} from={new THREE.Vector3(start.x + sphereOffset, start.y - sphereOffset, start.z)} to={new THREE.Vector3(end.x + sphereOffset, end.y - sphereOffset, end.z)} />
    </group>
  );

  return (
    <group ref={ref} position={position} visible={visible} >
      <Circle id={`${id}.Circle`} initialState={{radius: radius}} />
      <Sphere id={`${id}.Sphere1`} initialState={{position: spherePosition1, radius: sphereRadius, text: "Entity"}} />
      <Sphere id={`${id}.Sphere2`} initialState={{position: spherePosition2, radius: sphereRadius}} />
      <Sphere id={`${id}.Sphere3`} initialState={{position: spherePosition3, radius: sphereRadius}} />
      <Sphere id={`${id}.Sphere4`} initialState={{position: spherePosition4, radius: sphereRadius}} />
      <group visible={relationsAnimationState.visible}>
        <DynamicDoubleArrow id={`${id}.relations.1`} fromId={`${id}.Sphere1`} toId={`${id}.Sphere2`} margin={sphereRadius} />
        <DynamicDoubleArrow id={`${id}.relations.2`} fromId={`${id}.Sphere3`} toId={`${id}.Sphere4`} margin={sphereRadius} />
        <DynamicDoubleArrow id={`${id}.relations.3`} fromId={`${id}.Sphere1`} toId={`${id}.Sphere3`} margin={sphereRadius} />
        <DynamicDoubleArrow id={`${id}.relations.4`} fromId={`${id}.Sphere2`} toId={`${id}.Sphere4`} margin={sphereRadius} />
        <DynamicDoubleArrow id={`${id}.relations.5`} fromId={`${id}.Sphere1`} toId={`${id}.Sphere4`} margin={sphereRadius} />
        <DynamicDoubleArrow id={`${id}.relations.6`} fromId={`${id}.Sphere2`} toId={`${id}.Sphere3`} margin={sphereRadius} />
      </group>
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