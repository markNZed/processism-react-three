import React, { forwardRef, useRef, useImperativeHandle, useEffect, useMemo } from 'react';
import { RigidBody as RapierRigidBody } from '@react-three/rapier';
import PropTypes from 'prop-types';
import * as THREE from 'three';

const ParticleRigidBody = forwardRef(({ children, worldToLocal, id, ...props }, ref) => {
    const internalRef = useRef();
    const impulseRef = useRef(new THREE.Vector3());
    const centerRef = useRef(new THREE.Vector3());
    const centerWorldRef = useRef(new THREE.Vector3());
    const visualConfigRef = useRef({});

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
                worldToLocal(centerRef.current);
                //console.log("ParticleRigidBody getCenter", id, centerRef.current)
                return centerRef.current.clone();
            } else {
                return null;
            }
        },
        getCenterWorld: () => {
            if (internalRef.current) {
                const pos = internalRef.current.translation(); // world position
                centerWorldRef.current.set(pos.x, pos.y, pos.z);
                //console.log("ParticleRigidBody getCenterWorld", id, centerRef.current)
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
        rotation: () => {
            if (internalRef.current) {
                return internalRef.current.rotation();
            } else { 
                return null;
            }
        },
        getVisualConfig: () => {
            if (visualConfigRef.current) {
                return visualConfigRef.current;
            } else {
                return null;
            }
        },
        setVisualConfig: (update) => {
            if (typeof update === 'function') {
                visualConfigRef.current = update(visualConfigRef.current);
            } else {
                visualConfigRef.current = update;
            }
        },
    }), [internalRef, impulseRef, centerRef, centerWorldRef, children, worldToLocal ]);

    useImperativeHandle(ref, () => handle, [handle]);;

    return (
        <RapierRigidBody ref={internalRef} visualConfig={{id: id}} {...props} >
            {children}
        </RapierRigidBody>
    );
});

ParticleRigidBody.propTypes = {
    children: PropTypes.node,
    worldToLocal: PropTypes.func.isRequired,
    // Add other prop types if needed
};

export default ParticleRigidBody;
