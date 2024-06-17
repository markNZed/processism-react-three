import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import useEntityStore from './useEntityStore';

const InstancedParticles = React.forwardRef(({ id, particleRefs }, ref) => {
    const instancedMeshRef = useRef();
    const {
        getNodeProperty,
    } = useEntityStore();
    const particleRadiusRef = getNodeProperty('root', 'particleRadiusRef');

    useFrame(() => {
        if (instancedMeshRef.current && particleRefs) {
            const mesh = instancedMeshRef.current;
            const userColor = new THREE.Color();
            let colorChanged = false;
            let matrixChanged = false;
            const colorTolerance = 0.01;
            const userScale = new THREE.Vector3();
            const currentPos = new THREE.Vector3();
            const currentScale = new THREE.Vector3();
            const currentQuaternion = new THREE.Quaternion();
            const invisibleScale = new THREE.Vector3(0.001, 0.001, 0.001);

            for (let i = 0; i < particleRefs.length; i++) {
                const instanceMatrix = new THREE.Matrix4();
                mesh.getMatrixAt(i, instanceMatrix);
                instanceMatrix.decompose(currentPos, currentQuaternion, currentScale);

                const pos = particleRefs[i].current.translation();
                const scale = particleRefs[i].current.getUserData().scale || 1;
                userScale.set(scale, scale, scale);
                const color = particleRefs[i].current.getUserData().color || 'red';
                userColor.set(color);

                if (!currentPos.equals(pos)) {
                    currentPos.copy(pos);
                    matrixChanged = true;
                }

                if (!currentScale.equals(userScale)) {
                    currentScale.copy(userScale);
                    matrixChanged = true;
                }

                const visible = particleRefs[i].current.getUserData().visible || false;
                if (!visible) {
                    currentScale.copy(invisibleScale);
                    matrixChanged = true;
                }

                if (matrixChanged) {
                    instanceMatrix.compose(currentPos, currentQuaternion, currentScale);
                    mesh.setMatrixAt(i, instanceMatrix);
                }

                if (mesh.instanceColor) {
                    const currentColor = new THREE.Color();
                    mesh.getColorAt(i, currentColor);

                    if (
                        Math.abs(currentColor.r - userColor.r) > colorTolerance ||
                        Math.abs(currentColor.g - userColor.g) > colorTolerance ||
                        Math.abs(currentColor.b - userColor.b) > colorTolerance
                    ) {
                        mesh.setColorAt(i, userColor);
                        colorChanged = true;
                    }
                } else {
                    mesh.setColorAt(i, userColor);
                    colorChanged = true;
                }
            }

            if (matrixChanged) {
                mesh.instanceMatrix.needsUpdate = true;
            }

            if (colorChanged && mesh.instanceColor) {
                mesh.instanceColor.needsUpdate = true;
            }
        }
    });

    // Should use entity instead of particle as per relations 
    const handlePointerDown = (event) => {
        event.stopPropagation();
        const instanceId = event.instanceId;
        if (instanceId !== undefined) {
            const userData = particleRefs[instanceId].current.getUserData();
            const currentScale = userData.scale;
            // Maybe we should have a function on the particle that allows for scaling
            console.log("handlePointerDown", id, instanceId, userData, particleRefs[instanceId]);
            if (currentScale && currentScale != 1) {
                particleRefs[instanceId].current.getUserData().scale = 1.0;
            } else {
                particleRefs[instanceId].current.getUserData().scale = 2.0;
            }
            particleRefs[instanceId].current.getUserData().color = 'pink';
        }
    };

    return (
        <instancedMesh
            ref={instancedMeshRef}
            args={[null, null, particleRefs.length]}
            onClick={handlePointerDown}
        >
            <circleGeometry args={[particleRadiusRef, 16]} />
            <meshStandardMaterial />
        </instancedMesh>
    );
});

export default InstancedParticles;
