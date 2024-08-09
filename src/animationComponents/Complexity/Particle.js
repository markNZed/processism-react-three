import React, { useEffect, useMemo, useRef, useImperativeHandle, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import ParticleRigidBody from './ParticleRigidBody';
import { BallCollider, vec3 } from '@react-three/rapier';
import useStoreEntity from './useStoreEntity';
import * as utils from './utils';
import useStore from './../../useStore';
import * as THREE from 'three';

// Should we maintian node.visualConfig syned with ParticleRigidBody visualConfig ?
// Coud store visualConfig only in node but would slow data access when rendering the instanced mesh of particles
// At least keep uniqueId aligned with id
// https://github.com/pmndrs/react-three-rapier/blob/main/demo/src/examples/kinematics/KinematicsExample.tsx

// The Particle uses ParticleRigidBody which extends RigidBody to allow for impulses to be accumulated before being applied
const Particle = React.memo(React.forwardRef(({ id, creationPath = [], initialPosition, initialQuaternion, radius, config, outer, ...props }, ref) => {

    useImperativeHandle(ref, () => nodeRef.current);

    const isDebug = props.debug || config.debug;
    const [colliderRadius, setColliderRadius] = useState(radius);
    const [initialize, setInitialize] = useState(true);
    // Direct access to the state outside of React's render flow
    const { updateNode: directUpdateNode, getNode: directGetNode, getJoint: directGetJoint }  = useStoreEntity.getState();
    const node = useStoreEntity(useCallback((state) => state.nodes[id], [id]));
    const nodeRef = node.ref; // because we forwardRef and want to use the ref locally too
    const configColor = config.colors[node.depth];
    const color = useMemo(() => utils.getColor(configColor, props.color));
    const parentNode = useMemo(() => directGetNode(node.parentId), [node.parentId]);
    const parentNodeRef = parentNode.ref
    // So we can get the particle position relative to the parent's position
    // Rapier uses world coordinates
    const worldToLocal = useCallback((worldPos) => (parentNodeRef.current.worldToLocal(worldPos)) , [parentNodeRef]);
    const fixParticles = useStore((state) => state.getOption("fixParticles"));
    const [damping, setDamping] = useState(0.1);
    const creationPositionRef = useRef(new THREE.Vector3());
    const nextCreationPositionRef = useRef(new THREE.Vector3());
    const lastCreationPositionRef = useRef(new THREE.Vector3());
    const creationPathIndexRef = useRef(0);
    const creationPathStepRef = useRef(0);
    const [created, setCreated] = useState(false);
    const nextPathRef = useRef(true);
    const worldInitialPosition = new THREE.Vector3(initialPosition[0], initialPosition[1], initialPosition[2]);
    const groupRef = useRef();
    const creationDurationRef = useRef(0);

    // When scaling a Particle we need to modify the joint positions
    useFrame((_, deltaTime) => {
        if (!nodeRef.current) return;
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
            setDamping(visualConfig.damping);
        }
        if (!created && nodeRef.current.current) {
            let created = false;
            // If not using creationPath
            if (creationPath.length === 0) {
                created = true;
            // If next path step or first path step
            } else if (nextPathRef.current) {
                nextPathRef.current = false;
                creationDurationRef.current = 0;
                creationPathStepRef.current = 0;
                lastCreationPositionRef.current = {
                    x: creationPath[creationPathIndexRef.current][0],
                    y: creationPath[creationPathIndexRef.current][1],
                    z: creationPath[creationPathIndexRef.current][2],
                }
                if (creationPath.length > creationPathIndexRef.current + 1) {
                    const nextIndex = creationPathIndexRef.current + 1;
                    nextCreationPositionRef.current = {
                        x: creationPath[nextIndex][0],
                        y: creationPath[nextIndex][1],
                        z: creationPath[nextIndex][2]
                    }
                } else {
                    created = true;
                }
                creationPositionRef.current.set(lastCreationPositionRef.current.x, lastCreationPositionRef.current.y, lastCreationPositionRef.current.z);
                creationPathIndexRef.current++;
            } else {
                //const currentTranslation = vec3(nodeRef.current.translation());
                creationPathStepRef.current++;
                // Move creationPositionRef closer to the nextCreationPositionRef
                const stepDistance = 0.1;
                const xDistance = nextCreationPositionRef.current.x - lastCreationPositionRef.current.x;
                const yDistance = nextCreationPositionRef.current.y - lastCreationPositionRef.current.y;
                const zDistance = nextCreationPositionRef.current.z - lastCreationPositionRef.current.z;
                const xDirection = xDistance > 0 ? 1 : -1;
                const yDirection = yDistance > 0 ? 1 : -1;
                const zDirection = zDistance > 0 ? 1 : -1;
                // Round to an integer
                const xSteps = Math.round(Math.abs(xDistance) / stepDistance);
                const ySteps = Math.round(Math.abs(yDistance) / stepDistance);
                const zSteps = Math.round(Math.abs(zDistance) / stepDistance);
                let nextPath = true;
                let nextX;
                if (creationPathStepRef.current >= xSteps) {
                    nextX = nextCreationPositionRef.current.x;
                } else {
                    nextX = lastCreationPositionRef.current.x + creationPathStepRef.current * stepDistance * xDirection;
                    nextPath = false;
                }
                let nextY;
                if (creationPathStepRef.current >= ySteps) {
                    nextY = nextCreationPositionRef.current.y;
                } else {
                    nextY = lastCreationPositionRef.current.y + creationPathStepRef.current * stepDistance * yDirection;
                    nextPath = false;
                }
                let nextZ;
                if (creationPathStepRef.current >= zSteps) {
                    nextZ = nextCreationPositionRef.current.z;
                } else {
                    nextZ = lastCreationPositionRef.current.z + creationPathStepRef.current * stepDistance * zDirection;
                    nextPath = false;
                }
                creationPositionRef.current.set(nextX, nextY, nextZ);
                groupRef.current.localToWorld(creationPositionRef.current);
                nextPathRef.current = nextPath;
                // Operate on the rigid body            
                //console.log("setTranslation", id, "creationPositionRef", creationPositionRef.current, "worldInitialPosition", worldInitialPosition, "creationPath", creationPath, "last creationPathIndexRef", creationPathIndexRef.current, "creationPathStepRef", creationPathStepRef.current);
                // True argument ensures the body is awake
                nodeRef.current.current.setTranslation(creationPositionRef.current, true);
                nodeRef.current.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
            }
            if (created) {
                setCreated(true);
                nodeRef.current.current.setEnabledTranslations([true, true, false]);
                nodeRef.current.current.setBodyType("dynamic");
                visualConfig.isCreated = true;
                nodeRef.current.setVisualConfig(visualConfig);
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
                radius: radius, 
                origRadius: radius, 
                outer: outer, 
                damping: damping, 
                isParticle: true,
                isCreated: false,
            });
            directUpdateNode(id, {isParticle: true});
            setInitialize(false);
        }
    }, [nodeRef]);

    useEffect(() => {
        console.log("Mounting Particle", id, initialPosition);
        groupRef.current.localToWorld(worldInitialPosition);
    }, []);

    //console.log("Particle rendering", id, initialPosition, initialQuaternion);

    return (
        <group ref={groupRef} >
            <ParticleRigidBody
                ref={nodeRef}
                position={initialPosition}
                quaternion={initialQuaternion}
                type={fixParticles ? "fixed" : "kinematicPosition"} // "kinematicPosition" "fixed"
                colliders={false}
                linearDamping={damping}
                angularDamping={damping}
                //enabledTranslations={[true, true, false]}
                enabledRotations={[false, false, true]}
                restitution={config.particleRestitution}
                ccd={config.ccd}
                worldToLocal={worldToLocal}
                id={id}
            >
                <BallCollider args={[colliderRadius * 0.99] /*scaled to avoid contact*/} />
            </ParticleRigidBody>
            {isDebug && (
                <>
                    <Text
                        position={[initialPosition[0], initialPosition[1], initialPosition[2] + 0.1]} // Slightly offset in the z-axis to avoid z-fighting
                        fontSize={radius / 2}
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