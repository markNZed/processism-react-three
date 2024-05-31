import React, { useEffect, useMemo, useRef, useImperativeHandle, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Circle as CircleDrei, Text } from '@react-three/drei';
import ParticleRigidBody from './ParticleRigidBody';
import CustomGroup from './CustomGroup'; 
import * as THREE from 'three';
import withAnimationState from '../withAnimationState';
import { Circle } from './';
import useStore from '../useStore';
import { useSphericalJoint, useRapier, useBeforePhysicsStep, useAfterPhysicsStep, BallCollider } from '@react-three/rapier';

/* Overview:
 A set of Particle forms a CompoundEntity and a set of CompoundEntity forms a new CompoundEntity etc
 This shows the concept of emergent entities 
 Each CompoundEntity has joints that connect entity/Particle to form a "soft body"

 requestAnimationFrame aims to achieve a refresh rate of 60 frames per second (FPS). 
 Each frame has 16.67 milliseconds for all the rendering and updates to occur.
*/

/* Ideas:
 Could introduce a runtimeConfig that all CompoundEntity can update
 The Attractor does not support ref for updating position - this causes re-rendering
*/

const ZERO_VECTOR = new THREE.Vector3();

/*
 This is the Component that gets exported and is instantiated in the scene
 There is a recursive structure under EntityScopes where
 a CompoundEntity will instantiate multiple CompoundEntity to a certain depth (length of scopesConfig.entityCounts array)
 the deepest scope instantiates Particle which are rigid body circles controlled by rapier physics engine
*/
const EntityScopes = React.forwardRef((props, ref) => {

  // The global configuration 
  const impulse = 0.02;
  const scopesConfig = {
    // Number of entities at each scope
    entityCounts: [9, 9, 21],
    // Can pass a function as a color, null will inherit parent color or default
    colors: [props.color || null, getRandomColorFn, null],
    debug: false,
    radius: props.radius || 10, // Radius of the first CompoundEntity
    impulsePerParticle: impulse,
    overshootScaling: 2,
    attractorStrength: -10,
    maxDisplacementScaling: 1.0,
    particleRestitution: 0,
  };
  const { step } = useRapier();
  const framesPerStep = 3; // Update every framesPerStep frames
  const fixedDelta = framesPerStep / 60; //fps
  const framesPerStepCount = useRef(0);
  const startTimeRef = useRef(0);
  const durations = useRef([]); // Store the last 100 durations
  const stepCount = useRef(0); // Counter to track the number of steps
  const lastStepEnd = useRef(0);

  useFrame(() => {
    framesPerStepCount.current++;
    if (framesPerStepCount.current == framesPerStep) framesPerStepCount.current = 0;
    if (framesPerStepCount.current == 0) {
      step(fixedDelta);
    }
  });

  useBeforePhysicsStep(() => {
    startTimeRef.current = performance.now();
  });

  useAfterPhysicsStep(() => {
    const endTime = performance.now();
    const duration = endTime - startTimeRef.current;
    durations.current.push(duration); // Store the duration
    if (durations.current.length > 100) {
      durations.current.shift(); // Keep only the last 100 entries
    }
    
    stepCount.current++;
    //console.log(`useAfterPhysicsStep: ${stepCount.current} ${framesPerStepCount.current} ${duration}`);
    
    if (stepCount.current >= 100) {
      const averageDuration = durations.current.reduce((a, b) => a + b, 0) / durations.current.length;
      console.log(`Average step duration over last 100 steps: ${averageDuration.toFixed(2)} ms`);
      stepCount.current = 0; // Reset the step count
    }

    lastStepEnd.current = endTime;
  });

  return (
    // Pass in radius so we can calcualte new radius for next scope an pass in same way to CompoundEntity
    <CompoundEntity id={"Scope0"} {...props} ref={ref} config={scopesConfig} radius={scopesConfig.radius}/>
  );
});

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

// The Particle uses ParticleRigidBody which extends RigidBody to allow for impulses to be accumulated before being applied
const Particle = React.memo(React.forwardRef(({ id, index, indexArray, scope, initialPosition, radius, parentColor, registerParticlesFn, config }, ref) => {
  
  const internalRef = useRef(); // because we forwardRef and want to use the ref locally too
  useImperativeHandle(ref, () => internalRef.current);

  const isDebug = config.debug;
  const color = getColor(config, scope, parentColor || "blue");

  // Calculate the unique global index for the Particle
  const calculateUniqueIndex = (indexArray, entityCounts) => {
    let multiplier = 1;
    let uniqueIndex = 0;
    for (let i = indexArray.length - 1; i >= 0; i--) {
      uniqueIndex += indexArray[i] * multiplier;
      multiplier *= entityCounts[i];
    }
    return uniqueIndex;
  };

  const uniqueIndex = useMemo(() => calculateUniqueIndex(indexArray, config.entityCounts), [indexArray, config.entityCounts]);

  useFrame(() => {
    if (internalRef?.current?.applyImpulses) {
      internalRef.current.applyImpulses();
    }
  });

  useEffect(() => {
    if (registerParticlesFn && internalRef.current) {
      registerParticlesFn(index, [internalRef.current], radius);
    }
  }, [registerParticlesFn, internalRef]);

  return (
    <>
    <ParticleRigidBody
      ref={internalRef}
      position={initialPosition}
      type="dynamic"
      colliders={false}
      linearDamping={0.5}
      angularDamping={0.5}
      enabledTranslations={[true, true, false]}
      enabledRotations={[false, false, true]}
      restitution={config.particleRestitution}
      userData={{color: color}}
    >
      <BallCollider args={[radius]} />
    </ParticleRigidBody>
    {isDebug && (
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
}));

Particle.displayName = 'Particle'; // the name property doesn't exist because it uses forwardRef

// 
const CompoundEntity = React.memo(React.forwardRef(({ id, index, indexArray=[], initialPosition=[0, 0, 0], scope=0, radius, parentColor, registerParticlesFn, config }, ref) => {

  const isDebug = config.debug;
  
  // Using forwardRef and need to access the ref from inside this component too
  const internalRef = useRef();
  useImperativeHandle(ref, () => internalRef.current);

  const entityCount = config.entityCounts[scope];
  const [color, setColor] = useState(getColor(config, scope, parentColor || "blue"));
  // At the deepest scope we will instantiate Particles instead of CompoundEntity
  const Entity = scope == config.entityCounts.length - 1 ? Particle : CompoundEntity;
  // Used for Circle animation when isDebug, the position is managed by r3f not rapier
  const getComponentRef = useStore((state) => state.getComponentRef); 
  // Array of refs to entities (either CompoundEntity or Particles)
  const entityRefs = Array.from({ length: entityCount }, () => useRef());
  // An array of entityCount length that stores the particle refs associated with each entity
  const entityParticlesRefs = Array.from({ length: entityCount }, () => useRef([]));
  // The entity radius fills the boundary of CompoundEntity with a margin to avoid overlap
  const entityRadius = Math.min((radius * Math.PI / (entityCount + Math.PI)), radius / 2) * 0.925;
  // Layout to avoid Particle overlap
  const entityPositions = useMemo(() => {
    return generateEntityPositions(radius - entityRadius, entityCount);
  }, [radius, entityRadius, entityCount]);
  // Joints aligned based on entityPositions
  const jointsData = useMemo(() => {
    return generateJointsData(entityPositions);
  }, [entityPositions]);
  // An impulse to get some random behavior at the beginning
  const [applyInitialImpulse, setApplyInitialImpulse] = useState(true);
  const frameCount = useRef(0);
  // Track the center of this CompoundEntity
  const centerRef = useRef(new THREE.Vector3());
  const prevCenterRef = useRef();
  // State machine that distributes computation across frames
  const frameStateRef = useRef("init");
  const initialPositionVector = new THREE.Vector3(initialPosition[0], initialPosition[1], initialPosition[2]);
  // Impulse that will be applied to Particles in this CompoundEntity
  const impulseRef = useRef();
  // All true when all entities have registered a ref
  const entitiesRegisteredRef = useRef(false);
  // All true when all Particles have registered a ref for all entities
  const entityParticlesRegisteredRef = useRef(Array.from({ length: entityCount }, () => false));
  // Joints alow for soft body like behavior and create the structure at each scope (joining entities)
  const [joints, setJoints] = useState([]);
  // Info about Particle at the deepest scope
  const particleRadiusRef = useRef(); 
  const particleCountRef = useRef();
  const particleAreaRef = useRef();
  const instancedMeshRef = useRef();
  const flattenedParticleRefs = useRef();

  ////////////////////////////////////////
  // Constants impacting particle behavior
  ////////////////////////////////////////
  const impulsePerParticle = config.impulsePerParticle || 0.02;
  const overshootScaling = config.overshootScaling || 1;
  const maxDisplacement = (config.maxDisplacementScaling || 1) * radius;
  const attractorStrength = config.attractorStrength;
  
  const initialImpulseVectors = Array.from({ length: entityCount }, () => new THREE.Vector3(
    (Math.random() - 0.5) * impulsePerParticle / (scope + 1),
    (Math.random() - 0.5) * impulsePerParticle / (scope + 1),
    0
  ));

  // Initialization logging/debug
  useEffect(() => {
    //console.log("entityArea", id, entityArea)
    if (isDebug) {
      //console.log("jointsData", id, jointsData);
    }
  }, []);

  const areAllParticlesRegistered = () => {
    return entityParticlesRegisteredRef.current.every(ref => ref === true);
  };

  // Pass up the Particle refs from lower scope so we can find Particles for joints at the scope of this entity
  // The particle radius gets passed up to calculate joint offsets
  const localRegisterParticlesFn = (entityIndex, particleRefs, particleRadius) => {
    entityParticlesRefs[entityIndex].current = [...entityParticlesRefs[entityIndex].current, ...particleRefs];
    particleRadiusRef.current = particleRadius;
    entityParticlesRegisteredRef.current[entityIndex] = true;
    if (areAllParticlesRegistered() && !entitiesRegisteredRef.current) {
      entitiesRegisteredRef.current = true;
      flattenedParticleRefs.current = entityParticlesRefs.flatMap(refs => refs.current);
      if (registerParticlesFn) {
        registerParticlesFn(index, flattenedParticleRefs.current, particleRadius);
      }
      particleCountRef.current = flattenedParticleRefs.current.length;
      particleAreaRef.current = calculateCircleArea(particleRadius);
      if (scope == 0) {
        console.log(`All particles (radius: ${particleRadiusRef.current}m) are registered`, id, flattenedParticleRefs.length, jointsData);
      }
    }
  };

  // Map the joints to the Particles and align teh joint with the initial Particle layout
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

  // Find center of this CompoundEntity (using the centers of the entities at the lower scope)
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

  // Distribute impulses to each entity
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
            directionToCenter.multiplyScalar(impulse / entityRefs.length * overshoot * overshootScaling);
            entity.current.addImpulse(directionToCenter);
          } else {
            // Continue moving in the current direction
            entity.current.addImpulse(impulse / entityRefs.length);
          }
          // Model attractor
          if (attractorStrength) {
            const directionToCenter = attractorStrength > 0 ? displacement.negate().normalize() : displacement.normalize();
            directionToCenter.multiplyScalar(impulse / entityRefs.length *  Math.abs(attractorStrength));
            entity.current.addImpulse(directionToCenter);
          }
        }
      }
    });
  };

  useFrame(() => {
    // Transfer the impulse to entities on each frame
    if (entitiesRegisteredRef.current === true) {
      const perEntityImpulse = internalRef.current.getImpulse().multiplyScalar(1/entityRefs.length);
      entityRefs.forEach((entity) => {
          entity.current.addImpulse(perEntityImpulse);
      });
      internalRef.current.setImpulse(ZERO_VECTOR);
    }
  });

  useFrame(() => {
  
    frameCount.current += 1;
  
    // This state machine allows for computation to be distributed across frames, reducing load on the physics engine
    switch (frameStateRef.current) {
      case "init":
        // Initial random impulse to get more interesting behavior
        if (applyInitialImpulse && entitiesRegisteredRef.current === true) {
          const allocatedJoints = allocateJointsToParticles(entityParticlesRefs, jointsData);
          setJoints(allocatedJoints);
          setApplyInitialImpulse(false);
          entityRefs.forEach((entity, i) => {
            if (entity.current) {
              // Add an impulse that is unique to each entity
              const perEntityImpulse = initialImpulseVectors[i].multiplyScalar(entityParticlesRefs[i].current.length);
              entity.current.addImpulse(perEntityImpulse);
            }
          });
          frameStateRef.current = "findCenter";
        }
        break;
      case "findCenter":
        centerRef.current = calculateCenter();
        internalRef.current.setCenter(centerRef.current);
        // Wait until prevCenterRef is set so we can assume it is there in later states
        if (prevCenterRef.current) {
          frameStateRef.current = "calcEntitiesImpulse";
        }
        break;
      case "calcEntitiesImpulse":
        // Could calculate velocity and direction here
        const displacement = centerRef.current.clone().sub(prevCenterRef.current);
        const impulseDirection = displacement.normalize(); // keep moving in the direction of the displacement
        impulseRef.current = impulseDirection.multiplyScalar(impulsePerParticle * particleAreaRef.current * particleCountRef.current);
        frameStateRef.current = "entityImpulses";
        break;
      case "entityImpulses":
        entityImpulses(centerRef.current, impulseRef.current);
        frameStateRef.current = "findCenter";
        break;
      default:
        break;
    }
  
    // For tracking movement and calculating displacement
    if (centerRef.current) {
      // Leave the center of scope 0 at initial position so it stays in the center of the screen
      if (scope == 0) {
        prevCenterRef.current = prevCenterRef.current || centerRef.current.clone();
      } else {
        prevCenterRef.current = centerRef.current.clone();
      }
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

  // Because we are using instanced meshes of the particles to improve performance they are instantiated at scope 0
  // Then the Particle contains the associated rigid body with the physics information whcih is copied here to update
  // all the instances at once.
  useFrame(() => {
    if (scope === 0 && instancedMeshRef.current) {
      const mesh = instancedMeshRef.current;
      const dummy = new THREE.Object3D();
      const colorDummy = new THREE.Color();
      let colorChanged = false; // Track if any color has changed
      let positionChanged = false; // Track if any position has changed
  
      for (let i = 0; i < particleCountRef.current; i++) {
        // Get the current position of the instance
        mesh.getMatrixAt(i, dummy.matrix);
        const currentPos = new THREE.Vector3();
        dummy.matrix.decompose(currentPos, new THREE.Quaternion(), new THREE.Vector3());
  
        // Get the position of the rigid body
        const pos = flattenedParticleRefs.current[i].current.translation();
        dummy.position.set(pos.x, pos.y, pos.z);
  
        // Compare with the current position
        if (!currentPos.equals(dummy.position)) {
          dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
          positionChanged = true;
        }
  
        // Get the color from userData
        const color = flattenedParticleRefs.current[i].current.userData.color || 'red';
        colorDummy.set(color);
  
        // Check if the color attribute is set
        if (mesh.instanceColor) {
          // Get the current color of the instance
          const currentColor = new THREE.Color();
          mesh.getColorAt(i, currentColor);
  
          // Update the color only if it has changed
          if (!currentColor.equals(colorDummy)) {
            mesh.setColorAt(i, colorDummy);
            colorChanged = true; // Mark that a color has changed
          }
        } else {
          // If instanceColor is not set, set it now
          mesh.setColorAt(i, colorDummy);
          colorChanged = true;
        }
      }
  
      // Update the instance matrix to reflect changes only if positions changed
      if (positionChanged) {
        mesh.instanceMatrix.needsUpdate = true;
      }
      
      // Update the instance color only if any color has changed
      if (colorChanged && mesh.instanceColor) {
        mesh.instanceColor.needsUpdate = true;
      }
    }
  });
  
  // This is only used in debug
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
          parentColor={color}
          scope={scope + 1}
          index={i}
          indexArray={[...indexArray, i]}
          ref={entityRef}
          registerParticlesFn={localRegisterParticlesFn}
          parentDebug={isDebug}
          config={config}
          userData={{ color }}
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

      {scope == 0 && particleCountRef.current && (
        <instancedMesh ref={instancedMeshRef} args={[null, null, particleCountRef.current]}>
          <circleGeometry args={[particleRadiusRef.current, 16]} /> 
          <meshStandardMaterial />
        </instancedMesh>
      )}

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
}));

export default withAnimationState(EntityScopes);

// Distribute evenly around the perimeter
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

// Return the center point of all the joints
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

const getRandomColorFn = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  //console.log("Color: ", color);
  return color;
};

const calculateCircleArea = (radius) => {
  if (radius <= 0) {
    return "Radius must be a positive number.";
  }
  return Math.PI * Math.pow(radius, 2);
};

// Utility to allow passing in color string or function
const getColor = (config, scope, defaultValue) => {
  const colorConfig = config.colors[scope];
  if (colorConfig === null || colorConfig === undefined) {
    return defaultValue;
  }
  if (typeof colorConfig === 'function') {
    return colorConfig();
  }
  return colorConfig;
};