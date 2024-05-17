import React, { useEffect, useMemo, useRef, useImperativeHandle, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import withAnimationState from '../withAnimationState';

const Particle = React.forwardRef(({ id, initialPosition, radius, color, registerRef }, ref) => {
  const internalRef = useRef();

  useImperativeHandle(ref, () => internalRef.current);

  useEffect(() => {
    registerRef(internalRef.current);
  }, [registerRef]);

  return (
    <RigidBody
      ref={internalRef}
      position={initialPosition}
      type="dynamic"
      colliders="ball"
      linearDamping={0.8}
      angularDamping={0.8}
      enabledTranslations={[true, true, false]}
    >
      <Sphere args={[radius, 8, 8]}>
        <meshStandardMaterial color={color} />
      </Sphere>
    </RigidBody>
  );
});

const EmergentEntity = React.forwardRef(({ id, initialPosition = [0, 0, 0], layer, radius = 10, entityCount, Entity, color = "blue", emergentImpulseMagnitude = 0.01, registerRef }, ref) => {
  const allEntityRefs = useRef(new Set());
  const entityData = useMemo(() => {
    const positions = generateEntityPositions(radius, entityCount, radius / (entityCount + 1));
    return { positions };
  }, [radius, entityCount]);
  const [initialImpulse, setInitialImpulse] = useState(true);
  const frameCount = useRef(0);
  const maxDisplacement = radius * 1.5;

  const collectRef = (entityRef) => {
    if (entityRef) {
      allEntityRefs.current.add(entityRef);
      if (registerRef) {
        registerRef(entityRef);
      }
    }
  };

  const impulseScale = 0.001 / allEntityRefs.current.size;
  const initialImpulseVectors = Array.from({ length: allEntityRefs.current.size }, () => new THREE.Vector3(
      (Math.random() - 0.5) * impulseScale,
      (Math.random() - 0.5) * impulseScale,
      (Math.random() - 0.5) * impulseScale
  ));

  useEffect(() => {
    console.log("entityData", id, "layer", layer, entityData, allEntityRefs, initialImpulseVectors);
  }, []);

  useFrame(() => {
    frameCount.current += 1;

    const groupCenter = new THREE.Vector3();
    let activeEntities = 0;

    Array.from(allEntityRefs.current).forEach((entity) => {
      if (entity) {
        const pos = entity.translation ? entity.translation() : entity.position;
        groupCenter.add(new THREE.Vector3(pos.x, pos.y, pos.z));
        activeEntities++;
      }
    });

    if (activeEntities > 0) {
      groupCenter.divideScalar(activeEntities);
    }

    const displacement = groupCenter.clone().sub(new THREE.Vector3(...initialPosition));
    if (displacement.length() > maxDisplacement) {
      displacement.setLength(maxDisplacement);
      groupCenter.copy(new THREE.Vector3(...initialPosition).add(displacement));
    }

    const emergentImpulseDirection = displacement.clone().normalize();
    const emergentImpulse = emergentImpulseDirection.multiplyScalar(emergentImpulseMagnitude * impulseScale);

    if (initialImpulse && frameCount.current === 10) {
      setInitialImpulse(false);
    }

    Array.from(allEntityRefs.current).forEach((entity, index) => {
      if (entity) {
        const pos = entity.translation ? entity.translation() : entity.position;
        const posVector = new THREE.Vector3(pos.x, pos.y, pos.z);
        const localPos = posVector.clone().sub(groupCenter);

        let impulseMultiplier = radius * radius * 0.001;

        if (localPos.length() > radius) {
          const directionToCenter = groupCenter.clone().sub(posVector).normalize();
          const impulse = directionToCenter.multiplyScalar(impulseMultiplier * 2);
          entity.applyImpulse(impulse, true);
        }

        entity.applyImpulse(emergentImpulse, true);

        if (initialImpulse && frameCount.current === 10) {
          //console.log("applyImpulse initialImpulseVectors", id, "index", index);
          entity.applyImpulse(initialImpulseVectors[index], true);
        }
      }
    });
  });

  return (
    <group ref={ref} position={initialPosition}>
      {entityData.positions.map((pos, index) => (
        <Entity
          key={`${id}-${index}`}
          id={`${id}-${index}`}
          initialPosition={pos.toArray()}
          radius={radius / (entityCount + 1)}
          color={color}
          layer={layer + 1}
          registerRef={collectRef}
        />
      ))}
    </group>
  );
});

const EntityScope3 = React.forwardRef((props, ref) => (
  <EmergentEntity {...props} ref={ref} Entity={Particle} entityCount={10} color={getRandomColor()} />
));

const EntityScope2 = React.forwardRef((props, ref) => (
  <EmergentEntity {...props} ref={ref} Entity={EntityScope3} entityCount={5} />
));

const EntityScopes = React.forwardRef((props, ref) => (
  <EmergentEntity layer={1} {...props} ref={ref} Entity={EntityScope2} entityCount={4} />
));

export default withAnimationState(EntityScopes);

const generateEntityPositions = (radius, count, sphereRadius) => {
  const positions = [];
  const diameter = radius * 2;
  const gridSpacing = radius / Math.ceil(Math.sqrt(count));
  const tempPositions = [];

  for (let y = -radius; y <= radius; y += gridSpacing) {
    for (let x = -radius; x <= radius; x += gridSpacing) {
      const distanceFromCenter = Math.sqrt(x * x + y * y);
      if (distanceFromCenter + sphereRadius <= radius) {
        tempPositions.push({ position: new THREE.Vector3(x, y, 0), distance: distanceFromCenter });
      }
    }
  }

  tempPositions.sort((a, b) => a.distance - b.distance);

  for (let i = 0; i < Math.min(count, tempPositions.length); i++) {
    positions.push(tempPositions[i].position);
  }

  return positions;
};

const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};
