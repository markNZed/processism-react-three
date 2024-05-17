import React, { useEffect, useMemo, useRef, useImperativeHandle, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import withAnimationState from '../withAnimationState';
import { Circle } from './';

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
      linearDamping={0.5}
      angularDamping={0.5}
      enabledTranslations={[true, true, false]}
    >
      <Sphere args={[radius, 8, 8]}>
        <meshStandardMaterial color={color} />
      </Sphere>
    </RigidBody>
  );
});

const EmergentEntity = React.forwardRef(({ id, initialPosition = [0, 0, 0], layer = 1, radius, entityCount, Entity, color = "blue", registerRef }, ref) => {
  const allEntityRefs = useRef(new Set());
  const entityRadius = radius / (Math.ceil(entityCount / 3) + 1);
  const entityData = useMemo(() => {
    const positions = generateEntityPositions(radius, entityCount, entityRadius);
    return { positions };
  }, [radius, entityCount]);
  const [initialImpulse, setInitialImpulse] = useState(true);
  const frameCount = useRef(0);
  function calculateMaxDisplacement(radius, layer) {
    let maxDisplacement;
    switch (layer) {
      case 1:
        maxDisplacement = radius * 0.25;
        break;
      case 2:
        maxDisplacement = radius * 0.5;
        break;
      case 3:
        maxDisplacement = radius * 1.0;
        break;
      default:
        maxDisplacement = radius; // Default to middle layer
        break;
    }
    return maxDisplacement;
  }
  const maxDisplacement = calculateMaxDisplacement(radius, layer);
  const prevGroupCenter = useRef();
  const internalRef = useRef();

  useImperativeHandle(ref, () => internalRef.current);

  const collectRef = (entityRef) => {
    if (entityRef) {
      allEntityRefs.current.add(entityRef);
      if (registerRef) {
        registerRef(entityRef);
      }
    }
  };

  const impulseScale = 0.001 / allEntityRefs.current.size / layer;
  const initialImpulseVectors = Array.from({ length: allEntityRefs.current.size }, () => new THREE.Vector3(
      (Math.random() - 0.5) * impulseScale,
      (Math.random() - 0.5) * impulseScale,
      (Math.random() - 0.5) * impulseScale
  ));

  useEffect(() => {
    console.log("entityData", id, "layer", layer, "radius", radius, "entityData", entityData, "allEntityRefs", allEntityRefs, "initialImpulseVectors", initialImpulseVectors);
  }, []);

  const calculateGroupCenter = () => {
    const groupCenter = new THREE.Vector3();
    let activeEntities = 0;
    allEntityRefs.current.forEach((entity) => {
      if (entity) {
        const pos = entity.translation(); // This assumes we are dealing with a RigidBody
        const posVector = new THREE.Vector3(pos.x, pos.y, pos.z);
        groupCenter.add(posVector);
        activeEntities++;
      }
    });
    if (activeEntities > 0) {
      groupCenter.divideScalar(activeEntities);
    }
    return groupCenter;
  };

  const applyImpulses = (groupCenter, emergentImpulse, frameCount) => {
    Array.from(allEntityRefs.current).forEach((entity, index) => {
      if (entity) {
        const pos = entity.translation(); // This assumes we are dealing with a RigidBody
        const posVector = new THREE.Vector3(pos.x, pos.y, pos.z);
        const displacement = posVector.sub(groupCenter);

        if (displacement.length() > maxDisplacement) {
          const directionToCenter = displacement.clone().negate().normalize();
          //console.log("reverse directionToCenter", id, directionToCenter)
          const impulse = directionToCenter.multiplyScalar(impulseScale * 100);
          entity.applyImpulse(impulse, true);
        } else {
          //console.log("emergentImpulse.length", id, emergentImpulse, displacement.length());
          if (layer == 2) {
            entity.applyImpulse(emergentImpulse.clone().negate().multiplyScalar(10), true);
          } else {
            entity.applyImpulse(emergentImpulse, true);
          }
        }

        if (initialImpulse && frameCount.current === 10 && layer != 1) {
          entity.applyImpulse(initialImpulseVectors[index], true);
        }
      }
    });
  };

  useFrame(() => {
    
    frameCount.current += 1;

    const groupCenter = (layer == 1) ? new THREE.Vector3(initialPosition[0], initialPosition[1], initialPosition[2]) : calculateGroupCenter();

    if (prevGroupCenter.current) {
      const displacement = groupCenter.clone().sub(prevGroupCenter.current);
      const emergentImpulseDirection = displacement.clone().normalize(); // keep moving in the direction of the impulse
      const emergentImpulse = emergentImpulseDirection.multiplyScalar(impulseScale);

      if (initialImpulse && frameCount.current === 10) {
        setInitialImpulse(false);
      }

      applyImpulses(groupCenter, emergentImpulse, frameCount);
    }

    prevGroupCenter.current = groupCenter.clone();

  });

  return (
    <group ref={internalRef} position={initialPosition}>
      {entityData.positions.map((pos, index) => (
        <Entity
          key={`${id}-${index}`}
          id={`${id}-${index}`}
          initialPosition={pos.toArray()}
          radius={entityRadius}
          color={color}
          layer={layer + 1}
          registerRef={collectRef}
        />
      ))}
      <Circle 
        id={`${id}.Circle`} 
        initialState={{ 
          radius: radius, 
          color: color,
          opacity: 0.05,
        }}  
      />
    </group>
  );
});

const EntityScope3 = React.forwardRef((props, ref) => (
  <EmergentEntity {...props} ref={ref} Entity={Particle} entityCount={20} color={getRandomColor()} />
));

const EntityScope2 = React.forwardRef((props, ref) => (
  <EmergentEntity {...props} ref={ref} Entity={EntityScope3} entityCount={10} />
));

const EntityScopes = React.forwardRef((props, ref) => (
  <EmergentEntity {...props} ref={ref} Entity={EntityScope2} entityCount={10} />
));

export default withAnimationState(EntityScopes);

const generateEntityPositions = (radius, count, sphereRadius) => {
  const positions = [];
  const gridSpacing = (radius * 2) / Math.ceil(Math.sqrt(count));
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

