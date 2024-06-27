import React, { useEffect, useMemo, useRef, useImperativeHandle, useState, useCallback } from 'react';
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
import { useRapier, vec3, quat, RigidBody, BallCollider } from '@react-three/rapier';

const CompoundEntity = React.memo(React.forwardRef(({ id, initialPosition = [0, 0, 0], radius, debug, color, index, config }, ref) => {

    // Using forwardRef and need to access the ref from inside this component too
    const nodeRef = useRef();
    useImperativeHandle(ref, () => nodeRef.current);
    const { world, rapier } = useRapier();

    // Direct access to the state outside of React's render flow
    const { 
        getNode: directGetNode, 
        updateNode: directUpdateNode, 
        getAllParticleRefs: directGetAllParticleRefs,
        getJoint: directGetJoint,
    } = useStoreEntity.getState();
    const setOption = useStore((state) => state.setOption);
    const getOption = useStore((state) => state.getOption);

    // Select so we are only sensitive to changes of this node
    const { node, entityNodes } = useStoreEntity(useCallback((state) => {
        const node = state.nodes[id];
        const entityNodes = (node.childrenIds || []).map(childId => state.nodes[childId]);
        return { node, entityNodes };
      }, [id]));
    const isDebug = node.debug || debug || config.debug;
    const entityCount = node.childrenIds.length;
     // Store the color in a a state so it is consistent across renders (when defined by a function)
    const configColor = config.colors[node.depth];
    const localColor = useMemo(() => utils.getColor(configColor, color), [configColor, color]);    
    // The entity radius fills the perimeter of CompoundEntity with a margin to avoid overlap
    //const entityRadius = config.radius / getNodeCount();
    const entityRadius = config.radius / 10; // Fixed to help with testing
    //const entityRadius = useMemo(() => Math.min(radius * Math.PI / (entityCount + Math.PI), radius / 2) * 0.97, [radius, entityCount]);
    // Track the center of this CompoundEntity
    const centerRef = useRef(new THREE.Vector3());
    const worldCenterRef = useRef(new THREE.Vector3());
    // State machine that can distribute computation across frames
    const frameStateRef = useRef("init");
    const [physicsState, setPhysicsState] = useState("waiting");
    // A function to encapsulate the condition
    const isPhysicsReady = () => physicsState === "ready";
    const [entitiesInstantiated, setEntitiesInstantiated] = useState([]);
    // Block the instnatiating of next entity
    const busyInstantiatingRef = useRef(false);
    const instantiatingIdRef = useRef();
    const [instantiateJoints, setInstantiateJoints] = useState([]);
    const activeJointsStackRef = useRef([]);
    const [replaceJointWith, setReplaceJointWith] = useState([]);
    const [entityInstantiated, setEntityInstantiated] = useState();
    const [particlesReady, setParticlesReady] = useState();
    const [innerCoreActive, setInnerCoreActive] = useState();
    const innerCoreRef = useRef();
    const [innerCoreRadius, setInnerCoreRadius] = useState();
    const innerCoreInitialPositionRef = useRef();
    const innerCoreChangeRef = useRef(1);

    // Layout to avoid Particle overlap (which can cause extreme forces in Rapier)
    //const entityPositions = useMemo(() => {
    //    return generateEntityPositions(radius - entityRadius, entityCount, initialPosition);
    //}, [radius, entityRadius, entityCount]);
    const entityPositionsRef = useRef([]);
    
    const {initializeJoints, deleteJoint, createJoint} = useJoints();

    //useAnimateImpulses(isPhysicsReady(), node, entityNodes, initialPosition, radius, config);
    useAnimateRelations(isPhysicsReady(), node, entityNodes, config);
    useAnimateJoints(isPhysicsReady(), node, entityNodes, deleteJoint, createJoint, config);

    useEffect(() => {
        directUpdateNode(id, {initialPosition});
        if (node.depth == 0) console.log(`Mounting CompoundEntity ${id} at depth ${node.depth}`);
        node.ref.current.setVisualConfig({ color: color, uniqueId: id, radius: radius });
    }, []);

    useEffect(() => {
        return;
        if (physicsState === "initialize") {
            node.ref.current.setVisualConfig({ color: color, uniqueId: id, radius: radius });
            const allParticleRefs = directGetAllParticleRefs(id);
            node.particlesRef.current = allParticleRefs;
            initializeJoints(node, entityPositions);
            setPhysicsState("ready");
            if (!getOption("pausePhysics")) setOption("pausePhysics", true);
        }
    }, [physicsState]);

    // Need particles[i].current.getVisualConfig().outerChain

    // This will cause a render on each change of entitiesInstantiated, adding one entity at a time
    useEffect(() => {
        console.log("useEffect", entityCount, busyInstantiatingRef.current);
        if (busyInstantiatingRef.current) return;
        for (let i = 0; i < entityNodes.length; i++) {
            const entityNodeId = entityNodes[i].id;
            if (entitiesInstantiated.includes(entityNodeId)) continue;
            busyInstantiatingRef.current = true;
            instantiatingIdRef.current = entityNodeId;
            setTimeout(() => {
                // Strip out any id from entitiesInstantiated that is not in entityNodes
                setEntitiesInstantiated(p => [...p.filter(id => node.childrenIds.includes(id)), entityNodeId]);
                // Not doing anything with i = 0 yet
                switch (i) {
                    case 0:
                        setInstantiateJoints(p => [...p, [null, null]]);
                        break;
                    case 1:
                        setInstantiateJoints(p => [...p, [entityNodes[0].id, entityNodes[1].id]]);
                        break;
                    case 2:
                        // Order is important, it must be clockwise
                        setInstantiateJoints(p => [...p, [entityNodes[1].id, entityNodes[2].id], [entityNodes[2].id, entityNodes[0].id]]);
                        break;
                    case 3:
                        const jointId = utils.jointId(entityNodes[0].id, entityNodes[1].id);
                        const newPosition = true;
                        setReplaceJointWith(p => [...p, [entityNodes[i].id, jointId, newPosition]]);
                        break;
                    default:
                        setReplaceJointWith(p => [...p, [entityNodes[i].id, null, false]]);
                        break;
                }
            }, 1000); 
            
            // This is a hack for now as we should check that deeper levels are ready first
            // Probably just check if all children are ready (rather than all particles)
            if (physicsState !== "ready") {
                setPhysicsState("ready");
                console.log("setPhysicsState", physicsState, "to", "ready");
            }
            
            const newPosition = [...initialPosition];
            switch (i) {
                case 0: // point
                    break;
                case 1: // line
                    newPosition[0] += 2 * entityRadius;
                    break;
                case 2: // triangle
                    newPosition[0] += entityRadius;
                    newPosition[1] -= 2 * entityRadius; 
                    break;
                case 3: // diamond
                    // Here we can insert a virtual circle that "grows" to create a spherical blob
                    newPosition[0] += entityRadius;
                    newPosition[1] += 2 * entityRadius; 
                    break;
                default: {
                    // Should be the joint that is being replaced - first need to widen the joint
                    const oldestJointId = activeJointsStackRef.current[0];
                    console.log("oldestJointId", oldestJointId, i, isDividedBy3APowerOf2(i));
                    if (isDividedBy3APowerOf2(i)) {

                        activeJointsStackRef.current.forEach((jointId, i) => {
                            const [jointRef, body1Id, body2Id] = directGetJoint(jointId);
                            const joint = jointRef.current;
                            const scaleAnchor = (anchor) => ({
                                x: anchor.x * 2,
                                y: anchor.y * 2,
                                z: anchor.z * 2,
                            });
                            joint.setAnchor1(scaleAnchor(joint.anchor1()));
                            joint.setAnchor2(scaleAnchor(joint.anchor2()));
                        })

                    }
                    // Find the midpoint between the two nodes
                    // Need to wait for the joints to update first so the midpoint is up to date.
                    const [jointRef, body1Id, body2Id] = directGetJoint(oldestJointId);
                    const node1 = directGetNode(body1Id);
                    const node2 = directGetNode(body2Id);
                    const body1Ref = node1.ref.current;
                    const body2Ref = node2.ref.current;
                    // Create the particle in the middle and let the joints "pull" it into place.
                    const midpoint = utils.calculateMidpoint(body1Ref, body2Ref);
                    nodeRef.current.worldToLocal(midpoint);
                    newPosition[0] = midpoint.x;
                    newPosition[1] = midpoint.y;
                    newPosition[2] = midpoint.z;
                    break;
                }
            }
            entityPositionsRef.current.push(newPosition);
            console.log("Instantiating entityNodeId", id, i, entitiesInstantiated, entityNodeId, newPosition);
            break;
        }
    }, [entityInstantiated, entityNodes]);

    useFrame(() => {
        
        if (instantiateJoints.length || replaceJointWith.length) {
            calculateWorldCenterFromIds(directGetNode, entitiesInstantiated, worldCenterRef);
            const instantiatedJoints = [];
            // Create a new joint connecting entities that are already connected
            instantiateJoints.forEach(([id1, id2], i) => {
                if (id1 === null && id2 === null) return; // special case for first entity (no join to create for now
                const node1 = directGetNode(id1); 
                const node2 = directGetNode(id2); 
                const body1Ref = node1.ref.current;
                const body2Ref = node2.ref.current;
                if (!body1Ref?.current || !body2Ref?.current) return;
                // Should deal with different radius
                const { offset1, offset2 } = utils.calculateJointOffsets(body1Ref, body2Ref, entityRadius);
                const a = {
                    ref: body1Ref,
                    offset: offset1,
                }
                const b = {
                    ref: body2Ref,
                    offset: offset2 ,
                }
                createJoint(body1Ref, offset1, body2Ref, offset2);
                activeJointsStackRef.current.push(utils.jointId(node1.id, node2.id));
                instantiatedJoints.push(i);   
            });
            setInstantiateJoints(p => p.filter((value, i) => !instantiatedJoints.includes(i)));
            const replacedJoints = [];
            // Replace a joint with a new entity and connect that entity
            replaceJointWith.forEach(([newId, replaceJointId, newPosition], i) => {
                const entityReplace = directGetNode(newId); 
                // Can just create the "right" joint and it will snap the entity into place ?
                if (!entityReplace.ref.current?.current) return;
                //const oldestJointId = replaceJointId ? replaceJointId : activeJointsStackRef.current[0];
                // Replace the oldest joint
                const oldestJointId = activeJointsStackRef.current[0];

                console.log("Replacing joint oldestJointId", oldestJointId, "newId", newId, "replaceJointId", replaceJointId);

                // The order of this depends on the ids 
                // we always store smallest to largest ? 

                const [jointRef, body1Id, body2Id] = directGetJoint(oldestJointId);
                const joint = jointRef.current;
                const anchor1 = joint.anchor1()
                const anchor2 = joint.anchor2()

                const node1 = directGetNode(body1Id); 
                const node2 = directGetNode(body2Id);
                const body1Ref = node1.ref.current;
                const body2Ref = node2.ref.current;

                if (newPosition) {
                    // We want to use the particle position for the offsets
                    const { offset1, offset2 } = utils.calculateJointOffsets(body1Ref, entityReplace.ref.current, entityRadius);
                    anchor1.x = offset1.x;
                    anchor1.y = offset1.y;
                    anchor1.z = offset1.z;
                    anchor2.x = offset2.x;
                    anchor2.y = offset2.y;
                    anchor2.z = offset2.z;
                } else {
                    anchor1.x = anchor1.x * 0.5;
                    anchor1.y = anchor1.y * 0.5;
                    anchor1.z = anchor1.z * 0.5;
                    anchor2.x = anchor2.x * 0.5;
                    anchor2.y = anchor2.y * 0.5;
                    anchor2.z = anchor2.z * 0.5;
                }

                {
                console.log("anchor1 before", anchor1, entityReplace.id);
                        const rotation1 = quat(body1Ref.current.rotation());
                        console.log("anchor1 after", anchor1, entityReplace.id, rotation1);
                        const newAnchor1 = vec3(anchor1).applyQuaternion(rotation1);
                        anchor1.x = newAnchor1.x;
                        anchor1.y = newAnchor1.y;
                        anchor1.z = newAnchor1.z;
                        const rotation2 = quat(body2Ref.current.rotation());
                        console.log("anchor2 before", anchor2, entityReplace.id);
                        const newAnchor2 = vec3(anchor2).applyQuaternion(rotation2);
                        anchor2.x = newAnchor2.x;
                        anchor2.y = newAnchor2.y;
                        anchor2.z = newAnchor2.z;
                        console.log("anchor2 after", anchor2, rotation2, node2.id);
                }

                    {

                        const a = {
                            ref: body1Ref,
                            offset: anchor1 // offset1,
                        }
                        const b = {
                            ref: entityReplace.ref.current,
                            offset: anchor2 //offset2 ,
                        }
                        console.log("createJoint", id, utils.jointId(node1.id, entityReplace.id));
                        createJoint(body1Ref, anchor1, entityReplace.ref.current, anchor2);
                        activeJointsStackRef.current.push(utils.jointId(node1.id, entityReplace.id));
                    }

                    if (newPosition) {   
                        // We want to use the particle position for the offsets
                        const { offset1, offset2 } = utils.calculateJointOffsets(entityReplace.ref.current, body2Ref, entityRadius);
                        anchor1.x = offset1.x;
                        anchor1.y = offset1.y;
                        anchor1.z = offset1.z;
                        anchor2.x = offset2.x;
                        anchor2.y = offset2.y;
                        anchor2.z = offset2.z;

                        console.log("anchor1 before", anchor1, entityReplace.id);
                        const rotation1 = quat(entityReplace.ref.current.current.rotation());
                        console.log("anchor1 after", anchor1, entityReplace.id, rotation1);
                        const newAnchor1 = vec3(anchor1).applyQuaternion(rotation1);
                        anchor1.x = newAnchor1.x;
                        anchor1.y = newAnchor1.y;
                        anchor1.z = newAnchor1.z;
                        const rotation2 = quat(body2Ref.current.rotation());
                        console.log("anchor2 before", anchor2, node2.id);
                        const newAnchor2 = vec3(anchor2).applyQuaternion(rotation2);
                        anchor2.x = newAnchor2.x;
                        anchor2.y = newAnchor2.y;
                        anchor2.z = newAnchor2.z;
                        console.log("anchor2 after", anchor2, rotation2, node2.id);

                    }

                    {

                        const a = {
                            ref: entityReplace.ref.current,
                            offset: anchor1,
                        }
                        const b = {
                            ref: body2Ref,
                            offset: anchor2,
                        }

                        console.log("createJoint", id, utils.jointId(node2.id, entityReplace.id));
                        createJoint(entityReplace.ref.current, anchor1, body2Ref, anchor2);
                        activeJointsStackRef.current.push(utils.jointId(node2.id, entityReplace.id));
                    }

            
                // Deleting the joint causes an impulse on the Particles
                deleteJoint(oldestJointId);
                activeJointsStackRef.current.shift();

                replacedJoints.push(i);
            });
            // filter out indexes that have already been instantiated
            setReplaceJointWith(p => p.filter((value, i) => !replacedJoints.includes(i)));

            // If we haev a shape then update the joints with new angles to allow for change in the number of entities
            if (entitiesInstantiated.length > 2) {
                calculateWorldCenterFromIds(directGetNode, entitiesInstantiated, worldCenterRef);
               
                // Align each joint to conform to the shape with newJointAngle
                const sumInternal = (entitiesInstantiated.length - 2) * 180;
                const newJointAngle = sumInternal / entitiesInstantiated.length / 2;
                activeJointsStackRef.current.forEach((jointId, i) => {
                    // Because we use a clockwise direction for joints angle1 is positive, angle2 is negative
                    const angle1 = THREE.MathUtils.degToRad(newJointAngle * 1);
                    const angle2 = THREE.MathUtils.degToRad(newJointAngle * -1);
                    const [jointRef, body1Id, body2Id] = directGetJoint(jointId);
                    const joint = jointRef.current;
                    const axis = new THREE.Vector3(0, 0, 1); // Rotate around the Z axis
                    const quaternion1 = new THREE.Quaternion();
                    quaternion1.setFromAxisAngle(axis, angle1);
                    const quaternion2 = new THREE.Quaternion();
                    quaternion2.setFromAxisAngle(axis, angle2);
                    const anchor1 = joint.anchor1();
                    const anchor2 = joint.anchor2();

                    const radius1 = vec3(anchor1).length();
                    const radius2 = vec3(anchor2).length();


                    // Calculate the new position based on the angle
                    const newX1 = radius1 * Math.cos(angle1);
                    const newY1 = radius1 * Math.sin(angle1);
                    const newAnchorPosition1 = new THREE.Vector3(newX1, newY1, 0); 

                    // Calculate the new position based on the angle
                    const newX2 = radius2 * Math.cos(angle2);
                    const newY2 = radius2 * Math.sin(angle2);
                    const newAnchorPosition2 = new THREE.Vector3(newX2, newY2, 0);

                    jointRef.current.setAnchor1(newAnchorPosition1);
                    jointRef.current.setAnchor2(newAnchorPosition2);
                })

                // create innerCore
                calculateCenterFromIds(directGetNode, entitiesInstantiated, centerRef);
                innerCoreInitialPositionRef.current = centerRef.current;
                //console.log("innerCoreInitialPositionRef", innerCoreInitialPositionRef.current, entitiesInstantiated);
                setInnerCoreRadius(entityRadius / 3);
                setInnerCoreActive(true);

                // From here on we can increase the size of innerCore radius and extend a jint which is then replaced
            }
        }
        if (busyInstantiatingRef.current) {
            const lastEntity = directGetNode(instantiatingIdRef.current); 
            if (lastEntity?.ref?.current?.current) {
                setEntityInstantiated(lastEntity.id);
                busyInstantiatingRef.current = false;
                if (entitiesInstantiated.length == 1) {
                    lastEntity.ref.current.current.lockRotations(true, true);
                }
                if (entitiesInstantiated.length == entityCount) {
                    setParticlesReady(true);
                }
                node.particlesRef.current.push(lastEntity.ref);
            }
        }
    });


    useFrame(() => {
        if (innerCoreActive) {
            if (innerCoreRadius > entityRadius * 1.5) {
                innerCoreChangeRef.current = -1;
            }
            if (innerCoreRadius < entityRadius * 0.5 ) {
                innerCoreChangeRef.current = 1;
            }
            setInnerCoreRadius(innerCoreRadius + innerCoreChangeRef.current * entityRadius * 0.001);
        }
        return
        if (entityCount == 0) return;
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
                calculateCenter(entityNodes, centerRef);
                nodeRef.current.setCenter(centerRef.current);
                break;
            default:
                console.error("Unexpected state", id, frameStateRef.current)
                break;
        }
    });

    //console.log("CompoundEntity rendering", id, "node", node, "entityCount", entityCount, "entityNodes", entityNodes)
    //useWhyDidYouUpdate(`CompoundEntity ${id}`, {id, initialPosition, radius, debug, color, index, config, node, entityNodes, entitiesInstantiated} );

    return (
        <group>
            <CompoundEntityGroup ref={nodeRef} position={initialPosition} >
                {entitiesInstantiated.map((entityId, i) => {
                    let entity = entityNodes[i];
                    let EntityType = (entity.childrenIds.length === 0) ? Particle : CompoundEntity;
                    return (
                        <EntityType
                            key={`${id}-${i}`}
                            id={`${entity.id}`}
                            initialPosition={entityPositionsRef.current[i]}
                            radius={entityRadius}
                            color={localColor}
                            ref={entity.ref}
                            debug={isDebug}
                            config={config}
                            index={`${i}`}
                        />
                    )
                })}

                {innerCoreActive && (
                    <RigidBody
                        ref={innerCoreRef}
                        position={innerCoreInitialPositionRef.current}
                        type={"dynamic"}
                        colliders={false}
                        enabledTranslations={[true, true, false]}
                        enabledRotations={[false, false, true]}
                    >
                        <BallCollider args={[innerCoreRadius]} />
                    </RigidBody>
                )}

                {physicsState === "ready" && (
                    <group>
                        {particlesReady && (
                            <Blob
                                color={localColor}
                                node={node}
                                centerRef={centerRef}
                                entityNodes={entityNodes}
                            />
                        )}
                        {node.depth === 0 && (
                            <group>
                                <ParticlesInstance
                                    id={`${id}`}
                                    node={node}
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
const calculateCenter = (getNode,entityNodes, centerRef) => {
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

const calculateWorldCenterFromIds = (getNode, ids, centerRef) => {
    centerRef.current.set(0, 0, 0); // Reset the center vector
    let activeEntities = 0;
    ids.forEach((id) => {
        const entityNode = getNode(id);
        if (entityNode.ref.current) {
            const entityCenter = entityNode.ref.current.getCenterWorld();
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

const calculateCenterFromIds = (getNode, ids, centerRef) => {
    centerRef.current.set(0, 0, 0); // Reset the center vector
    let activeEntities = 0;
    ids.forEach((id) => {
        const entityNode = getNode(id);
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

function isDividedBy3APowerOf2(i) {
    if (i % 3 !== 0) return false;  // First, ensure i is divisible by 3
    let quotient = i / 3;
    return (quotient & (quotient - 1)) === 0;  // Check if quotient is a power of 2
}