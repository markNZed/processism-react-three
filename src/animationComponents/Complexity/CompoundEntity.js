import React, { useEffect, useMemo, useRef, useImperativeHandle, useState, useCallback, createRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Tube } from '@react-three/drei';
import CompoundEntityGroup from './CompoundEntityGroup';
import * as THREE from 'three';
import _ from 'lodash';
import * as utils from './utils';
import Particle from './Particle';
import ParticlesInstance from './ParticlesInstance';
import Blob from './Blob';
import Relations from './Relations';
import useAnimateRelations from './useAnimateRelations';
import useAnimateImpulses from './useAnimateImpulses';
import useAnimateJoints from './useAnimateJoints';
import useJoints from './useJoints';
import DebugRender from './DebugRender';
import useStoreEntity from './useStoreEntity';
import useStore from './../../useStore';
import useWhyDidYouUpdate from './useWhyDidYouUpdate';

const CompoundEntity = React.memo(React.forwardRef(({ id, initialPosition = [0, 0, 0], radius, debug, color, index, config, getTopBlobGeometryRef, topBlobGeometryRef }, ref) => {

    // Using forwardRef and need to access the ref from inside this component too
    const nodeRef = useRef();
    useImperativeHandle(ref, () => nodeRef.current);

    // Direct access to the state outside of React's render flow
    const { 
        getNode: directGetNode, 
        updateNode: directUpdateNode, 
        getAllParticleRefs: directGetAllParticleRefs,
        deleteJointId: directDeleteJointId,
    } = useStoreEntity.getState();
    const setPausePhysics = useStore((state) => state.setPausePhysics);
    const pausePhysics = useStore((state) => state.pausePhysics);

    // Select so we are only sensitive to changes of this node. useCallback avoids recreating the selector on each render.
    const node = useStoreEntity(useCallback((state) => state.nodes[id], [id]));
    const isDebug = node.debug || debug || config.debug;
    const entityCount = node.childrenIds.length;
    const entityNodes = useMemo(() => node.childrenIds.map(childId => directGetNode(childId)), [node.childrenIds]);
    // Store the color in a a state so it is consistent across renders (when defined by a function)
    const configColor = config.colors[node.depth];
    const localColor = useMemo(() => utils.getColor(configColor, color), [configColor, color]);    
    // The entity radius fills the perimeter of CompoundEntity with a margin to avoid overlap
    const entityRadius = useMemo(() => Math.min(radius * Math.PI / (entityCount + Math.PI), radius / 2) * 0.99, [radius, entityCount]);
    // Track the center of this CompoundEntity
    //const centerRef = useRef(new THREE.Vector3());
    const centerRef = node.centerRef;
    // State machine that can distribute computation across frames
    const frameStateRef = useRef("init");
    const [physicsState, setPhysicsState] = useState("waiting");
    // A function to encapsulate the condition
    const isPhysicsReady = () => physicsState === "ready";

    // Layout to avoid Particle overlap (which can cause extreme forces in Rapier)
    const entityPositions = useMemo(() => {
        return generateEntityPositions(radius - entityRadius, entityCount, initialPosition);
    }, [radius, entityRadius, entityCount]);
    
    const {initializeJoints, deleteJoint, createJoint} = useJoints();

    useAnimateImpulses(isPhysicsReady(), node, entityNodes, initialPosition, radius, config);
    useAnimateRelations(isPhysicsReady(), node, entityNodes, config);
    useAnimateJoints(isPhysicsReady(), node, entityNodes, deleteJoint, createJoint, config);

    useEffect(() => {
        directUpdateNode(id, {initialPosition});
        if (node.depth == 0) console.log(`Mounting CompoundEntity ${id} at depth ${node.depth}`);
    }, []);

    useEffect(() => {
        if (physicsState === "initialize") {
            node.ref.current.setVisualConfig({ color: color, uniqueId: id, radius: radius });
            const allParticleRefs = directGetAllParticleRefs(id);
            node.particlesRef.current = allParticleRefs;
            initializeJoints(node, entityPositions);
            setPhysicsState("ready");
            //if (!pausePhysics) setPausePhysics(true);
        }
    }, [physicsState]);

    useFrame(() => {
        if (entityCount === 0) return;

        // State machine can distribute computation across frames, reducing load on the physics engine
        switch (frameStateRef.current) {
            case "init":
                // useEffect to call initializeJoints because it may take longer than a frame
                if (physicsState === "waiting") {
                    const allParticleRefs = directGetAllParticleRefs(id);
                    if (allParticleRefs.length) {
                        //console.log("allParticleRefs.length", id, allParticleRefs.length)
                        let particlesExist = true;
                        allParticleRefs.forEach((particleRef) => {
                            if (!particleRef.current) {
                                particlesExist = false;
                            }
                        });
                        if (particlesExist) setPhysicsState("initialize");
                    }
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
            case "findCenter":
                //if (!pausePhysics) setPausePhysics(true);
                calculateCenter(entityNodes, centerRef);
                nodeRef.current.setCenter(centerRef.current);
                break;
            default:
                console.error("Unexpected state", id, frameStateRef.current)
                break;
        }
    });

    //console.log("CompoundEntity rendering", id)
    //useWhyDidYouUpdate("CompoundEntity", {id, initialPosition, radius, debug, color, index, config} );

    return (
        <group>
            <CompoundEntityGroup ref={nodeRef} position={initialPosition} >
                {entityNodes.map((entity, i) => {

                    let Entity = CompoundEntity;
                    if (entity.childrenIds.length === 0) Entity = Particle;
                    return (
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
                            topBlobGeometryRef={getTopBlobGeometryRef ?? topBlobGeometryRef}
                        />
                    )
                })}
                {isPhysicsReady() && (
                    <group>
                        <Blob
                            color={localColor}
                            node={node}
                            centerRef={centerRef}
                            entityNodes={entityNodes}
                            getGeometryRef={getTopBlobGeometryRef}
                        />
                        {node.depth === 0 && (
                            <group>
                                <ParticlesInstance
                                    id={`${id}`}
                                    node={node}
                                    geometryRef={getTopBlobGeometryRef}
                                    config={config}
                                />
                                {config.showRelations && (
                                    <Relations 
                                        id={`${id}`} 
                                        node={node}
                                    />
                                )}
                            </group>
                        )}
                    </group>
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
        </group>
    );

}));

export default CompoundEntity;

// Function declarations outside the Component to reduce computation during rendering
// Distribute entities within the perimeter
const generateEntityPositions = (radius, count, initialPoint) => {
    const positions = [];
    const angleStep = (2 * Math.PI) / count;
    const initialAngle = Math.atan2(initialPoint[1], initialPoint[0]); // Calculate the angle of the initial point

    for (let i = 0; i < count; i++) {
        const angle = initialAngle + (i * angleStep);
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        positions.push(new THREE.Vector3(x, y, 0));
    }

    return positions;
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