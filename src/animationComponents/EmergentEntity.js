import React, { useEffect } from 'react';
import * as THREE from 'three';
import useStore from '../useStore';
import withAnimationState from '../withAnimationState';
import { Circle, CustomText, DynamicDoubleArrow, FatArrow, Sphere } from './';

const EmergentEntity = React.forwardRef(({ id, animationState, ...props }, ref) => {

  const { updateAnimationState, batchUpdateAnimationStates } = useStore();

  const { radius, position, visible } = animationState;

  useEffect(() => {
    // causation is not a Component but a group
    updateAnimationState(`${id}.causation`, animationState);
    updateAnimationState(`${id}.relations`, animationState);
  }, []);

  const causationAnimationState = useStore(state => state.animationStates[`${id}.causation`] || {});
  const relationsAnimationState = useStore(state => state.animationStates[`${id}.relations`] || {});

  const sphereRadius = radius / 4;
  const causationLength = radius / 2;
  const sphereOffset = radius / 3;

  // Effect to update child component's animation state based on the this variant
  useEffect(() => {
    switch (animationState.variant) {
      case 'oneSphere':
        batchUpdateAnimationStates({
          [`${id}.Circle`]: { visible: false },
          [`${id}.causation`]: { visible: false },
          [`${id}.Sphere2`]: { visible: false },
          [`${id}.Sphere3`]: { visible: false },
          [`${id}.Sphere4`]: { visible: false },
          [`${id}.relations`]: { visible: false },
          [`${id}.text`]: { visible: false },
        });
        break;
      case 'oneSphere-details':
        batchUpdateAnimationStates({
          [`${id}.Sphere1.text`]: { variant: 'visible', duration: .5 },
        });
        break;
      case 'twoSphere':
        batchUpdateAnimationStates({
          [`${id}.Sphere2`]: { visible: true },
          [`${id}.Sphere1.text`]: { variant: 'hidden', duration: .5 },
        });
        break;

      case 'relation':
        batchUpdateAnimationStates({
          [`${id}.relations`]: { visible: true },
          [`${id}.relations1`]: { visible: true },
          [`${id}.relations2`]: { visible: false },
          [`${id}.relations3`]: { visible: false },
          [`${id}.relations4`]: { visible: false },
          [`${id}.relations5`]: { visible: false },
          [`${id}.relations6`]: { visible: false },
        });
        break;
      case 'allRelations':
        batchUpdateAnimationStates({
          [`${id}.relations1`]: { visible: true },
          [`${id}.relations2`]: { visible: true },
          [`${id}.relations3`]: { visible: true },
          [`${id}.relations4`]: { visible: true },
          [`${id}.relations5`]: { visible: true },
          [`${id}.relations6`]: { visible: true },
          [`${id}.Sphere1`]: { visible: true },
          [`${id}.Sphere2`]: { visible: true },
          [`${id}.Sphere3`]: { visible: true },
          [`${id}.Sphere4`]: { visible: true },
        });
      case 'accumulation-description':
        batchUpdateAnimationStates({
          [`${id}.text2`]: { visible: true },
        });
        break;
      case 'accumulation-description-end':
        batchUpdateAnimationStates({
          [`${id}.text2`]: { visible: false },
        });
        break;
      default:
        // Handle default case if needed
        break;
    }
  }, [animationState.variant, batchUpdateAnimationStates, id]);

  // Define animation variants
  const variants = {
    hidden: { opacity: 0 },
    visible: { opacity: animationState.opacity ?? 1.0 },
  };

  const spherePosition1 = new THREE.Vector3(-sphereOffset, +sphereOffset, -causationLength);
  const spherePosition2 = new THREE.Vector3(+sphereOffset, +sphereOffset, -causationLength);
  const spherePosition3 = new THREE.Vector3(-sphereOffset, -sphereOffset, -causationLength);
  const spherePosition4 = new THREE.Vector3(+sphereOffset, -sphereOffset, -causationLength);

  const fatArrowVarient = causationAnimationState.visible ? 'visible' : 'hidden';
  const causationArrows = (id, start, end) => (
    <group visible={causationAnimationState.visible}>
      <FatArrow id={`${id}.FatArrow1`} initialState={{ variant: fatArrowVarient, duration: 1, from: new THREE.Vector3(start.x - sphereOffset, start.y + sphereOffset, start.z), to: new THREE.Vector3(end.x - sphereOffset, end.y + sphereOffset, end.z) }} />
      <FatArrow id={`${id}.FatArrow2`} initialState={{ variant: fatArrowVarient, duration: 1, from: new THREE.Vector3(start.x + sphereOffset, start.y + sphereOffset, start.z), to: new THREE.Vector3(end.x + sphereOffset, end.y + sphereOffset, end.z) }} />
      <FatArrow id={`${id}.FatArrow3`} initialState={{ variant: fatArrowVarient, duration: 1, from: new THREE.Vector3(start.x - sphereOffset, start.y - sphereOffset, start.z), to: new THREE.Vector3(end.x - sphereOffset, end.y - sphereOffset, end.z) }} />
      <FatArrow id={`${id}.FatArrow4`} initialState={{ variant: fatArrowVarient, duration: 1, from: new THREE.Vector3(start.x + sphereOffset, start.y - sphereOffset, start.z), to: new THREE.Vector3(end.x + sphereOffset, end.y - sphereOffset, end.z) }} />
    </group>
  );

  // Calculate text position based on initialState position and any offset
  const textPosition = new THREE.Vector3(0, radius * 1.2, 0);
  const text2Position = new THREE.Vector3(0, radius * .75, 0);

  return (
    // We set a mesh for this object so we can get a ref for DynamicDoubleArrow above this component
    <group ref={ref} position={position} visible={visible} userData={{ meshId: `${id}.Circle` }} >
      <CustomText 
        id={`${id}.text`} 
        initialState={{
          visible: false,
          position: textPosition,
          text: animationState.text,
          scale: 0.5
        }}
      />
      <CustomText
        id={`${id}.text2`}
        initialState={{
          visible: false,
          position: text2Position,
          text: animationState.text2,
          scale: 0.3
        }}
      />
      <Circle id={`${id}.Circle`} initialState={{radius: radius}} />
      <Sphere id={`${id}.Sphere1`} initialState={{position: spherePosition1, radius: sphereRadius}} />
      <Sphere id={`${id}.Sphere2`} initialState={{position: spherePosition2, radius: sphereRadius}} />
      <Sphere id={`${id}.Sphere3`} initialState={{position: spherePosition3, radius: sphereRadius}} />
      <Sphere id={`${id}.Sphere4`} initialState={{position: spherePosition4, radius: sphereRadius}} />
      <group visible={relationsAnimationState.visible}>
        <DynamicDoubleArrow id={`${id}.relations1`} initialState={{fromId: `${id}.Sphere1`, toId: `${id}.Sphere2`}} />
        <DynamicDoubleArrow id={`${id}.relations2`} initialState={{fromId: `${id}.Sphere3`, toId: `${id}.Sphere4`}} />
        <DynamicDoubleArrow id={`${id}.relations3`} initialState={{fromId: `${id}.Sphere1`, toId: `${id}.Sphere3`}} />
        <DynamicDoubleArrow id={`${id}.relations4`} initialState={{fromId: `${id}.Sphere2`, toId: `${id}.Sphere4`}} />
        <DynamicDoubleArrow id={`${id}.relations5`} initialState={{fromId: `${id}.Sphere1`, toId: `${id}.Sphere4`}} />
        <DynamicDoubleArrow id={`${id}.relations6`} initialState={{fromId: `${id}.Sphere2`, toId: `${id}.Sphere3`}} />
      </group>
      {
        animationState.causation === "bottomup" ?
        causationArrows(`${id}.causation`, new THREE.Vector3(0, 0, -(causationLength - sphereRadius)), new THREE.Vector3(0, 0, -causationLength * 0.05)) : causationArrows(`${id}.causation`, new THREE.Vector3(0, 0, -causationLength * 0.05), new THREE.Vector3(0, 0, -(causationLength - sphereRadius)))
      }
    </group>
  );
});

// Automatically wrap EmergentEntity with the HOC before export
export default withAnimationState(EmergentEntity);