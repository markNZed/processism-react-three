import React, { forwardRef, useRef, useImperativeHandle, useMemo } from 'react';
import PropTypes from 'prop-types';
import * as THREE from 'three';

const CompoundEntityGroup = forwardRef(({ children, position, userData }, ref) => {
    const internalRef = useRef();
    const impulseRef = useRef(new THREE.Vector3());
    const centerRef = useRef(new THREE.Vector3());

    // Convert position array to THREE.Vector3 instance
    const verifiedPosition = useMemo(() => new THREE.Vector3(...position), [position]);

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
        getCenter: () => {
            if (centerRef.current) {
                return centerRef.current.clone();
            } else {
                return null;
            }
        },
        setCenter: (center) => {
            return centerRef.current.copy(center);
        },
        getCenterWorld: () => {
            if (centerRef.current) {
                return internalRef.current.localToWorld(centerRef.current.clone());
            } else {
                return null;
            }
        },
        worldToLocal: (vector) => {
            return internalRef.current.worldToLocal(vector);
        },
        localToWorld: (vector) => {
            return internalRef.current.localToWorld(vector);
        },
        getWorldPosition: (vector) => {
            return internalRef.current.getWorldPosition(vector);
        },
        getUserData: () => {
            if (internalRef.current) {
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
    }), [internalRef, impulseRef, centerRef]);

    useImperativeHandle(ref, () => handle, [handle]);

    return (
        <group ref={internalRef} position={verifiedPosition} userData={userData}>
            {children}
        </group>
    );
});

CompoundEntityGroup.propTypes = {
    children: PropTypes.node,
    position: PropTypes.arrayOf(
        (propValue, key, componentName, location, propFullName) => {
            if (typeof propValue[key] !== 'number') {
                return new Error(
                    `Invalid prop \`${propFullName}\` supplied to` +
                    ` \`${componentName}\`. Validation failed. Expected a number at index ${key}.`
                );
            }
            if (propValue.length !== 3) {
                return new Error(
                    `Invalid prop \`${propFullName}\` supplied to` +
                    ` \`${componentName}\`. Validation failed. Expected an array of length 3.`
                );
            }
        }
    ).isRequired,
    userData: PropTypes.object,
};

CompoundEntityGroup.defaultProps = {
    userData: {},
};

export default CompoundEntityGroup;
