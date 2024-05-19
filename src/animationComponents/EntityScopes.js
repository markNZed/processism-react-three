import React, { useEffect, useMemo, useRef, useImperativeHandle, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import RigidBody from './RigidBody';
import CustomGroup from './CustomGroup'; 
import * as THREE from 'three';
import withAnimationState from '../withAnimationState';
import { Circle } from './';
import useStore from '../useStore';

// Use velocity instead of impulse to improve perf ?
// Add a repellant force 
// Could break frame calculation into sequence e.g.
//   Calculate center
//   Calculate overshoot
//   Apply impulse to x%
// requestAnimationFrame aims to achieve a refresh rate of 60 frames per second (FPS). 
// This means that each frame has about 16.67 milliseconds (1000 ms / 60 FPS) available for all the rendering and updates to occur.

const Particle = React.forwardRef(({ id, initialPosition, radius, color }, ref) => {
  const internalRef = useRef();

  useImperativeHandle(ref, () => internalRef.current);

  useFrame(() => {
    if (internalRef.current.applyImpulses) {
      internalRef.current.applyImpulses();
    }
  });

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

const EmergentEntity = React.forwardRef(({ id, initialPosition = [0, 0, 0], scope = 1, radius, entityCount, Entity, color = "blue" }, ref) => {
  const getComponentRef = useStore((state) => state.getComponentRef);
  const entityRefs = Array.from({ length: entityCount }, () => React.createRef());
  const emergentEntityArea = areaOfCircle(radius);
  const entityRadius = radiusFromArea(emergentEntityArea / entityCount) * 0.9;
  const entityArea = radiusFromArea(emergentEntityArea / entityCount);
  const emergentEntityDensity = emergentEntityArea / entityArea;
  const entityData = useMemo(() => {
    const positions = generateEntityPositions(radius, entityCount, entityRadius);
    return { positions };
  }, [radius, entityCount]);
  const [initialImpulse, setInitialImpulse] = useState(true);
  const frameCount = useRef(0);
  const maxDisplacement = radius;
  const prevEmergentCenter = useRef();
  const internalRef = useRef();
  const zeroVector = new THREE.Vector3();

  useImperativeHandle(ref, () => internalRef.current);

  const impulseScale = 0.0001 * emergentEntityDensity;
  const initialImpulseVectors = Array.from({ length: entityRefs.length }, () => new THREE.Vector3(
          (Math.random() - 0.5) * impulseScale * 100,
          (Math.random() - 0.5) * impulseScale * 100,
          (Math.random() - 0.5) * impulseScale * 100
      ));

  useEffect(() => {
    //console.log("entityData", id, "scope", scope, "radius", radius, "entityData", entityData, "entityRefs", entityRefs, "initialImpulseVectors", initialImpulseVectors);
  }, []);

  const calculateEmergentCenter = () => {
    const emergentCenter = new THREE.Vector3();
    let activeEntities = 0;
    entityRefs.forEach((entity) => {
      if (entity.current) {
        const entityCenter = entity.current.getCenter();
        if (entityCenter) {
          emergentCenter.add(entityCenter);
          activeEntities++;
        }
      }
    });
    if (activeEntities > 0) {
      emergentCenter.divideScalar(activeEntities);
    }
    return emergentCenter;
  };

  const addImpulses = (emergentCenter, emergentImpulse) => {
    entityRefs.forEach((entity) => {
      if (entity.current) {
        const entityCenter = entity.current.getCenter();
        if (entityCenter) {
          const displacement = entityCenter.sub(emergentCenter);

          if (displacement.length() > maxDisplacement) {
            const overshoot = displacement.length() - maxDisplacement;
            const directionToCenter = displacement.negate().normalize();
            directionToCenter.multiplyScalar(impulseScale * overshoot * 5);
            entity.current.addImpulse(directionToCenter);
          } else {
            entity.current.addImpulse(emergentImpulse);
          }
        }
      }
    });
  };

  useFrame(() => {
    
    frameCount.current += 1;

    //if (frameCount.current % 10 !== 0) return // every X frames

    const emergentCenter = (scope == 1) ? new THREE.Vector3(initialPosition[0], initialPosition[1], initialPosition[2]) : calculateEmergentCenter();
    internalRef.current.setCenter(emergentCenter);

    if (prevEmergentCenter.current) {
      const displacement = emergentCenter.clone().sub(prevEmergentCenter.current);
      const emergentImpulseDirection = displacement.normalize(); // keep moving in the direction of the impulse
      const emergentImpulse = emergentImpulseDirection.multiplyScalar(impulseScale);

      if (initialImpulse && scope != 1 && frameCount.current > 10) {
        setInitialImpulse(false);
        entityRefs.forEach((entity, index) => {
          if (entity.current) {
            // Add an impulse that is unique to each entity
            entity.current.addImpulse(initialImpulseVectors[index]);
          }
        });
      }

      addImpulses(emergentCenter, emergentImpulse);

      entityRefs.forEach((entity, index) => {
        if (entity.current) {
          entity.current.addImpulse(internalRef.current.getImpulse());
        } else {
          console.log("No entity", id, index);
        }
      })
      
      internalRef.current.setImpulse(zeroVector);

    }

    prevEmergentCenter.current = emergentCenter.clone();

    const circleCenterRef = getComponentRef(`${id}.CircleCenter`);
    if (circleCenterRef && circleCenterRef.current && internalRef.current) {
      // Convert the emergentCenter to the local space of the CustomGroup
      const localCenter = internalRef.current.worldToLocal(emergentCenter.clone());
      circleCenterRef.current.position.copy(localCenter);
    }

  });

  const showScopes = false;

  return (
    <CustomGroup ref={internalRef} position={initialPosition}>
      {entityData.positions.map((pos, index) => (
        <Entity
          key={`${id}-${index}`}
          id={`${id}-${index}`}
          initialPosition={pos.toArray()}
          radius={entityRadius}
          color={color}
          scope={scope + 1}
          ref={entityRefs[index]}
        />
      ))}
      {showScopes && (
        <>
          <Circle 
            id={`${id}.Circle`} 
            initialState={{ 
              radius: radius, 
              color: color,
              opacity: 0.05,
            }}  
          />
          <Circle 
            id={`${id}.CircleCenter`} 
            initialState={{ 
              radius: radius, 
              color: color,
              opacity: 0.5,
            }}  
          />
        </>
      )}
    </CustomGroup>
  );
});

const EntityScope3 = React.forwardRef((props, ref) => (
  <EmergentEntity id={"Scope3"} {...props} ref={ref} Entity={Particle} entityCount={21} color={getRandomColor()} />
));

const EntityScope2 = React.forwardRef((props, ref) => (
  <EmergentEntity id={"Scope2"} {...props} ref={ref} Entity={EntityScope3} entityCount={9} color={getRandomColor()} />
));

const EntityScopes = React.forwardRef((props, ref) => (
  <EmergentEntity id={"Scope1"} {...props} ref={ref} Entity={EntityScope2} entityCount={9} />
));

export default withAnimationState(EntityScopes);

const generateEntityPositions = (radius, count, sphereRadius) => {
  const positions = [];
  const gridSpacing = sphereRadius * 2;
  const tempPositions = [];
  const packingRadius = radius * 1.2;
  for (let y = -packingRadius; y <= packingRadius; y += gridSpacing) {
    for (let x = -packingRadius; x <= packingRadius; x += gridSpacing) {
      const distanceFromCenter = Math.sqrt(x * x + y * y);
      //if (distanceFromCenter + sphereRadius <= radius) {
        tempPositions.push({ position: new THREE.Vector3(x, y, 0), distance: distanceFromCenter });
      //}
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

const radiusFromArea = (area) => {
  if (area <= 0) {
    return "Area must be a positive number.";
  }
  return Math.sqrt(area / Math.PI);
};

const areaOfCircle = (radius) => {
  if (radius <= 0) {
    return "Radius must be a positive number.";
  }
  return Math.PI * Math.pow(radius, 2);
};