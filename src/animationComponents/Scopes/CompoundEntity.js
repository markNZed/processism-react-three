import React, { useEffect, useMemo, useRef, useImperativeHandle, useState } from 'react';
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
import useLimitedLog from '../../hooks/useLimitedLog';
import useAnimateRelations from './useAnimateRelations';
import useJoints from './useJoints';
import useAnimateImpulses from './useAnimateImpulses';
import DebugRender from './DebugRender';
import useEntityStore from './useEntityStore';
import useScopeStore from './useScopeStore';

const CompoundEntity = React.memo(React.forwardRef(({ id = "root", initialPosition = [0, 0, 0], radius, ...props }, ref) => {

    // Using forwardRef and need to access the ref from inside this component too
    const internalRef = useRef();
    useImperativeHandle(ref, () => internalRef.current);

    const {
        updateNode,
        getNode,
        getAllParticleRefs,
    } = useEntityStore(); 

    const { addScope } = useScopeStore();

    let node = getNode(id);
    const isDebug = node.debug || props.debug || node.config.debug;
    const entityCount = node.childrenIds.length;
    const entityNodes  = node.childrenIds.map(childId => getNode(childId));
    // Store the color in a a state so it is consistent across renders (when defined by a function)
    const configColor = node.config.colors[node.depth];
    const color = useMemo(() => utils.getColor(configColor, props.color), [configColor, props.color]);
    // At the deepest scope we will instantiate Particles instead of CompoundEntity
    const lastCompoundEntity = node.lastCompoundEntity;
    const Entity = lastCompoundEntity ? Particle : CompoundEntity;    
    // The entity radius fills the perimeter of CompoundEntity with a margin to avoid overlap
    const entityRadius = Math.min((radius * Math.PI / (entityCount + Math.PI)), radius / 2) * 0.99;
    // Track the center of this CompoundEntity
    const centerRef = useRef(new THREE.Vector3());
    // State machine that distributes computation across frames
    const [frameState, setFrameState] = useState("init");
    const initialPositionVector = new THREE.Vector3(...initialPosition);

    useEffect(() => {
        // Each entity at this scope will attempt to add and one will succeed
        addScope(node.depth, {joints: []});
    }, []);

    // Need to store the userData so we can re-render and not lose the changes to userData
    const localUserDataRef = useRef({ uniqueIndex: id });
    const limitedLog = useLimitedLog(100);
    const [initializePhysics, setInitializePhysics] = useState(false);  

    // Logging/debug
    useEffect(() => {
        if (node.depth == 0) limitedLog("Mounting CompoundEntity at depth 0", id);
    }, []);

    useAnimateRelations(node.config, frameState, entityCount, node, entityNodes);

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

    //chainRef is broken - we bild a chain at the CompoundEntity not a global chianRef e.g. no multiple joints to other scopes

    const [particleRefs, setParticleRefs] = useState([]);
    const [particleCount, setParticleCount] = useState(0); 

    const { jointsData, initializeJoints } = useJoints(frameState, entityPositions, node, entityNodes);

    useAnimateImpulses(particleCount, node, entityNodes, frameState, initialPositionVector, particleRefs);

    const areAllParticlesRegistered = () => {
        getAllParticleRefs(node.id).forEach((ref) => {
            if (!ref.current) return false;
        });
        return true;
    };

    // Find center of this CompoundEntity (using the centers of the entities at the lower scope)
    const calculateCenter = () => {
        const center = new THREE.Vector3();
        let activeEntities = 0;
        entityNodes.forEach((entityNode) => {
            if (entityNode.ref) {
                const entityCenter = entityNode.ref.current.getCenter();
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
        if (initializePhysics) {
            const allParticles = getAllParticleRefs(node.id);
            setParticleRefs(allParticles);
            // Maybe use a variable instead of getNode so we can update and not sync node
            updateNode(id, {joints: initializeJoints(allParticles, initialPosition)});
            node = getNode(id);
            setParticleCount(allParticles.length);
            setFrameState("findCenter");
        }
    }, [initializePhysics]);

    useFrame(() => {
        // State machine can distribute computation across frames, reducing load on the physics engine
        switch (frameState) {
            case "init":
                // Use a state to trigger the initializeJoints as this may take longer than a frame
                if (!initializePhysics && areAllParticlesRegistered()) setInitializePhysics(true);
                break;
                // Maybe we should wait for all entities to be registered - so state machines are syned
            case "findCenter":
                centerRef.current = calculateCenter();
                // could use ZuStand to avoid needing extensions to group e.g. setCenter
                internalRef.current.setCenter(centerRef.current);
                break;
            default:
                console.error("Unexpected state", id, frameState)
                break;
        }

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
                        color={color}
                        ref={entity.ref}
                        debug={isDebug}
                        config={node.config}
                        index={`${i}`}
                    />
                ))}
                {frameState !== "init" && (
                    <>
                        <Blob
                            particleRefs={particleRefs}
                            lastCompoundEntity={lastCompoundEntity}
                            color={color}
                            node={node}
                        />
                        <Relations
                            internalRef={internalRef}
                            config={node.config}
                            depth={node.depth}
                        />
                        {node.depth === 0 && (
                            <InstancedParticles
                                id={`${id}`}
                                particleRefs={particleRefs}
                            />
                        )}
                    </>
                )}
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
                    index={props.index || 0}
                    internalRef={internalRef}
                    isDebug={isDebug}
                    centerRef={centerRef}
                />
            </CompoundEntityGroup>
            {isDebug && (
                <Text
                    position={[initialPosition[0], initialPosition[1], 0.1]}
                    fontSize={radius / 2}
                    color="black"
                    anchorX="center"
                    anchorY="middle"
                >
                    {props.index || 0}
                </Text>
            )}
        </>
    );

}));

export default CompoundEntity;


