import * as THREE from 'three';
import { quat } from '@react-three/rapier';

/**
 * Retrieves a color setting from a configuration object.
 * Allows for the color setting to be a static value or a function.
 *
 * @param {Object} config - Configuration object containing color settings.
 * @param {string} scope - The key under which the color setting is stored.
 * @param {*} defaultValue - A default value to return if the specific setting is not found.
 * @returns {*} - The color setting from the configuration or the default return value.
 */
export const getColor = (colorConfig, defaultValue) => {
    if (colorConfig === null || colorConfig === undefined) {
        return defaultValue;
    }
    if (typeof colorConfig === 'function') {
        return colorConfig();
    }
    return colorConfig;
};

export const calculateCircleArea = (radius) => {
    if (radius <= 0) {
        return "Radius must be a positive number.";
    }
    return Math.PI * Math.pow(radius, 2);
};

export const getRandomColorFn = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
};

export const jointId = (id1, id2) => {
    const numId1 = Number(id1);
    const numId2 = Number(id2);
    const jointString = numId1 < numId2 ? `${numId1}-${numId2}` : `${numId2}-${numId1}`;
    return jointString;
}

export const jointIdToNodeIds = (jointId) => {
    let parts = jointId.split('-');
    const body1Id = parts[0];
    const body2Id = parts[1];
    return [body1Id, body2Id];
}

export const calculateJointOffsets = (body1, body2, particleRadius) => {
    const body1position = body1.translation();
    const body2position = body2.translation();
    const quaternion1 = quat(body1.current.rotation());
    const quaternion2 = quat(body2.current.rotation());
    const direction = new THREE.Vector3()
        .subVectors(body1position, body2position)
        .normalize();
    const offset1 = direction.clone().multiplyScalar(-particleRadius);
    const offset2 = direction.clone().multiplyScalar(particleRadius);
    offset1.applyQuaternion(quaternion1);
    offset2.applyQuaternion(quaternion2);
    return { offset1, offset2 };
};

export const calculateMidpoint = (body1, body2) => {
    const body1position = body1.translation();
    const body2position = body2.translation();
    const midpoint = new THREE.Vector3()
        .addVectors(body1position, body2position)
        .divideScalar(2);
    return midpoint;    
}

export const stringifyCircular = (obj) => {
    const seen = new WeakSet();
    return JSON.stringify(obj, (key, value) => {
        if (typeof value === "object" && value !== null) {
            if (seen.has(value)) {
                // Return some custom object or a marker indicating a circular reference
                return "[Circular]";
            }
            seen.add(value);
        }
        return value;
    });
}