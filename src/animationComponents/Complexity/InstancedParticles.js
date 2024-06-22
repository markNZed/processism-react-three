import React, { useRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import useStoreEntity from './useStoreEntity';

const InstancedParticles = React.forwardRef(({ id, node }, ref) => {

    const internalRef = useRef();
    useImperativeHandle(ref, () => internalRef.current);

    const getNodeProperty = useStoreEntity.getState().getNodeProperty;
    const particleRadius = getNodeProperty('root', 'particleRadius');
    const particles = node.particlesRef.current;
    const userColor = new THREE.Color();
    const userScale = new THREE.Vector3();
    const currentPos = new THREE.Vector3();
    const currentScale = new THREE.Vector3();
    const currentQuaternion = new THREE.Quaternion();
    const invisibleScale = new THREE.Vector3(0.001, 0.001, 0.001);
    const instanceMatrix = new THREE.Matrix4();

    useFrame(() => {
        if (!internalRef.current) return;
        const mesh = internalRef.current;
        let matrixChanged = false;
        let colorChanged = false;

        particles.forEach((particleRef, i) => {
            const particle = particleRef.current;
        
            mesh.getMatrixAt(i, instanceMatrix);
            instanceMatrix.decompose(currentPos, currentQuaternion, currentScale);

            const pos = particle.translation();
            const scale = particle.getVisualConfig().scale || 1;
            userScale.set(scale, scale, scale);
            const color = particle.getVisualConfig().color || 'red';
            userColor.set(color);

            if (!currentPos.equals(pos)) {
                currentPos.copy(pos);
                matrixChanged = true;
            }

            const visible = particle.getVisualConfig().visible;
            if (!visible) {
                currentScale.copy(invisibleScale);
                matrixChanged = true;
            } else if (!currentScale.equals(userScale)) {
                currentScale.copy(userScale);
                matrixChanged = true;
            }

            if (matrixChanged) {
                instanceMatrix.compose(currentPos, currentQuaternion, currentScale);
                mesh.setMatrixAt(i, instanceMatrix);
            }

            if (mesh.instanceColor) {
                const currentColor = new THREE.Color();
                mesh.getColorAt(i, currentColor);
            
                // Tolerance because the conversion to floats causing mismatch
                const tolerance = 0.001;
                const diffR = Math.pow(currentColor.r - userColor.r, 2);
                const diffG = Math.pow(currentColor.g - userColor.g, 2);
                const diffB = Math.pow(currentColor.b - userColor.b, 2);

            
                const colorDifference = Math.sqrt(diffR + diffG + diffB);
            
                if (colorDifference > tolerance) {
                    mesh.setColorAt(i, userColor);
                    colorChanged = true;
                }
            } else {
                mesh.setColorAt(i, userColor);
                colorChanged = true;
            }
        });

        if (matrixChanged) {
            mesh.instanceMatrix.needsUpdate = true;
        }

        if (colorChanged) {
            mesh.instanceColor.needsUpdate = true;
        }
    });

    const handlePointerDown = (event) => {
        if (!event.shiftKey) return;
        const instanceId = event.instanceId;
        if (instanceId === undefined) return;
        event.stopPropagation();
        const visualConfig = particles[instanceId].current.getVisualConfig();
        const currentScale = visualConfig.scale;
        visualConfig.scale = (currentScale && currentScale !== 1) ? 1.0 : 2.0;
        visualConfig.color = 'pink';
    };

    return (
        <instancedMesh
            ref={internalRef}
            args={[null, null, particles.length]}
            onPointerUp={handlePointerDown}
        >
            <circleGeometry args={[particleRadius, 16]} />
            <meshStandardMaterial />
        </instancedMesh>
    );
});

export default InstancedParticles;
