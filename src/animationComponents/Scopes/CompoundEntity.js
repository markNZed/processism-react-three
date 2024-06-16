import React, { useEffect, useMemo, useRef, useImperativeHandle, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import CompoundEntityGroup from './CompoundEntityGroup';
import * as THREE from 'three';
import { Circle } from '..';
import _ from 'lodash';
import { getColor } from './utils';
import Particle from './Particle';
import InstancedParticles from './InstancedParticles';
import Blob from './Blob';
import Relations from './Relations';
import useLimitedLog from '../../hooks/useLimitedLog';
import useParticlesRegistration from './useParticlesRegistration';
import useRandomRelations from './useRandomRelations';
import useJoints from './useJoints';
import useImpulses from './useImpulses';
import DebugRender from './DebugRender';
import useTreeStore from './useTreeStore';
import useScopeStore from './useScopeStore';

// useTreeStore -> useEntityStore ?

const CompoundEntity = React.memo(React.forwardRef(({ id = "root", indexArray = [], initialPosition = [0, 0, 0], radius, ...props }, ref) => {

    // Using forwardRef and need to access the ref from inside this component too
    const internalRef = useRef();
    useImperativeHandle(ref, () => internalRef.current);

    const {
        addNode,
        updateNode,
        getNode,
        moveNode,
        deleteNode,
        getNodesByPropertyAndDepth,
        flattenTree,
        traverseTreeDFS,
        copySubtree,
        getAllNodes,
        getAllpropertyLookups,
        getPropertyAll,
        getProperty,
    } = useTreeStore(); 

    const { setScope, getScope, addScope, removeScope, clearScope, clearAllScopes } = useScopeStore();

    let node = getNode(id);
    const scope = node.depth;
    const config = node.config;
    const isDebug = props.debug || config.debug;
    const childrenId = node.children;
    const entityCount = childrenId.length;
    const children  = node.children.map(childId => getNode(childId));
    //const entityCount = config.entityCounts[scope];
    // Store the color in a a state so it is consistent across renders (when defined by a function)
    //const configColor = config.colors[scope];
    const configColor = config.colors[scope];
    const color = useMemo(() => getColor(configColor, props.color), [configColor, props.color]);
    // At the deepest scope we will instantiate Particles instead of CompoundEntity
    //const lastCompoundEntity = (scope == config.entityCounts.length - 1);
    const lastCompoundEntity = node.deepestCompoundEntity;
    const Entity = lastCompoundEntity ? Particle : CompoundEntity;    
    // The entity radius fills the perimeter of CompoundEntity with a margin to avoid overlap
    const entityRadius = Math.min((radius * Math.PI / (entityCount + Math.PI)), radius / 2) * 0.99;
    // Track the center of this CompoundEntity
    const centerRef = useRef(new THREE.Vector3());
    const prevCenterRef = useRef();
    // State machine that distributes computation across frames
    const frameStateRef = useRef("init");
    const initialPositionVector = new THREE.Vector3(...initialPosition);

    // Joints allow for soft body like behavior and create the structure at each scope (joining entities)
    // This is the array of joints added by this CompoundEntity
    // Joints could be held in ZuStand
    //const newJointsRef = useRef([]);
    // Key is uniqueIndex of the particle. Value is array of linked (through joints) uniqueIndex 
    // Sould be moved into ZuStand and subscribe to tree to maintian itself
    
    //const chainRef = props.chainRef || useRef({});
    //Sould be moved into ZuStand - property in the tree
    // Could be a side state
    //const blobVisibleRef = props.blobVisibleRef || useRef({ 0: true });


    // Key is the uniqueIndex of a particle. Value is an array of joint ids
    // Any change to particleJointsRef needs to be made to jointRefsRef also
    //Sould be moved into ZuStand
    //const particleJointsRef = props.particleJointsRef || useRef({});
    // This is not so obvious - do we use the CompoundEntity associated with that scope ? No this is across branches
    // Move out and create a dedicated "flat" - much easier

    useEffect(() => {
        // Each entity at this scope will attempt to add and one will succeed
        addScope(node.depth, {joints: []});
    }, []);
    
    //const jointScopeRef = props.jointScopeRef || useRef({});
    // indexed with `${a.uniqueIndex}-${b.uniqueIndex}`
    // Any change to jointRefsRef needs to be made to particleJointsRef also
    // maps a jointId to a joint ref for all joints (not just this CompoundEntity)
    // This should be built "auto-magically" by TreeStore
    //const jointRefsRef = props.jointRefsRef || useRef({});

    //const relationsRef = useRef({});
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
    useRandomRelations(config, frameStateRef, entityCount, indexArray, children);

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

       /*
    // Up to here converting to useTreeStore
    const node = {
                id: nodeId,
                deepestCompoundEntity: restCounts.length === 1,
                isParticle: restCounts.length === 0,
                ref: React.createRef(),
                joints: [],
                particles: [],
                relations: [],
                chain: [],
                visible: false,
            };
    */
    //chainRef is broken - we bild a chain at the CompoundEntity not a global chianRef e.g. no multiple joints to other scopes

    //Sould be moved into ZuStand ?
    // Each particle could store the array of CompoundEntiites that includes it
    // Could "refresh" this explicitly - no when adding every node (too slow)
    // Each CompoundEntity could maintain a list of all lower entities - the tree could do this ?
    // That would also cover entityParticlesRefsRef
    // Maybe a store for "global" e.g. particleRadiusRef "system"
    //   Could just write into node["root"] 
    //     moved particleRadiusRef and particleAreaRef
    // What does it mean when a particle is registered ? When internalRef is valid e.. rididBodyReady (isParticle can be this)
    // From the Particle can we know the ancestors and then simply push the particles ?
    // node has the parentId - recurse up ? 
    // Could build only when we need it ?
    const {
        registerParticlesFn,
        // An array of entityCount length that stores the particle refs associated with each entity
        //Sould be moved into ZuStand
        entityParticlesRefsRef,
        // A simple array with all the refs
        flattenedParticleRefs,
        particleCount,
        areAllParticlesRegistered
    } = useParticlesRegistration(props, index, scope, id, config);

    // Relying on order of args is not good with such large numbres of args
    //Sould be moved into ZuStand for jointRefsRef, particleRadiusRef
    // Replace scope for depth
    const { jointsData, initializeJoints } = useJoints(frameStateRef, id, config, internalRef, entityPositions, scope, entityParticlesRefsRef, children, node);

    const { entityImpulses, impulseRef, applyInitialImpulses, calculateImpulses } = useImpulses(
        id,
        internalRef,
        indexArray,
        particleCount,
        config,
        scope,
        children,
        frameStateRef,
    );

    // Find center of this CompoundEntity (using the centers of the entities at the lower scope)
    const calculateCenter = () => {
        const center = new THREE.Vector3();
        let activeEntities = 0;
        children.forEach((entity) => {
            if (entity.ref) {
                const entityCenter = entity.ref.current.getCenter();
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
            // Maybe use a variable instead of getNode so we can update and not sync node
            updateNode(id, {joints: initializeJoints(flattenedParticleRefs, initialPosition)});
            node = getNode(id);
            frameStateRef.current = "initialImpulse";
            // Need to set state to trigger re-rendering of this component
            // otherwise the state machine gets stuck
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
                if (scope == 0) console.log("getAllpropertyLookups", getAllpropertyLookups(), "getAllNodes", getAllNodes());
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
                {children.map((entity, i) => (
                    <Entity
                        key={`${id}-${i}`}
                        id={`${entity.id}`}
                        initialPosition={entityPositions[i].toArray()}
                        radius={entityRadius}
                        color={color}
                        scope={scope + 1}
                        indexArray={[...indexArray, i]}
                        ref={entity.ref}
                        registerParticlesFn={registerParticlesFn}
                        debug={isDebug}
                        config={config}
                    />
                ))}

                {frameStateRef.current !== "init" && (
                    <Blob
                        id={`${id}`}
                        indexArray={indexArray}
                        scope={scope}
                        flattenedParticleRefs={flattenedParticleRefs}
                        lastCompoundEntity={lastCompoundEntity}
                        worldToLocalFn={internalRef.current.worldToLocal}
                        color={color}
                    />
                )}

                {scope === 0 && particleCount && (
                    <InstancedParticles
                        id={`particles-${id}`}
                        flattenedParticleRefs={flattenedParticleRefs}
                    />
                )}

                {frameStateRef.current !== "init" && (
                    <Relations
                        internalRef={internalRef}
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
                    newJointsRef={node.joints}
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


