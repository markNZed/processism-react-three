import React, { useEffect, useMemo, useRef, useImperativeHandle, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import ParticleRigidBody from './ParticleRigidBody';
import { BallCollider } from '@react-three/rapier';
import _ from 'lodash';
import { getColor, calculateCircleArea } from './utils.js';
import useStoreEntity from './useStoreEntity';

// Should we maintian node.userData syned with ParticleRigidBody userData ?
// Coud store userData only in node but would slow data access when rendering the instanced mesh of particles
// At leasst keep uniqueIndex aligned with id

// The Particle uses ParticleRigidBody which extends RigidBody to allow for impulses to be accumulated before being applied
const Particle = React.memo(React.forwardRef(({ id, initialPosition, radius, config, ...props }, ref) => {

    useImperativeHandle(ref, () => internalRef.current);

    const isDebug = props.debug || config.debug;
    const [colliderRadius, setColliderRadius] = useState(radius);
    const [initialize, setInitialize] = useState(true);
    const {
        updateNode,
        getNode,
    } = useStoreEntity(); 
    const node = useStoreEntity(useCallback((state) => state.nodes[id], [id]));
    const internalRef = node.ref; // because we forwardRef and want to use the ref locally too
    const configColor = config.colors[node.depth];
    const color = useMemo(() => getColor(configColor, props.color));

    // When scaling a Particle we need to modify the joint positions
    useFrame(() => {
        if (internalRef.current) {
            if (internalRef.current.applyImpulses) {
                internalRef.current.applyImpulses();
            }
            //
            const userData = internalRef.current.getUserData();
            // Could adjust scale over multiple frames
            if (userData?.scale !== userData?.rigidScale) {
                let relativeScale = userData.scale;
                if (userData.rigidScale) {
                    relativeScale = userData.scale / userData.rigidScale;
                }
                const newRadius = relativeScale * colliderRadius
                setColliderRadius(newRadius);
                internalRef.current.setUserData(userData)
                node.joints.forEach((jointIndex) => {
                    const joint = props.jointRefsRef.current[jointIndex].current;
                    if (joint.body1().userData.uniqueIndex == id) {
                        const a1 = joint.anchor1();
                        joint.setAnchor1({
                            x: a1.x * relativeScale,
                            y: a1.y * relativeScale,
                            z: a1.z * relativeScale,
                        })
                    }
                    if (joint.body2().userData.uniqueIndex == id) {
                        const a2 = joint.anchor2();
                        joint.setAnchor2({
                            x: a2.x * relativeScale,
                            y: a2.y * relativeScale,
                            z: a2.z * relativeScale,
                        })
                    }
                })
                userData.rigidScale = userData.scale;
                internalRef.current.setUserData(userData);
            }
        }
    });

    // Set the initial userData, don't do this in JSX (it would overwrite on renders)
    useEffect(() => {
        if (initialize && internalRef.current) {
            //console.log(`Initialize particle ${id} begin`)
            internalRef.current.setUserData({ color: color, uniqueIndex: id });
            //updateNode(id, {isParticle: true});
            const rootNode = getNode("root");
            if (!rootNode.particleRadius) {
                updateNode("root", {
                    particleRadiusRef: radius,
                    particleAreaRef: calculateCircleArea(radius),
                })
            }
            setInitialize(false);
            //console.log(`Initialize particle ${id} end`)
        }
    }, [internalRef]);

    //console.log("Particle rendering");

    return (
        <>
            <ParticleRigidBody
                ref={internalRef}
                position={initialPosition}
                type={"dynamic"}
                colliders={false}
                linearDamping={0.5}
                angularDamping={0.5}
                enabledTranslations={[true, true, false]}
                enabledRotations={[false, false, true]}
                restitution={config.particleRestitution}
                ccd={config.ccd}
            >
                <BallCollider args={[colliderRadius]} />
            </ParticleRigidBody>
            {isDebug && (
                <>
                    <Text
                        position={[initialPosition[0], initialPosition[1], 0.1]} // Slightly offset in the z-axis to avoid z-fighting
                        fontSize={radius / 2}
                        color="black"
                        anchorX="center"
                        anchorY="middle"
                    >
                        {id}
                    </Text>
                </>
            )}
        </>
    );
}));

Particle.displayName = 'Particle'; // the name property doesn't exist because it uses forwardRef

export default Particle;