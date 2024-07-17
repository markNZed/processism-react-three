import React, { forwardRef, useRef, useImperativeHandle, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import * as THREE from 'three';

const CompoundEntityGroup = forwardRef(({ children, position, initialQuaternion, id }, ref) => {
    const internalRef = useRef();
    const impulseRef = useRef(new THREE.Vector3());
    const centerRef = useRef(new THREE.Vector3());
    const visualConfigRef = useRef({});

    // Convert position array to THREE.Vector3 instance
    const verifiedPosition = useMemo(() => new THREE.Vector3(...position), [position]);

    // Memoize the initialization of the quaternion from the initialQuaternion prop
    // and apply a 90-degree clockwise rotation around the Z-axis
    const quaternionRef = useMemo(() => {
        if (initialQuaternion) {
            const initialQuat = new THREE.Quaternion(...initialQuaternion);
            const rotationQuat = new THREE.Quaternion();
            rotationQuat.setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI / 2); // 90 degrees clockwise
            initialQuat.multiply(rotationQuat); // Apply the rotation
            return initialQuat;
        } else {
            return new THREE.Quaternion();
        }
    }, [initialQuaternion]);
    
    // Apply the quaternion to the group when it's available
    useEffect(() => {
        if (internalRef.current) {
            internalRef.current.quaternion.copy(quaternionRef);
        }
    }, [quaternionRef]);

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
            //console.log("CompoundEntityGroup getCenter", id, centerRef.current)
            if (centerRef.current) {
                return centerRef.current.clone();
            } else {
                return null;
            }
        },
        setCenter: (center) => {
            //console.log("CompoundEntityGroup setCenter", id, center)
            return centerRef.current.copy(center);
        },
        getCenterWorld: () => {
            //console.log("CompoundEntityGroup getCenterWorld", id, centerRef.current, internalRef.current.localToWorld(centerRef.current.clone()))
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
            //console.log("localToWorld", vector, internalRef.current.localToWorld(vector))
            return internalRef.current.localToWorld(vector.clone());
        },
        translation: () => {
            return internalRef.current.localToWorld(centerRef.current.clone());
        },
        rotation: () => {
            return quaternionRef.current;
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
};

export default CompoundEntityGroup;
