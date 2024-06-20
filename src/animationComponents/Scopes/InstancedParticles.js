import React, { useRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import useStoreEntity from './useStoreEntity';

const InstancedParticles = React.forwardRef(({ id, node }, ref) => {

    const internalRef = useRef();
    useImperativeHandle(ref, () => internalRef.current);

    const directGetNodeProperty = useStoreEntity.getState().getNodeProperty;
    const particleRadiusRef = directGetNodeProperty('root', 'particleRadiusRef');
    // Because we know InstancedParticles is called from the root node
    const particles = node.particlesRef.current;
    const userColor = new THREE.Color();
    let colorChanged = false;
    let matrixChanged = false;
    const userScale = new THREE.Vector3();
    const currentPos = new THREE.Vector3();
    const currentScale = new THREE.Vector3();
    const currentQuaternion = new THREE.Quaternion();
    const invisibleScale = new THREE.Vector3(0.001, 0.001, 0.001);
    const instanceMatrix = new THREE.Matrix4();

    useFrame(() => {
        if (!internalRef.current) return;
        const mesh = internalRef.current;

        particles.forEach((particleRef, i) => {
            const particle = particleRef.current;
        
            mesh.getMatrixAt(i, instanceMatrix);
            instanceMatrix.decompose(currentPos, currentQuaternion, currentScale);

            const pos = particle.translation();
            const scale = particle.getUserData().scale || 1;
            userScale.set(scale, scale, scale);
            const color = particle.getUserData().color || 'red';
            userColor.set(color);

            if (!currentPos.equals(pos)) {
                currentPos.copy(pos);
                matrixChanged = true;
            }

            const visible = particle.getUserData().visible;
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
            
                if (!currentColor.equals(userColor)) {
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

    // Should use entity instead of particle as per relations 
    const handlePointerDown = (event) => {
        // Require shift to differntiate from click in Blob
        if (!event.shiftKey) return;
        const instanceId = event.instanceId;
        if (instanceId === undefined) return;
        event.stopPropagation();
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
    };

    return (
        <instancedMesh
            ref={internalRef}
            args={[null, null, particles.length]}
            onPointerUp={handlePointerDown}
        >
            <circleGeometry args={[particleRadiusRef, 16]} />
            <meshStandardMaterial />
        </instancedMesh>
    );
});

export default InstancedParticles;
