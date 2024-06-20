import React, { forwardRef, useRef, useImperativeHandle, useEffect, useMemo } from 'react';
import { RigidBody as RapierRigidBody } from '@react-three/rapier';
import PropTypes from 'prop-types';
import * as THREE from 'three';

const ParticleRigidBody = forwardRef(({ children, registerRef, ...props }, ref) => {
    const internalRef = useRef();
    const impulseRef = useRef(new THREE.Vector3());
    const centerRef = useRef(new THREE.Vector3());
    const centerWorldRef = useRef(new THREE.Vector3());

    const handle = useMemo(() => ({
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
                centerRef.current.set(pos.x, pos.y, pos.z);
                props.worldToLocal(centerRef.current);
                return centerRef.current.clone();
            } else {
                return null;
            }
        },
        getCenterWorld: () => {
            if (internalRef.current) {
                const pos = internalRef.current.translation(); // world position
                centerWorldRef.current.set(pos.x, pos.y, pos.z);
                return centerWorldRef.current.clone();
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
        setUserData: (update) => {
            if (typeof update === 'function') {
                internalRef.current.userData = update(internalRef.current.userData);
            } else {
                internalRef.current.userData = update;
            }
        },
    }), [internalRef, impulseRef, centerRef, centerWorldRef, props]);

    useImperativeHandle(ref, () => handle, [handle]);

    useEffect(() => {
        if (registerRef) {
            registerRef(internalRef.current);
        }
    }, [registerRef]);

    return (
        <RapierRigidBody ref={internalRef} {...props}>
            {children}
        </RapierRigidBody>
    );
});

ParticleRigidBody.propTypes = {
    children: PropTypes.node,
    registerRef: PropTypes.func,
    worldToLocal: PropTypes.func.isRequired,
    // Add other prop types if needed
};

export default ParticleRigidBody;
