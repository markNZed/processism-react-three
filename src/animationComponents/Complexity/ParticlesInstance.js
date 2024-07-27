import React, { useRef, useEffect, useImperativeHandle, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import useStoreEntity from './useStoreEntity';
import { vertex as meshBasicVertex, fragment as meshBasicFragment } from 'three/src/renderers/shaders/ShaderLib/meshbasic.glsl.js';
import useStore from '../../useStore'

const ParticlesInstance = React.forwardRef(({ id }, ref) => {

    const maxParticleCount = 5*5*5*2;

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
        renderBlobRef.current = {};
        
        renderBlobRef.current.circleMaterial = createCircleShaderMaterial(1);
        renderBlobRef.current.circleGeometry = createCircleShaderGeometry(1, maxParticleCount, maxParticleCount);
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
        
        if (renderBlobRef.current) {
          const { circleMaterial: circleInstanceMaterial, circleGeometry: circleInstanceGeometry } = renderBlobRef.current;

          circleInstanceMaterial.uniforms.time.value = timeRef.current;
          if (circleInstanceGeometry.instanceCount !== count) circleInstanceGeometry.instanceCount = count;
          //if (circleInstanceMaterial.uniforms.radius.value !== particleRadius) { circleInstanceMaterial.uniforms.radius.value = particleRadius; }
          
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

            const pos = particle.translation();
            let scale = visualConfig.scale || 1;

            const radius = visualConfig.radius;
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

            if (!currentPos.equals(pos)) {
                currentPos.copy(pos);
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
        console.log("ParticlesInstance handlePointerDown", id, event);
        const instanceId = event.instanceId;
        if (instanceId === undefined) return;
        event.stopPropagation();
        const allParticleRefs = getAllParticleRefs();
        const visualConfig = allParticleRefs[instanceId].current.getVisualConfig();
        const currentScale = visualConfig.scale;
        visualConfig.scale = (currentScale && currentScale !== 1) ? 1.0 : 2.0;
        visualConfig.color = 'pink';
    };

    // Use a fixed radius and scale this for particle size
    return (
        <instancedMesh
            ref={internalRef}
            args={[null, null, particleCount]}
            onPointerUp={handlePointerDown}
        >
            <circleGeometry args={[1, 16]} />
            <meshStandardMaterial />
        </instancedMesh>
    );
});

export default ParticlesInstance;

const createCircleShaderMaterial = (particleRadius) => {
    const circleSinVertexShader = meshBasicVertex.replace('#include <clipping_planes_pars_vertex>',
`#include <clipping_planes_pars_vertex>

    attribute vec2 timeOffset;
    attribute float vertTimeOffset;
    uniform float radius;
    uniform float time;
    uniform vec4 strength;
    uniform vec4 speed;
`
).replace('#include <skinning_vertex>', 
`#include <skinning_vertex>

    // Make sure circle radius is equal to the radius uniform
    float len = length(transformed.xy);
    vec2 sinDir = len == 0.0 ? vec2(0.0, 0.0) : normalize(vec2(position.x, position.y));
    transformed = vec3(sinDir * radius, 1.0);
    vec4 strength2 = strength * radius;

    // Just before #include <project_vertex>
    vec2 vertOff = vec2(sin((transformed.y/radius+1.0)*PI2+(time+timeOffset.x)*speed.x)*strength2.x, sin((transformed.x/radius+1.0)*PI2+(time+timeOffset.y)*speed.y)*strength2.y);
    //vec2 vertOff = vec2(sin((time+timeOffset.x)*speed.x)*strength2.x, sin((time+timeOffset.y)*speed.y)*strength2.y);
    transformed.x += vertOff.x;
    transformed.y += vertOff.y;
    
    //float vo2Mult = sin(time*speed.z); // -- Looks bad, causes ripples to smooth out
    vec2 vertOff2 = sinDir * strength2.z * sin(vertTimeOffset+(time+timeOffset.x)*speed.z);// * vo2Mult;
    transformed.x += vertOff2.x;
    transformed.y += vertOff2.y;
`);

    return new THREE.ShaderMaterial({
        //map: renderTarget.texture,
        transparent: false,
        wireframe: false,
        //depthWrite: false,
        //depthTest: false,
        uniforms: { 
            radius: { value: particleRadius },
            time: { value: 0 },
            strength: { value: new THREE.Vector4(0.08, 0.08, 0.04, 0.04), },
            speed: { value: new THREE.Vector4(1, 1, 2, 2) },
            diffuse: { value: new THREE.Vector3(1, 1, 1) },
        },
        vertexShader: circleSinVertexShader,
        fragmentShader: meshBasicFragment,
    });
}

const createCircleShaderGeometry = (particleRadius, particleCount, maxParticleCount) => {
    const circleSegments = 64;
    const circleGeometry = new THREE.CircleGeometry(particleRadius, circleSegments);
    const circleInstanceGeometry = new THREE.InstancedBufferGeometry();
    circleInstanceGeometry.setAttribute('position', circleGeometry.getAttribute('position'));
    circleInstanceGeometry.setAttribute('normal', circleGeometry.getAttribute('normal'));
    circleInstanceGeometry.setAttribute('uv', circleGeometry.getAttribute('uv'));
    circleInstanceGeometry.setIndex(circleGeometry.getIndex());

    let stepAngle = 2*Math.PI / circleSegments;
    const vertTimeOffs = new Float32Array((circleSegments+2));
    vertTimeOffs[0] = 0;
    for (let i=1; i<(circleSegments+2); ++i) {
        let angle = (stepAngle * (i-1)) % 2*Math.PI;
        vertTimeOffs[i] = angle*4;
    }
    vertTimeOffs[vertTimeOffs.length - 1] = vertTimeOffs[1];
    const vertTimeOffsAttribute = new THREE.BufferAttribute(vertTimeOffs, 1);
    circleInstanceGeometry.setAttribute('vertTimeOffset', vertTimeOffsAttribute);

    const circleTimeOffsets = new Float32Array(maxParticleCount*2);
    for (let i=0; i<circleTimeOffsets.length; ++i) { 
        let off = Math.random() * 2*Math.PI;
        circleTimeOffsets[i] = off; 
    }
    const circleTimeOffsetsAttribute = new THREE.InstancedBufferAttribute(circleTimeOffsets, 2, undefined, 1);
    circleTimeOffsetsAttribute.needsUpdate = true;
    circleInstanceGeometry.setAttribute('timeOffset', circleTimeOffsetsAttribute);
    
    circleInstanceGeometry.instanceCount = particleCount;
    return circleInstanceGeometry;     
}