import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

const InstancedParticles = React.forwardRef(({ particleCount, flattenedParticleRefs, particleRadiusRef, onClick }, ref) => {
    const instancedMeshRef = useRef();

    useFrame(() => {
        if (instancedMeshRef.current && flattenedParticleRefs && particleRadiusRef) {
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

            for (let i = 0; i < particleCount; i++) {
                const instanceMatrix = new THREE.Matrix4();
                mesh.getMatrixAt(i, instanceMatrix);
                instanceMatrix.decompose(currentPos, currentQuaternion, currentScale);

                const pos = flattenedParticleRefs.current[i].current.translation();
                const scale = flattenedParticleRefs.current[i].current.userData.scale || 1;
                userScale.set(scale, scale, scale);
                const color = flattenedParticleRefs.current[i].current.userData.color || 'red';
                userColor.set(color);

                if (!currentPos.equals(pos)) {
                    currentPos.copy(pos);
                    matrixChanged = true;
                }

                if (!currentScale.equals(userScale)) {
                    currentScale.copy(userScale);
                    matrixChanged = true;
                }

                const visible = flattenedParticleRefs.current[i].current.userData.visible || false;
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

    return (
        <instancedMesh
            ref={instancedMeshRef}
            args={[null, null, particleCount]}
            onClick={onClick}
        >
            <circleGeometry args={[particleRadiusRef.current, 16]} />
            <meshStandardMaterial />
        </instancedMesh>
    );
});

export default InstancedParticles;
