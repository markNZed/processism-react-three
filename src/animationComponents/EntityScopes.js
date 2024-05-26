import React, { useEffect, useMemo, useRef, useImperativeHandle, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Circle as CircleDrei, Text } from '@react-three/drei';
import MyRigidBody from './MyRigidBody';
import CustomGroup from './CustomGroup'; 
import * as THREE from 'three';
import withAnimationState from '../withAnimationState';
import { Circle } from './';
import useStore from '../useStore';
import { useSphericalJoint } from '@react-three/rapier';

// Add a repellant force 
// requestAnimationFrame aims to achieve a refresh rate of 60 frames per second (FPS). 
// Each frame has 16.67 milliseconds for all the rendering and updates to occur.

// Use https://github.com/pmndrs/react-three-rapier/tree/main/packages/react-three-rapier-addons#attractors
// Use https://github.com/pmndrs/react-three-rapier?tab=readme-ov-file#instanced-meshes

// Maybe pass all the refs up and then from top level instantiate Particles and Joints

const ZERO_VECTOR = new THREE.Vector3();

// Joints connect Particles and when the joints form a loop the boundary will behave like a softbody
const Joint = ({ id, a, b, ax, ay, az, bx, by, bz }) => {
  // Scaling the joint can create space between the particles
  const scale = 1;
  //const scale = 1 + Math.random(); // A more organic form
  useSphericalJoint(a, b, [
    [ax * scale, ay * scale, az * scale],
    [bx * scale, by * scale, bz * scale]
  ])
  return null
}

// The Particle uses MyRigidBody which extends RigidBody to allow for impulses to be accumulated before being applied
const Particle = React.forwardRef(({ id, index, initialPosition, radius, color, registerParticlesFn, parentDebug }, ref) => {
  
  const internalRef = useRef(); // because we forwardRef and want to use the ref locally too
  useImperativeHandle(ref, () => internalRef.current);

  const FRAMES_PER_IMPULSE = 10;
  const frameCount = useRef(0);
  const initialFrame = Math.floor(Math.random() * FRAMES_PER_IMPULSE);

  useFrame(() => {
    if (frameCount.current >= initialFrame && (frameCount.current - initialFrame) % FRAMES_PER_IMPULSE === 0) {
      if (internalRef.current.applyImpulses) {
        internalRef.current.applyImpulses();
      }
    }
    frameCount.current += 1;
  });

  useEffect(() => {
    if (registerParticlesFn && internalRef.current) {
      registerParticlesFn(index, [internalRef.current], radius);
    }
  }, [registerParticlesFn, internalRef]);

  return (
    <>
    <MyRigidBody
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
    </MyRigidBody>
    {parentDebug && (
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

Particle.displayName = 'Particle'; // the name property doesn't exist because it uses forwardRef

// 
const CompoundEntity = React.forwardRef(({ id, index, initialPosition=[0, 0, 0], scope=1, radius, entityCount, Entity, color = "blue", registerParticlesFn, parentDebug=false }, ref) => {

  const isDebug = parentDebug;//id == "EntityScopes1-0-8";
  
  // Using forwardRef and need to access the ref from inside this component too
  const internalRef = useRef();
  useImperativeHandle(ref, () => internalRef.current);

  const getComponentRef = useStore((state) => state.getComponentRef); // used for Circle during isDebug
  const entityRefs = Array.from({ length: entityCount }, () => useRef());
  const entityParticlesRefs = Array.from({ length: entityCount }, () => useRef([]));
  const area = calculateCircleArea(radius);
  // The entity radius fills the boundary with a margin to avoid overl
  const entityRadius = (radius * Math.PI / (entityCount + Math.PI)) * 0.95;
  const entityArea = calculateCircleArea(entityRadius);
  const density = area / (entityArea * entityCount)
  const entityPositions = useMemo(() => {
    return generateEntityPositions(radius - entityRadius, entityCount);
  }, [radius, entityRadius, entityCount]);
  const jointsData = useMemo(() => {
    return generateJointsData(entityPositions);
  }, [entityPositions]);
  const [applyInitialImpulse, setApplyInitialImpulse] = useState(true);
  const frameCount = useRef(0);
  const centerRef = useRef(new THREE.Vector3());
  const prevCenterRef = useRef();
  const frameStateRef = useRef("init");
  const initialPositionVector = new THREE.Vector3(initialPosition[0], initialPosition[1], initialPosition[2]);
  const impulseRef = useRef();
  const entitiesRegisteredRef = useRef(false);
  const entityParticlesRegisteredRef = useRef(Array.from({ length: entityCount }, () => false));
  const [joints, setJoints] = useState([]);
  const particleRadiusRef = useRef(); 

  // Constants impacting particle behavior
  const impulseScale = entityArea * 0.03;
  const initialImpulseVectors = Array.from({ length: entityCount }, () => new THREE.Vector3(
    (Math.random() - 0.5) * impulseScale * 2,
    (Math.random() - 0.5) * impulseScale * 2,
    0
  ));
  const maxDisplacement = radius;
  const overshootScaling = 0.01;

  useEffect(() => {
    if (isDebug) {
      //console.log("jointsData", id, jointsData);
    }
  }, [entityRefs]); // Will only run during a render after ref has changed

  const areAllParticlesRegistered = () => {
    return entityParticlesRegisteredRef.current.every(ref => ref === true);
  };

  // Pass up the Particle refs so we can find Particles for joints at the scope of this entity
  // The particle radius gets passed up to calculate joint offsets
  const localRegisterParticlesFn = (entityIndex, particleRefs, particleRadius) => {
    entityParticlesRefs[entityIndex].current = [...entityParticlesRefs[entityIndex].current, ...particleRefs];
    particleRadiusRef.current = particleRadius;
    entityParticlesRegisteredRef.current[entityIndex] = true;
    if (areAllParticlesRegistered() && !entitiesRegisteredRef.current) {
      entitiesRegisteredRef.current = true;
      const flattenedParticleRefs = entityParticlesRefs.flatMap(refs => refs.current);
      if (registerParticlesFn) {
        registerParticlesFn(index, flattenedParticleRefs, particleRadius);
      }
      if (scope == 1) {
        console.log("All particles registered", id, flattenedParticleRefs.length, jointsData);
      }
    }
  };

  const allocateJointsToParticles = (entityParticlesRefs, jointsData) => {
    if (isDebug) console.log("allocateJointsToParticles", entityParticlesRefs, jointsData)
    // Create a new Vector3 to store the world position of this entity
    const worldPosition = new THREE.Vector3();
    internalRef.current.getWorldPosition(worldPosition);
    const particleWorldPosition = new THREE.Vector3();
    const allocateJoints = jointsData.map((jointData, i) => {

      function findClosestParticle(entityParticlesRefs, jointData, worldPosition, excludedEntityIndex) {
        let minDistance = Infinity;
        let closestParticleIndex = -1;
        let closestParticlePosition = new THREE.Vector3();
        let particleEntityIndex = -1;
      
        entityParticlesRefs.forEach((entity, entityIndex) => {
          if (entityIndex === excludedEntityIndex) return;
          entity.current.forEach((particleRef, j) => {
            const pos = particleRef.current.translation();
            particleWorldPosition.set(pos.x, pos.y, pos.z);
            const distance = particleWorldPosition.distanceTo(new THREE.Vector3(
              jointData.position.x + worldPosition.x,
              jointData.position.y + worldPosition.y,
              jointData.position.z + worldPosition.z
            ));
            if (distance < minDistance) {
              minDistance = distance;
              closestParticleIndex = j; // will be 0 all the time at the lowest level (one particle per entity)
              closestParticlePosition.copy(particleWorldPosition);
              particleEntityIndex = entityIndex;
            }   
          });
        });
      
        return { minDistance, closestParticleIndex, closestParticlePosition, particleEntityIndex };
      }
      
      // Ensure particleWorldPosition is defined
      const particleWorldPosition = new THREE.Vector3();
      
      // Initial setup for A
      const resultA = findClosestParticle(entityParticlesRefs, jointData, worldPosition, -1);
      const closestParticleAIndex = resultA.closestParticleIndex;
      const closestParticleAPosition = resultA.closestParticlePosition;
      const particleAEntityIndex = resultA.particleEntityIndex;
      
      // Initial setup for B (excluding the entity of particle A)
      const resultB = findClosestParticle(entityParticlesRefs, jointData, worldPosition, particleAEntityIndex);
      const closestParticleBIndex = resultB.closestParticleIndex;
      const closestParticleBPosition = resultB.closestParticlePosition;
      const particleBEntityIndex = resultB.particleEntityIndex;      
      
      // Calculate the direction vector between the two closest particles
      const direction = new THREE.Vector3()
        .subVectors(closestParticleBPosition, closestParticleAPosition)
        .normalize();

      // Calculate the offset to the boundary of the particle
      const offsetA = direction.clone().multiplyScalar(particleRadiusRef.current);
      const offsetB = direction.clone().multiplyScalar(-particleRadiusRef.current);

      return {
        particleRefA: entityParticlesRefs[particleAEntityIndex].current[closestParticleAIndex],
        particlePosA: closestParticleAPosition.clone(),
        ax: offsetA.x,
        ay: offsetA.y,
        az: offsetA.z,
        particleRefB: entityParticlesRefs[particleBEntityIndex].current[closestParticleBIndex],
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

  const entityImpulses = (center, impulse) => {
    entityRefs.forEach((entity, i) => {
      if (entity.current) {
        const entityCenter = entity.current.getCenter();
        if (entityCenter) {
          const displacement = entityCenter.sub(center);
          // If the entity gets too far from the center then pull it back toward the center
          if (displacement.length() > maxDisplacement) {
            const overshoot = displacement.length() - maxDisplacement;
            const directionToCenter = displacement.negate().normalize();
            directionToCenter.multiplyScalar(impulseScale * overshoot * overshootScaling);
            entity.current.addImpulse(directionToCenter);
          } else {
            entity.current.addImpulse(impulse);
          }
        }
      }
    });
  };

  useFrame(() => {
  
    frameCount.current += 1;
  
    // A state machine allows for computation to be distributed across frames, reducng load on the physics engine
    switch (frameStateRef.current) {
      case "init":
        // Initial random impulse to get more interesting behavior
        if (applyInitialImpulse && entitiesRegisteredRef.current === true) {
          setApplyInitialImpulse(false);
          entityRefs.forEach((entity, i) => {
            if (entity.current && scope != 1) {
              // Add an impulse that is unique to each entity
              entity.current.addImpulse(initialImpulseVectors[i]);
            }
          });
          const allocatedJoints = allocateJointsToParticles(entityParticlesRefs, jointsData)
          setJoints(allocatedJoints)
          frameStateRef.current = "findCenter";
        }
        break;
      case "findCenter":
        centerRef.current = (scope == 1) ? initialPositionVector : calculateCenter();
        internalRef.current.setCenter(centerRef.current);
        // Wait until prevCenterRef is set so we can assume it is there in later states
        if (prevCenterRef.current) {
          frameStateRef.current = "calcImpulse";
        }
        break;
      case "calcImpulse":
        // Could calculate velocity and direction here
        const displacement = centerRef.current.clone().sub(prevCenterRef.current);
        const impulseDirection = displacement.normalize(); // keep moving in the direction of the displacement
        impulseRef.current = impulseDirection.multiplyScalar(impulseScale * density);
        frameStateRef.current = "addImpulse";
        break;
      case "addImpulse":
        entityRefs.forEach((entity) => {
            entity.current.addImpulse(internalRef.current.getImpulse());
        });
        internalRef.current.setImpulse(ZERO_VECTOR);
        frameStateRef.current = "entityImpulses";
        break;
      case "entityImpulses":
        // Don't apply impulses to Particles to improve performance
        if (Entity.displayName != "Particle") {
          entityImpulses(centerRef.current, impulseRef.current);
        }
        frameStateRef.current = "findCenter";
        break;
      default:
        break;
    }
  
    // For tracking movement and calculating displacement
    if (centerRef.current) {
      prevCenterRef.current = centerRef.current.clone();
    }

    if (isDebug) {
      const circleCenterRef = getComponentRef(`${id}.CircleCenter`);
      if (circleCenterRef && circleCenterRef.current && internalRef.current && centerRef.current) {
        // Convert the centerRef.current to the local space of the entity
        const localCenter = internalRef.current.worldToLocal(centerRef.current.clone());
        circleCenterRef.current.position.copy(localCenter);
      }
    }
  
  });

  // This is used only for debug
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
      {entityRefs.map((entityRef, i) => (
        <Entity
          key={`${id}-${i}`}
          id={`${id}-${i}`}
          initialPosition={entityPositions[i].toArray()}
          radius={entityRadius}
          color={color}
          scope={scope + 1}
          index={i}
          ref={entityRef}
          registerParticlesFn={localRegisterParticlesFn}
          parentDebug={isDebug}
        />
      ))}

      {joints.map((particles, i) => (
        <Joint 
          a={particles.particleRefA} 
          b={particles.particleRefB} 
          ax={particles.ax}
          ay={particles.ay}
          az={particles.az} 
          bx={particles.bx}
          by={particles.by}
          bz={particles.bz}
          key={`${id}-${i}-joint`}
          id={`${id}-${i}-joint`}
        />
      ))}

      {isDebug && (
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
          {joints.map((particles, i) => (
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
    {isDebug && (
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

// Instead of using an explicit instantiation of the scopes refactor to use a config and a single instantiation of CompoundEntity
// Could also introduce a runtimeConfig that all CompoundEntity can update

const EntityScope3 = React.forwardRef((props, ref) => (
  <CompoundEntity id={"Scope3"} {...props} ref={ref} Entity={Particle} entityCount={21} />
));

const EntityScope2 = React.forwardRef((props, ref) => (
  <CompoundEntity id={"Scope2"} {...props} ref={ref} Entity={EntityScope3} entityCount={9} color={getRandomColor()} />
));

const EntityScopes = React.forwardRef((props, ref) => (
  <CompoundEntity id={"Scope1"} {...props} ref={ref} Entity={EntityScope2} entityCount={9} />
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
    
    return {
      position: {
        x: midX,
        y: midY,
        z: midZ,
      },
    };
  });
  return jointsData;
};

const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

const calculateCircleArea = (radius) => {
  if (radius <= 0) {
    return "Radius must be a positive number.";
  }
  return Math.PI * Math.pow(radius, 2);
};