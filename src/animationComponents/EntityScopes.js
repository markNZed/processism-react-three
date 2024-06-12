import React, { useEffect, useMemo, useRef, useImperativeHandle, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Circle as CircleDrei, Text, QuadraticBezierLine } from '@react-three/drei';
import ParticleRigidBody from './ParticleRigidBody';
import CompoundEntityGroup from './CompoundEntityGroup'; 
import * as THREE from 'three';
import withAnimationState from '../withAnimationState';
import { Circle } from './';
import useStore from '../useStore';
import { useSphericalJoint, useRapier, useBeforePhysicsStep, useAfterPhysicsStep, BallCollider, vec3 } from '@react-three/rapier';
import { useControls } from 'leva'
import _ from 'lodash';

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
 Should it be possible to create/destroy particles ?
*/

const ZERO_VECTOR = new THREE.Vector3();

let global_scope = 0

/*
 This is the Component that gets exported and is instantiated in the scene
 There is a recursive structure under EntityScopes where
 a CompoundEntity will instantiate multiple CompoundEntity to a certain depth (length of config.entityCounts array)
 the deepest scope instantiates Particle which are rigid body circles controlled by rapier physics engine
*/
const EntityScopes = React.forwardRef((props, ref) => {

  // Leva controls
  // Some controls require remounting (e.g. scope0count) so make the CompoundEntity key dependent on these
  // Using state here is a problemn for the functions
  // The onChange in scope0 etc here breaks things
  const [controlsConfig, setControlsConfig] = useState({
    scopeCount: {value: 3, step: 1,},
    radius: { value: props.radius || 10, min: 1, max: 20 },
    impulsePerParticle: { value: 0.01, min: 0.001, max: 10, step: 0.001, label: "Impulse per Particle" },
    overshootScaling: { value: 1, min: 1, max: 10, step: 1, label: "Overshoot Scaling" },
    maxDisplacementScaling: { value: 0.75, min: 0.1, max: 2, step: 0.1, label: "Max Displacement Scaling" },
    particleRestitution: { value: 0, min: 0, max: 5, step: 0.1, label: "Particle Restitution" },
    attractorScaling: { value: [0, -0.8, -0.1], label: "Attractor Scaling" },
    initialImpulse: {value: false, label: "Initial Impulse"},
    showRelations: {value: false, label: "Show Relations"},
    detach: {value: false, label: "Detach Experiment"},
    scope0: { value: 9, min: 1, max: 30, step: 1 },
    scope1: { value: 9, min: 1, max: 30, step: 1 },
    scope2: { value: 21, min: 1, max: 30, step: 1 },
  });

  const [controls] = useControls(() => controlsConfig, [controlsConfig]);

  // Configuration object for your simulation, does not include config that needs to remount
  const config = {
    debug: false,
    colors: [props.color || null, getRandomColorFn, null],
    impulsePerParticle: controls.impulsePerParticle / 1000,
    overshootScaling: controls.overshootScaling,
    attractorScaling: controls.attractorScaling,
    maxDisplacementScaling: controls.maxDisplacementScaling,
    particleRestitution: controls.particleRestitution,
    ccd: false,
    initialImpulse: controls.initialImpulse,
    showRelations: controls.showRelations,
    detach: controls.detach,
  };

  // Configuration object for your simulation that needs to remount
  const remountConfig = useRef({
    scopeCount: controls.scopeCount,
    entityCounts: [controls.scope0, controls.scope1, controls.scope2],
    radius: controls.radius,
  });

  // Use a state for remountConfig to sync update with new key
  const [remountConfigState, setRemountConfigState] = useState(JSON.parse(JSON.stringify(remountConfig.current)));

  const { step } = useRapier();
  const framesPerStep = 1; // Update every framesPerStep frames
  const fixedDelta = framesPerStep / 60; //fps
  const framesPerStepCount = useRef(0);
  const startTimeRef = useRef(0);
  const durations = useRef([]); // Store the last 100 durations
  const stepCount = useRef(0); // Counter to track the number of steps
  const lastStepEnd = useRef(0);
  const averageOver = 1000;

  // Because this renders then remountConfig gets reset then entityCounts has an undefined value if we reduce te scope
  useEffect(() => {
    let change = false;
    const updatedRemountConfig = { ...remountConfig.current };
  
    Object.keys(remountConfig.current).forEach(key => {
      if (key === 'entityCounts') {
        const entityCounts = [];
        for (let i = 0; i < controls.scopeCount; i++) {
          entityCounts.push(controls[`scope${i}`]);
        }
        if (!_.isEqual(entityCounts, remountConfig.current.entityCounts)) {
          updatedRemountConfig.entityCounts = entityCounts;
          change = true;
        }
      } else if (controls[key] !== remountConfig.current[key]) {
        updatedRemountConfig[key] = controls[key];
        change = true;
      }
    });
  
    if (change) {
      remountConfig.current = updatedRemountConfig;
      setRemountConfigState(updatedRemountConfig);
    }
  
    console.log("useEffect controls", controls, "change", change, "remountConfig", remountConfig.current, "remountConfigState", remountConfigState);
  }, [controls, controlsConfig]);

  useEffect(() => {
    console.log("remountConfigState", remountConfigState);
  }, [remountConfigState]);

  // When scopeCount changes setConfig then we refresh the controls so we can add to scopeCountsUI
  useEffect(() => {
    if (controls.scopeCount) {
      // Delete all the scopeX entries
      const controlsConfigCopy = JSON.parse(JSON.stringify(controlsConfig));
      const scopeRegex = /^scope\d+/;
      Object.keys(controlsConfigCopy).forEach(key => {
        if (scopeRegex.test(key)) {
          delete controlsConfigCopy[key];
        }
      });
      const defaultValue = 5;
      let scopeCountsUI = {};
      for (let i = 0; i < controls.scopeCount; i++) {
        let defaultValueOverride = defaultValue;
        if (controls[`scope${i}`]) {
          defaultValueOverride = controls[`scope${i}`];
        }
        scopeCountsUI[`scope${i}`] = { 
          value: defaultValueOverride, 
          min: 1, 
          max: 30, 
          step: 1,
        };
      }
      const newControlsConfig = {...scopeCountsUI, ...controlsConfigCopy };
      console.log("setControlsConfig", "controls.scopeCount", controls.scopeCount, "remountConfig.current", "newControlsConfig", newControlsConfig);
      // Update controlsConfig to trigger update of useControls
      setControlsConfig(newControlsConfig);
    }
  }, [controls.scopeCount]);

  // Need to resert physics when we reset the scopes
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
    if (durations.current.length > averageOver) {
      durations.current.shift(); // Keep only the last 100 entries
    }
    
    stepCount.current++;
    //console.log(`useAfterPhysicsStep: ${stepCount.current} ${framesPerStepCount.current} ${duration}`);
    
    if (stepCount.current >= averageOver) {
      const averageDuration = durations.current.reduce((a, b) => a + b, 0) / durations.current.length;
      console.log(`Average step duration over last 100 steps: ${averageDuration.toFixed(2)} ms`);
      stepCount.current = 0; // Reset the step count
    }

    lastStepEnd.current = endTime;
  });

  console.log("config", config);

  // Pass in radius so we can calculate new radius for next scope an pass in same way to CompoundEntity
  return (
    <>
    {config && remountConfigState && (
      <CompoundEntity 
        key={JSON.stringify(remountConfigState)}
        {...props} 
        id={`Scope`}
        ref={ref} 
        config={{...config, ...remountConfigState}} 
        radius={remountConfigState.radius}
      />
    )}
    </>
  );
});

// Joints connect Particles and when the joints form a loop the group of Particles will behave like a soft body
const Joint = ({ a, b, jointRefsRef }) => {
  const aUserData = a.ref.getUserData()
  const bUserData = b.ref.getUserData()
  const jointRefsIndex = `${aUserData.uniqueIndex}-${bUserData.uniqueIndex}`;
  jointRefsRef.current[jointRefsIndex] = useSphericalJoint(a.ref, b.ref, [
    [a.offset.x, a.offset.y, a.offset.z],
    [b.offset.x, b.offset.y, b.offset.z]
  ])
  return null
}

// The Particle uses ParticleRigidBody which extends RigidBody to allow for impulses to be accumulated before being applied
const Particle = React.memo(React.forwardRef(({ id, index, indexArray, scope, initialPosition, radius, config, ...props }, ref) => {
  
  const internalRef = useRef(); // because we forwardRef and want to use the ref locally too
  useImperativeHandle(ref, () => internalRef.current);

  const isDebug = props.debug || config.debug;
  const color = useMemo(() => getColor(config, scope, props.color || "blue"));
  const [colliderRadius, setColliderRadius] = useState(radius);
  const registeredRef = useRef(false);
  const [initialize, setInitialize] = useState(true);

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

  // With adding/removing Particles this may not be unique - use a singleton to get a unique id
  const uniqueIndex = useMemo(() => calculateUniqueIndex(indexArray, config.entityCounts), [indexArray, config.entityCounts]);

  // When scaling a Particle we need to modify the joint positions
  useFrame(() => {
    if (internalRef.current) {
      if (internalRef.current.applyImpulses) {
        internalRef.current.applyImpulses();
      }
      //
      const userData = internalRef.current.getUserData();
      // Could adjust scale over multiple frames
      if (userData?.scale !== userData?.rigidScale) {
        let relativeScale = userData.scale;
        if (userData.rigidScale) {
          relativeScale = userData.scale / userData.rigidScale;
        }
        const newRadius = relativeScale * colliderRadius
        setColliderRadius(newRadius);
        internalRef.current.setUserData(userData)
        props.particleJointsRef.current[uniqueIndex].forEach((jointIndex) => {
          const joint = props.jointRefsRef.current[jointIndex].current;
          if (joint.body1().userData.uniqueIndex == uniqueIndex) {
            const a1 = joint.anchor1();
            joint.setAnchor1({
              x: a1.x * relativeScale,
              y: a1.y * relativeScale,
              z: a1.z * relativeScale,
            })
          }
          if (joint.body2().userData.uniqueIndex == uniqueIndex) {
            const a2 = joint.anchor2();
            joint.setAnchor2({
              x: a2.x * relativeScale,
              y: a2.y * relativeScale,
              z: a2.z * relativeScale,
            })
          }
        })
        userData.rigidScale = userData.scale;
        internalRef.current.setUserData(userData);
      }
    }
  });

  useEffect(() => {
    // Don't need registeredRef as sensitive to internalRef
    if (props.registerParticlesFn && internalRef.current && !registeredRef.current) {
      props.registerParticlesFn(index, [internalRef.current], radius);
      registeredRef.current = true;
    }
  }, [props.registerParticlesFn, internalRef]);

  // Set the initial userData, don't do this in JSX (it would overwrite on renders)
  useEffect(() => {
    if (initialize && internalRef.current) {
      internalRef.current.setUserData({color: color, uniqueIndex: uniqueIndex});
      setInitialize(false);
    }
  }, [internalRef]);

  // Set the initial userData, don't do this in JSX (it would overwrite on renders)
  useEffect(() => {
    if (initialize && internalRef.current) {
      internalRef.current.setUserData({color: color, uniqueIndex: uniqueIndex});
      setInitialize(false);
    }
  }, [internalRef]);

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
	    ccd={config.ccd}
    >
      <BallCollider args={[colliderRadius]} />
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
          {uniqueIndex}
        </Text>
      </>
    )}
  </>
  );
}));

Particle.displayName = 'Particle'; // the name property doesn't exist because it uses forwardRef

const CompoundEntity = React.memo(React.forwardRef(({ id, index, indexArray=[], initialPosition=[0, 0, 0], scope=0, radius, config, ...props }, ref) => {

  const isDebug = props.debug || config.debug;
  
  // Using forwardRef and need to access the ref from inside this component too
  const internalRef = useRef();
  useImperativeHandle(ref, () => internalRef.current);

  const entityCount = config.entityCounts[scope];
  // Store the color in a a state so it si consistent across renders, setColor is not used
  const [color, setColor] = useState(getColor(config, scope, props.color || "blue"));
  // At the deepest scope we will instantiate Particles instead of CompoundEntity
  const Entity = scope == config.entityCounts.length - 1 ? Particle : CompoundEntity;
  // Used for Circle animation when isDebug, the position is managed by r3f not rapier
  const getComponentRef = useStore((state) => state.getComponentRef); 
  // Array of refs to entities (either CompoundEntity or Particles)
  const entityRefs = Array.from({ length: entityCount }, () => useRef());
  // An array of entityCount length that stores the particle refs associated with each entity
  const entityParticlesRefs = Array.from({ length: entityCount }, () => useRef([]));
  // A simple array with all the refs
  const flattenedParticleRefs = useRef();
  // The entity radius fills the boundary of CompoundEntity with a margin to avoid overlap
  const entityRadius = Math.min((radius * Math.PI / (entityCount + Math.PI)), radius / 2) * 0.99;
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
  // Track the center of this CompoundEntity
  const centerRef = useRef(new THREE.Vector3());
  const prevCenterRef = useRef();
  // State machine that distributes computation across frames
  const frameStateRef = useRef("init");
  const initialPositionVector = new THREE.Vector3(initialPosition[0], initialPosition[1], initialPosition[2]);
  // Impulse that will be applied to Particles of this CompoundEntity
  const impulseRef = useRef();
  // All true when all entities have registered a ref
  const entitiesRegisteredRef = useRef(false);
  // All true when all Particles in all entities have registered a ref
  // Note the particles are grouped by entity
  const particlesRegisteredRef = useRef(Array.from({ length: entityCount }, () => false));
  // Joints allow for soft body like behavior and create the structure at each scope (joining entities)
  // This is the array of joints to be added by this CompoundEntity
  const newJoints = useRef([]);
  // Info about Particle at the deepest scope
  const particleRadiusRef = useRef(); 
  const particleCountRef = useRef();
  const particleAreaRef = useRef();
  // Used for the Particles
  const instancedMeshRef = useRef();
  const chainRef = props.chainRef || useRef({});
  
  // jsg
  const hull_ref               = useRef()
  let   compilation            = useRef()
  let   compilation_done       = useRef(false);
  const blobVisibleRef         = props.blobVisibleRef || useRef({0: true});
  const prevAncestorVisibleRef = useRef(true);
  
  // Key is the uniqueIndex of a particle. Value is an array of joint ids
  // Any change to particleJointsRef needs to be made to jointRefsRef also
  const particleJointsRef = props.particleJointsRef || useRef({});
  // indexed with `${a.uniqueIndex}-${b.uniqueIndex}`
  // Any change to jointRefsRef needs to be made to particleJointsRef also
  const jointRefsRef = props.jointRefsRef || useRef({});
  const logCountRef = useRef(0);  // Ref to track the number of logs
  const linesRef = useRef({});
  const relationsRef = useRef({});
  // Need to store the userData so we can re-render and not lose the changes to userData
  const localUserDataRef = useRef({uniqueIndex: id});
  const newLinesRef = useRef({});
  const childGetEntityRefFnRef = useRef([]);
  const { world, rapier } = useRapier();

  ////////////////////////////////////////
  // Constants impacting particle behavior
  ////////////////////////////////////////
  const impulsePerParticle = (config.impulsePerParticle || 0.02) * (scope + 1);
  const overshootScaling = config.overshootScaling || 1;
  const maxDisplacement = (config.maxDisplacementScaling || 1) * radius;
  const attractorScaling = config.attractorScaling[scope];
  
  // Initialization logging/debug
  useEffect(() => {
    //console.log("Mounting", id);
    if (isDebug) {
      //console.log("jointsData", id, jointsData);
    }
  }, []);

  // Function to log multiple arguments, limited to 100 total logs (avoids flooding the JS console)
  const limitedLog = (...args) => {
    if (logCountRef.current < 100) {
        console.log(...args);  // Log all arguments passed
        logCountRef.current += 1;  // Increment the log count
    }
  };

  // getEntityRefFn finds an entity ref by walking the CompoundEntity tree.
  // The getEntityRefFn can be called in a parent or child
  // If we need to broaden the scope to find the entity then call parent's getEntityRefFn
  // If we need to narrow the scope to find the entity then call child's getEntityRefFn
  // It is simmilar to a walker
  // A more efficient approach would use Zustand to store/fetch the entityRef 
  // but this is not realistic in terms of what a CompoundEntity should "know"

  // Register the child's getEntityRefFn with the parent when the child mounts
  useEffect(() => {
    if (props.registerGetEntityRefFn) {
      props.registerGetEntityRefFn(index, getEntityRefFn);
    }
  }, [props.registerGetEntityRefFn]);

  // Passed to the child to register the child function in childGetEntityRefFnRef.current
  const registerGetEntityRefFn = (childIndex, method) => {
    childGetEntityRefFnRef.current[childIndex] = method;
  };

  // path is similar to the indexArray e.g. [3,6,7] would fetch the 7th entity from scope 2 
  const getEntityRefFn = (path) => {
    // Check if this Compound Entity is on the path
    for (let i = 0; i < indexArray.length; i++) {
      const val = indexArray[i];
      if (val !== path[i]) {
        // Need to broader scope (call getEntityRefFn in parent)
        return props.getEntityRefFn(path);
      }
    }
    // We have a match so return the ref of this CompoundEntity
    if (path.length == indexArray.length) {
      return internalRef;
    } 
    // Return an entity of this CompoundEntity
    if (path.length == indexArray.length + 1) {
      const entityIndex = path[path.length - 1];
      return entityRefs[entityIndex];
    }
    // Need to narrow the scope (call getEntityRefFn in child)
    const childIndex = path[indexArray.length];
    return childGetEntityRefFnRef.current[childIndex](path);
  };

  const areAllParticlesRegistered = () => {
    return particlesRegisteredRef.current.every(ref => ref === true);
  };

  // Pass up the Particle refs from lower scope so we can find Particles for joints at the scope of this entity
  // The particle radius gets passed up to calculate joint offsets
  const registerParticlesFn = (entityIndex, particleRefs, particleRadius) => {
    entityParticlesRefs[entityIndex].current = [...entityParticlesRefs[entityIndex].current, ...particleRefs];
    particleRadiusRef.current = particleRadius;
    particlesRegisteredRef.current[entityIndex] = true;
    if (areAllParticlesRegistered() && !entitiesRegisteredRef.current) {
      entitiesRegisteredRef.current = true;
      flattenedParticleRefs.current = entityParticlesRefs.flatMap(refs => refs.current);
      if (props.registerParticlesFn) {
        props.registerParticlesFn(index, flattenedParticleRefs.current, particleRadius);
      }
      particleCountRef.current = flattenedParticleRefs.current.length;
      particleAreaRef.current = calculateCircleArea(particleRadius);
      if (scope == 0) {
        console.log(`All particles (radius: ${particleRadiusRef.current}m) are registered`, id, flattenedParticleRefs.current.length, jointsData);
      }
    }
  };

  // Map joints to Particles and align the joint with the initial Particle layout
  const allocateJointsToParticles = (entityParticlesRefs, jointsData) => {
    // Create a new Vector3 to store the world position of this CompoundEntity
    const worldPosition = new THREE.Vector3();
    internalRef.current.getWorldPosition(worldPosition);
    // Vector3 to be used for particle world position
    const particleWorldPosition = new THREE.Vector3();

    const allocateJoints = jointsData.map((jointData, i) => {

      function findClosestParticle(entityParticlesRefs, jointData, worldPosition, excludedEntityIndex) {
        let minDistance = Infinity;
        let closestParticleIndex = -1;
        let closestParticlePosition = new THREE.Vector3();
        let particleEntityIndex = -1;
        let closestParticleRef;
      
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
              closestParticleRef = particleRef;
            }   
          });
        });
      
        return { minDistance, closestParticleIndex, closestParticlePosition, particleEntityIndex, closestParticleRef };
      }
      
      // Initial setup for A
      const resultA = findClosestParticle(entityParticlesRefs, jointData, worldPosition, -1);
      const closestParticleAPosition = resultA.closestParticlePosition;
      const particleAEntityIndex = resultA.particleEntityIndex;
      const closestParticleARef = resultA.closestParticleRef;
      
      // Initial setup for B (excluding the entity of particle A)
      const resultB = findClosestParticle(entityParticlesRefs, jointData, worldPosition, particleAEntityIndex);
      const closestParticleBPosition = resultB.closestParticlePosition;
      const closestParticleBRef = resultB.closestParticleRef; 
      
      // Calculate the direction vector between the two closest particles
      const direction = new THREE.Vector3()
        .subVectors(closestParticleBPosition, closestParticleAPosition)
        .normalize();

      // Calculate the offset to the boundary of the particle
      const offsetA = direction.clone().multiplyScalar(particleRadiusRef.current);
      const offsetB = direction.clone().multiplyScalar(-particleRadiusRef.current);

      const uniqueIndexA = closestParticleARef.current.userData.uniqueIndex
      const uniqueIndexB = closestParticleBRef.current.userData.uniqueIndex

      if (chainRef.current[uniqueIndexA]) {
        if (!chainRef.current[uniqueIndexA].includes(uniqueIndexB)) {
          chainRef.current[uniqueIndexA].push(uniqueIndexB)
        }
      } else {
        chainRef.current[uniqueIndexA] = [uniqueIndexB]
      }
      if (chainRef.current[uniqueIndexB]) {
        if (!chainRef.current[uniqueIndexB].includes(uniqueIndexA)) {
          chainRef.current[uniqueIndexB].push(uniqueIndexA)
        }
      } else {
        chainRef.current[uniqueIndexB] = [uniqueIndexA]
      }

      return {
        a: {
          ref: closestParticleARef,
          offset: offsetA
        },
        b: {
          ref: closestParticleBRef,
          offset: offsetB
        },
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
  const entityImpulses = (center, impulseIn) => {
    const impulse = impulseIn.clone();
    impulse.multiplyScalar(1 /  entityRefs.length);
    entityRefs.forEach((entity, i) => {
      if (entity.current) {
        const entityCenter = entity.current.getCenter();
        if (entityCenter) {
          const displacement = entityCenter.clone()
          displacement.sub(center);
          const directionToCenter = displacement.clone();
          directionToCenter.negate().normalize();
          if (impulse.length() == 0) {
            impulse.copy(directionToCenter);
            impulse.multiplyScalar(impulsePerParticle * particleAreaRef.current * particleCountRef.current  / entityRefs.length);
          }
          // If the entity gets too far from the center then pull it back toward the center
          const overshoot = displacement.length() - maxDisplacement;
          if (overshoot > 0) {
            impulse.copy(directionToCenter);
            impulse.multiplyScalar(impulsePerParticle * particleAreaRef.current * particleCountRef.current  / entityRefs.length);
            impulse.multiplyScalar(overshoot * overshootScaling);
          }
          // Model attractor
          if (attractorScaling) {
            const directionToCenter = attractorScaling > 0 ? displacement.negate().normalize() : displacement.normalize();
            directionToCenter.multiplyScalar(impulse.length() * Math.abs(attractorScaling));
            impulse.add(directionToCenter);
          }
          entity.current.addImpulse(impulse);
        }
      }
    });
  };

  const createJoint = (a, b) => {
    const aUserData = a.ref.userData || a.ref.getUserData();
    const bUserData = b.ref.userData || b.ref.getUserData();
    const jointRefsRefIndex = `${aUserData.uniqueIndex}-${bUserData.uniqueIndex}`;
    const jointRef = { current: null }; // Create a plain object to hold the reference
    jointRef.current = world.createImpulseJoint(
      rapier.JointData.spherical(a.offset, b.offset),
      a.ref,
      b.ref,
      true
    );
    jointRefsRef.current[jointRefsRefIndex] = jointRef;
    particleJointsRef.current[aUserData.uniqueIndex].push(jointRefsRefIndex)
    console.log("createJoint", id, jointRefsRefIndex, jointRef);
    return jointRef;
  };

  const removeJoint = (jointKey) => {
    const jointRef = jointRefsRef.current[jointKey];
    // Get the particles
    const body1 = jointRef.current.body1();
    const body2 = jointRef.current.body2();
    // Remove the joint from the particleJointsRef
    let body1Joints = particleJointsRef.current[body1.userData.uniqueIndex];
    let body2Joints = particleJointsRef.current[body2.userData.uniqueIndex];
    body1Joints = body1Joints.filter(obj => obj !== jointKey);
    body2Joints = body2Joints.filter(obj => obj !== jointKey);
    particleJointsRef.current[body1.userData.uniqueIndex] = body1Joints;
    particleJointsRef.current[body2.userData.uniqueIndex] = body2Joints;
    //console.log("removeJoint", id, jointRef);
    if (jointRef.current) {
      const joint = jointRef.current;
      jointRef.current = undefined;
      if (world.getImpulseJoint(joint.handle)) {
        world.removeImpulseJoint(joint, true);
      }
      delete jointRefsRef.current[jointKey]
    }
  };

  const calculateJointOffsets = (body1, body2, particleRadius) => {
    const body1position = body1.translation();
    const body2position = body2.translation();
    const direction = new THREE.Vector3()
      .subVectors(body1position, body2position)
      .normalize();
    const offset1 = direction.clone().multiplyScalar(-particleRadius);
    const offset2 = direction.clone().multiplyScalar(particleRadius);
    return { offset1, offset2 };
  };

  // Experimenting on how to migrate an entity
  // Start with single particle
  // Need to remove the entity from CompoundEntity center calculations - where does it belong?
  // Could maintain a list of "detached" particles at the CompoundEntity level (can filter for center calc)
  // Adding an entity to a CompoundEntity will also be a challenge e.g. array sizes change
  //   What needs to change ? 
  //     entityCount, entityRefs, entityParticlesRefs, flattenedParticleRefs, entityPositions, jointsData, 
  //     entitiesRegisteredRef, particlesRegisteredRef, newJoints, particleJointsRef
  //   Zustand might be able to store refs when we useRef but not sure that has advantages
  //   Data structures that require remounting could be in Zustand
  //   The entityid could be a unique id that is generated from a singleton rather than ordered.
  //   Work on dynamic change of entityCounts from GUI
  //     When config changes it should impact all Components as it is a prop
  // Could have a "move" entity command that is similar to getEntityRefFn so from anywhere we can call
  // moveEntityFn and it would find the entity and detach it then find the destination and attach it

  useEffect(() => {
    if (!config.detach) return
    // Generate a random number between 1000 and 10000 which determines the duration of relations
    const randomDuration = 1000; //Math.floor(Math.random() * (10000 - 1000 + 1)) + 1000;
    const interval = setInterval(() => {
      // With "Scope-3" this is at scope 1 so userData.uniqueIndex is e.g. "Scope-3-5" not a Particle index
      if (frameStateRef.current !== "init" && id == "Scope-8-3") {
        // Randomly select an entity from this CompoundEntity
        const randomIndexFrom = 1; //Math.floor(Math.random() * entityCount);
        const entityRef = entityRefs[randomIndexFrom];
        const userData = entityRef.current.getUserData();
        const entityUniqueIndex = userData.uniqueIndex;
        const entityJointIndexes = particleJointsRef.current[entityUniqueIndex];
        let replacementEntity;
        let closestIndex;
        let closestDistance = Infinity;
        // Create a new Vector3 to store the world position of this CompoundEntity
        const worldPosition = new THREE.Vector3();
        internalRef.current.getWorldPosition(worldPosition);
        // Vector3 to be used for particle world position
        const particleWorldPosition = new THREE.Vector3();
        entityJointIndexes.forEach((jointKey) => {
          const jointRef = jointRefsRef.current[jointKey];
          const body1 = jointRef.current.body1();
          const body2 = jointRef.current.body2();
          // Entity needs to store parent entity in userData ?
          // Find the entity which is closest to the center of this CompoundEntity
          function replaceEntity(body, entityUniqueIndex) {
            if (body.userData.uniqueIndex === entityUniqueIndex) return false;
            const pos = body.translation();
            particleWorldPosition.set(pos.x, pos.y, pos.z);
            const distance = particleWorldPosition.distanceTo(particleWorldPosition);
            if (distance < closestDistance) {
              closestDistance = distance;
              return true
            } else {
              return false;
            }
          }
          if (replaceEntity(body1, entityUniqueIndex)) {
            replacementEntity = body1;
            closestIndex = body1.userData.uniqueIndex;
          }
          if (replaceEntity(body2, entityUniqueIndex)) {
            replacementEntity = body2;
            closestIndex = body2.userData.uniqueIndex;
          }
          //console.log("Joint anchors", jointKey, a1, body1, a2, body2);
        });
        console.log("Detach a random entity", id, entityUniqueIndex, entityRef, "closestIndex", closestIndex, "replacementEntity", replacementEntity );
        const jointsToCreate = [];
        entityJointIndexes.forEach((jointKey) => {
          const jointRef = jointRefsRef.current[jointKey];
          let body1 = jointRef.current.body1();
          let body2 = jointRef.current.body2();
          if (replacementEntity.userData.uniqueIndex == body1.userData.uniqueIndex) return;
          if (replacementEntity.userData.uniqueIndex == body2.userData.uniqueIndex) return;
          if (body1.userData.uniqueIndex === entityUniqueIndex) {
            body1 = replacementEntity;
          }
          if (body2.userData.uniqueIndex === entityUniqueIndex) {
            body2 = replacementEntity;
          }
          // Can't just copy the offset, need to recalculate them. Create a function for this ?
          // The radius of the replacement may not be the same...
          const {offset1, offset2} = calculateJointOffsets(body1, body2, particleRadiusRef.current);
          // Offset needs to be in local coordinates - should be OK for 
          const a = {
            ref: body1,
            offset: offset1,
          }
          const b = {
            ref: body2,
            offset: offset2,
          }
          jointsToCreate.push([a, b]);
        });
        entityJointIndexes.forEach((jointKey) => {
          removeJoint(jointKey);
          console.log("removeJoint", jointKey);
        });
        jointsToCreate.forEach(([a,b]) => {
          a.ref.userData.color = 'orange';
          b.ref.userData.color = 'orange';
          const newJointRef = createJoint(a, b);
        })
      }
      clearInterval(interval);
    }, randomDuration); 
    return () => {
      clearInterval(interval); // Cleanup interval on component unmount
    }
  }, []);

  // Create relations between entities at a random time interval
  useEffect(() => {
    // Generate a random number between 1000 and 10000 which determines the duration of relations
    const randomDuration = Math.floor(Math.random() * (10000 - 1000 + 1)) + 1000;
    const interval = setInterval(() => {
      if (config.showRelations && frameStateRef.current !== "init") {
        const relationCount = Math.ceil(entityCount * 0.2)
        let relationFound = 0;
        const allKeys = Object.keys(relationsRef.current);
        // Randomly delete keys so we remove relations (and create space for new ones)
        allKeys.forEach(key => {
            if (Math.random() < 0.25) { 
                delete relationsRef.current[key];
            }
        });
        // Update relationFound after removing relations
        relationFound = Object.keys(relationsRef.current).length;
        while (relationFound < relationCount) {

          // Randomly select an entity from this CompoundEntity
          const randomIndexFrom = Math.floor(Math.random() * entityCount);
          const entityRefFrom = entityRefs[randomIndexFrom];
          const userDataFrom = entityRefFrom.current.getUserData() || {};
          const fromId = userDataFrom.uniqueIndex;
          
          // Randomly select an entity which entityRefFrom will go to
          let entityRefTo;
          // Some of the time we want to select an entity outside of this CompoundEntity
          if (Math.random() < 0.2) { 
            let randomPath = [];
            for (let i = 0; i < config.entityCounts.length; i++) {
              const max = config.entityCounts[i];
              // Bias to chose entities that are close to this CompoundEntity
              if (Math.random() < 0.9) { 
                if (indexArray[i]) {
                  randomPath.push(indexArray[i]);
                  continue;
                }
                break;
              }
              const randomIndex = Math.floor(Math.random() * max);
              randomPath.push(randomIndex);
            }
            // getEntityRefFn will walk the CompoundEntity tree to find the entityRef 
            entityRefTo = getEntityRefFn(randomPath)
          // Most of the time we want to select an entity inside this CompoundEntity
          } else {
            let randomIndexTo = Math.floor(Math.random() * entityCount);
            entityRefTo = entityRefs[randomIndexTo];
          }

          const userDataTo = entityRefTo.current.getUserData() || {};
          const toId = userDataTo.uniqueIndex;

          // Avoid selecting the same entity for from and to 
          if (fromId == toId) continue;

          const randomIndexFromRelations = userDataFrom.relations || [];
          entityRefFrom.current.setUserData({ ...userDataFrom, relations: [...randomIndexFromRelations, entityRefTo] });

          if (!relationsRef.current[fromId]) relationsRef.current[fromId] = {};
          relationsRef.current[fromId][toId] = [entityRefFrom, entityRefTo];

          relationFound++
        }
      }
    }, randomDuration); 
    return () => {
      clearInterval(interval); // Cleanup interval on component unmount
    }
  }, [config.showRelations]);

  useFrame(() => {
    // Transfer the CompoundEntity's impulse to entities
    if (entitiesRegisteredRef.current === true) {
      const impulse = internalRef.current.getImpulse();
      if (impulse.length() > 0) {
        const perEntityImpulse = internalRef.current.getImpulse().multiplyScalar(1/entityRefs.length);
        entityRefs.forEach((entity) => {
            entity.current.addImpulse(perEntityImpulse);
        });
        internalRef.current.setImpulse(ZERO_VECTOR);
      }
    }
  });

  useFrame(() => {
    // State machine allows for computation to be distributed across frames, reducing load on the physics engine
    switch (frameStateRef.current) {
      case "init":
        // Initial random impulse to get more interesting behavior
        if (applyInitialImpulse && areAllParticlesRegistered()) {
          centerRef.current = internalRef.current.localToWorld(vec3(initialPosition));
          // Get distance from center ot first joint
          const firstJointData = jointsData[0];
          const firstJointPosition = new THREE.Vector3(firstJointData.position.x, firstJointData.position.y, firstJointData.position.z);
          const distanceToFirstJoint = centerRef.current.distanceTo(internalRef.current.localToWorld(firstJointPosition));
          // foreach particle set a userData entry userData.scopeOuter[scope] = true if the particle is closer to the center than the joint
          flattenedParticleRefs.current.forEach(particleRef => {
            const particlePosition = particleRef.current.translation();
            const particleVector = new THREE.Vector3(particlePosition.x, particlePosition.y, particlePosition.z);
            const distanceToCenter = centerRef.current.distanceTo(particleVector);
            if (!particleRef.current.userData.scopeOuter) {
              particleRef.current.userData.scopeOuter = {};
            }
						const offset = [-0.15, -0.2, 0]; // Why 0.15 ???
            let outer = distanceToCenter >= (distanceToFirstJoint + offset[scope]); 
            const scopeOuter = particleRef.current.userData.scopeOuter;
            if (scopeOuter[scope + 1] === false) {
              outer = false;
            }
						scopeOuter[scope] = outer;
            //if (outer && scope == 0) particleRef.current.userData.color = "black";
          });
          newJoints.current = allocateJointsToParticles(entityParticlesRefs, jointsData);
          // Joints are at different CompoundEntity levels
          // The joints from higher entities are not added to the array (need to init it from props I guess)
          // We need a unique id for all the joints
          newJoints.current.forEach((particles, i) => {
            // At this point userData is not available ?
            const aIndex = particles.a.ref.current.userData.uniqueIndex
            const bIndex = particles.b.ref.current.userData.uniqueIndex
            const jointIndex = `${aIndex}-${bIndex}`;
            if (particleJointsRef.current[aIndex]) {
              if (!particleJointsRef.current[aIndex].includes(jointIndex)) {
                particleJointsRef.current[aIndex].push(jointIndex);
              }
            } else {
              particleJointsRef.current[aIndex] = [jointIndex]
            }
            if (particleJointsRef.current[bIndex]) {
              if (!particleJointsRef.current[bIndex].includes(jointIndex)) {
                particleJointsRef.current[bIndex].push(jointIndex);
              }
            } else {
              particleJointsRef.current[bIndex] = [jointIndex]
            }
          });
          if (config.initialImpulse) {
            const initialImpulseVectors = Array.from({ length: entityCount }, () => new THREE.Vector3(
              (Math.random() - 0.5) * impulsePerParticle,
              (Math.random() - 0.5) * impulsePerParticle,
              0
            ));        
            entityRefs.forEach((entity, i) => {
              if (entity.current) {
                // Add an impulse that is unique to each entity
                const perEntityImpulse = initialImpulseVectors[i].multiplyScalar(entityParticlesRefs[i].current.length);
                entity.current.addImpulse(perEntityImpulse);
              }
            });
          }
          setApplyInitialImpulse(false);
          frameStateRef.current = "findCenter";
        }
        break;
      case "findCenter":
        prevCenterRef.current = scope == 0 ? initialPositionVector : centerRef.current;
        centerRef.current = calculateCenter();
        internalRef.current.setCenter(centerRef.current);
        if (centerRef.current && prevCenterRef.current) {
          frameStateRef.current = "calcEntityImpulses";
        }
        break;
      case "calcEntityImpulses":
        // Could calculate velocity and direction here
        const displacement = centerRef.current.clone();
        displacement.sub(prevCenterRef.current);
        const impulseDirection = displacement.normalize(); // keep moving in the direction of the displacement
        impulseRef.current = impulseDirection.multiplyScalar(impulsePerParticle * particleAreaRef.current * particleCountRef.current);
        frameStateRef.current = "entityImpulses";
        break;
      case "entityImpulses":
        entityImpulses(prevCenterRef.current, impulseRef.current);
        frameStateRef.current = "findCenter";
        break;
      default:
        break;
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
  // The Particle contains the associated rigid body with the physics information.
  // The particle positions (etc.) are collated here to update all the instances at once.
  useFrame(() => {
    if (scope === 0 && instancedMeshRef.current && frameStateRef.current !== "init") {
      const mesh = instancedMeshRef.current;
      
      const userColor = new THREE.Color();
      let colorChanged = false; // Track if any color has changed
      let matrixChanged = false; // Track if any position or scale has changed
      const colorTolerance = 0.01; // Define a tolerance for color comparison
      const userScale = new THREE.Vector3();
      const currentPos = new THREE.Vector3();
      const currentScale = new THREE.Vector3();
      const currentQuaternion = new THREE.Quaternion();
      const invisibleScale = new THREE.Vector3(0, 0, 0);
  
      for (let i = 0; i < particleCountRef.current; i++) {
        const instanceMatrix = new THREE.Matrix4(); // a new instance to avoid transfer between iterations
        // Get the current matrix of the instance
        mesh.getMatrixAt(i, instanceMatrix);
        instanceMatrix.decompose(currentPos, currentQuaternion, currentScale);

        // Get the position of the rigid body (world position)
        const pos = flattenedParticleRefs.current[i].current.translation();
  
        // Get the scale from userData
        const scale = flattenedParticleRefs.current[i].current.userData.scale || 1;
        userScale.set(scale, scale, scale);

        // Get the color from userData
        const color = flattenedParticleRefs.current[i].current.userData.color || 'red';
        userColor.set(color);

        // Get the visibility from userData
        const visible = flattenedParticleRefs.current[i].current.userData.visible || false;
        if (!visible) {
          if (!currentScale.equals(invisibleScale)) {
            currentScale.copy(invisibleScale); // Set scale to 0 to hide
            matrixChanged = true;
          }
        // Compare and update the scale if necessary
        } else if (!currentScale.equals(userScale)) {
          currentScale.copy(userScale);
          matrixChanged = true;
        }
  
        // Compare and update the position if necessary
        if (!currentPos.equals(pos)) {
          currentPos.copy(pos);
          matrixChanged = true;
        }
        
        if (matrixChanged) {
          instanceMatrix.compose(currentPos, currentQuaternion, currentScale);
          mesh.setMatrixAt(i, instanceMatrix);
        }
  
        // Update the color only if it has changed beyond the tolerance threshold
        if (mesh.instanceColor) {
          const currentColor = new THREE.Color();
          mesh.getColorAt(i, currentColor);
  
          if (
            Math.abs(currentColor.r - userColor.r) > colorTolerance ||
            Math.abs(currentColor.g - userColor.g) > colorTolerance ||
            Math.abs(currentColor.b - userColor.b) > colorTolerance
          ) {
            console.log("Color change", i, userColor)
            mesh.setColorAt(i, userColor);
            colorChanged = true;
          }
        } else {
          // If instanceColor is not set, set it now
          mesh.setColorAt(i, userColor);
          colorChanged = true;
        }
      }
  
      // Update the instance matrix to reflect changes only if positions or scales changed
      if (matrixChanged) {
        mesh.instanceMatrix.needsUpdate = true;
      }
  
      // Update the instance color only if any color has changed
      if (colorChanged && mesh.instanceColor) {
        mesh.instanceColor.needsUpdate = true;
      }
    }
  });

  useFrame(() => {
    if (frameStateRef.current === "init") return;
  
    if( ! compilation.current) {

      compilation.current = {
        positions      : [],
        scopeOuters    : [],
        uniqueIndexes  : [],
        position_index : 0,
        hull           : [],
        scope          : 0,			  
      }

      const n = particleCountRef.current;
      for( let i = 0; i < n ; ++i ) {
        compilation.current.positions.push( new THREE.Vector3())
        compilation.current.scopeOuters.push(flattenedParticleRefs.current[i].current.userData.scopeOuter)
        compilation.current.uniqueIndexes.push(flattenedParticleRefs.current[i].current.userData.uniqueIndex)
      }

      // Helper function to recursively build the ordered list
      let all_positions         = [];
      let ordered_uniqueIndexes = [];
      let visited               = new Set();

      function buildOrderedPositions(uniqueIndex) {
				// Prevent infinite loops
				if (visited.has(uniqueIndex)) return false;
				visited.add(uniqueIndex);
				// Find the positionObj with the current uniqueIndex
				const positionObj = all_positions.find(posObj => posObj.uniqueIndex === uniqueIndex);
				if (positionObj) {
					ordered_uniqueIndexes.push(uniqueIndex)
				} else {
					return false;
				}
				const connectedIndexes = chainRef.current[uniqueIndex];
        let foundJoint = false
        if (connectedIndexes.length > 2) {
          for (let i = 0; i < connectedIndexes.length; i++) {
            if (chainRef.current[connectedIndexes[i]].length > 2) {
              if (buildOrderedPositions(connectedIndexes[i])) {
                //console.log("Found joint", uniqueIndex, connectedIndexes[i])
                foundJoint = true;
              }
            } 
          }
        }
        if (!foundJoint) {
          for (let i = 0; i < connectedIndexes.length; i++) {
            buildOrderedPositions(connectedIndexes[i])
          }
        }
        return true;
			}

      function filterMiddleIndexes(chainRef, indexes) {
        const jointIndexes = [];
        // First, find all valid indexes from the provided list where the condition is true
        for (let i = 0; i < indexes.length; i++) {
          const idx = indexes[i];
          //Find joints
          //console.log("chainRef.current[idx].length", idx, i, chainRef.current[idx].length)
          if (chainRef.current[idx].length > 2) {
              jointIndexes.push(i);
          }
        }
        const middleIndexes = [];
        //console.log("jointIndexes", jointIndexes)
        // Now, find indexes that are exactly in the middle between joints
        for (let i = 1; i < jointIndexes.length; i++) {
          // Calculate the middle index
          const midIndex = Math.floor((jointIndexes[i - 1] + jointIndexes[i]) / 2);
          // Avoid adding joints
          if (!jointIndexes.includes(midIndex)) {
            middleIndexes.push(indexes[midIndex]);
          }
        }
        // Calculate the correct middle position between the first and last link with wraparound
        const firstJoint = jointIndexes[0];
        const lastJoint = jointIndexes[jointIndexes.length - 1];
        const indexesLength = indexes.length;
        const distance = (indexesLength - firstJoint + lastJoint);
        const middle = (firstJoint + Math.floor(distance / 2)) % indexes.length;
        middleIndexes.push(indexes[middle]);
        return middleIndexes;
      }
      
      // update the hidden blob so that it can be correctly clicked
      for (let i = 0; i < compilation.current.positions.length; i++) {
        const position = compilation.current.positions[i];
        if ( compilation.current.scopeOuters[i][scope] ) {
          all_positions.push({
            position: position,
            uniqueIndex: compilation.current.uniqueIndexes[i]
          });
        }
      }

      // We need to order all_positions
      // For each uniqueIndex get the array of connected uniqueIndexes from chainRef.current[uniqueIndex] 
      // Find the relevant uniqueIndex from all_positions and contineu to build an ordred list of positions
      // Until we reach the original element we started with

      // Start building the ordered list from each uniqueIndex in all_positions
      const firstIndex = all_positions[0].uniqueIndex;
      buildOrderedPositions(firstIndex);

      const orderedJoint = filterMiddleIndexes(chainRef, ordered_uniqueIndexes);

      compilation.current.orderedJoint = orderedJoint;

      if (scope != 0) {
        blobVisibleRef.current[indexArray.join()] = false;
      }
      if (scope == config.entityCounts.length - 1) {
        blobVisibleRef.current[indexArray.join() + ',0'] = false;
      }
            
    }

    compilation_done.current = true;
        
    const points_to_geometry = points =>{
      const curve           = new THREE.CatmullRomCurve3( points, true )
      const ten_fold_points = curve.getPoints( points.length * 10 )
      const shape           = new THREE.Shape( ten_fold_points )
      const shape_geometry  = new THREE.ShapeGeometry( shape )
      return                shape_geometry
    }

    let ancestorVisible = false;
    for (let i = scope; i > 0; i--) {
      const key = indexArray.slice(0, i).join(); // create a string for the key
      if (blobVisibleRef.current[key]) {
        blobVisibleRef.current[indexArray.join()] = false;
        if (scope == config.entityCounts.length - 1) blobVisibleRef.current[indexArray.join() + ',0'] = false;
        ancestorVisible = true;
        break;
      }
    }

    if (!ancestorVisible && prevAncestorVisibleRef.current) {
      blobVisibleRef.current[indexArray.join()] = true;
    }

    prevAncestorVisibleRef.current = ancestorVisible;

    hull_ref.current.visible = blobVisibleRef.current[indexArray.join()];

    /*
    if (scope == config.entityCounts.length - 1) {
      for (let i = 0; i < flattenedParticleRefs.current.length; i++) {
        flattenedParticleRefs.current[i].current.userData.visible = blobVisibleRef.current[indexArray.join() + ',0'];
      }
    }
    */
    //if (!ancestorVisible) {
    
      const worldVector = new THREE.Vector3();

      for (let i = 0; i < particleCountRef.current; i++) {
        // Get the position of the rigid body, this is world position
        const pos = flattenedParticleRefs.current[i].current.translation();
        worldVector.set(pos.x, pos.y, pos.z);
        compilation.current.positions[i].copy(internalRef.current.worldToLocal(worldVector))
      }

      let jointPositions = []
      const all_positions =[]

      function getPositions(indexes) {
        return indexes.map(idx => {
            const positionObj = all_positions.find(posObj => posObj.uniqueIndex === idx);
            return positionObj.position;
        });
      }

      if (scope == config.entityCounts.length - 1) {
        for (let i = 0; i < particleCountRef.current; i++) {
          const position = compilation.current.positions[i];
          jointPositions.push(position);
        }
      } else {
        for (let i = 0; i < compilation.current.positions.length; i++) {
          const position = compilation.current.positions[i];
          if ( compilation.current.scopeOuters[i][scope] ) {
            all_positions.push({
              position: position,
              uniqueIndex: compilation.current.uniqueIndexes[i]
            });
          }
        }
        jointPositions = getPositions(compilation.current.orderedJoint);
      }

      const geometry = points_to_geometry( jointPositions )
      hull_ref.current.geometry.dispose()
      hull_ref.current.geometry = geometry
    //}

    // hide / show blobs
    const show_or_hide_particles = show_or_hide =>{
      if( scope != config.entityCounts.length - 1 ) return

      for ( let i = 0; i < flattenedParticleRefs.current.length; ++i ) {
        flattenedParticleRefs.current[i].current.userData.visible = show_or_hide
      }
    }
    hull_ref.current.visible = false
    switch( global_scope ){
      case 0 :{
        // only show scope 0 blob
        hull_ref.current.visible = scope == 0
        show_or_hide_particles   ( false )
      } break
      case 1 :{
        if( ! hull_ref.current.userData.visible ){
          // show scope 1 for the first time ?
          if( ! hull_ref.current.userData.clicks ){
            hull_ref.current.visible = scope == 1
            show_or_hide_particles   ( false )
          }
        } else {
          hull_ref.current.visible = scope != 0
          show_or_hide_particles   ( false )
        }
      }
    }
  });

  const Handle_click = ( event, blobVisibleRef, scope, config ) => { 
    console.log("Handle_click", id, event)

    // avoid processing hidden blobs
    if( ! hull_ref.current.visible ) return

    switch( global_scope ){
      case 0 :{
        global_scope = 1
      } break
      case 1 :{
        // hide the clicked blob
        hull_ref.current.userData.visible = false
        hull_ref.current.userData.clicks++
        
        // show all the children
        entityRefs.forEach( entity => {
          if (entity.current) {
            if (entity.current.current) {
              if( 'children' in entity.current.current ){
                entity.current.current.children.forEach( child =>{
                  child.userData.visible = true
                })
              } else {
                entity.current.current.userData.visible = true
              }
            }
          }          
        })
      } break
    } 
  }
  

  function Relations({ internalRef, relationsRef, linesRef, newLinesRef }) {
    
    const segmentIndexRef = useRef({}); // Keeps track of the current segment index
    const numPoints = 12;
    const lineWidth = (config.entityCounts.length - scope)
    const material = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: lineWidth });
    const [linesUpdate, setLinesUpdate] = useState(0);
  
    useFrame(() => {
      let update = false;
      // Create new lines (only if relation is new)
      Object.keys(relationsRef.current).forEach(fromId => {
        Object.keys(relationsRef.current[fromId]).forEach(toId => {
          if (linesRef.current[fromId] && linesRef.current[fromId][toId]) return;
          const geometry = new THREE.BufferGeometry();
          const positions = new Float32Array(numPoints * 3);
          geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
          const line = new THREE.Line(geometry, material);
          if (!linesRef.current[fromId]) linesRef.current[fromId] = {};
          linesRef.current[fromId][toId] = { ref: React.createRef(), line };
          newLinesRef.current[`${fromId}-${toId}`] = true;
          update = true;
        });
      });

      if (update) setLinesUpdate(prev => prev + 1);
  
      Object.keys(linesRef.current).forEach(fromId => {
        Object.keys(linesRef.current[fromId]).forEach(toId => {
          // Remove lineRef for relations that no longer exist
          if (!relationsRef.current[fromId]) {
            delete linesRef.current[fromId];
            return;
          } else if (!relationsRef.current[fromId][toId]) {
            delete linesRef.current[fromId][toId];
            return;
          }
          const { ref, line } = linesRef.current[fromId][toId];
          if (ref.current) {
            const startPoint = internalRef.current.worldToLocal(relationsRef.current[fromId][toId][0].current.getCenter());
            const endPoint = internalRef.current.worldToLocal(relationsRef.current[fromId][toId][1].current.getCenter());
            const start = new THREE.Vector3(startPoint.x, startPoint.y, startPoint.z);
            const end = new THREE.Vector3(endPoint.x, endPoint.y, endPoint.z);
            const distance = start.distanceTo(end);
            const curveAmount = distance * 0.5;
            const mid = new THREE.Vector3(
              (start.x + end.x) / 2 + curveAmount * 0.2,
              (start.y + end.y) / 2 + curveAmount * 0.2,
              (start.z + end.z) / 2 + curveAmount,
            );
    
            const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
            const points = curve.getPoints(numPoints-1); // This return one more point than numPoints - number of segments ?
            const positions = line.geometry.attributes.position.array;

            if (!segmentIndexRef.current[`${fromId}-${toId}`]) {
              segmentIndexRef.current[`${fromId}-${toId}`] = 1
            }
            
            if (newLinesRef.current[`${fromId}-${toId}`]) {
              if (segmentIndexRef.current[`${fromId}-${toId}`] == numPoints) {
                delete newLinesRef.current[`${fromId}-${toId}`]
              }
            } else {
              segmentIndexRef.current[`${fromId}-${toId}`] = numPoints;
            }
    
            // Determine the number of segments to reveal
            const segmentCount = Math.min(numPoints, segmentIndexRef.current[`${fromId}-${toId}`]);
    
            // segmentCount is initialized to 1 so we get a first segment
            for (let j = 0; j < segmentCount; j++) {
              positions[j * 3] = points[j].x;
              positions[j * 3 + 1] = points[j].y;
              positions[j * 3 + 2] = points[j].z;
            }
    
            if (segmentCount < numPoints) {
              // Set remaining positions to the last revealed point
              const lastVisiblePoint = points[segmentCount - 1];
              for (let j = segmentCount; j < numPoints; j++) {
                positions[j * 3] = lastVisiblePoint.x;
                positions[j * 3 + 1] = lastVisiblePoint.y;
                positions[j * 3 + 2] = lastVisiblePoint.z;
              }
            }
    
            line.geometry.attributes.position.needsUpdate = true;

            // Increment the segment index for the next frame
            segmentIndexRef.current[`${fromId}-${toId}`] = Math.min(segmentIndexRef.current[`${fromId}-${toId}`] + 1, numPoints);
          }
        });
      });
    });
  
    return (
      <>
        {linesRef.current && (
          <group>
            {Object.keys(linesRef.current).map(fromId => 
              Object.keys(linesRef.current[fromId]).map((toId) => {
                const { ref, line } = linesRef.current[fromId][toId];
                return (
                  <primitive key={`${linesUpdate}-${fromId}-${toId}`} object={line} ref={ref} />
                );
              })
            )}
          </group>
        )}
      </>
    );    
  }
  
  // Should use entity instead of particle as per relations 
  const handlePointerDown = (event) => {
    const instanceId = event.instanceId;
    if (instanceId !== undefined) {
      const userData = flattenedParticleRefs.current[instanceId].current.userData;
      const currentScale = userData.scale;
      // Maybe we should have a function on the particle that allows for scaling
      console.log("handlePointerDown", id, instanceId, userData, flattenedParticleRefs.current[instanceId].current);
      if (currentScale && currentScale != 1) {
        flattenedParticleRefs.current[instanceId].current.userData.scale = 1.0;
      } else {
        flattenedParticleRefs.current[instanceId].current.userData.scale = 2.0;
      }
      flattenedParticleRefs.current[instanceId].current.userData.color = 'pink';
    }
  };
  
  // This is only used in debug
  const localJointPosition = (groupRef, particle, side) => {
    const worldPosition = particle.ref.current.translation();
    const xOffset = particle.offset.x;
    const yOffset = particle.offset.y;
    const zOffset = 0.4;
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
    <CompoundEntityGroup ref={internalRef} position={initialPosition} userData={localUserDataRef.current}>
      {entityRefs.map((entityRef, i) => (
        <Entity
          key={`${id}-${i}`}
          id={`${id}-${i}`}
          initialPosition={entityPositions[i].toArray()}
          radius={entityRadius}
          color={color}
          scope={scope + 1}
          index={i}
          indexArray={[...indexArray, i]}
          ref={entityRef}
          registerParticlesFn={registerParticlesFn}
          debug={isDebug}
          config={config}
          userData={{ color }}
          blobVisibleRef={blobVisibleRef}
          particleJointsRef={particleJointsRef}
          jointRefsRef={jointRefsRef}
          getEntityRefFn={getEntityRefFn}
          registerGetEntityRefFn={registerGetEntityRefFn}
		  
		  // jsg 
      chainRef = {chainRef}	  
          
        />
      ))}

      {newJoints.current.map((particles, i) => (
        <Joint 
          a={particles.a} 
          b={particles.b} 
          key={`${id}-${i}-joint`}
          jointRefsRef={jointRefsRef}
        />
      ))}

	  {/*// jsg*/}
	  
	  <mesh 
      ref           = { hull_ref } 
      userData      = {{ visible : false, clicks : 0 }}
		  onContextMenu = { event => global_scope = 0  }	 
      onClick       = { event => { 	
        Handle_click( event, blobVisibleRef, scope, config )
      }}>
	    <meshBasicMaterial color = {color}/>
	  </mesh>
	  
      {scope == 0 && particleCountRef.current && (
        <instancedMesh 
          ref={instancedMeshRef} 
          args={[null, null, particleCountRef.current]}
          onClick={(e) => handlePointerDown(e)}
        >
          <circleGeometry args={[particleRadiusRef.current, 16]} /> 
          <meshStandardMaterial />
        </instancedMesh>
      )}

      {entitiesRegisteredRef.current && (
        <Relations 
          internalRef={internalRef} 
          relationsRef={relationsRef} 
          linesRef={linesRef} 
          newLinesRef={newLinesRef} 
        />
      )}

      {/* Unclear why we need this but without it the remounting caused by GUI controls changing the key does not work*/}
      <Circle 
        id={`${id}.mounting`} 
        initialState={{ 
          radius: 0, 
          color: color,
          opacity: 0,
        }}  
      />

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
          {newJoints.current.map((particles, i) => (
            <>
              <CircleDrei
                args={[0.1, 8]} 
                position={localJointPosition(internalRef, particles.a, "A")}
                material-color="red"
              />
              <CircleDrei
                args={[0.1, 8]} 
                position={localJointPosition(internalRef, particles.b, "B")}
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
    </CompoundEntityGroup>
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

const arraysEqual = (arr1, arr2) => {
  if (arr1.length !== arr2.length) return false;
  for (let i = 0; i < arr1.length; i++) {
      if (arr1[i] !== arr2[i]) return false;
  }
  return true;
};
