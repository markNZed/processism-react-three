import React, { useRef, useEffect, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import useStoreEntity from './useStoreEntity';
//import * as TIUM from 'three-instanced-uniforms-mesh';
import { vertex as meshBasicVertex, fragment as meshBasicFragment } from 'three/src/renderers/shaders/ShaderLib/meshbasic.glsl.js';
import useStore from '../../useStore'
import { useThree } from '@react-three/fiber';

const USE_CIRCLE_PARTICLES = true; // True to use circle geometry particles, false to use blob texture particles

const ParticlesInstance = React.forwardRef(({ id, node, config, particleTexturesRef }, ref) => {

    /** @type {{ gl: THREE.WebGLRenderer }} */
    const { gl } = useThree();
    const maxParticleCount = config.entityCounts.reduce((a, b) => a * b);

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
    
    /** @type {{ current: { renderTarget: THREE.WebGLRenderTarget, camera: THREE.OrthographicCamera, material: THREE.ShaderMaterial, blobMesh: THREE.Mesh, geometry: THREE.InstancedBufferGeometry, circleMaterial: THREE.ShaderMaterial, circleGeometry: THREE.InstancedBufferGeometry, originalRadius: Number } }} */
    const renderBlobRef = useRef();
    const timeRef = useRef(0);
    const pausePhysics = useStore((state) => state.pausePhysics);

    /** @type {THREE.Texture | Null} */
    const blobTexture = particleTexturesRef.current;

    useEffect(() => {
        if (!internalRef.current) return;

        // Randomize particle rotations
        if (!USE_CIRCLE_PARTICLES) {
            const mesh = internalRef.current;
            particles.forEach((p, i) => {
                
                mesh.getMatrixAt(i, instanceMatrix);
                instanceMatrix.decompose(currentPos, currentQuaternion, currentScale);
                currentQuaternion.setFromEuler(new THREE.Euler(0, 0, Math.random() * 2*Math.PI), true);
                instanceMatrix.compose(currentPos, currentQuaternion, currentScale);
                mesh.setMatrixAt(i, instanceMatrix);
            });
    
            mesh.instanceMatrix.needsUpdate = true;
        }



    }, [ internalRef.current ]);

    useEffect(() => {
        renderBlobRef.current = {};

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
        renderBlobRef.current.circleMaterial = new THREE.ShaderMaterial({
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
        
        circleInstanceGeometry.instanceCount = particles.length;
        renderBlobRef.current.circleGeometry = circleInstanceGeometry;
        renderBlobRef.current.originalRadius = particleRadius;



        const sinVertexShader = meshBasicVertex
.replace('#include <clipping_planes_pars_vertex>',
`#include <clipping_planes_pars_vertex>

    attribute vec2 timeOffset;
    varying vec2 vTimeOffset;
`)
.replace('#include <skinning_vertex>', 
`#include <skinning_vertex>

    // Just before #include <project_vertex>
    vTimeOffset = timeOffset;
`);

        const sinFragmentShader = meshBasicFragment
.replace(
'#include <clipping_planes_pars_fragment>',
`#include <clipping_planes_pars_fragment>
    
    uniform float time;
    uniform vec2 strength;
    uniform vec2 speed;
    //uniform float timeOffset;
    varying vec2 vTimeOffset;
	uniform sampler2D map;
    
    //attribute vec2 sinDir;`)
.replace(
'#include <map_fragment>', 
`    
    vec2 uvOff = vec2(vUv.x + sin(vUv.y*PI2+(time+vTimeOffset.x)*speed.x)*strength.x, vUv.y + sin(vUv.x*PI2+(time+vTimeOffset.y)*speed.y)*strength.y);
    //uvOff = vec2(vUv.x, vUv.y + sin(time+vUv.x*PI2)*0.05);
    vec4 sampledDiffuseColor = texture2D( map, uvOff );
    diffuseColor *= sampledDiffuseColor;
`)
.replace(
'#include <dithering_fragment>',
`#include <dithering_fragment>

    //gl_FragColor = vec4(sampledDiffuseColor.rgb * vColor.rgb, sampledDiffuseColor.a);
    gl_FragColor = vec4(gl_FragColor.rgb, sampledDiffuseColor.a);
`);

        renderBlobRef.current.material = new THREE.ShaderMaterial({
            //map: renderTarget.texture,
            transparent: true,
            wireframe: false,
            depthWrite: false,
            depthTest: false,
            uniforms: { 
                time: { value: 0 },
                strength: { value: new THREE.Vector2(0.05, 0.05), },
                speed: { value: new THREE.Vector2(1, 1) },
                diffuse: { value: new THREE.Vector3(1, 1, 1) },
                center: { value: new THREE.Vector2() },
                map: { value: undefined },
            },
            defines: { USE_UV: true },
            vertexShader: sinVertexShader,
            fragmentShader: sinFragmentShader,
        });

        const planeGeometry = new THREE.PlaneGeometry(particleRadius*2, particleRadius*2, 1, 1);
        const instanceGeometry = new THREE.InstancedBufferGeometry();
        instanceGeometry.setAttribute('position', planeGeometry.getAttribute('position'));
        instanceGeometry.setAttribute('normal', planeGeometry.getAttribute('normal'));
        instanceGeometry.setAttribute('uv', planeGeometry.getAttribute('uv'));
        instanceGeometry.setIndex(planeGeometry.getIndex());

        const timeOffsets = new Float32Array(maxParticleCount*2);
        for (let i=0; i<timeOffsets.length; ++i) { 
            let off = Math.random() * 2*Math.PI;
            timeOffsets[i] = off; 
        }
        const timeOffsetsAttribute = new THREE.InstancedBufferAttribute(timeOffsets, 2, undefined, 1);
        timeOffsetsAttribute.needsUpdate = true;
        instanceGeometry.setAttribute('timeOffset', timeOffsetsAttribute);
        
        instanceGeometry.instanceCount = particles.length;
        renderBlobRef.current.geometry = instanceGeometry;
        
    }, []);

    useFrame((_, deltaTime) => {
        if (!internalRef.current) return;

        if (!pausePhysics) timeRef.current += deltaTime;
        //timeRef.current += deltaTime;

        const mesh = internalRef.current;
        let matrixChanged = false;
        let colorChanged = false;

        if (renderBlobRef.current && blobTexture) {

            const { material: instanceMaterial, geometry: instanceGeometry } = renderBlobRef.current;
            const { circleMaterial: circleInstanceMaterial, circleGeometry: circleInstanceGeometry } = renderBlobRef.current;

            if (USE_CIRCLE_PARTICLES) {
                circleInstanceMaterial.uniforms.time.value = timeRef.current;
                if (circleInstanceGeometry.instanceCount !== particles.length) circleInstanceGeometry.instanceCount = particles.length;
                if (circleInstanceMaterial.uniforms.radius.value !== particleRadius) { circleInstanceMaterial.uniforms.radius.value = particleRadius; }
                
                if (mesh.material !== circleInstanceMaterial) mesh.material = circleInstanceMaterial;
                if (mesh.geometry !== circleInstanceGeometry) mesh.geometry = circleInstanceGeometry;
            }
            else {
                instanceMaterial.uniforms.time.value = timeRef.current;
                if (instanceGeometry.instanceCount !== particles.length) instanceGeometry.instanceCount = particles.length;

                if (instanceMaterial.uniforms.map.value != blobTexture) {
                    instanceMaterial.uniforms.map.value = blobTexture;
                    instanceMaterial.uniforms.map.needsUpdate = true;
                }
                
                if (mesh.material !== instanceMaterial) mesh.material = instanceMaterial;
                if (mesh.geometry !== instanceGeometry) mesh.geometry = instanceGeometry;
            }
        }


        let blobScale;
        if (USE_CIRCLE_PARTICLES) { blobScale = 1.0; }
        else { blobScale = 1.2; }

        particles.forEach((particleRef, i) => {
            const particle = particleRef.current;
        
            mesh.getMatrixAt(i, instanceMatrix);
            instanceMatrix.decompose(currentPos, currentQuaternion, currentScale);

            const pos = particle.translation();
            const scale = (particle.getVisualConfig().scale || 1) * blobScale;

            userScale.set(scale, scale, scale);
            const color = particle.getVisualConfig().color || 'red';
            userColor.set(color);

            if (!currentPos.equals(pos)) {
                currentPos.copy(pos);
                matrixChanged = true;
            }

            const visible = particle.getVisualConfig().visible //|| true;
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

    //let t = new TIUM.InstancedUniformsMesh()

    //const geometry = new THREE.CircleGeometry(particleRadius, 16);
    //const material = new THREE.MeshStandardMaterial();

    return (
        //<group ref={groupRef} >
        //
        //</group>

        <instancedMesh
            ref={internalRef}
            args={[null, null, particles.length]}
            onPointerUp={handlePointerDown}
        
        >
            <planeGeometry args={[ particleRadius*2, particleRadius*2, 1, 1 ]} />
            <meshBasicMaterial args={[{ color: 0xffffff }]} />
            {/*<circleGeometry args={[particleRadius, 16]} />*/}
            {/*<meshStandardMaterial />*/}
        </instancedMesh>
    );
});

export default ParticlesInstance;

const createInstancedGeometry = (geometry, oldInstanced) => {

    const g = new THREE.InstancedBufferGeometry();
    
    
    g.setAttribute('position', geometry.getAttribute('position'));
    g.setAttribute('normal', geometry.getAttribute('normal'));
    g.setAttribute('uv', geometry.getAttribute('uv'));
    g.setIndex(geometry.index);
    
    let sinDir = geometry.getAttribute('sinDir');
    if (sinDir) g.setAttribute('sinDir', sinDir);

    if (oldInstanced) { oldInstanced.dispose(); }
    return g;
}