import React, { useEffect, useMemo, useRef, useImperativeHandle, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import CompoundEntityGroup from './CompoundEntityGroup';
import * as THREE from 'three';
import { Circle } from '..';
import useStore from '../../useStore';
import { useRapier, vec3 } from '@react-three/rapier';
import _ from 'lodash';
import Particle from './Particle';
import { getColor } from './utils';
import Joint from './Joint'
import Blob from './Blob';
import DebugRender from './DebugRender';
import useLimitedLog from '../../hooks/useLimitedLog';
import useEntityRef from './useEntityRef';
import useParticlesRegistration from './useParticlesRegistration';
import InstancedParticles from './InstancedParticles';

const ZERO_VECTOR = new THREE.Vector3();

const CompoundEntity = React.memo(React.forwardRef(({ id, index, indexArray = [], initialPosition = [0, 0, 0], scope = 0, radius, config, ...props }, ref) => {

    const isDebug = props.debug || config.debug;

    // Using forwardRef and need to access the ref from inside this component too
    const internalRef = useRef();
    useImperativeHandle(ref, () => internalRef.current);

    const entityCount = config.entityCounts[scope];
    // Store the color in a a state so it si consistent across renders, setColor is not used
    const [color, setColor] = useState(getColor(config, scope, props.color || "blue"));
    const lastCompoundEntity = (scope == config.entityCounts.length - 1);
    // At the deepest scope we will instantiate Particles instead of CompoundEntity
    const Entity = lastCompoundEntity ? Particle : CompoundEntity;
    // Used for Circle animation when isDebug, the position is managed by r3f not rapier
    const getComponentRef = useStore((state) => state.getComponentRef);
    // Array of refs to entities (either CompoundEntity or Particles)
    const entityRefs = Array.from({ length: entityCount }, () => useRef());
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
    // Joints allow for soft body like behavior and create the structure at each scope (joining entities)
    // This is the array of joints to be added by this CompoundEntity
    const newJoints = useRef([]);
    // Used for the Particles
    const instancedMeshRef = useRef();
    const chainRef = props.chainRef || useRef({});
    const blobRef = useRef()
    const blobData = useRef()
    const blobVisibleRef = props.blobVisibleRef || useRef({ 0: true });

    // Key is the uniqueIndex of a particle. Value is an array of joint ids
    // Any change to particleJointsRef needs to be made to jointRefsRef also
    const particleJointsRef = props.particleJointsRef || useRef({});
    // indexed with `${a.uniqueIndex}-${b.uniqueIndex}`
    // Any change to jointRefsRef needs to be made to particleJointsRef also
    const jointRefsRef = props.jointRefsRef || useRef({});
    const linesRef = useRef({});
    const relationsRef = useRef({});
    // Need to store the userData so we can re-render and not lose the changes to userData
    const localUserDataRef = useRef({ uniqueIndex: id });
    const newLinesRef = useRef({});
    const { world, rapier } = useRapier();
    const limitedLog = useLimitedLog(100); 
    const { getEntityRefFn, registerGetEntityRefFn } = useEntityRef(props, index, indexArray, internalRef, entityRefs);
    const {
        registerParticlesFn,
        // An array of entityCount length that stores the particle refs associated with each entity
        entityParticlesRefsRef,
        // All true when all Particles in all entities have registered a ref
        // All true when all entities have registered a ref
        entitiesRegisteredRef,
        // A simple array with all the refs
        flattenedParticleRefs,
        particleAreaRef,
        particleRadiusRef,
        areAllParticlesRegistered
    } = useParticlesRegistration(props, index, scope, id, jointsData, config);
    const particleCount = useMemo(() => flattenedParticleRefs?.current?.length, [flattenedParticleRefs.current]);

    ////////////////////////////////////////
    // Constants impacting particle behavior
    ////////////////////////////////////////
    const impulsePerParticle = (config.impulsePerParticle || 0.02) * (scope + 1);
    const overshootScaling = config.overshootScaling || 1;
    const maxDisplacement = (config.maxDisplacementScaling || 1) * radius;
    const attractorScaling = config.attractorScaling[scope];

    // Logging/debug
    useEffect(() => {
        if (scope == 0) limitedLog("Mounting from scope 0", id);
        if (isDebug) {
            //console.log("jointsData", id, jointsData);
        }
    }, []);

    // Map joints to Particles and align the joint with the initial Particle layout
    const allocateJointsToParticles = (entityParticlesRefsRef, jointsData) => {
        // Create a new Vector3 to store the world position of this CompoundEntity
        const worldPosition = new THREE.Vector3();
        internalRef.current.getWorldPosition(worldPosition);
        // Vector3 to be used for particle world position
        const particleWorldPosition = new THREE.Vector3();

        const allocateJoints = jointsData.map((jointData, i) => {

            function findClosestParticle(entityParticlesRefsRef, jointData, worldPosition, excludedEntityIndex) {
                let minDistance = Infinity;
                let closestParticleIndex = -1;
                let closestParticlePosition = new THREE.Vector3();
                let particleEntityIndex = -1;
                let closestParticleRef;

                entityParticlesRefsRef.current.forEach((entity, entityIndex) => {
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
            const resultA = findClosestParticle(entityParticlesRefsRef, jointData, worldPosition, -1);
            const closestParticleAPosition = resultA.closestParticlePosition;
            const particleAEntityIndex = resultA.particleEntityIndex;
            const closestParticleARef = resultA.closestParticleRef;

            // Initial setup for B (excluding the entity of particle A)
            const resultB = findClosestParticle(entityParticlesRefsRef, jointData, worldPosition, particleAEntityIndex);
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
        impulse.multiplyScalar(1 / entityRefs.length);
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
                        impulse.multiplyScalar(impulsePerParticle * particleAreaRef.current * particleCount / entityRefs.length);
                    }
                    // If the entity gets too far from the center then pull it back toward the center
                    const overshoot = displacement.length() - maxDisplacement;
                    if (overshoot > 0) {
                        impulse.copy(directionToCenter);
                        impulse.multiplyScalar(impulsePerParticle * particleAreaRef.current * particleCount / entityRefs.length);
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
    //     entityCount, entityRefs, entityParticlesRefsRef, flattenedParticleRefs, entityPositions, jointsData, 
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
                console.log("Detach a random entity", id, entityUniqueIndex, entityRef, "closestIndex", closestIndex, "replacementEntity", replacementEntity);
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
                    const { offset1, offset2 } = calculateJointOffsets(body1, body2, particleRadiusRef.current);
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
                jointsToCreate.forEach(([a, b]) => {
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
                const perEntityImpulse = internalRef.current.getImpulse().multiplyScalar(1 / entityRefs.length);
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
                    newJoints.current = allocateJointsToParticles(entityParticlesRefsRef, jointsData);
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
                    setApplyInitialImpulse(false);
                    frameStateRef.current = "initialImpulse";
                }
                break;
            case "initialImpulse":
                //return // Uncomment to stop before impulses
                if (config.initialImpulse) {
                    const initialImpulseVectors = Array.from({ length: entityCount }, () => new THREE.Vector3(
                        (Math.random() - 0.5) * impulsePerParticle,
                        (Math.random() - 0.5) * impulsePerParticle,
                        0
                    ));
                    entityRefs.forEach((entity, i) => {
                        if (entity.current) {
                            // Add an impulse that is unique to each entity
                            const perEntityImpulse = initialImpulseVectors[i].multiplyScalar(entityParticlesRefsRef.current[i].current.length);
                            entity.current.addImpulse(perEntityImpulse);
                        }
                    });
                }
                frameStateRef.current = "findCenter";
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
                impulseRef.current = impulseDirection.multiplyScalar(impulsePerParticle * particleAreaRef.current * particleCount);
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
                        const points = curve.getPoints(numPoints - 1); // This return one more point than numPoints - number of segments ?
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
        event.stopPropagation();
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
                        chainRef={chainRef}
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

                {frameStateRef.current !== "init" && (
                    <Blob
                        id={`blob-${id}`}
                        blobRef={blobRef}
                        blobData={blobData}
                        blobVisibleRef={blobVisibleRef}
                        indexArray={indexArray}
                        scope={scope}
                        flattenedParticleRefs={flattenedParticleRefs}
                        chainRef={chainRef}
                        lastCompoundEntity={lastCompoundEntity}
                        worldToLocalFn={internalRef.current.worldToLocal}
                        color={color}
                    />
                )}

                {scope === 0 && particleCount && (
                    <InstancedParticles
                        ref={instancedMeshRef}
                        particleCount={particleCount}
                        flattenedParticleRefs={flattenedParticleRefs}
                        particleRadiusRef={particleRadiusRef}
                        onClick={handlePointerDown}
                    />
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
                        opacity: 0,
                    }}
                />

                {isDebug && (
                    <DebugRender
                        id={id}
                        radius={radius}
                        color={color}
                        initialPosition={initialPosition}
                        jointsData={jointsData}
                        newJoints={newJoints}
                        scope={scope}
                        index={index}
                        localJointPosition={localJointPosition}
                        internalRef={internalRef}
                    />
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

export default CompoundEntity;

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


