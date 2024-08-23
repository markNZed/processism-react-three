import React, { useEffect, useMemo, useRef, useImperativeHandle, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import ParticleRigidBody from './ParticleRigidBody';
import { BallCollider, interactionGroups } from '@react-three/rapier';
import * as utils from './utils';
import useAppStore from '../../useAppStore';
import * as THREE from 'three';
import useWhyDidYouUpdate from './useWhyDidYouUpdate';

// Should we maintian node.visualConfig syned with ParticleRigidBody visualConfig ?
// Coud store visualConfig only in node but would slow data access when rendering the instanced mesh of particles
// At least keep uniqueId aligned with id
// https://github.com/pmndrs/react-three-rapier/blob/main/demo/src/examples/kinematics/KinematicsExample.tsx

// The Particle uses ParticleRigidBody which extends RigidBody to allow for impulses to be accumulated before being applied
const Particle = React.memo(React.forwardRef(({ id, index, creationPathRef, initialPosition, quaternion, radius, config, outer, lockPose, entityStore, ...props }, ref) => {

    useImperativeHandle(ref, () => nodeRef.current);

    // Here we define a fixed particleRadius (could use radius but will have different radius at different depth)
    const particleRadius = radius > 1 ? 1 : radius;

    const isDebug = props.debug || config.debug;
    const [colliderRadius, setColliderRadius] = useState(radius);
    const [initialize, setInitialize] = useState(true);
    // Direct access to the state outside of React's render flow
    const { updateNode: directUpdateNode, getNode: directGetNode, getJoint: directGetJoint }  = entityStore.getState();
    const node = entityStore(useCallback((state) => state.nodes[id], [id]));
    const nodeRef = node.ref; // because we forwardRef and want to use the ref locally too
    const configColor = config.colors[node.depth];
    const color = useMemo(() => utils.getColor(configColor, props.color));
    const parentNode = useMemo(() => directGetNode(node.parentId), [node.parentId]);
    const parentNodeRef = parentNode.ref
    // So we can get the particle position relative to the parent's position
    // Rapier uses world coordinates
    // Can't use groupRef because the particle may not be rendering and we still
    // want the center position converted to local coordinates
    const worldToLocal = useCallback((worldPos) => (parentNodeRef.current.worldToLocal(worldPos)) , [parentNodeRef]);
    const fixParticles = useAppStore((state) => state.getOption("fixParticles"));
    const [damping, setDamping] = useState(5);
    const dampingRef = useRef(5);
    const nextCreationPositionRef = useRef(new THREE.Vector3());
    const lastCreationPositionRef = useRef(new THREE.Vector3());
    const creationPathIndexRef = useRef(0);
    const worldInitialPosition = new THREE.Vector3(initialPosition[0], initialPosition[1], initialPosition[2]);
    const groupRef = useRef();
    const colliderRef = useRef();
    const creationDurationRef = useRef(0);
    const creationPositionRef = useRef(new THREE.Vector3());
    const frameStateRef = useRef("init");
    const frameCountRef = useRef(0);
    const enabledTranslationsRef = useRef([!lockPose, !lockPose, !lockPose]);
    const enabledRotationsRef = useRef([false, false, !lockPose]);
    const currLockPoseRef = useRef();
    const lockZRef = useRef(false);

    // When scaling a Particle we need to modify the joint positions
    useFrame((_, deltaTime) => {
        frameCountRef.current++;
        if (!nodeRef.current?.current) return;
        creationDurationRef.current += deltaTime;
        if (nodeRef.current.applyImpulses) {
            nodeRef.current.applyImpulses();
        }
        //
        const visualConfig = nodeRef.current.getVisualConfig();
        // Could adjust scale over multiple frames
        if (visualConfig?.scale !== visualConfig?.rigidScale) {
            let relativeScale = visualConfig.scale;
            if (visualConfig.rigidScale) {
                relativeScale = visualConfig.scale / visualConfig.rigidScale;
            }
            const newRadius = relativeScale * colliderRadius
            setColliderRadius(newRadius);
            visualConfig.colliderRadius = newRadius;
            nodeRef.current.setVisualConfig(visualConfig)
            node.jointsRef.current.forEach((jointId) => {
                const {jointRef, body1Id, body2Id} = directGetJoint(jointId);
                const joint = jointRef.current;
                const scaleAnchor = (anchor) => ({
                    x: anchor.x * relativeScale,
                    y: anchor.y * relativeScale,
                    z: anchor.z * relativeScale,
                });
                if (body1Id === id) {
                    joint.setAnchor1(scaleAnchor(joint.anchor1()));
                }
                if (body2Id === id) {
                    joint.setAnchor2(scaleAnchor(joint.anchor2()));
                }
            })
            visualConfig.rigidScale = visualConfig.scale;
            nodeRef.current.setVisualConfig(visualConfig);
        }
        if (visualConfig.damping && visualConfig.damping !== damping) {
            //console.log("Damping changed", id, damping, visualConfig.damping);
            // Need to force a rendering ?
            dampingRef.current = visualConfig.damping;
        }
        switch (frameStateRef.current) {
            case "init": {
                if (nodeRef.current.current) {
                    if (!creationPathRef) {
                        frameStateRef.current = "inPosition";
                    } else {
                        frameStateRef.current = "nextPath";
                    }
                }
                break;
            }
            case "nextPath": {
                lastCreationPositionRef.current.set(
                    creationPathRef.current[creationPathIndexRef.current][0],
                    creationPathRef.current[creationPathIndexRef.current][1],
                    creationPathRef.current[creationPathIndexRef.current][2],
                );
                groupRef.current.localToWorld(lastCreationPositionRef.current);
                creationPathIndexRef.current++;
                if (creationPathRef.current.length > creationPathIndexRef.current) {
                    frameStateRef.current = "move";
                } else {
                    frameStateRef.current = "finalizePosition";
                }
                break;
            }
            case "move": {
                const currentTranslation = nodeRef.current.translation();
                nextCreationPositionRef.current.set(
                    creationPathRef.current[creationPathIndexRef.current][0],
                    creationPathRef.current[creationPathIndexRef.current][1],
                    creationPathRef.current[creationPathIndexRef.current][2],
                );
                groupRef.current.localToWorld(nextCreationPositionRef.current);
                // Move creationPositionRef closer to the nextCreationPositionRef
                const xDistance = nextCreationPositionRef.current.x - currentTranslation.x;
                const yDistance = nextCreationPositionRef.current.y - currentTranslation.y;
                const zDistance = nextCreationPositionRef.current.z - currentTranslation.z;
                const xDirection = xDistance > 0 ? 1 : -1;
                const yDirection = yDistance > 0 ? 1 : -1;
                const zDirection = zDistance > 0 ? 1 : -1;
                const velocityScale = 40;
                let xVelocity = xDirection * Math.min(velocityScale, Math.abs(xDistance) * velocityScale);
                let yVelocity = yDirection * Math.min(velocityScale, Math.abs(yDistance) * velocityScale);
                let zVelocity = zDirection * Math.min(velocityScale, Math.abs(zDistance) * velocityScale);
                let nextPath = true;
                const closeEnough = 0.2;
                if (Math.abs(xDistance) < closeEnough) {
                    xVelocity = 0;
                } else {
                    nextPath = false;
                }
                if (Math.abs(yDistance) < closeEnough) {
                    yVelocity = 0;
                } else {
                    nextPath = false;
                }
                if (Math.abs(zDistance) < closeEnough) {
                    zVelocity = 0;
                } else {
                    nextPath = false;
                }
                if (nextPath) {
                    frameStateRef.current = "nextPath";
                }
                nodeRef.current.current.setLinvel({ x: xVelocity, y: yVelocity, z: zVelocity }, true);
                //console.log("setLinvel velocity", id, xVelocity, yVelocity, zVelocity);
                //console.log("setLinvel", xDistance, yDistance, zDistance, creationPositionRef.current, currentTranslation);
                break;
            }
            case "finalizePosition": {
                nodeRef.current.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
                // It seems important to update creationPositionRef when changing enabledTranslations
                creationPositionRef.current.set(
                    nextCreationPositionRef.current.x,
                    nextCreationPositionRef.current.y,
                    nextCreationPositionRef.current.z,
                );
                // Need this so the setEnabledTranslations will eject the particles
                nodeRef.current.current.setTranslation(nextCreationPositionRef.current, true);
                groupRef.current.worldToLocal(creationPositionRef.current);
                frameStateRef.current = "inPosition";
                break;
            }
            case "inPosition": {
                lockZRef.current = true;
                if (!lockPose) {
                    enabledTranslationsRef.current = [true, true, !lockZRef.current];
                    nodeRef.current.current.setEnabledTranslations(true, true, !lockZRef.current, true);
                }
                colliderRef.current.setCollisionGroups(interactionGroups(0));
                visualConfig.isCreated = true;
                nodeRef.current.setVisualConfig(visualConfig);
                frameStateRef.current = "done";
                dampingRef.current = 0.1;
                break;
            }
            case "done": {
                break;
            }
            default:
                console.error("Unexpected state", id, frameStateRef.current)
                break;
        }
        // Must use setEnabledTranslations in useFrame not useEffect
        if (currLockPoseRef.current !== lockPose) {
            currLockPoseRef.current = lockPose;
            if (lockPose) {
                nodeRef.current.current.setEnabledTranslations(false, false, false, true);
                nodeRef.current.current.setEnabledRotations(false, false, false, true);
                enabledTranslationsRef.current = [true, true, false];
                enabledRotationsRef.current = [false, false, false];
            } else {
                nodeRef.current.current.setEnabledTranslations(true, true, !lockZRef.current, true);
                nodeRef.current.current.setEnabledRotations(false, false, true, true);
                enabledTranslationsRef.current = [true, true, false];
                enabledRotationsRef.current = [false, false, true];
            }
        }
    });

    // Set the initial visualConfig, don't do this in JSX (it would overwrite on renders)
    useEffect(() => {
        if (initialize && nodeRef.current) {
            // Must set outer before isParticle
            // if all outer array is true then set color to pink
            let localColor = color;
            if (Object.values(outer).every((o) => o)) {
                // For debugging the outer map
                //localColor = "pink";
            }
            nodeRef.current.setVisualConfig({ 
                color: localColor, 
                uniqueId: id, 
                radius: particleRadius, 
                origRadius: particleRadius, 
                outer: outer, 
                damping: dampingRef.current, 
                isParticle: true,
                isCreated: false,
                colliderRadius: colliderRadius,
            });
            directUpdateNode(id, {isParticle: true});
            setInitialize(false);
        }
    }, [nodeRef]);

    useEffect(() => {
        console.log("Mounting Particle", id, initialPosition);
        groupRef.current.localToWorld(worldInitialPosition);
        if (creationPathRef && creationPathRef.current[0]) {
            creationPositionRef.current.set(creationPathRef.current[0][0], creationPathRef.current[0][1], creationPathRef.current[0][2]);
        } else {
            creationPositionRef.current.set(initialPosition[0], initialPosition[1], initialPosition[2]);
        }
    }, []);

    //console.log("Particle rendering", id, index, frameCountRef.current, initialPosition, radius, frameStateRef.current, creationPositionRef, creationPathRef);
    //useWhyDidYouUpdate(`Particle ${id}`, {id, index, creationPathRef, initialPosition, quaternion, radius, config, outer, lockPose, entityStore, ...props} );

    return (
        <group ref={groupRef} >
            <ParticleRigidBody
                ref={nodeRef}
                position={[creationPositionRef.current.x, creationPositionRef.current.y, creationPositionRef.current.z]}
                quaternion={quaternion}
                type={fixParticles ? "fixed" : "dynamic"} // "kinematicPosition" "fixed" "kinematicVelocity" "dynamic"
                colliders={false}
                //linearVelocity={[2, 2, 0]}
                linearDamping={dampingRef.current}
                angularDamping={dampingRef.current}
                //enabledTranslations={enabledTranslationsRef.current}
                //enabledTranslations={[false, false, false]}
                //enabledRotations={enabledRotationsRef.current}
                //enabledRotations={[false, false, false]}
                restitution={config.particleRestitution}
                ccd={config.ccd}
                worldToLocal={worldToLocal}
                id={id}
            >
                {/*  
                    collisionGroups set to 2 and collides only with empty group 1
                    After arriving at position collisionGroup will be set to 0
                */}
                <BallCollider 
                    ref={colliderRef} 
                    collisionGroups={interactionGroups([2], 1)} 
                    args={[colliderRadius * 0.99] /*scaled to avoid contact*/} 
                />
            </ParticleRigidBody>
            {isDebug && (
                <>
                    <Text
                        // Slightly offset in the z-axis to avoid z-fighting
                        position={[initialPosition[0], initialPosition[1], initialPosition[2] + 0.1]} 
                        fontSize={particleRadius / 2}
                        color="black"
                        anchorX="center"
                        anchorY="middle"
                    >
                        {id}
                    </Text>
                </>
            )}
        </group>
    );
}));

Particle.displayName = 'Particle'; // the name property doesn't exist because it uses forwardRef

export default Particle;