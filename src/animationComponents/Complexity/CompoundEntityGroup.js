import React, { forwardRef, useRef, useImperativeHandle, useMemo } from 'react';
import PropTypes from 'prop-types';
import * as THREE from 'three';

const CompoundEntityGroup = forwardRef(({ children, position, visualConfig }, ref) => {
    const internalRef = useRef();
    const impulseRef = useRef(new THREE.Vector3());
    const centerRef = useRef(new THREE.Vector3());
    const visualConfigRef = useRef({});

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
    }), [internalRef, impulseRef, centerRef]);

    useImperativeHandle(ref, () => handle, [handle]);

    return (
        <group ref={internalRef} position={verifiedPosition}>
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
    visualConfig: PropTypes.object,
};

CompoundEntityGroup.defaultProps = {
    visualConfig: {},
};

export default CompoundEntityGroup;
