import * as THREE from 'three';
import { vertex as meshBasicVertex, fragment as meshBasicFragment } from 'three/src/renderers/shaders/ShaderLib/meshbasic.glsl.js';

const createParticleShaderOriginalMaterial = (particleRadius) => {

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


const createParticleShaderDiversityMaterial = (particleRadius) => {

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

    attribute vec4 translate1;
    attribute vec4 translate2;
    attribute vec4 translate3;
    attribute vec4 translate4;

    uniform float radius;
    uniform float time;
    uniform vec4 strength;
    uniform vec4 speed;

    vec3 applyDragTranslation(vec3 transformed, vec4 translate) {
      vec2 dragDir;
      float dragDist;
      float t;

      // translate is a vec4 instanced buffer attribute passed in from the instanced buffer geometry
      // transformed.xy is position, in local space, of the drag operation
      // transformed.z is the radius of the drag operation. Vertices closer to the radius will be affected more
      // strongly by the drag operation, and vertices further away, less strongly
      // transformed.w is the strength of the drag operation. Vertices at distance zero from dragPos
      // will be moved by this amount in the direction from the origin to their position
      vec2 dragPos = translate.xy;
      float dragRadius = translate.z;
      float dragStrength = translate.w;

      float len = length(transformed.xy);
      dragDir = len == 0.0 ? vec2(0.0, 0.0) : normalize(vec2(transformed.x, transformed.y));
      dragDist = length(transformed.xy - dragPos);
      t = 1.0 - min(1.0, dragDist / dragRadius);
      t = sin(t*0.5*PI);
      transformed.xy += dragDir * dragStrength * t;

      return transformed;
    }
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

    // Apply 4 drag operations to the vertices in the circle to stretch and deform it, and give it uniqueness

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
    
    vec4 strengthScaled = strength * strengthMult * radius;
    vec4 speedScaled = speed * speedMult;
  
    // Just before #include <project_vertex> shader chunk in MeshBasicMaterial vertex shader
    // That shader chunk is where the vertices are transformed by modelview and projection matrices
    
    // Translate vertices horizontally/vertically based on sin of the other coordinate
    // (verticles will be translated horizontally based on time and their y coordinate, and vertically based on time and their x coordinate)
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
const createParticleShaderOriginalGeometry = (particleRadius, particleCount, maxParticleCount) => {
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
const createParticleShaderDiversityGeometry = (radius, segmentsPer90, particleCount, maxParticleCount) => {
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
  //
  // After this, the vertices are displaced horizontally/vertically based on a sin wave, and then in/out toward/away from the center of
  // the circle based on another sin wave
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

    // If on the x axis then mirrorwith -py.y
    if (pt.x === 0) {
      addPointToMap(yPts, -pt.y, new THREE.Vector2(pt.x, -pt.y));
      addPointToMap(xPts, pt.x, new THREE.Vector2(pt.x, -pt.y));
    // If on the y axis then mirror with -px.x (cannot have x = 0 and y = 0 at same time)
    } else if (pt.y === 0) {
      addPointToMap(yPts, pt.y, new THREE.Vector2(-pt.x, pt.y));
      addPointToMap(xPts, -pt.x, new THREE.Vector2(-pt.x, pt.y));
    // Add the points for the other 3 quadrants
    } else {
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
  for (let y=0; y < yCoords.length; ++y) {
    // Get the y-coordinate for the current row
    const yCoord = yCoords[y];
    // Initialize variables to track the minimum and maximum x-coordinates for the current row
    let xMin = Number.POSITIVE_INFINITY, xMax = Number.NEGATIVE_INFINITY;
    // Get the array of points that share the same y-coordinate
    let pts = yPts.get(yCoord);
    // Determine the range of x-coordinates that are within the circle for this y-coordinate
    pts.forEach((pt) => { xMin = Math.min(xMin, pt.x); xMax = Math.max(xMax, pt.x); });
    // Find the start and end indices for the x-coordinates within the circle for the current row
    let xStartIndex = -1;
    for (let i=0; i<xCoords.length; ++i) { if (xCoords[i] >= xMin) { xStartIndex = i; break; } }
    let xEndIndex = -1;
    for (let i=xCoords.length-1; i>=0; --i) { if (xCoords[i] <= xMax) { xEndIndex = i; break; } }
    // Check if the start or end index is invalid, which should not happen
    if (xStartIndex === -1 || xEndIndex === -1) {
      let brk = 5;
    }

    const row = [];
    // Fill the row with null for x-coordinates outside the circle (before the start index)
    for (let i=0; i < xStartIndex; ++i) { row.push(null); }
    // Fill the row with THREE.Vector2 points for x-coordinates within the circle (from start to end index)
    for (let i=xStartIndex; i <= xEndIndex; ++i) { row.push(new THREE.Vector2(xCoords[i], yCoord)); }
    // Fill the row with null for x-coordinates outside the circle (after the end index)
    for (let i=xEndIndex+1; i < xCoords.length; ++i) { row.push(null); }

    points2d.push(row);
  }

  const position = [];
  const normal = [];
  const uv = [];
  const index = [];
  const vertTimeOffs = [];
  
  // Create a 2d map based on points2d that instead contains the index of each vertex
  // The code can later reference these indices to construct faces (triangles) of the geometry efficiently.
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
        // Counter clockwise
        index.push(x0y0, x1y1, x0y1);
        index.push(x0y0, x1y0, x1y1);
      }
      else if (x1y1 != null && x1y0 != null) {
        // Counter clockwise
        index.push(x0y0, x1y0, x1y1);
      }
      else if(x0y1 != null && x1y0 != null) {
        // Counter clockwise
        index.push(x0y0, x1y0, x0y1);
      }
      else if (x0y1 != null && x1y1 != null) {
        // Counter clockwise
        index.push(x0y0, x1y1, x0y1);
      }

      if (xn1y1 != null && x0y1 != null && xn1y0 == null) {
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

  /**
   * Generates translation values for a particle.
   * @param {Float32Array} translateArray - The array to populate with translation values.
   * @param {number} index - The starting index in the array.
   * @param {number} radius - The radius of the circle.
  */
  const generateTranslation = (translateArray, index, radius) => {
    let angle = Math.random() * 2 * Math.PI;
    let tx = Math.cos(angle) * radius;
    let ty = Math.sin(angle) * radius;
    translateArray[index + 0] = tx;
    translateArray[index + 1] = ty;
    translateArray[index + 2] = 0.25 + Math.random() * 0.5; // Radius
    translateArray[index + 3] = 0.25 + Math.random() * 0.5; // Strength
  };

  for (let i = 0; i < maxParticleCount; i += 4) {
    // Randomize strength and speed for variety
    strength[i + 0] = Math.random() + 1;
    strength[i + 1] = Math.random() + 1;
    strength[i + 2] = Math.random() + 1;
    strength[i + 3] = Math.random() + 1;
    speed[i + 0] = Math.random() + 1;
    speed[i + 1] = Math.random() + 1;
    speed[i + 2] = Math.random() + 1;
    speed[i + 3] = Math.random() + 1;
  
    // Generate translation values using the function
    generateTranslation(translate1, i, radius);
    generateTranslation(translate2, i, radius);
    generateTranslation(translate3, i, radius);
    generateTranslation(translate4, i, radius);
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
  createParticleShaderOriginalGeometry,
  createParticleShaderDiversityGeometry,
  createParticleShaderOriginalMaterial,
  createParticleShaderDiversityMaterial,
};