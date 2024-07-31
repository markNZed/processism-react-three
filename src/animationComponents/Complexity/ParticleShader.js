import * as THREE from 'three';
import { vertex as meshBasicVertex, fragment as meshBasicFragment } from 'three/src/renderers/shaders/ShaderLib/meshbasic.glsl.js';

const createCircleShaderMaterial = (particleRadius) => {

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
    vec4 strength2 = strength * strengthMult * radius;
    vec4 speed2 = speed * speedMult;
  
    // Just before #include <project_vertex>
    vec2 vertOff = vec2(sin((transformed.y/radius+1.0)*PI2+(time+timeOffset.x)*speed2.x)*strength2.x, sin((transformed.x/radius+1.0)*PI2+(time+timeOffset.y)*speed2.y)*strength2.y);
    //vec2 vertOff = vec2(sin((time+timeOffset.x)*speed2.x)*strength2.x, sin((time+timeOffset.y)*speed2.y)*strength2.y);
    transformed.x += vertOff.x;
    transformed.y += vertOff.y;
    
    //float vo2Mult = sin(time*speed2.z); // -- Looks bad, causes ripples to smooth out
    vec2 vertOff2 = sinDir * strength2.z * sin(vertTimeOffset+(time+timeOffset.x)*speed2.z);// * vo2Mult;
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


const createCircleShaderMaterial2 = (particleRadius) => {

    const circleSinVertexShader = meshBasicVertex.replace('#include <clipping_planes_pars_vertex>',
`#include <clipping_planes_pars_vertex>

    attribute vec2 timeOffset;
    attribute float vertTimeOffset;
    attribute vec4 strengthMult;
    attribute vec4 speedMult;

    attribute vec4 translate1;
    attribute vec4 translate2;
    attribute vec4 translate3;
    attribute vec4 translate4;

    uniform float radius;
    uniform float time;
    uniform vec4 strength;
    uniform vec4 speed;
`
).replace('#include <skinning_vertex>', 
`#include <skinning_vertex>

    vec2 dragPos;
    vec2 dragDir;
    float dragDist;
    float dragRadius;
    float dragStrength;
    float t;
    float len;

      // Translate 1
      dragPos = translate1.xy;
      dragRadius = translate1.z;
      dragStrength = translate1.w;

      len = length(transformed.xy);
      dragDir = len == 0.0 ? vec2(0.0, 0.0) : normalize(vec2(transformed.x, transformed.y));
      dragDist = length(transformed.xy - dragPos);
      t = 1.0 - min(1.0, dragDist / dragRadius);
      t = sin(t*0.5*PI);
      transformed.xy += dragDir * dragStrength * t;

      // Translate 2
      dragPos = translate2.xy;
      dragRadius = translate2.z;
      dragStrength = translate2.w;

      len = length(transformed.xy);
      dragDir = len == 0.0 ? vec2(0.0, 0.0) : normalize(vec2(transformed.x, transformed.y));
      dragDist = length(transformed.xy - dragPos);
      t = 1.0 - min(1.0, dragDist / dragRadius);
      t = sin(t*0.5*PI);
      transformed.xy += dragDir * dragStrength * t;

      // Translate 3
      dragPos = translate3.xy;
      dragRadius = translate3.z;
      dragStrength = translate3.w;

      len = length(transformed.xy);
      dragDir = len == 0.0 ? vec2(0.0, 0.0) : normalize(vec2(transformed.x, transformed.y));
      dragDist = length(transformed.xy - dragPos);
      t = 1.0 - min(1.0, dragDist / dragRadius);
      t = sin(t*0.5*PI);
      transformed.xy += dragDir * dragStrength * t;

      // Translate 4
      dragPos = translate4.xy;
      dragRadius = translate4.z;
      dragStrength = translate4.w;

      len = length(transformed.xy);
      dragDir = len == 0.0 ? vec2(0.0, 0.0) : normalize(vec2(transformed.x, transformed.y));
      dragDist = length(transformed.xy - dragPos);
      t = 1.0 - min(1.0, dragDist / dragRadius);
      t = sin(t*0.5*PI);
      transformed.xy += dragDir * dragStrength * t;

    len = length(transformed.xy);
    vec2 sinDir = len == 0.0 ? vec2(0.0, 0.0) : normalize(vec2(transformed.x, transformed.y));
    
    vec4 strength2 = strength * strengthMult * radius;
    vec4 speed2 = speed * speedMult;
  
    // Just before #include <project_vertex>
    vec2 vertOff = vec2(sin((transformed.y/radius+1.0)*PI2+(time+timeOffset.x)*speed2.x)*strength2.x, sin((transformed.x/radius+1.0)*PI2+(time+timeOffset.y)*speed2.y)*strength2.y);
    //vec2 vertOff = vec2(sin((time+timeOffset.x)*speed2.x)*strength2.x, sin((time+timeOffset.y)*speed2.y)*strength2.y);
    transformed.x += vertOff.x;
    transformed.y += vertOff.y;
    
    //float vo2Mult = sin(time*speed2.z); // -- Looks bad, causes ripples to smooth out
    vec2 vertOff2 = sinDir * strength2.z * sin(vertTimeOffset+(time+timeOffset.x)*speed2.z);// * vo2Mult;
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
const createCircleShaderGeometry = (particleRadius, particleCount, maxParticleCount) => {
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

/**
 * 
 * @param {*} radius The radius of the circle
 * @param {*} segmentsPer90 The number of segments the circle has in every quadrant (total segment count will be this * 4)
 * @param {*} particleCount The number of particles to render
 * @param {*} maxParticleCount The max instance count for the geometry
 * @returns 
 */
const createCircleShaderGeometry2 = (radius, segmentsPer90, particleCount, maxParticleCount) => {
  if (segmentsPer90 < 1) segmentsPer90 = 1;

  // Circle is created with a number of segments in the positive xy quadrant
  // These vertices are then flipped horizontally/vertically for the other quadrants
  // A grid is made between these vertices
  // Then 4 positions on the outside of the circle are selected randomly and dragged
  // outward in direction opposite the center of the circle
  // The drag operation has a radius which determines how many vertices are affected
  // And a strength which determines how far the vertices are dragged
  // Vertices further from the center of the drag operation are affected less than those
  // close to the center
  // This is basically like dragging a vertex in Blender in vertex editing mode with "Proportional Editing" turned on
  // That's where the idea came from.
  // This gives the particles a decent amount of variety and uniqueness
  // This is all done in the vertex shader so all the particles can still be rendered instanced with the same geometry and material
  //                        .
  //                  /     |       \
  //                . _____ . ______ .
  //               /|       |        |\
  //             . _.______ . ______ ._ .
  //            /|  |       |        |  |\
  //           ._.__._______.________.__._.
  const segments = (segmentsPer90-1) + 2;
  const stepAngle = 0.5*Math.PI / segments;

  /** @type {Map<Number, Array<THREE.Vector2>>} */
  let xPts = new Map();
  /** @type {Map<Number, Array<THREE.Vector2>>} */
  let yPts = new Map();

  /**
   * 
   * @param {Map<Number, Array<THREE.Vector2>>} map 
   * @param {Number} key 
   * @param {THREE.Vector2} pt 
   */
  const addPointToMap = (map, key, pt) => {
    let ar = map.get(key);
    if (!ar) { ar = []; map.set(key, ar); }
    ar.push(pt);
  }

  const EPSILON = 1e-6;
  /**
   * 
   * @param {Number} n
   */
  const isAlmostZero = (n) => {
    return Math.abs(n) < EPSILON;
  }

  for (let i=0; i<=segments; ++i) {
    const angle = i*stepAngle;
    const pt = new THREE.Vector2(Math.cos(angle)*radius, Math.sin(angle)*radius);

    if (isAlmostZero(pt.x)) pt.x = 0;
    if (isAlmostZero(pt.y)) pt.y = 0;

    addPointToMap(yPts, pt.y, pt);
    addPointToMap(xPts, pt.x, pt);
    if (pt.x === 0) {
      addPointToMap(yPts, -pt.y, new THREE.Vector2(pt.x, -pt.y));

      addPointToMap(xPts, pt.x, new THREE.Vector2(pt.x, -pt.y));

    }
    else if (pt.y === 0) {
      addPointToMap(yPts, pt.y, new THREE.Vector2(-pt.x, pt.y));

      addPointToMap(xPts, -pt.x, new THREE.Vector2(-pt.x, pt.y));
    }
    else {
      addPointToMap(yPts, pt.y, new THREE.Vector2(-pt.x, pt.y));
      addPointToMap(yPts, -pt.y, new THREE.Vector2(pt.x, -pt.y));
      addPointToMap(yPts, -pt.y, new THREE.Vector2(-pt.x, -pt.y));

      addPointToMap(xPts, -pt.x, new THREE.Vector2(-pt.x, pt.y));
      addPointToMap(xPts, pt.x, new THREE.Vector2(pt.x, -pt.y));
      addPointToMap(xPts, -pt.x, new THREE.Vector2(-pt.x, -pt.y));
    }
  }

  let xCoords = Array.from(xPts.keys()).sort((a, b) => a - b);
  let yCoords = Array.from(yPts.keys()).sort((a, b) => b - a);

  // Create a 2d square map of the vertices of the circle
  // Indexes inside and on the edge of the circle will have THREE.Vector2's.
  // Indexes outside the circle will be null
  const points2d = [];
  for (let y=0; y<yCoords.length; ++y) {
    const yCoord = yCoords[y];
    let xMin = Number.POSITIVE_INFINITY, xMax = Number.NEGATIVE_INFINITY;
    let pts = yPts.get(yCoord);
    pts.forEach((pt) => { xMin = Math.min(xMin, pt.x); xMax = Math.max(xMax, pt.x); });

    let xStartIndex = -1;
    for (let i=0; i<xCoords.length; ++i) { if (xCoords[i] >= xMin) { xStartIndex = i; break; } }
    let xEndIndex = -1;
    for (let i=xCoords.length-1; i>=0; --i) { if (xCoords[i] <= xMax) { xEndIndex = i; break; } }

    if (xStartIndex === -1 || xEndIndex === -1) {
      let brk = 5;
    }

    const row = [];
    for (let i=0; i<xStartIndex; ++i) { row.push(null); }
    for (let i=xStartIndex; i<=xEndIndex; ++i) { row.push(new THREE.Vector2(xCoords[i], yCoord)); }
    for (let i=xEndIndex+1; i<xCoords.length; ++i) { row.push(null); }

    points2d.push(row);
  }

  const position = [];
  const normal = [];
  const uv = [];
  const index = [];
  const vertTimeOffs = [];
  
  // Create a 2d map based on points2d that instead contains the index of each vertex
  // Also populate our position, normal, uv, and vertTimeOffs attributes in order of the vertices from
  // top to bottom, left to right
  const indices2d = [];
  let curIndex = 0;
  for (let i=0; i<points2d.length; ++i) {
    const pointsRow = points2d[i];
    const indexRow = [];
    indices2d.push(indexRow);
    for (let n=0; n<pointsRow.length; ++n) {
      const pt = pointsRow[n];
      if (pt == null) {
        indexRow.push(null);
        continue;
      }

      indexRow.push(curIndex++);

      position.push(pt.x, pt.y, 0.0);
      normal.push(0, 0, 1);
      uv.push(0, 0);
      
      // Set a time offset associated with each vertex on the circle based on its angle
      // This is used to calculate vertOff2 in the shader which moves the vertices in/out around the edge
      // of the circle. Since it's based on their angle it could be computed in the vertex shader, but this will make it
      // slightly cheaper
      let angle = Math.atan2(pt.y, pt.x);
      // Keep angle in 0 to 2*Math.PI range
      if (angle < 0.0) angle = angle + 2*Math.PI;
      vertTimeOffs[i] = angle*4;
    }
  }

  // Populate index attribute
  for (let y=1; y<indices2d.length; ++y) {
    let lastRow = indices2d[y-1], row = indices2d[y];
    for (let x=0, xlen=row.length-1; x<xlen; ++x) {
      const x0y0 = row[x];
      if (!x0y0) continue;

      const x0y1 = lastRow[x];
      const x1y0 = row[x+1];
      const x1y1 = lastRow[x+1];
      const xn1y1 = x > 0 ? lastRow[x-1] : null;
      const xn1y0 = x > 0 ? row[x-1] : null;

      // Faces should be drawn counter clockwise
      if (x0y1 != null && x1y0 != null && x1y1 != null) {
        // 2 faces
        // Clockwise
        //index.push(x0y0, x0y1, x1y1);
        //index.push(x0y0, x1y1, x1y0);

        // Counter clockwise
        index.push(x0y0, x1y1, x0y1);
        index.push(x0y0, x1y0, x1y1);
      }
      else if (x1y1 != null && x1y0 != null) {
        // Clockwise
        //index.push(x0y0, x1y1, x1y0);

        // Counter clockwise
        index.push(x0y0, x1y0, x1y1);
      }
      else if(x0y1 != null && x1y0 != null) {
        // Clockwise
        //index.push(x0y0, x0y1, x1y0);

        // Counter clockwise
        index.push(x0y0, x1y0, x0y1);
      }
      else if (x0y1 != null && x1y1 != null) {
        // Clockwise
        //index.push(x0y0, x0y1, x1y1);

        // Counter clockwise
        index.push(x0y0, x1y1, x0y1);
      }

      if (xn1y1 != null && x0y1 != null && xn1y0 == null) {
        // Clockwise
        //index.push(x0y0, xn1y1, x0y1);

        // Counter clockwise
        index.push(x0y0, x0y1, xn1y1);
      }
    }
  }

  // Create attributes from the arrays
  const positionAttribute = new THREE.BufferAttribute(new Float32Array(position), 3);
  const normalAttribute = new THREE.BufferAttribute(new Float32Array(normal), 3);
  const uvAttribute = new THREE.BufferAttribute(new Float32Array(uv), 2);
  const vertTimeOffsAttribute = new THREE.BufferAttribute(new Float32Array(vertTimeOffs), 1);
  const indexAttribute = new THREE.BufferAttribute(new Uint32Array(index), 1);
  
  // Create geometry and set attributes
  const geometry = new THREE.InstancedBufferGeometry();
  geometry.setAttribute('position', positionAttribute);
  geometry.setAttribute('normal', normalAttribute);
  geometry.setAttribute('uv', uvAttribute);
  geometry.setAttribute('vertTimeOffset', vertTimeOffsAttribute);
  geometry.setIndex(indexAttribute);

  // Create instanced attributes
  // The translate attributes contain information about the distance weighted vertex drag operations to perform on the
  // vertices before the same code from the old shader is applied to distort them by several sin wave operations
  // translate.xy is a position chosen on the edge of the circle
  // translate.z is the radius for the drag operation. Vertices at the position will be affected strongly, while
  // vertices at the edge of the radius will almost not be affected at all
  // translate.w is the strength of the drag operation, in the direction opposite the circle center
  const strength = new Float32Array(maxParticleCount*4);
  const speed = new Float32Array(maxParticleCount*4);
  const translate1 = new Float32Array(maxParticleCount*4);
  const translate2 = new Float32Array(maxParticleCount*4);
  const translate3 = new Float32Array(maxParticleCount*4);
  const translate4 = new Float32Array(maxParticleCount*4);
  for (let i=0; i<maxParticleCount; i+=4) {
    strength[i+0] = Math.random() + 1;
    strength[i+1] = Math.random() + 1;
    strength[i+2] = Math.random() + 1;
    strength[i+3] = Math.random() + 1;
    speed[i+0] = Math.random() + 1;
    speed[i+1] = Math.random() + 1;
    speed[i+2] = Math.random() + 1;
    speed[i+3] = Math.random() + 1;

    let angle;
    let tx, ty;

    // Translate 1
    angle = Math.random() * 2*Math.PI;
    tx = Math.cos(angle)*radius; ty = Math.sin(angle)*radius;
    translate1[i+0] = tx;
    translate1[i+1] = ty;
    translate1[i+2] = 0.25 + Math.random() * 0.5;
    translate1[i+3] = 0.25 + Math.random() * 0.5;

    // Translate 1
    angle = Math.random() * 2*Math.PI;
    tx = Math.cos(angle)*radius; ty = Math.sin(angle)*radius;
    translate2[i+0] = tx;
    translate2[i+1] = ty;
    translate2[i+2] = 0.25 + Math.random() * 0.5;
    translate2[i+3] = 0.25 + Math.random() * 0.5;

    // Translate 1
    angle = Math.random() * 2*Math.PI;
    tx = Math.cos(angle)*radius; ty = Math.sin(angle)*radius;
    translate3[i+0] = tx;
    translate3[i+1] = ty;
    translate3[i+2] = 0.25 + Math.random() * 0.5;
    translate3[i+3] = 0.25 + Math.random() * 0.5;

    // Translate 1
    angle = Math.random() * 2*Math.PI;
    tx = Math.cos(angle)*radius; ty = Math.sin(angle)*radius;
    translate4[i+0] = tx;
    translate4[i+1] = ty;
    translate4[i+2] = 0.25 + Math.random() * 0.5;
    translate4[i+3] = 0.25 + Math.random() * 0.5;
  }
    
  // strengthMult and speedMult instanced attributes
  // Multiplies the strength/speed uniforms from the material on a per instance basis to give variety to each particle
  // Speed determines how fast the sin wave moves, strength determines how strong the vertex displacement is
  // Speed/strength xy are used for vertOff in the vertex shader, which displaces the vertices horizontally/vertically
  // based on the other component (x offset is based on y position, and vice versa)
  // Speed/strength z is used for vertOff2 which displaces the vertices in/out in their direction from the center of the circle
  const strengthAttribute = new THREE.InstancedBufferAttribute(strength, 4, undefined, 1);
  const speedAttribute = new THREE.InstancedBufferAttribute(speed, 4, undefined, 1);
  const translate1Attribute = new THREE.InstancedBufferAttribute(translate1, 4, undefined, 1);
  const translate2Attribute = new THREE.InstancedBufferAttribute(translate2, 4, undefined, 1);
  const translate3Attribute = new THREE.InstancedBufferAttribute(translate3, 4, undefined, 1);
  const translate4Attribute = new THREE.InstancedBufferAttribute(translate4, 4, undefined, 1);
  geometry.setAttribute('strengthMult', strengthAttribute);
  geometry.setAttribute('speedMult', speedAttribute);
  geometry.setAttribute('translate1', translate1Attribute);
  geometry.setAttribute('translate2', translate2Attribute);
  geometry.setAttribute('translate3', translate3Attribute);
  geometry.setAttribute('translate4', translate4Attribute);

  // timeOffset instanced attribute
  // Added to material time uniform to give variety to each particle
  const circleTimeOffsets = new Float32Array(maxParticleCount*2);
  for (let i=0; i<circleTimeOffsets.length; ++i) { 
      let off = Math.random() * 2*Math.PI;
      circleTimeOffsets[i] = off; 
  }
  const circleTimeOffsetsAttribute = new THREE.InstancedBufferAttribute(circleTimeOffsets, 2, undefined, 1);
  circleTimeOffsetsAttribute.needsUpdate = true;
  geometry.setAttribute('timeOffset', circleTimeOffsetsAttribute);
  
  // Keep track of max instance count in InstancedBufferGeometry.userData
  // It will need to be recreated if the particle count ever exceeds it
  geometry.instanceCount = particleCount;
  geometry.userData.maxInstanceCount = maxParticleCount;
  return geometry;
}

export default {
  createCircleShaderGeometry,
  createCircleShaderGeometry2,
  createCircleShaderMaterial,
  createCircleShaderMaterial2
};