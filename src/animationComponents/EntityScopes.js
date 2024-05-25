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

const RopeJoint = ({ id, a, b, ax, ay, az, bx, by, bz }) => {
  //console.log("RopeJoint", id, a, b);
  const scale = 1;
  //const scale = 1 + Math.random();
  useSphericalJoint(a, b, [
    [ax * scale, ay * scale, az * scale],
    [bx * scale, by * scale, bz * scale]
  ])
  return null
}

const Particle = React.forwardRef(({ id, index, initialPosition, radius, color, registerParticlesFn, debugInfo }, ref) => {
  
  const internalRef = useRef();

  useImperativeHandle(ref, () => internalRef.current);

  useFrame(() => {
    if (internalRef.current.applyImpulses) {
      internalRef.current.applyImpulses();
    }
  });

  useEffect(() => {
    if (registerParticlesFn && internalRef.current) {
      //console.log("registerParticlesFn", id, internalRef)
      registerParticlesFn(index, [internalRef.current], radius);
    }
  }, [registerParticlesFn, internalRef]);

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
    {debugInfo && (
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
      </>
    )}
  </>
  );
});

Particle.displayName = 'Particle'; // the name property won't give the component's name since it uses forwardRef

const EmergentEntity = React.forwardRef(({ id, index, initialPosition=[0, 0, 0], scope=1, radius, entityCount, Entity, color = "blue", registerParticlesFn, debugInfo=false }, ref) => {
  const getComponentRef = useStore((state) => state.getComponentRef);
  const entityRefs = Array.from({ length: entityCount }, () => useRef());
  const particleRefs = Array.from({ length: entityCount }, () => useRef([]));
  const emergentEntityArea = areaOfCircle(radius);
  const entityRadius = (radius * Math.PI / (entityCount + Math.PI)) * 0.95;
  const entityArea = areaOfCircle(entityRadius);
  const emergentEntityDensity = emergentEntityArea / (entityArea * entityCount)
  const entityPositions = useMemo(() => {
    return generateEntityPositions(radius - entityRadius, entityCount, entityRadius);
  }, [radius, entityRadius, entityCount]);
  const jointsData = useMemo(() => {
    return generateJointsData(entityPositions);
  }, [entityPositions]);
  const [initialImpulse, setInitialImpulse] = useState(true);
  const frameCount = useRef(0);
  const applyImpulseCountRef = useRef(0);
  const maxDisplacement = radius;
  const centerRef = useRef(new THREE.Vector3());
  const prevCenterRef = useRef();
  const internalRef = useRef();
  const frameStateRef = useRef("init");
  const initialPositionVector = new THREE.Vector3(initialPosition[0], initialPosition[1], initialPosition[2]);
  const impulseRef = useRef();
  const entitiesRegisteredRef = useRef(false);
  const entityParticlesRegisteredRef = useRef(Array.from({ length: entityCount }, () => false));
  const [jointParticles, setJointParticles] = useState([]);
  const particleRadiusRef = useRef();

  const debug = debugInfo;//id == "EntityScopes1-0-8";  

  useImperativeHandle(ref, () => internalRef.current);

  useEffect(() => {
    //console.log("entityPositions", id, "scope", scope, "radius", radius, "entityPositions", entityPositions, "entityRefs", entityRefs, "initialImpulseVectors", initialImpulseVectors);
    //if (scope == 3) console.log("entityRefs[1] entityRefs[0]", entityRefs[1], entityRefs[0]);
    //console.log("jointsData", id, jointsData);
  }, [entityRefs]); // Will only update during  arender not when ref changes

  const areAllParticlesRegistered = () => {
    return entityParticlesRegisteredRef.current.every(ref => ref === true);
  };

  const localRegisterParticlesFn = (indexToRegister, particleRefsToRegister, particleRadius) => {
    //console.log("localRegisterParticlesFn", id, indexToRegister, particleRefsToRegister)
    particleRefs[indexToRegister].current = [...particleRefs[indexToRegister].current, ...particleRefsToRegister];
    particleRadiusRef.current = particleRadius;
    entityParticlesRegisteredRef.current[indexToRegister] = true;
    if (areAllParticlesRegistered() && !entitiesRegisteredRef.current) {
      entitiesRegisteredRef.current = true;
      const flattenedParticleRefs = particleRefs.flatMap(refs => refs.current);
      if (registerParticlesFn) {
        registerParticlesFn(index, flattenedParticleRefs, particleRadius);
      }
      if (scope == 1) {
        console.log("All particles registered", id, flattenedParticleRefs.length, jointsData);
      }
    }
  };

  const impulseScale = entityArea * 0.03;
  const initialImpulseVectors = Array.from({ length: entityCount }, () => new THREE.Vector3(
    (Math.random() - 0.5) * impulseScale * 2,
    (Math.random() - 0.5) * impulseScale * 2,
    0
  ));

  const allocateJointsToParticles = (particleRefs, jointsData) => {
    if (debug) console.log("allocateJointsToParticles", particleRefs, jointsData)
    // Create a new Vector3 to store the world position of this emergent entity
    const worldPosition = new THREE.Vector3();
    internalRef.current.getWorldPosition(worldPosition);
    const particleWorldPosition = new THREE.Vector3();
    const allocateJoints = jointsData.map((jointData, i) => {
      let minDistanceA = Infinity;
      let closestParticleAIndex = null;
      let closestParticleAPosition = new THREE.Vector3();
      let particleAEntity = null;
      let minDistanceB = Infinity;
      let closestParticleBIndex = null;
      let closestParticleBPosition = new THREE.Vector3();
      let particleBEntity = null;

      // Find the two closest particles in different entities
      particleRefs.forEach((entityParticleRefs, entityIndex) => {
        entityParticleRefs.current.forEach((particleRef, j) => {
          const pos = particleRef.current.translation();
          particleWorldPosition.set(pos.x, pos.y, pos.z);
          const distance = particleWorldPosition.distanceTo(new THREE.Vector3(jointData.position.x + worldPosition.x, jointData.position.y + worldPosition.y, jointData.position.z + worldPosition.z));
          if (distance < minDistanceA) {
            minDistanceA = distance;
            closestParticleAIndex = j; // will be 0 all the time at the lowest level (one particle per entity)
            closestParticleAPosition.copy(particleWorldPosition);
            particleAEntity = entityIndex;
          }   
        });
      });

      particleRefs.forEach((entityParticleRefs, entityIndex) => {
        if (entityIndex === particleAEntity) return;
        entityParticleRefs.current.forEach((particleRef, j) => {
          const pos = particleRef.current.translation();
          particleWorldPosition.set(pos.x, pos.y, pos.z);
          const distance = particleWorldPosition.distanceTo(new THREE.Vector3(jointData.position.x + worldPosition.x, jointData.position.y + worldPosition.y, jointData.position.z + worldPosition.z));
          if (distance < minDistanceB) {
            minDistanceB = distance;
            closestParticleBIndex = j; // will be 0 all the time at the lowest level (one particle per entity)
            closestParticleBPosition.copy(particleWorldPosition);
            particleBEntity = entityIndex;
          }     
        });
      });

      // Calculate the direction vector between the two closest particles
      const direction = new THREE.Vector3()
        .subVectors(closestParticleBPosition, closestParticleAPosition)
        .normalize();

      // Calculate the offsets
      const offsetA = direction.clone().multiplyScalar(particleRadiusRef.current);
      const offsetB = direction.clone().multiplyScalar(-particleRadiusRef.current);

      return {
        particleRefA: particleRefs[particleAEntity].current[closestParticleAIndex],
        particlePosA: closestParticleAPosition.clone(),
        ax: offsetA.x,
        ay: offsetA.y,
        az: offsetA.z,
        particleRefB: particleRefs[particleBEntity].current[closestParticleBIndex],
        particlePosB: closestParticleBPosition.clone(),
        bx: offsetB.x,
        by: offsetB.y,
        bz: offsetB.z,
      };
    });
    return allocateJoints;
};


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
  
    switch (frameStateRef.current) {
      case "init":
        if (initialImpulse && entitiesRegisteredRef.current === true) {
          setInitialImpulse(false);
          entityRefs.forEach((entity, i) => {
            if (entity.current && scope != 1) {
              // Add an impulse that is unique to each entity
              entity.current.addImpulse(initialImpulseVectors[i]);
            }
          });
          frameStateRef.current = "findCenter";
          const allocatedJoints = allocateJointsToParticles(particleRefs, jointsData)
          setJointParticles(allocatedJoints)
          //console.log("allocatedJoints", id, allocatedJoints)
          //console.log("Entity.displayName", id, Entity.displayName);
        }
        break;
      case "findCenter":
        centerRef.current = (scope == 1) ? initialPositionVector : calculateCenter();
        internalRef.current.setCenter(centerRef.current);
        if (prevCenterRef.current) {
          frameStateRef.current = "calcImpulse";
        }
        break;
      case "calcImpulse":
        const displacement = centerRef.current.clone().sub(prevCenterRef.current);
        const impulseDirection = displacement.normalize(); // keep moving in the direction of the impulse
        impulseRef.current = impulseDirection.multiplyScalar(impulseScale * emergentEntityDensity);
        frameStateRef.current = "addImpulse";
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
        frameStateRef.current = "entityImpulses";
        break;
      case "entityImpulses":
        applyImpulseCountRef.current += 1;
  
        // Calculate 10% of entities per frame
        const numEntitiesToUpdate = Math.ceil(entityRefs.length * 0.1);
        const startIndex = (applyImpulseCountRef.current % Math.ceil(entityRefs.length / numEntitiesToUpdate)) * numEntitiesToUpdate;
        const entityIndices = Array.from({ length: numEntitiesToUpdate }, (_, i) => (startIndex + i) % entityRefs.length);
  
        //console.log("applyImpulseCountRef", id, startIndex)
        addImpulses(centerRef.current, impulseRef.current, entityIndices);
  
        if (startIndex + numEntitiesToUpdate >= entityRefs.length) {
          frameStateRef.current = "findCenter";
        }
        break;
      default:
        break;
    }
  
    if (centerRef.current) {
      prevCenterRef.current = centerRef.current.clone();
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
      console.log(`Frame time: ${frameTime.toFixed(3)} ms`,id, frameStateRef.current);
    }
  });

  const localJointPosition = (groupRef, particles, side) => {
    let worldPosition;
    let xOffset;
    let yOffset;
    let zOffset;
    if (side == "A") {
      worldPosition = particles.particleRefA.current.translation();
      xOffset = particles.ax;
      yOffset = particles.ay;
      zOffset = 0.4;
    } else {
      worldPosition = particles.particleRefB.current.translation();
      xOffset = particles.bx;
      yOffset = particles.by;
      zOffset = 0.5;
    }
    const worldVector = new THREE.Vector3(worldPosition.x, worldPosition.y, worldPosition.z);
    const localVector = groupRef.current.worldToLocal(worldVector);
    localVector.x += xOffset;
    localVector.y += yOffset;
    localVector.z += zOffset;
    const result = [localVector.x, localVector.y, localVector.z];
    return result
  };  

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
          registerParticlesFn={localRegisterParticlesFn}
          debugInfo={debug}
        />
      ))}

      {jointParticles.map((particles, i) => (
        <RopeJoint 
          a={particles.particleRefA} 
          b={particles.particleRefB} 
          ax={particles.ax}
          ay={particles.ay}
          az={particles.az} 
          bx={particles.bx}
          by={particles.by}
          bz={particles.bz}
          key={`${id}-${i}-emergent-joint`}
          id={`${id}-${i}-emergent-joint`}
        />
      ))}

      {debug && Entity.displayName == "Particle" && (
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
          {jointParticles.map((particles, i) => (
            <>
              <CircleDrei
                args={[0.1, 8]} 
                position={localJointPosition(internalRef, particles, "A")}
                material-color="red"
              />
              <CircleDrei
                args={[0.1, 8]} 
                position={localJointPosition(internalRef, particles, "B")}
                material-color="green"
              />
            </>
          ))}
          {jointsData.map((data, i) => (
            <CircleDrei
              args={[0.1, 16]} 
              position={[data.position.x, data.position.y, 0.3]}
            />
          ))}
        </>
      )}
    </CustomGroup>
    {debug && (
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

const generateJointsData = (positions) => {
  const jointsData = positions.map((pos, i) => {
    let nextPos;
    if (i == positions.length - 1) {
      nextPos = positions[0];
    } else {
      nextPos = positions[i + 1];
    }
    
    // Calculate midpoint
    const midX = (pos.x + nextPos.x) / 2;
    const midY = (pos.y + nextPos.y) / 2;
    const midZ = (pos.z + nextPos.z) / 2;
    
    // Calculate direction vector
    const dirX = nextPos.x - pos.x;
    const dirY = nextPos.y - pos.y;
    const dirZ = nextPos.z - pos.z;
    
    return {
      position: {
        x: midX,
        y: midY,
        z: midZ,
      },
      direction: {
        x: dirX,
        y: dirY,
        z: dirZ,
      },
    };
  });
  return jointsData;
};

