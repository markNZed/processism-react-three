import React, { useRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import useStoreEntity from './useStoreEntity';

const InstancedParticles = React.forwardRef(({ id, node }, ref) => {

    const internalRef = useRef();
    useImperativeHandle(ref, () => internalRef.current);

    const getNodeProperty = useStoreEntity.getState().getNodeProperty;
    const particleRadiusRef = getNodeProperty('root', 'particleRadiusRef');
    const particles = node.particlesRef.current;

    useFrame(() => {
        if (internalRef.current) {
            const mesh = internalRef.current;
            const userColor = new THREE.Color();
            let colorChanged = false;
            let matrixChanged = false;
            const colorTolerance = 0.01;
            const userScale = new THREE.Vector3();
            const currentPos = new THREE.Vector3();
            const currentScale = new THREE.Vector3();
            const currentQuaternion = new THREE.Quaternion();
            const invisibleScale = new THREE.Vector3(0.001, 0.001, 0.001);

            for (let i = 0; i < particles.length; i++) {
                const instanceMatrix = new THREE.Matrix4();
                mesh.getMatrixAt(i, instanceMatrix);
                instanceMatrix.decompose(currentPos, currentQuaternion, currentScale);

                const pos = particles[i].current.translation();
                const scale = particles[i].current.getUserData().scale || 1;
                userScale.set(scale, scale, scale);
                const color = particles[i].current.getUserData().color || 'red';
                userColor.set(color);

                if (!currentPos.equals(pos)) {
                    currentPos.copy(pos);
                    matrixChanged = true;
                }

                if (!currentScale.equals(userScale)) {
                    currentScale.copy(userScale);
                    matrixChanged = true;
                }

                const visible = particles[i].current.getUserData().visible;
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
            const userData = particles[instanceId].current.getUserData();
            const currentScale = userData.scale;
            // Maybe we should have a function on the particle that allows for scaling
            console.log("handlePointerDown", id, instanceId, userData, particles[instanceId]);
            if (currentScale && currentScale != 1) {
                particles[instanceId].current.getUserData().scale = 1.0;
            } else {
                particles[instanceId].current.getUserData().scale = 2.0;
            }
            particles[instanceId].current.getUserData().color = 'pink';
        }
    };

    return (
        <instancedMesh
            ref={internalRef}
            args={[null, null, particles.length]}
            onClick={handlePointerDown}
        >
            <circleGeometry args={[particleRadiusRef, 16]} />
            <meshStandardMaterial />
        </instancedMesh>
    );
});

export default InstancedParticles;