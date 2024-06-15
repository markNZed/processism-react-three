import React, { useEffect, useMemo, useRef, useImperativeHandle, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import ParticleRigidBody from './ParticleRigidBody';
import { BallCollider } from '@react-three/rapier';
import _ from 'lodash';
import { getColor } from './utils.js';

// The Particle uses ParticleRigidBody which extends RigidBody to allow for impulses to be accumulated before being applied
const Particle = React.memo(React.forwardRef(({ id, indexArray, scope, initialPosition, radius, config, ...props }, ref) => {

    const internalRef = useRef(); // because we forwardRef and want to use the ref locally too
    useImperativeHandle(ref, () => internalRef.current);

    const isDebug = props.debug || config.debug;
    const configColor = config.colors[scope];
    const color = useMemo(() => getColor(configColor, props.color));
    const [colliderRadius, setColliderRadius] = useState(radius);
    const registeredRef = useRef(false);
    const [initialize, setInitialize] = useState(true);
    const index = scope ? indexArray[scope - 1] : 0;

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
                props.particleJointsRef.current[id].forEach((jointIndex) => {
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

    useEffect(() => {
        // Don't need registeredRef as sensitive to internalRef
        if (props.registerParticlesFn && internalRef.current && !registeredRef.current) {
            props.registerParticlesFn(index, [internalRef.current], radius);
            registeredRef.current = true;
        }
    }, [props.registerParticlesFn, internalRef]);

    // Set the initial userData, don't do this in JSX (it would overwrite on renders)
    useEffect(() => {
        if (initialize && internalRef.current) {
            internalRef.current.setUserData({ color: color, uniqueIndex: id });
            setInitialize(false);
        }
    }, [internalRef]);

    return (
        <>
            <ParticleRigidBody
                ref={internalRef}
                position={initialPosition}
                type="dynamic"
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