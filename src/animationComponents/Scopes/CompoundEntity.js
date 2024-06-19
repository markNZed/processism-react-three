import React, { useEffect, useMemo, useRef, useImperativeHandle, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import CompoundEntityGroup from './CompoundEntityGroup';
import * as THREE from 'three';
import { Circle } from '..';
import _ from 'lodash';
import * as utils from './utils';
import Particle from './Particle';
import InstancedParticles from './InstancedParticles';
import Blob from './Blob';
import Relations from './Relations';
import useAnimateRelations from './useAnimateRelations';
import useJoints from './useJoints';
import useAnimateImpulses from './useAnimateImpulses';
import DebugRender from './DebugRender';
import useStoreEntity from './useStoreEntity';
import useStoreScope from './useStoreScope';
import useWhyDidYouUpdate from './useWhyDidYouUpdate';


const CompoundEntity = React.memo(React.forwardRef(({ id = "root", initialPosition = [0, 0, 0], radius, debug, color, index }, ref) => {

    // Using forwardRef and need to access the ref from inside this component too
    const internalRef = useRef();
    useImperativeHandle(ref, () => internalRef.current);

    // Direct access to the state outside of React's render flow
    const getNode = useStoreEntity.getState().getNode; 
    const getAllParticleRefs = useStoreEntity.getState().getAllParticleRefs; //
    const addScope = useStoreScope.getState().addScope; // Direct access to the state outside of React's render flow

    const node = useStoreEntity(useCallback((state) => state.nodes[id], [id]));
    const isDebug = node.debug || debug || node.config.debug;
    const entityCount = node.childrenIds.length;
    const entityNodes = useMemo(() => node.childrenIds.map(childId => getNode(childId)), [node.childrenIds]);
    // Store the color in a a state so it is consistent across renders (when defined by a function)
    const configColor = node.config.colors[node.depth];
    const localColor = useMemo(() => utils.getColor(configColor, color), [configColor, color]);
    // At the deepest scope we will instantiate Particles instead of CompoundEntity
    const Entity = node.lastCompoundEntity ? Particle : CompoundEntity;    
    // The entity radius fills the perimeter of CompoundEntity with a margin to avoid overlap
    const entityRadius = useMemo(() => Math.min((radius * Math.PI / (entityCount + Math.PI)), radius / 2) * 0.99, [radius, entityCount]);
    // Track the center of this CompoundEntityentityCount
    const centerRef = useRef(new THREE.Vector3());
    // State machine that distributes computation across frames
    const frameStateRef = useRef("init");
    const initialPositionVector = useMemo(() => new THREE.Vector3(...initialPosition), []);
    const [particleRefs, setParticleRefs] = useState([]);
    const [particleCount, setParticleCount] = useState(0); 
    // Need to store the userData so we can re-render and not lose the changes to userData
    const localUserDataRef = useRef({ uniqueIndex: id });
    const [initializePhysics, setInitializePhysics] = useState(false);
    const [initializedPhysics, setInitializedPhysics] = useState(false); 

    useEffect(() => {
        // Each entity at this scope will attempt to add and one will succeed
        addScope(node.depth, {joints: []});
    }, []);

    // Logging/debug
    useEffect(() => {
        if (node.depth == 0 && true) console.log(`Mounting CompoundEntity ${id} at depth ${node.depth}`);
    }, []);

    useAnimateRelations(initializedPhysics, node, entityNodes);

    // Layout to avoid Particle overlap (which can cause extreme forces in Rapier)
    const entityPositions = useMemo(() => {
        return generateEntityPositions(radius - entityRadius, entityCount);
    }, [radius, entityRadius, entityCount]);

    const { jointsData, initializeJoints } = useJoints(initializedPhysics, entityPositions, node, entityNodes);

    useAnimateImpulses(particleCount, node, entityNodes, initializedPhysics, initialPositionVector, particleRefs);

    const areAllParticlesRegistered = () => {
        getAllParticleRefs(id).forEach((ref) => {
            if (!ref.current) return false;
        });
        return true;
    };

    useEffect(() => {
        if (initializePhysics) {
            const allParticles = getAllParticleRefs(id);
            initializeJoints(allParticles, initialPosition);
            setParticleRefs(allParticles);
            setParticleCount(allParticles.length);
            setInitializedPhysics(true);
        }
    }, [initializePhysics]);

    // frameState as useState in useFrame is probably not a good idea - would cause re-rendering when set in switch
    useFrame(() => {
        // State machine can distribute computation across frames, reducing load on the physics engine
        switch (frameStateRef.current) {
            case "init":
                // Use a state to trigger the initializeJoints as this may take longer than a frame
                if (!initializePhysics && areAllParticlesRegistered()) {
                    if (id == "root") console.log("setInitializePhysics", id);
                    setInitializePhysics(true);
                }
                if (initializedPhysics) {
                    if (id == "root") console.log("initializedPhysics", id);
                    frameStateRef.current = "findCenter";
                }
                break;
                // Maybe we should wait for all entities to be registered - so state machines are syned
            case "findCenter":
                calculateCenter(entityNodes, centerRef);
                // could use ZuStand to avoid needing extensions to group e.g. setCenter
                internalRef.current.setCenter(centerRef.current);
                break;
            default:
                console.error("Unexpected state", id, frameStateRef.current)
                break;
        }
        //if (node.depth == 0) console.log("frameStateRef.current", frameStateRef.current)
    });

    return (
        <>
            <CompoundEntityGroup ref={internalRef} position={initialPosition} userData={localUserDataRef.current}>
                {entityNodes.map((entity, i) => (
                    <Entity
                        key={`${id}-${i}`}
                        id={`${entity.id}`}
                        initialPosition={entityPositions[i].toArray()}
                        radius={entityRadius}
                        color={localColor}
                        ref={entity.ref}
                        debug={isDebug}
                        config={node.config}
                        index={`${i}`}
                    />
                ))}
                {initializedPhysics && (
                    <>
                        
                        <Blob
                            particleRefs={particleRefs}
                            color={localColor}
                            node={node}
                        />
                        {node.depth === 0 && (
                            <>
                                <InstancedParticles
                                    id={`${id}`}
                                    particleRefs={particleRefs}
                                />
                                <Relations 
                                    id={`${id}`} 
                                    internalRef={internalRef}
                                />
                            </>
                        )}
                    
                    </>
                )}
                
                {/*}
                <Circle
                    id={`${id}.mounting`}
                    initialState={{
                        radius: 5,
                        opacity: 1,
                    }}
                />
                */}
                
                {isDebug && (
                    <DebugRender
                        id={id}
                        radius={radius}
                        color={localColor}
                        initialPosition={initialPosition}
                        jointsData={jointsData}
                        newJointsRef={node.joints}
                        index={index || 0}
                        internalRef={internalRef}
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