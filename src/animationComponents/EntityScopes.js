import React, { useEffect, useMemo, useRef, useImperativeHandle, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Circle as CircleDrei, Text } from '@react-three/drei';
import RigidBody from './RigidBody';
import CustomGroup from './CustomGroup'; 
import * as THREE from 'three';
import withAnimationState from '../withAnimationState';
import { Circle } from './';
import useStore from '../useStore';
import { useSphericalJoint } from '@react-three/rapier';

// Add a repellant force 
// requestAnimationFrame aims to achieve a refresh rate of 60 frames per second (FPS). 
// This means that each frame has about 16.67 milliseconds for all the rendering and updates to occur.

// Use https://github.com/pmndrs/react-three-rapier/tree/main/packages/react-three-rapier-addons#attractors
// Use https://github.com/pmndrs/react-three-rapier?tab=readme-ov-file#instanced-meshes

// Maybe pass all the refs up and then from top level instantiate Particles and Joints
// Pass all the Joints up
// Create all Joints from top - or maybe at the emergent level (it should have access to all the Particles)

const zeroVector = new THREE.Vector3();

const RopeJoint = ({ a, b, ax, ay, az, bx, by, bz }) => {
  const scale = 1;
  //const scale = 1 + Math.random();
  useSphericalJoint(a, b, [
    [ax * scale, ay * scale, az * scale],
    [bx * scale, by * scale, bz * scale]
  ])
  return null
}

const Particle = React.forwardRef(({ id, index, jointPosition, initialPosition, radius, color, registerParticlesFn }, ref) => {
  
  const internalRef = useRef();
  const jointRadius = radius/10;

  useImperativeHandle(ref, () => internalRef.current);

  useFrame(() => {
    if (internalRef.current.applyImpulses) {
      internalRef.current.applyImpulses();
    }
  });

  useEffect(() => {
    if (registerParticlesFn && internalRef.current) {
      //console.log("registerParticlesFn", id, internalRef)
      registerParticlesFn(index, [internalRef.current]);
    }
  }, [registerParticlesFn, internalRef]);

  const showScopes = false;

  return (
    <>
    <RigidBody
      ref={internalRef}
      position={initialPosition}
      type="dynamic"
      colliders="ball"
      linearDamping={0.5}
      angularDamping={0.5}
      enabledTranslations={[true, true, false]}
      enabledRotations={[false, false, true]}
    >
      <CircleDrei args={[radius, 16]}>
        <meshStandardMaterial color={color} />
      </CircleDrei>
    </RigidBody>
    {showScopes && (
      <>
        <Text
          position={[initialPosition[0], initialPosition[1], 0.1]} // Slightly offset in the z-axis to avoid z-fighting
          fontSize={radius / 2}
          color="black"
          anchorX="center"
          anchorY="middle"
        >
          {index}
        </Text>
        <CircleDrei 
          args={[jointRadius, 16]} 
          position={[initialPosition[0] + jointPosition.ax, initialPosition[1] + jointPosition.ay, 0.2]}
        >
        </CircleDrei>  
      </>
    )}
  </>
  );
});

Particle.displayName = 'Particle'; // the name property won't give the component's name since it uses forwardRef

const EmergentEntity = React.forwardRef(({ id, index, initialPosition = [0, 0, 0], scope = 1, radius, entityCount, Entity, color = "blue", registerParticlesFn }, ref) => {
  const getComponentRef = useStore((state) => state.getComponentRef);
  const entityRefs = Array.from({ length: entityCount }, () => useRef());
  const particleRefs = useRef([]);
  const emergentEntityArea = areaOfCircle(radius);
  const entityRadius = (radius * Math.PI / (entityCount + Math.PI)) * 0.95;
  const entityArea = areaOfCircle(entityRadius);
  const emergentEntityDensity = emergentEntityArea / (entityArea * entityCount)
  const entityPositions = useMemo(() => {
    return generateEntityPositions(radius - entityRadius, entityCount, entityRadius);
  }, [radius, entityRadius, entityCount]);
  const jointPositions = useMemo(() => {
    return generateJointPositions(entityPositions, entityRadius);
  }, [radius, entityCount]);
  const [initialImpulse, setInitialImpulse] = useState(true);
  const frameCount = useRef(0);
  const applyImpulseCount = useRef(0);
  const maxDisplacement = radius;
  const centerRef = new THREE.Vector3();
  const prevEmergentCenter = useRef();
  const internalRef = useRef();
  const frameState = useRef("init");
  const initialPositionVector = new THREE.Vector3(initialPosition[0], initialPosition[1], initialPosition[2]);
  const impulseRef = useRef();
  const [addJoints, setAddJoints] = useState(false);
  const jointRadius = radius / 10;
  const entitiesRegisteredRef = useRef(false);
  const entityParticlesRegisteredRef = useRef(Array.from({ length: entityCount }, () => false));

  useImperativeHandle(ref, () => internalRef.current);

  const areAllParticlesRegistered = () => {
    return entityParticlesRegisteredRef.current.every(ref => ref === true);
  };

  const localRegisterParticlesFn = (indexToRegister, particleRefsToRegister) => {
    //console.log("localRegisterParticlesFn", id, indexToRegister, particleRefsToRegister)
    particleRefs.current = [...particleRefs.current, ...particleRefsToRegister];
    entityParticlesRegisteredRef.current[indexToRegister] = true;
    if (areAllParticlesRegistered() && !entitiesRegisteredRef.current) {
      entitiesRegisteredRef.current = true;
      if (registerParticlesFn) {
        registerParticlesFn(index, particleRefs.current);
      }
      if (scope == 1) {
        console.log("All particles registered", id, particleRefs.current.length, entityParticlesRegisteredRef.current);
      }
    }
  };

  const impulseScale = entityArea * 0.01;
  const initialImpulseVectors = Array.from({ length: entityCount }, () => new THREE.Vector3(
    (Math.random() - 0.5) * impulseScale * 2,
    (Math.random() - 0.5) * impulseScale * 2,
    0
  ));

  useEffect(() => {
    //console.log("entityPositions", id, "scope", scope, "radius", radius, "entityPositions", entityPositions, "entityRefs", entityRefs, "initialImpulseVectors", initialImpulseVectors);
    //if (scope == 3) console.log("entityRefs[1] entityRefs[0]", entityRefs[1], entityRefs[0]);
    //console.log("jointPositions", jointPositions);
  }, [entityRefs]); // Will only update during  arender not when ref changes
// 

  // Will need absolute positions
  // Then find closest particles and creatr joints at scope 3
  const allocateJointsToParticles = (particleRefs, jointPositions) => {
    // Create a new Vector3 to store the world position of this emergent entity
    const worldPosition = new THREE.Vector3();
    internalRef.current.getWorldPosition(worldPosition);
    const particleWorldPosition = new THREE.Vector3();
    const distances = jointPositions.map((joint, i) => {
      let minDistanceA = Infinity;
      let closestParticleA = null;
      let minDistanceB = Infinity;
      let closestParticleB = null;
      // Convert joint to world position
      particleRefs.current.forEach((particleRef, j) => {
        //console.log("particleRef", id, particleRef)
        // We use translation because this is a RigidBody 
        const pos = particleRef.current.translation();
        particleWorldPosition.set(pos.x, pos.y, pos.z);
        const distanceA = particleWorldPosition.distanceTo(new THREE.Vector3(joint.ax + worldPosition.x, joint.ay + worldPosition.y, joint.az + worldPosition.z));
        const distanceB = particleWorldPosition.distanceTo(new THREE.Vector3(joint.bx + worldPosition.x, joint.by + worldPosition.y, joint.bz + worldPosition.z));
        if (distanceA < minDistanceA) {
          minDistanceA = distanceA;
          closestParticleA = j;
        }
        if (distanceB < minDistanceB) {
          minDistanceB = distanceB;
          closestParticleB = j;
        }
        /*
        console.log("Allocating joints to particles with the following details:", {
          ID: id,
          "Position": pos,
          "Particle World Position": particleWorldPosition,
          "Distance A": distanceA,
          "Distance B": distanceB
        }); 
        */       
      });
      return {
        particleRefA: particleRefs.current[closestParticleA],
        particleRefB: particleRefs.current[closestParticleB],
      };
    });
    return distances;
  };

  useEffect(() => {
    // FOr now we add joints at the lowest emergent entity in the JSX
    if (addJoints && Entity.displayName != "Particle") {
      const jointParticles = allocateJointsToParticles(particleRefs, jointPositions)
      console.log("jointParticles", id, jointParticles)
    }
  }, [addJoints]);

  const calculateCenter = () => {
    const center = new THREE.Vector3();
    let activeEntities = 0;
    entityRefs.forEach((entity) => {
      if (entity.current) {
        const entityCenter = entity.current.getCenter();
        if (entityCenter) {
          center.add(entityCenter);
          activeEntities++;
        }
      }
    });
    if (activeEntities > 0) {
      center.divideScalar(activeEntities);
    }
    return center;
  };

  const addImpulses = (center, impulse, entityIndices) => {
    entityIndices.forEach((i) => {
      const entity = entityRefs[i];
      if (entity.current) {
        const entityCenter = entity.current.getCenter();
        if (entityCenter) {
          const displacement = entityCenter.sub(center);

          if (displacement.length() > maxDisplacement) {
            const overshoot = displacement.length() - maxDisplacement;
            const directionToCenter = displacement.negate().normalize();
            directionToCenter.multiplyScalar(impulseScale * overshoot * 0.01);
            entity.current.addImpulse(directionToCenter);
          } else {
            entity.current.addImpulse(impulse);
          }
        }
      }
    });
  };

  useFrame(() => {
    const startTime = performance.now(); // Start timing
  
    frameCount.current += 1;
  
    //if (frameCount.current % 10 !== 0) return // every X frames
  
    switch (frameState.current) {
      case "init":
        if (initialImpulse && entitiesRegisteredRef.current === true) {
          setInitialImpulse(false);
          entityRefs.forEach((entity, i) => {
            if (entity.current && scope != 1) {
              // Add an impulse that is unique to each entity
              entity.current.addImpulse(initialImpulseVectors[i]);
            }
          });
          frameState.current = "findCenter";
          setAddJoints(true);
          //console.log("Entity.displayName", id, Entity.displayName);
        }
        break;
      case "findCenter":
        centerRef.current = (scope == 1) ? initialPositionVector : calculateCenter();
        internalRef.current.setCenter(centerRef.current);
        if (prevEmergentCenter.current) {
          frameState.current = "calcImpulse";
        }
        break;
      case "calcImpulse":
        const displacement = centerRef.current.clone().sub(prevEmergentCenter.current);
        const impulseDirection = displacement.normalize(); // keep moving in the direction of the impulse
        impulseRef.current = impulseDirection.multiplyScalar(impulseScale * emergentEntityDensity);
        frameState.current = "addImpulse";
        break;
      case "addImpulse":
        entityRefs.forEach((entity, i) => {
          if (entity.current) {
            entity.current.addImpulse(internalRef.current.getImpulse());
          } else {
            console.log("No entity", id, i);
          }
        });
        internalRef.current.setImpulse(zeroVector);
        frameState.current = "entityImpulses";
        break;
      case "entityImpulses":
        applyImpulseCount.current += 1;
  
        // Calculate 10% of entities per frame
        const numEntitiesToUpdate = Math.ceil(entityRefs.length * 0.1);
        const startIndex = (applyImpulseCount.current % Math.ceil(entityRefs.length / numEntitiesToUpdate)) * numEntitiesToUpdate;
        const entityIndices = Array.from({ length: numEntitiesToUpdate }, (_, i) => (startIndex + i) % entityRefs.length);
  
        //console.log("applyImpulseCount", id, startIndex)
        addImpulses(centerRef.current, impulseRef.current, entityIndices);
  
        if (startIndex + numEntitiesToUpdate >= entityRefs.length) {
          frameState.current = "findCenter";
        }
        break;
      default:
        break;
    }
  
    if (centerRef.current) {
      prevEmergentCenter.current = centerRef.current.clone();
    }
  
    const circleCenterRef = getComponentRef(`${id}.CircleCenter`);
    if (circleCenterRef && circleCenterRef.current && internalRef.current && centerRef.current) {
      // Convert the centerRef.current to the local space of the CustomGroup
      const localCenter = internalRef.current.worldToLocal(centerRef.current.clone());
      circleCenterRef.current.position.copy(localCenter);
    }
  
    const endTime = performance.now(); // End timing
    const frameTime = endTime - startTime;
    if (frameTime > 16) {
      console.log(`Frame time: ${frameTime.toFixed(3)} ms`,id, frameState.current);
    }
  });
  

  const showScopes = false;

  return (
    <>
    <CustomGroup ref={internalRef} position={initialPosition}>
      {entityPositions.map((pos, i) => (
        <Entity
          key={`${id}-${i}`}
          id={`${id}-${i}`}
          initialPosition={pos.toArray()}
          radius={entityRadius}
          color={color}
          scope={scope + 1}
          index={i}
          ref={entityRefs[i]}
          jointPosition={jointPositions[i]}
          registerParticlesFn={localRegisterParticlesFn}
        />
      ))}
      
      {Entity.displayName == "Particle" && addJoints && entityRefs.map((ref, i) => (
        <React.Fragment key={`fragment-${i}`}>
          {i > 0 && 
            <RopeJoint 
              a={entityRefs[i - 1].current} 
              b={ref.current} 
              ax={jointPositions[i-1].ax} 
              ay={jointPositions[i-1].ay} 
              az={jointPositions[i-1].az} 
              bx={jointPositions[i].bx} 
              by={jointPositions[i].by} 
              bz={jointPositions[i].bz} 
              key={`${id}-${i}-rope`} 
            />}
          {i === entityRefs.length - 1 && 
            <RopeJoint 
              a={ref.current} 
              b={entityRefs[0].current}
              ax={jointPositions[entityRefs.length - 1].ax} 
              ay={jointPositions[entityRefs.length - 1].ay} 
              az={jointPositions[entityRefs.length - 1].az} 
              bx={jointPositions[0].bx} 
              by={jointPositions[0].by} 
              bz={jointPositions[0].bz} 
              key={`${id}-${i}-last-to-first-rope`} 
            />}
        </React.Fragment>
      ))}
      
      {showScopes && (
        <>
          <Circle 
            id={`${id}.CircleInitialPosition`} 
            initialState={{ 
              radius: radius, 
              color: color,
              opacity: 0,
            }}  
          />
          <Circle 
            id={`${id}.CircleCenter`} 
            initialState={{ 
              radius: radius, 
              color: color,
              opacity: 0.2,
            }}  
          />
        </>
      )}
    </CustomGroup>
    {showScopes && (
      <>
        <Text
          position={[initialPosition[0], initialPosition[1], 0.1]} // Slightly offset in the z-axis to avoid z-fighting
          fontSize={radius / 2} // Adjust font size based on circle radius
          color="black"
          anchorX="center"
          anchorY="middle"
        >
          {index}
        </Text>
        {/*
        <CircleDrei 
          args={[jointRadius, 16]} 
          position={[initialPosition[0] + jointPosition.ax, initialPosition[1] + jointPosition.ay, 0.2]}
        >
        </CircleDrei>
        */}
      </>
    )}
    </>
  );
});

const EntityScope3 = React.forwardRef((props, ref) => (
  <EmergentEntity id={"Scope3"} {...props} ref={ref} Entity={Particle} entityCount={21} />
));

const EntityScope2 = React.forwardRef((props, ref) => (
  <EmergentEntity id={"Scope2"} {...props} ref={ref} Entity={EntityScope3} entityCount={9} color={getRandomColor()} />
));

const EntityScopes = React.forwardRef((props, ref) => (
  <EmergentEntity id={"Scope1"} {...props} ref={ref} Entity={EntityScope2} entityCount={9} />
));

export default withAnimationState(EntityScopes);

const generateEntityPositions = (radius, count) => {
  const positions = []
  const angleStep = (2 * Math.PI) / count
  for (let i = 0; i < count; i++) {
    const angle = i * angleStep
    const x = radius * Math.cos(angle)
    const y = radius * Math.sin(angle)
    positions.push(new THREE.Vector3(x, y, 0))
  }
  return positions
}

const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

const areaOfCircle = (radius) => {
  if (radius <= 0) {
    return "Radius must be a positive number.";
  }
  return Math.PI * Math.pow(radius, 2);
};

const generateJointPositions = (positions, entityRadius) => {
  const jointPositions = positions.map((pos, i) => {
    const nextPos = positions[(i + 1) % positions.length];
    return {
      ax: entityRadius * Math.cos(Math.atan2(nextPos.y - pos.y, nextPos.x - pos.x)),
      ay: entityRadius * Math.sin(Math.atan2(nextPos.y - pos.y, nextPos.x - pos.x)),
      az: 0,
      bx: -entityRadius * Math.cos(Math.atan2(nextPos.y - pos.y, nextPos.x - pos.x)),
      by: -entityRadius * Math.sin(Math.atan2(nextPos.y - pos.y, nextPos.x - pos.x)),
      bz: 0,
    };
  });
  return jointPositions;
};
