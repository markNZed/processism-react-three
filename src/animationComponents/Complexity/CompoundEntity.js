import React, { useEffect, useMemo, useRef, useImperativeHandle, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import CompoundEntityGroup from './CompoundEntityGroup';
import * as THREE from 'three';
import _ from 'lodash';
import * as utils from './utils';
import Particle from './Particle';
import InstancedParticles from './InstancedParticles';
import Blob from './Blob';
import Relations from './Relations';
import useAnimateRelations from './useAnimateRelations';
import useAnimateImpulses from './useAnimateImpulses';
import useAnimateJoints from './useAnimateJoints';
import useJoints from './useJoints';
import DebugRender from './DebugRender';
import useStoreEntity from './useStoreEntity';

const CompoundEntity = React.memo(React.forwardRef(({ id, initialPosition = [0, 0, 0], radius, debug, color, index, config }, ref) => {

    // Using forwardRef and need to access the ref from inside this component too
    const nodeRef = useRef();
    useImperativeHandle(ref, () => nodeRef.current);

    // Direct access to the state outside of React's render flow
    const directGetNode = useStoreEntity.getState().getNode;
    const directUpdateNode = useStoreEntity.getState().updateNode;
    const directGetAllParticleRefs = useStoreEntity.getState().getAllParticleRefs;

    // Select so we are only sensitive to changes of this node. useCallback avoids recreating the selector on each render.
    const node = useStoreEntity(useCallback((state) => state.nodes[id], [id]));
    const isDebug = node.debug || debug || config.debug;
    const entityCount = node.childrenIds.length;
    const entityNodes = useMemo(() => node.childrenIds.map(childId => directGetNode(childId)), [node.childrenIds]);
    // Store the color in a a state so it is consistent across renders (when defined by a function)
    const configColor = config.colors[node.depth];
    const localColor = useMemo(() => utils.getColor(configColor, color), [configColor, color]);
    // At the deepest scope we will instantiate Particles instead of CompoundEntity
    const Entity = node.lastCompoundEntity ? Particle : CompoundEntity;    
    // The entity radius fills the perimeter of CompoundEntity with a margin to avoid overlap
    const entityRadius = useMemo(() => Math.min((radius * Math.PI / (entityCount + Math.PI)), radius / 2) * 0.99, [radius, entityCount]);
    // Track the center of this CompoundEntity
    const centerRef = useRef(new THREE.Vector3());
    // State machine that can distribute computation across frames
    const frameStateRef = useRef("init");
    // Need to store the visualConfig so we can re-render and not lose the changes to visualConfig
    const localVisualConfigRef = useRef({ uniqueId: id });
    const [physicsState, setPhysicsState] = useState("waiting");
    // Define a function to encapsulate the condition
    const isPhysicsReady = () => physicsState === "ready";

    // Layout to avoid Particle overlap (which can cause extreme forces in Rapier)
    const entityPositions = useMemo(() => {
        return generateEntityPositions(radius - entityRadius, entityCount);
    }, [radius, entityRadius, entityCount]);
    
    // Joints could be a component but we want initializeJoints
    const {initializeJoints, deleteJoint, createJoint} = useJoints();

    useAnimateImpulses(isPhysicsReady(), node, entityNodes, initialPosition, config);
    useAnimateRelations(isPhysicsReady(), node, entityNodes, config);
    useAnimateJoints(isPhysicsReady(), node, entityNodes, deleteJoint, createJoint, config);

    useEffect(() => {
        // Each CompoundEntity at this scope will attempt to add and only one will succeed
        directUpdateNode(id, {initialPosition});
        if (node.depth == 0) console.log(`Mounting CompoundEntity ${id} at depth ${node.depth}`);
    }, []);

    // Maybe physicsState does not need to be useState (it will cause rendering upon change)
    useEffect(() => {
        if (physicsState === "initialize") {
            const allParticleRefs = directGetAllParticleRefs(id);
            node.particlesRef.current = allParticleRefs;
            // We need node.particlesRef in initializeJoints
            initializeJoints(node, entityPositions);
            setPhysicsState("ready");
        }
    }, [physicsState]);

    useFrame(() => {
        // State machine can distribute computation across frames, reducing load on the physics engine
        switch (frameStateRef.current) {
            case "init":
                // useEffect to call initializeJoints because it may take longer than a frame
                if (physicsState === "waiting") {
                    let particlesExist = true;
                    directGetAllParticleRefs(id).forEach((particleRef) => {
                        if (!particleRef.current) {
                            particlesExist = false;
                        }
                    });
                    if (particlesExist) setPhysicsState("initialize");
                }
                if (isPhysicsReady()) {
                    if (id == "root") {
                        console.log("Physics ready", nodeRef);
                        console.log("useStoreEntity", useStoreEntity.getState());
                        nodeRef.current.setVisualConfig(p => ({ ...p, visible: true }));
                    }
                    frameStateRef.current = "findCenter";
                }
                break;
                // Maybe we should wait for all entities to be registered - so state machines are syned
            case "findCenter":
                calculateCenter(entityNodes, centerRef);
                // could use ZuStand to avoid needing extensions to group e.g. setCenter
                nodeRef.current.setCenter(centerRef.current);
                break;
            default:
                console.error("Unexpected state", id, frameStateRef.current)
                break;
        }
    });

    return (
        <>
            <CompoundEntityGroup ref={nodeRef} position={initialPosition} visualConfig={localVisualConfigRef.current}>
                {entityNodes.map((entity, i) => (
                    <Entity
                        key={`${id}-${i}`}
                        id={`${entity.id}`}
                        initialPosition={entityPositions[i].toArray()}
                        radius={entityRadius}
                        color={localColor}
                        ref={entity.ref}
                        debug={isDebug}
                        config={config}
                        index={`${i}`}
                    />
                ))}
                {isPhysicsReady() && (
                    <>
                        
                        <Blob
                            color={localColor}
                            node={node}
                            centerRef={centerRef}
                            entityNodes={entityNodes}
                        />
                        {node.depth === 0 && (
                            <>
                                <InstancedParticles
                                    id={`${id}`}
                                    node={node}
                                />
                                {config.showRelations && (
                                    <Relations 
                                        id={`${id}`} 
                                        node={node}
                                    />
                                )}
                            </>
                        )}
                    
                    </>
                )}
                
                {isDebug && (
                    <DebugRender
                        id={id}
                        radius={radius}
                        color={localColor}
                        initialPosition={initialPosition}
                        newJointsRef={node.jointsRef}
                        index={index || 0}
                        nodeRef={nodeRef}
                        isDebug={isDebug}
                        centerRef={centerRef}
                    />
            )}
            </CompoundEntityGroup>
            {isDebug && (
                <Text
                    position={[initialPosition[0], initialPosition[1], 0.1]}
                    fontSize={radius / 2}
                    color="black"
                    anchorX="center"
                    anchorY="middle"
                >
                    {index || 0}
                </Text>
            )}
        </>
    );

}));

export default CompoundEntity;

// Function declarations outside the Component to reduce computation during rendering
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

// Find center of this CompoundEntity (using the centers of the entities at the lower scope)
const calculateCenter = (entityNodes, centerRef) => {
    centerRef.current.set(0, 0, 0); // Reset the center vector
    let activeEntities = 0;
    entityNodes.forEach((entityNode) => {
        if (entityNode.ref.current) {
            const entityCenter = entityNode.ref.current.getCenter();
            if (entityCenter) {
                centerRef.current.add(entityCenter);
                activeEntities++;
            }
        }
    });
    if (activeEntities > 0) {
        centerRef.current.divideScalar(activeEntities);
    }
};