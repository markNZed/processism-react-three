import React, { useEffect, useMemo, useRef, useImperativeHandle } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import CompoundEntityGroup from './CompoundEntityGroup';
import * as THREE from 'three';
import { Circle } from '..';
import _ from 'lodash';
import { getColor } from './utils';
import Particle from './Particle';
import InstancedParticles from './InstancedParticles';
import Joint from './Joint'
import Blob from './Blob';
import Relations from './Relations';
import useLimitedLog from '../../hooks/useLimitedLog';
import useEntityRef from './useEntityRef';
import useParticlesRegistration from './useParticlesRegistration';
import useRandomRelations from './useRandomRelations';
import useJoints from './useJoints';
import useImpulses from './useImpulses';
import useEntityStore from './useEntityStore';
import DebugRender from './DebugRender';

const CompoundEntity = React.memo(React.forwardRef(({ id, index, indexArray = [], initialPosition = [0, 0, 0], scope = 0, radius, config, ...props }, ref) => {

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

    // Array of refs to entities (either CompoundEntity or Particles)
    const { initializeEntityRefs, getEntityRefs } = useEntityStore(state => ({
        initializeEntityRefs: (id, count) => state.initializeEntityRefs(id, count),
        getEntityRefs: (id) => state.getEntityRefs(id),
    }));

    useEffect(() => {
        if (!getEntityRefs(id).length) {
            initializeEntityRefs(id, entityCount);
        }
    }, [entityCount, id, initializeEntityRefs, getEntityRefs]);

    const entityRefsArray = getEntityRefs(id);
    
    // The entity radius fills the boundary of CompoundEntity with a margin to avoid overlap
    const entityRadius = Math.min((radius * Math.PI / (entityCount + Math.PI)), radius / 2) * 0.99;
    // Track the center of this CompoundEntity
    const centerRef = useRef(new THREE.Vector3());
    const prevCenterRef = useRef();
    // State machine that distributes computation across frames
    const frameStateRef = useRef("init");
    const initialPositionVector = new THREE.Vector3(...initialPosition);
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
    const limitedLog = useLimitedLog(100); 
    const { getEntityRefFn, registerGetEntityRefFn } = useEntityRef(props, index, indexArray, internalRef, entityRefsArray);

    // Logging/debug
    useEffect(() => {
        if (scope == 0) limitedLog("Mounting from scope 0", id);
    }, []);

    // Use the custom hook for creating random relations
    useRandomRelations(config, frameStateRef, entityCount, entityRefsArray, getEntityRefFn, relationsRef, indexArray);

    // Distribute within the perimeter
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

    // Layout to avoid Particle overlap
    const entityPositions = useMemo(() => {
        return generateEntityPositions(radius - entityRadius, entityCount);
    }, [radius, entityRadius, entityCount]);

    const {
        registerParticlesFn,
        // An array of entityCount length that stores the particle refs associated with each entity
        entityParticlesRefsRef,
        // All true when all entities have registered a ref
        entitiesRegisteredRef,
        // A simple array with all the refs
        flattenedParticleRefs,
        particleCount,
        particleAreaRef,
        particleRadiusRef,
        areAllParticlesRegistered
    } = useParticlesRegistration(props, index, scope, id, config);

    const { jointsData, initializeJoints } = useJoints(particleJointsRef, jointRefsRef, entityRefsArray, particleRadiusRef, chainRef, frameStateRef, id, config, internalRef, entityPositions, scope, entityParticlesRefsRef);

    const { entityImpulses, impulseRef, applyInitialImpulses, calculateImpulses } = useImpulses(
        id,
        internalRef,
        entitiesRegisteredRef,
        entityRefsArray,
        particleAreaRef,
        particleCount,
        config,
        scope,
    );

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

    useFrame(() => {
        // State machine allows for computation to be distributed across frames, reducing load on the physics engine
        switch (frameStateRef.current) {
            case "init":
                if (areAllParticlesRegistered()) {
                    newJoints.current = initializeJoints(flattenedParticleRefs, initialPosition);
                    frameStateRef.current = "initialImpulse";
                }
                break;
            case "initialImpulse":
                if (config.initialImpulse) {
                    applyInitialImpulses(entityRefsArray, flattenedParticleRefs);
                }
                frameStateRef.current = "findCenter";
                break
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
                        index={i}
                        indexArray={[...indexArray, i]}
                        ref={entityRef}
                        registerParticlesFn={registerParticlesFn}
                        debug={isDebug}
                        config={config}
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
                        id={`particles-${id}`}
                        ref={instancedMeshRef}
                        particleCount={particleCount}
                        flattenedParticleRefs={flattenedParticleRefs}
                        particleRadiusRef={particleRadiusRef}
                    />
                )}

                {entitiesRegisteredRef.current && (
                    <Relations
                        internalRef={internalRef}
                        relationsRef={relationsRef}
                        linesRef={linesRef}
                        newLinesRef={newLinesRef}
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
                    newJoints={newJoints}
                    scope={scope}
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


