import React, { useRef, useEffect, useImperativeHandle, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import useStoreEntity from './useStoreEntity';
import useStore from '../../useStore'
import ParticleShader from './ParticleShader'
const { createParticleShaderOriginalGeometry, createParticleShaderDiversityGeometry, createParticleShaderOriginalMaterial, createParticleShaderDiversityMaterial } = ParticleShader;

const SHADER_NONE = 0;
const SHADER_1 = 1;
const SHADER_2 = 2;
const USE_SHADER = SHADER_2;

const ParticlesInstance = React.forwardRef(({ id, config }, ref) => {

    // We'll create the InstancedBufferGeometry for the particle shader with a max instance count based on how many particles were
    // set up in the config, with room to grow
    const startingParticleCount = config.entityCounts.reduce((a, b) => a*b, 1);
    

    const internalRef = useRef();
    useImperativeHandle(ref, () => internalRef.current);

    const { getAllParticleRefs } = useStoreEntity.getState();
    const userColor = new THREE.Color();
    const userScale = new THREE.Vector3();
    const currentPos = new THREE.Vector3();
    const currentScale = new THREE.Vector3();
    const currentQuaternion = new THREE.Quaternion();
    const currentColor = new THREE.Color();
    const invisibleScale = new THREE.Vector3(0.001, 0.001, 0.001);
    const instanceMatrix = new THREE.Matrix4();
    const [particleCount, setParticleCount] = useState(0);
    const showParticles = useStore((state) => state.getOption("showParticles"));
    
    
    /** @type {{ current: { circleMaterial: THREE.ShaderMaterial, circleGeometry: THREE.InstancedBufferGeometry } }} */
    const renderBlobRef = useRef();
    const timeRef = useRef(0);
    const pausePhysics = useStore((state) => state.pausePhysics);

    useEffect(() => {
        switch (USE_SHADER) {
          case SHADER_NONE:
            break;
          case SHADER_1:
            renderBlobRef.current = { };
            renderBlobRef.current.circleMaterial = createParticleShaderOriginalMaterial(1);
            renderBlobRef.current.circleGeometry = createParticleShaderOriginalGeometry(1, startingParticleCount, startingParticleCount*2);
            break;
          case SHADER_2:
            renderBlobRef.current = { };
            renderBlobRef.current.circleMaterial = createParticleShaderDiversityMaterial(1);
            renderBlobRef.current.circleGeometry = createParticleShaderDiversityGeometry(1, 12, startingParticleCount, startingParticleCount*2)
            break;
        }
    }, []);

    useFrame((_, deltaTime) => {
        if (!internalRef.current) return;

        if (!pausePhysics) timeRef.current += deltaTime;
        //timeRef.current += deltaTime;

        const mesh = internalRef.current;
        let matrixChanged = false;
        let colorChanged = false;

        const allParticleRefs = getAllParticleRefs();
        const count = allParticleRefs.length;
        if (count !== particleCount) {
            setParticleCount(count);
        }
        
        if (renderBlobRef.current && (USE_SHADER === SHADER_1 || USE_SHADER === SHADER_2)) {
          let { circleMaterial: circleInstanceMaterial, circleGeometry: circleInstanceGeometry } = renderBlobRef.current;

          circleInstanceMaterial.uniforms.time.value = timeRef.current;

          // If the number of particles is greater than our max instance count, recreate the geometry with particleCount*2 max instance count
          if (circleInstanceGeometry.userData.maxInstanceCount < particleCount) {
            renderBlobRef.current.circleGeometry = USE_SHADER === SHADER_1 ? 
              createParticleShaderOriginalGeometry(1, particleCount, particleCount*2) :
              createParticleShaderDiversityGeometry(1, 12, particleCount, particleCount*2);

            circleInstanceGeometry.dispose();
            circleInstanceGeometry = renderBlobRef.current.circleGeometry;
          }

          // If the instance count of our geometry is not equal to particleCount, set it
          if (circleInstanceGeometry.instanceCount !== particleCount) circleInstanceGeometry.instanceCount = particleCount;
          //if (circleInstanceMaterial.uniforms.radius.value !== particleRadius) { circleInstanceMaterial.uniforms.radius.value = particleRadius; }
          
          // If the InstancedMesh is not using our shader material and InstancedBufferGeometry, set it
          if (mesh.material !== circleInstanceMaterial) mesh.material = circleInstanceMaterial;
          if (mesh.geometry !== circleInstanceGeometry) mesh.geometry = circleInstanceGeometry;
      }

        //console.log("allParticleRefs", allParticleRefs)

        allParticleRefs.forEach((particleRef, i) => {
            
            const particle = particleRef.current;
            if (!particle || !particle.current) return;
        
            mesh.getMatrixAt(i, instanceMatrix);
            instanceMatrix.decompose(currentPos, currentQuaternion, currentScale);
 
            const visualConfig = particle.getVisualConfig();

            const particlePos = particle.translation();
            let scale = visualConfig.scale || 1;

            const RADIUS_MULT = USE_SHADER === SHADER_2 ? 0.85 : 1.0;
            const radius = visualConfig.radius * RADIUS_MULT;
            const origRadius = visualConfig.origRadius;
            //console.log("radius", i, radius, origRadius);
            if (radius !== origRadius) {
                scale = scale * (radius / origRadius);
            }

            // Default radius is 1
            if (radius !== 1) {
                scale = scale * (radius);
            }

            userScale.set(scale, scale, scale);

            const color = visualConfig.color || 'red';
            userColor.set(color);

            if (!currentPos.equals(particlePos)) {
                currentPos.copy(particlePos);
                matrixChanged = true;
            }

            const visible = visualConfig.visible || showParticles;
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
        const allParticleRefs = getAllParticleRefs();
        const visualConfig = allParticleRefs[instanceId].current.getVisualConfig();
        const currentScale = visualConfig.scale;
        visualConfig.scale = (currentScale && currentScale !== 1) ? 1.0 : 2.0;
        visualConfig.color = 'pink';
        console.log("ParticlesInstance handlePointerDown", id, event, visualConfig);
    };

    // Use a fixed radius and scale this for particle size
    return (
        <instancedMesh
            ref={internalRef}
            args={[null, null, particleCount]}
            onPointerUp={handlePointerDown}
        >
            <circleGeometry args={[1, 16]} />
            <meshStandardMaterial wireframe={false} side={THREE.FrontSide} />
        </instancedMesh>
    );
});

export default ParticlesInstance;