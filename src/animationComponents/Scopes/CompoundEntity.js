import React, { useEffect, useMemo, useRef, useImperativeHandle, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import CompoundEntityGroup from './CompoundEntityGroup';
import * as THREE from 'three';
import { Circle } from '..';
import _ from 'lodash';
import useStore from '../../useStore'
import { getColor } from './utils';
import Particle from './Particle';
import InstancedParticles from './InstancedParticles';
import Joint from './Joint'
import Blob from './Blob';
import Relations from './Relations';
import useLimitedLog from '../../hooks/useLimitedLog';
import useParticlesRegistration from './useParticlesRegistration';
import useRandomRelations from './useRandomRelations';
import useJoints from './useJoints';
import useImpulses from './useImpulses';
import useEntityStore from './useEntityStore';
import DebugRender from './DebugRender';

const CompoundEntity = React.memo(React.forwardRef(({ id, indexArray = [], initialPosition = [0, 0, 0], scope = 0, radius, config, ...props }, ref) => {

    const isDebug = props.debug || config.debug;

    // Using forwardRef and need to access the ref from inside this component too
    const internalRef = useRef();
    useImperativeHandle(ref, () => internalRef.current);

    const entityCount = config.entityCounts[scope];
    // Store the color in a a state so it si consistent across renders, setColor is not used
    const configColor = config.colors[scope];
    const color = useMemo(() => getColor(configColor, props.color), [configColor, props.color]);
    // At the deepest scope we will instantiate Particles instead of CompoundEntity
    const lastCompoundEntity = (scope == config.entityCounts.length - 1);
    const Entity = lastCompoundEntity ? Particle : CompoundEntity;

    const { initializeEntityRefs, getEntityRefs } = useEntityStore(state => ({
        initializeEntityRefs: state.initializeEntityRefs,
        getEntityRefs: state.getEntityRefs,
    }));

    useEffect(() => {
        if (!getEntityRefs(indexArray).length) {
            initializeEntityRefs(indexArray, entityCount);
        }
    }, [entityCount, indexArray, initializeEntityRefs, getEntityRefs]);

    const entityRefsArray = getEntityRefs(indexArray);
    
    // The entity radius fills the boundary of CompoundEntity with a margin to avoid overlap
    const entityRadius = Math.min((radius * Math.PI / (entityCount + Math.PI)), radius / 2) * 0.99;
    // Track the center of this CompoundEntity
    const centerRef = useRef(new THREE.Vector3());
    const prevCenterRef = useRef();
    // State machine that distributes computation across frames
    const frameStateRef = useRef("init");
    const initialPositionVector = new THREE.Vector3(...initialPosition);
    // Joints allow for soft body like behavior and create the structure at each scope (joining entities)
    // This is the array of joints added by this CompoundEntity
    // Joints could be held in ZuStand and instantiated in top
    // Instead of Joint we should use the create function
    const newJointsRef = useRef([]);
    // Key is uniqueIndex of the particle. Value is array of linked (through joints) uniqueIndex 
    //Sould be moved into ZuStand
    const chainRef = props.chainRef || useRef({});
    //Sould be moved into ZuStand
    const blobVisibleRef = props.blobVisibleRef || useRef({ 0: true });

    // Key is the uniqueIndex of a particle. Value is an array of joint ids
    // Any change to particleJointsRef needs to be made to jointRefsRef also
    //Sould be moved into ZuStand
    const particleJointsRef = props.particleJointsRef || useRef({});
    const jointScopeRef = props.jointScopeRef || useRef({});
    // indexed with `${a.uniqueIndex}-${b.uniqueIndex}`
    // Any change to jointRefsRef needs to be made to particleJointsRef also
    const jointRefsRef = props.jointRefsRef || useRef({});

    const relationsRef = useRef({});
    // Need to store the userData so we can re-render and not lose the changes to userData
    const localUserDataRef = useRef({ uniqueIndex: id });
    const limitedLog = useLimitedLog(100);
    const [initializePhysics, setInitializePhysics] = useState(false); 
    const [initializedPhysics, setInitializedPhysics] = useState(false); 

    // Logging/debug
    useEffect(() => {
        if (scope == 0) limitedLog("Mounting from scope 0", id);
    }, []);

    // Use the custom hook for creating random relations
    // Maybe rename to useAnimateRelations (useImpulse could be broken out into useAnimateImpulses)
    useRandomRelations(config, frameStateRef, entityCount, relationsRef, indexArray);

    // Distribute entities within the perimeter
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

    // Layout to avoid Particle overlap (which can cause extreme forces in Rapier)
    const entityPositions = useMemo(() => {
        return generateEntityPositions(radius - entityRadius, entityCount);
    }, [radius, entityRadius, entityCount]);

    const index = scope ? indexArray[scope - 1] : 0;

    //Sould be moved into ZuStand ?
    const {
        registerParticlesFn,
        // An array of entityCount length that stores the particle refs associated with each entity
        //Sould be moved into ZuStand
        entityParticlesRefsRef,
        // All true when all entities have registered a ref
        entitiesRegisteredRef,
        // A simple array with all the refs
        flattenedParticleRefs,
        particleCount,
        //Sould be moved into ZuStand
        particleAreaRef,
        //Sould be moved into ZuStand
        particleRadiusRef,
        areAllParticlesRegistered
    } = useParticlesRegistration(props, index, scope, id, config);

    // Relying on order of args is not good with such large numbres of args
    //Sould be moved into ZuStand for particleJointsRef, jointScopeRef, jointRefsRef, particleRadiusRef, chainRef,
    const { jointsData, initializeJoints } = useJoints(particleJointsRef, jointScopeRef, jointRefsRef, particleRadiusRef, chainRef, frameStateRef, id, config, internalRef, entityPositions, scope, entityParticlesRefsRef);

    const { entityImpulses, impulseRef, applyInitialImpulses, calculateImpulses } = useImpulses(
        id,
        internalRef,
        entitiesRegisteredRef,
        indexArray,
        particleAreaRef,
        particleCount,
        config,
        scope,
    );

    const setPausePhysics = useStore((state) => state.setPausePhysics)

    // Find center of this CompoundEntity (using the centers of the entities at the lower scope)
    const calculateCenter = () => {
        const center = new THREE.Vector3();
        let activeEntities = 0;
        entityRefsArray.forEach((entity) => {
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

    useEffect(() => {
        if (initializePhysics && !initializedPhysics) {
            newJointsRef.current = initializeJoints(flattenedParticleRefs, initialPosition);
            frameStateRef.current = "initialImpulse";
            // Need to set state to trigger re-rendering of this component
            // otherwise the satte machine gets stuck
            setInitializedPhysics(true);
        }
    }, [initializePhysics]);

    useFrame(() => {
        // State machine allows for computation to be distributed across frames, reducing load on the physics engine
        switch (frameStateRef.current) {
            case "init":
                // Use a state to trigger the initializeJoints as this may take longer than a frame
                if (!initializePhysics && areAllParticlesRegistered()) setInitializePhysics(true);
                break;
            // Should move this into useImpulses
            case "initialImpulse":
                if (config.initialImpulse) {
                    applyInitialImpulses(flattenedParticleRefs);
                }
                frameStateRef.current = "findCenter";
                break
            case "findCenter":
                prevCenterRef.current = scope == 0 ? initialPositionVector : centerRef.current;
                centerRef.current = calculateCenter();
                // could use ZuStand to avoid needing extensions to group e.g. setCenter
                // Could also manage the impulses through ZuStand
                internalRef.current.setCenter(centerRef.current);
                if (centerRef.current && prevCenterRef.current) {
                    frameStateRef.current = "calcEntityImpulses";
                }
                break;
            // Should move this into useImpulses
            case "calcEntityImpulses":
                // Could calculate velocity and direction here
                calculateImpulses(centerRef, prevCenterRef);
                frameStateRef.current = "entityImpulses";
                break;
            case "entityImpulses":
                entityImpulses(prevCenterRef.current, impulseRef.current);
                frameStateRef.current = "findCenter";
                break;
            default:
                console.error("Unexpected state", id, frameStateRef.current)
                break;
        }

    });

    return (
        <>
            <CompoundEntityGroup ref={internalRef} position={initialPosition} userData={localUserDataRef.current}>
                {entityRefsArray.map((entityRef, i) => (
                    <Entity
                        key={`${id}-${i}`}
                        id={`${id}-${i}`}
                        initialPosition={entityPositions[i].toArray()}
                        radius={entityRadius}
                        color={color}
                        scope={scope + 1}
                        indexArray={[...indexArray, i]}
                        ref={entityRef}
                        registerParticlesFn={registerParticlesFn}
                        debug={isDebug}
                        config={config}
                        blobVisibleRef={blobVisibleRef}
                        particleJointsRef={particleJointsRef}
                        jointScopeRef={jointScopeRef}
                        jointRefsRef={jointRefsRef}
                        chainRef={chainRef}
                    />
                ))}

                {frameStateRef.current !== "init" && (
                    <Blob
                        id={`blob-${id}`}
                        blobVisibleRef={blobVisibleRef}
                        indexArray={indexArray}
                        scope={scope}
                        flattenedParticleRefs={flattenedParticleRefs}
                        chainRef={chainRef}
                        lastCompoundEntity={lastCompoundEntity}
                        worldToLocalFn={internalRef.current.worldToLocal}
                        color={color}
                        jointScopeRef={jointScopeRef}
                    />
                )}

                {scope === 0 && particleCount && (
                    <InstancedParticles
                        id={`particles-${id}`}
                        flattenedParticleRefs={flattenedParticleRefs}
                        particleRadiusRef={particleRadiusRef}
                    />
                )}

                {entitiesRegisteredRef.current && (
                    <Relations
                        internalRef={internalRef}
                        relationsRef={relationsRef}
                        config={config}
                        scope={scope}
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

                <DebugRender
                    id={id}
                    radius={radius}
                    color={color}
                    initialPosition={initialPosition}
                    jointsData={jointsData}
                    newJointsRef={newJointsRef}
                    index={index}
                    internalRef={internalRef}
                    isDebug={isDebug}
                    centerRef={centerRef}
                />

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


