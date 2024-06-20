import React, { forwardRef, useRef, useImperativeHandle, useEffect } from 'react';
import { RigidBody as RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';

const ParticleRigidBody = forwardRef((props, ref) => {
    const internalRef = useRef();
    const impulseRef = useRef(new THREE.Vector3());
    const centerRef = useRef(new THREE.Vector3());
    const centerWorldRef = useRef(new THREE.Vector3());


    useImperativeHandle(ref, () => ({
        get current() {
            return internalRef.current;
        },
        setImpulse: (newImpulse) => {
            impulseRef.current.copy(newImpulse);
        },
        getImpulse: () => {
            return impulseRef.current.clone();
        },
        addImpulse: (newImpulse) => {
            impulseRef.current.add(newImpulse);
        },
        applyImpulses: () => {
            if (internalRef.current && impulseRef.current.lengthSq() > 0) {
                internalRef.current.applyImpulse(impulseRef.current, true);
                impulseRef.current.set(0, 0, 0);
            }
        },
        getCenter: () => {
            if (internalRef.current) {
                const pos = internalRef.current.translation(); // world position
                centerRef.current.set(pos.x, pos.y, pos.z)
                props.worldToLocal(centerRef.current);
                return centerRef.current;
            } else {
                return null;
            }
        },
        getCenterWorld: () => {
            if (internalRef.current) {
                const pos = internalRef.current.translation(); // world position
                centerWorldRef.current.set(pos.x, pos.y, pos.z)
                return centerWorldRef.current;
            } else {
                return null;
            }
        },
        translation: () => {
            if (internalRef.current) {
                return internalRef.current.translation();
            } else { 
                return null;
            }
        },
        getUserData: () => {
            if (internalRef.current) {
                // Returning a reference not a deep copy because we had circular reference issues with deep copy
                return internalRef.current.userData;
            } else {
                return null;
            }
        },
        setUserData: (userData) => {
            internalRef.current.userData = userData;
        },
    }));

    useEffect(() => {
        if (props.registerRef) {
            props.registerRef(internalRef.current);
        }
    }, [props.registerRef]);

    return (
        <RapierRigidBody ref={internalRef} {...props}>
            {props.children}
        </RapierRigidBody>
    );
});

export default ParticleRigidBody;
