import React, { useRef, useEffect, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import useStoreEntity from './useStoreEntity';
//import * as TIUM from 'three-instanced-uniforms-mesh';
import { vertex as meshBasicVertex, fragment as meshBasicFragment } from 'three/src/renderers/shaders/ShaderLib/meshbasic.glsl.js';
import useStore from '../../useStore'
import { useThree } from '@react-three/fiber';

const ParticlesInstance = React.forwardRef(({ id, node, geometryRef, config }, ref) => {

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
    
    /** @type {{ current: { renderTarget: THREE.WebGLRenderTarget, camera: THREE.OrthographicCamera, material: THREE.ShaderMaterial, blobMesh: THREE.Mesh, geometry: THREE.InstancedBufferGeometry } }} */
    const renderBlobRef = useRef();
    const timeRef = useRef(0);
    const pausePhysics = useStore((state) => state.pausePhysics);
    //const groupRef = useRef();
    //const circleGeometry = useRef(new THREE.CircleGeometry(0.0001, 4));
    //const internalRef = useRef(new TIUM.InstancedUniformsMesh(circleGeometry.current, material.current, particles.length));

    useEffect(() => {
        if (!internalRef.current) return;

        // Randomize particle rotations
        const mesh = internalRef.current;
        particles.forEach((p, i) => {
            
            mesh.getMatrixAt(i, instanceMatrix);
            instanceMatrix.decompose(currentPos, currentQuaternion, currentScale);
            currentQuaternion.setFromEuler(new THREE.Euler(0, 0, Math.random() * 2*Math.PI), true);
            instanceMatrix.compose(currentPos, currentQuaternion, currentScale);
            mesh.setMatrixAt(i, instanceMatrix);
        });

        mesh.instanceMatrix.needsUpdate = true;



    }, [ internalRef.current ]);

    useEffect(() => {
        renderBlobRef.current = {
            renderTarget: new THREE.WebGLRenderTarget(1024, 1024),
            camera: new THREE.OrthographicCamera(-10, 10, -10, 10, 0.1, 100),
            scene: new THREE.Scene(),
            blobMesh: new THREE.Mesh(undefined, new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })),
            v1: new THREE.Vector3(), v2: new THREE.Vector3(),
        };
        const { camera, scene, blobMesh, renderTarget } = renderBlobRef.current;
        //renderBlobRef.current.material = new THREE.MeshBasicMaterial({ map: renderTarget.texture, transparent: true, side: THREE.DoubleSide });
        scene.add(camera);
        scene.add(blobMesh);
        camera.position.set(0, 0, 10);

        const planeGeometry = new THREE.PlaneGeometry(particleRadius*2, particleRadius*2, 1, 1);
        const instanceGeometry = new THREE.InstancedBufferGeometry();
        instanceGeometry.setAttribute('position', planeGeometry.getAttribute('position'));
        instanceGeometry.setAttribute('normal', planeGeometry.getAttribute('normal'));
        instanceGeometry.setAttribute('uv', planeGeometry.getAttribute('uv'));
        instanceGeometry.setIndex(planeGeometry.index);

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

//        const sinVertexShader = meshBasicVertex.replace('#include <clipping_planes_pars_vertex>',
//`#include <clipping_planes_pars_vertex>
//
//    uniform float time;
//    uniform float radius;
//    uniform vec2 center;
//    //attribute vec2 sinDir;
//`
//            ).replace('#include <skinning_vertex>', 
//`#include <skinning_vertex>
//
//    // Just before #include <project_vertex>
//    float sinTime = sin(time);
//    //transformed.xy += sinDir * sinTime;
//    //transformed.xy += normalize(transformed.xy - center) * sinTime * radius;
//    transformed.y += sin(transformed.x + time) * 0.5;
//    transformed.x += sin(transformed.y + time) * 0.5;
//`);



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

    gl_FragColor = vec4(sampledDiffuseColor.rgb * vColor.rgb, sampledDiffuseColor.a);
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
                map: { value: renderTarget.texture },
            },
            defines: { USE_UV: true },
            vertexShader: sinVertexShader,
            fragmentShader: sinFragmentShader,
        });

        renderBlobRef.current.material.onBeforeCompile = (shader) => {
            //console.log(shader.vertexShader);
        };
        
    }, []);

    useFrame((_, deltaTime) => {
        if (!internalRef.current) return;

        //if (!pausePhysics) timeRef.current += deltaTime;
        timeRef.current += deltaTime;

        const mesh = internalRef.current;
        let matrixChanged = false;
        let colorChanged = false;

        if (gl && geometryRef && geometryRef.current && geometryRef.current.geometry && renderBlobRef.current) {

            const { camera: textureCamera, material: instanceMaterial, blobMesh, renderTarget, scene: textureScene, v1: gCenter, v2: gSize, geometry: instanceGeometry } = renderBlobRef.current;
            blobMesh.geometry = geometryRef.current.geometry;

            instanceMaterial.uniforms.time.value = timeRef.current;
            if (instanceGeometry.instanceCount !== particles.length) instanceGeometry.instanceCount = particles.length;

            blobMesh.geometry.computeBoundingSphere();
            const bs = blobMesh.geometry.boundingSphere;
            const sizeMult = 1.5;
            textureCamera.position.set(bs.center.x, bs.center.y, 10);
            textureCamera.updateMatrix();
            textureCamera.left = -bs.radius*sizeMult; textureCamera.right = bs.radius*sizeMult;
            textureCamera.top = -bs.radius*sizeMult; textureCamera.bottom = bs.radius*sizeMult;
            textureCamera.updateProjectionMatrix();
            let brk = 5;


            gl.setRenderTarget(renderTarget);
            gl.setSize(1024, 1024);
            gl.clear();
            gl.render(textureScene, textureCamera);
            gl.setRenderTarget(null);
            gl.setSize(window.innerWidth, window.innerHeight);

            if (mesh.material !== instanceMaterial) mesh.material = instanceMaterial;
            if (mesh.geometry !== instanceGeometry) mesh.geometry = instanceGeometry;
        }

        let blobScale = 1.3;
        if (geometryRef && geometryRef.current && geometryRef.current.geometry) { 
            //mesh.geometry = geometryRef.current.geometry;
            //blobScale = (particleRadius / geometryRef.current.blobRadius) * 1.3;

            //geometry.current = createInstancedGeometry(geometryRef.current.geometry, geometry.current);
            //mesh.geometry = geometry.current;
        }

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

        // Test
        //mesh.getMatrixAt(0, instanceMatrix);
        //instanceMatrix.compose(new THREE.Vector3(0, 0, 34), new THREE.Quaternion(), new THREE.Vector3(blobScale * 100, blobScale * 100, blobScale * 100));
        //mesh.setMatrixAt(0, instanceMatrix);

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