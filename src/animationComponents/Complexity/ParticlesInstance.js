import React, { useRef, useEffect, useImperativeHandle, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import useStoreEntity from './useStoreEntity';
import { vertex as meshBasicVertex, fragment as meshBasicFragment } from 'three/src/renderers/shaders/ShaderLib/meshbasic.glsl.js';
import useStore from '../../useStore'

const ParticlesInstance = React.forwardRef(({ id, config }, ref) => {

    // We'll create the InstancedBufferGeometry for the particle shader with a max instance count based on how many particles were
    // set up in the config, with room to grow
    const startingParticleCount = config.entityCounts.reduce((a, b) => a*b, 1) * 2;
    

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
        renderBlobRef.current = { };
        renderBlobRef.current.circleMaterial = createCircleShaderMaterial(1);
        //renderBlobRef.current.circleGeometry = createCircleShaderGeometry(1, startingParticleCount, startingParticleCount);
        renderBlobRef.current.circleGeometry = createCircleShaderGeometry2(1, 12, startingParticleCount, startingParticleCount)
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
          let { circleMaterial: circleInstanceMaterial, circleGeometry: circleInstanceGeometry } = renderBlobRef.current;

          circleInstanceMaterial.uniforms.time.value = timeRef.current;

          // If the number of particles is greater than our max instance count, recreate the geometry with particleCount*2 max instance count
          if (circleInstanceGeometry.userData.maxInstanceCount < particleCount) {
            renderBlobRef.current.circleGeometry = createCircleShaderGeometry(1, particleCount, particleCount*2);
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

            const pos = particle.translation();
            let scale = visualConfig.scale || 1;

            const radius = visualConfig.radius * 0.85;
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
            <meshStandardMaterial wireframe={false} side={THREE.FrontSide} />
        </instancedMesh>
    );
});

export default ParticlesInstance;

const createCircleShaderMaterial = (particleRadius) => {

  const oldVertexShader2Code = 
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
`;

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

    const circleTimeOffsets = new Float32Array(maxParticleCount*2);
    for (let i=0; i<circleTimeOffsets.length; ++i) { 
        let off = Math.random() * 2*Math.PI;
        circleTimeOffsets[i] = off; 
    }
    const circleTimeOffsetsAttribute = new THREE.InstancedBufferAttribute(circleTimeOffsets, 2, undefined, 1);
    circleTimeOffsetsAttribute.needsUpdate = true;
    circleInstanceGeometry.setAttribute('timeOffset', circleTimeOffsetsAttribute);
    
    circleInstanceGeometry.instanceCount = particleCount;
    circleInstanceGeometry.userData.maxInstanceCount = maxParticleCount;
    return circleInstanceGeometry;     
}

const createCircleShaderGeometry2 = (radius, segmentsPer90, particleCount, maxParticleCount) => {
  if (segmentsPer90 < 1) segmentsPer90 = 1;

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
      
      let angle = Math.atan2(pt.y, pt.x);
      // Keep angle in 0 to 2*Math.PI range
      if (angle < 0.0) angle = angle + 2*Math.PI;
      vertTimeOffs[i] = angle*4;
    }
  }

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

  const positionAttribute = new THREE.BufferAttribute(new Float32Array(position), 3);
  const normalAttribute = new THREE.BufferAttribute(new Float32Array(normal), 3);
  const uvAttribute = new THREE.BufferAttribute(new Float32Array(uv), 2);
  const vertTimeOffsAttribute = new THREE.BufferAttribute(new Float32Array(vertTimeOffs), 1);
  const indexAttribute = new THREE.BufferAttribute(new Uint32Array(index), 1);
  
  const geometry = new THREE.InstancedBufferGeometry();
  geometry.setAttribute('position', positionAttribute);
  geometry.setAttribute('normal', normalAttribute);
  geometry.setAttribute('uv', uvAttribute);
  geometry.setAttribute('vertTimeOffset', vertTimeOffsAttribute);
  geometry.setIndex(indexAttribute);

  // Create instanced attributes
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

  const circleTimeOffsets = new Float32Array(maxParticleCount*2);
  for (let i=0; i<circleTimeOffsets.length; ++i) { 
      let off = Math.random() * 2*Math.PI;
      circleTimeOffsets[i] = off; 
  }
  const circleTimeOffsetsAttribute = new THREE.InstancedBufferAttribute(circleTimeOffsets, 2, undefined, 1);
  circleTimeOffsetsAttribute.needsUpdate = true;
  geometry.setAttribute('timeOffset', circleTimeOffsetsAttribute);
  
  geometry.instanceCount = particleCount;
  geometry.userData.maxInstanceCount = maxParticleCount;
  return geometry;
}