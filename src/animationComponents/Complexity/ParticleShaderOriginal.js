import * as THREE from 'three';
import { vertex as meshBasicVertex, fragment as meshBasicFragment } from 'three/src/renderers/shaders/ShaderLib/meshbasic.glsl.js';

export const createParticleShaderOriginalMaterial = (particleRadius) => {

    // Instead of writing a shader from scratch, we will modify the shader code of the
    // THREE.MeshBasicMaterial vertex shader by searching for parts of the code where we want
    // to insert our uniforms and attributes, and the part of the code in the main function
    // just before the vertices are transformed by the modelview and projection matrices
    const circleSinVertexShader = meshBasicVertex.replace('#include <clipping_planes_pars_vertex>',
`#include <clipping_planes_pars_vertex>

    attribute vec2 timeOffset;
    attribute float vertTimeOffset;
    attribute vec4 strengthMult;
    attribute vec4 speedMult;

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
    vec4 strengthScaled = strength * strengthMult * radius;
    vec4 speedScaled = speed * speedMult;
  
    // Just before #include <project_vertex> shader chunk in MeshBasicMaterial vertex shader
    // That shader chunk is where the vertices are transformed by modelview and projection matrices

    // Translate vertices horizontally/vertically based on sin of the other coordinate
    // (verticles will be translated horizontally based on time and their y coordinate, and vertically based on time and their x coordinate)
    // Translate vertices in/out in the direction toward/away from the center of the circle
    vec2 vertOff = vec2(sin((transformed.y/radius+1.0)*PI2+(time+timeOffset.x)*speedScaled.x)*strengthScaled.x, sin((transformed.x/radius+1.0)*PI2+(time+timeOffset.y)*speedScaled.y)*strengthScaled.y);
    //vec2 vertOff = vec2(sin((time+timeOffset.x)*speedScaled.x)*strengthScaled.x, sin((time+timeOffset.y)*speedScaled.y)*strengthScaled.y);
    transformed.x += vertOff.x;
    transformed.y += vertOff.y;
    
    // Translate vertices in/out in the direction toward/away from the center of the circle
    //float vo2Mult = sin(time*speedScaled.z); // -- Looks bad, causes ripples to smooth out
    vec2 vertOff2 = sinDir * strengthScaled.z * sin(vertTimeOffset+(time+timeOffset.x)*speedScaled.z);// * vo2Mult;
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

/**
 * 
 * @param {Number} particleRadius The radius of the circle
 * @param {Number} particleCount The number of particles to render
 * @param {Number} maxParticleCount The max instance count for the geometry
 * @returns 
 */
export const createParticleShaderOriginalGeometry = (particleRadius, particleCount, maxParticleCount) => {
    // Use a regular THREE.CircleGeometry to get attributes for the InstancedBufferGeometry
    const circleSegments = 64;
    const circleGeometry = new THREE.CircleGeometry(particleRadius, circleSegments);
    const circleInstanceGeometry = new THREE.InstancedBufferGeometry();
    circleInstanceGeometry.setAttribute('position', circleGeometry.getAttribute('position'));
    circleInstanceGeometry.setAttribute('normal', circleGeometry.getAttribute('normal'));
    circleInstanceGeometry.setAttribute('uv', circleGeometry.getAttribute('uv'));
    circleInstanceGeometry.setIndex(circleGeometry.getIndex());
  
    // Set a time offset associated with each vertex on the circle based on its angle
    // This is used to calculate vertOff2 in the shader which moves the vertices in/out around the edge
    // of the circle. Since it's based on their angle it could be computed in the vertex shader, but this will make it
    // slightly cheaper
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

    // strengthMult and speedMult instanced attributes
    // Multiplies the strength/speed uniforms from the material on a per instance basis to give variety to each particle
    // Speed determines how fast the sin wave moves, strength determines how strong the vertex displacement is
    // Speed/strength xy are used for vertOff in the vertex shader, which displaces the vertices horizontally/vertically
    // based on the other component (x offset is based on y position, and vice versa)
    // Speed/strength z is used for vertOff2 which displaces the vertices in/out in their direction from the center of the circle
    const strength = new Float32Array(maxParticleCount*4);
    const speed = new Float32Array(maxParticleCount*4);
    for (let i=0; i<maxParticleCount; i+=4) {
      strength[i+0] = Math.random() + 1;
      strength[i+1] = Math.random() + 1;
      strength[i+2] = Math.random() + 1;
      strength[i+3] = Math.random() + 1;
      speed[i+0] = Math.random() + 1;
      speed[i+1] = Math.random() + 1;
      speed[i+2] = Math.random() + 1;
      speed[i+3] = Math.random() + 1;
    }
    const strengthAttribute = new THREE.InstancedBufferAttribute(strength, 4, undefined, 1);
    const speedAttribute = new THREE.InstancedBufferAttribute(speed, 4, undefined, 1);
    circleInstanceGeometry.setAttribute('strengthMult', strengthAttribute);
    circleInstanceGeometry.setAttribute('speedMult', speedAttribute);

    // timeOffset instanced attribute
    // Added to material time uniform to give variety to each particle
    const circleTimeOffsets = new Float32Array(maxParticleCount*2);
    for (let i=0; i<circleTimeOffsets.length; ++i) { 
        let off = Math.random() * 2*Math.PI;
        circleTimeOffsets[i] = off; 
    }
    const circleTimeOffsetsAttribute = new THREE.InstancedBufferAttribute(circleTimeOffsets, 2, undefined, 1);
    circleTimeOffsetsAttribute.needsUpdate = true;
    circleInstanceGeometry.setAttribute('timeOffset', circleTimeOffsetsAttribute);
    
    circleInstanceGeometry.instanceCount = particleCount;

    // Keep track of max instance count in InstancedBufferGeometry.userData
    // It will need to be recreated if the particle count ever exceeds it
    circleInstanceGeometry.userData.maxInstanceCount = maxParticleCount;
    return circleInstanceGeometry;     
}