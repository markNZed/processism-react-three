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
    //const circleSegments = 64;
    //const circleGeometry = new THREE.CircleGeometry(particleRadius, circleSegments);
    //const circleInstanceGeometry = new THREE.InstancedBufferGeometry();
    //circleInstanceGeometry.setAttribute('position', circleGeometry.getAttribute('position'));
    //circleInstanceGeometry.setAttribute('normal', circleGeometry.getAttribute('normal'));
    //circleInstanceGeometry.setAttribute('uv', circleGeometry.getAttribute('uv'));
    //circleInstanceGeometry.setIndex(circleGeometry.getIndex());
    
    //let stepAngle = 2*Math.PI / circleSegments;
    //const vertTimeOffs = new Float32Array((circleSegments+2));
    //vertTimeOffs[0] = 0;
    //for (let i=1; i<(circleSegments+2); ++i) {
    //    let angle = (stepAngle * (i-1)) % 2*Math.PI;
    //    vertTimeOffs[i] = angle*4;
    //}
    //vertTimeOffs[vertTimeOffs.length - 1] = vertTimeOffs[1];
    //const vertTimeOffsAttribute = new THREE.BufferAttribute(vertTimeOffs, 1);
    //circleInstanceGeometry.setAttribute('vertTimeOffset', vertTimeOffsAttribute);

    const circleInstanceGeometry = new THREE.InstancedBufferGeometry();
    circleInstanceGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(tesselatedCircle.position), 3));
    circleInstanceGeometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(tesselatedCircle.normal), 3));
    circleInstanceGeometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(tesselatedCircle.uv), 2));
    circleInstanceGeometry.setAttribute('vertTimeOffset', new THREE.BufferAttribute(new Float32Array(tesselatedCircle.vertTimeOffset), 1));
    circleInstanceGeometry.setIndex(new THREE.BufferAttribute(new Uint32Array(tesselatedCircle.index), 1));

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

const tesselatedCircle = {
	position: [-0.3125,-0.9375,0.0,-0.25,-0.9375,0.0,-0.1875,-0.9375,0.0,-0.125,-0.9375,0.0,-0.0625,-0.9375,0.0,0.0,-0.9375,0.0,0.0625,-0.9375,0.0,0.125,-0.9375,0.0,0.1875,-0.9375,0.0,0.25,-0.9375,0.0,0.3125,-0.9375,0.0,-0.4375,-0.875,0.0,-0.375,-0.875,0.0,-0.3125,-0.875,0.0,-0.25,-0.875,0.0,-0.1875,-0.875,0.0,-0.125,-0.875,0.0,-0.0625,-0.875,0.0,0.0,-0.875,0.0,0.0625,-0.875,0.0,0.125,-0.875,0.0,0.1875,-0.875,0.0,0.25,-0.875,0.0,0.3125,-0.875,0.0,0.375,-0.875,0.0,0.4375,-0.875,0.0,-0.5625,-0.8125,0.0,-0.5,-0.8125,0.0,-0.4375,-0.8125,0.0,-0.375,-0.8125,0.0,-0.3125,-0.8125,0.0,-0.25,-0.8125,0.0,-0.1875,-0.8125,0.0,-0.125,-0.8125,0.0,-0.0625,-0.8125,0.0,0.0,-0.8125,0.0,0.0625,-0.8125,0.0,0.125,-0.8125,0.0,0.1875,-0.8125,0.0,0.25,-0.8125,0.0,0.3125,-0.8125,0.0,0.375,-0.8125,0.0,0.4375,-0.8125,0.0,0.5,-0.8125,0.0,0.5625,-0.8125,0.0,-0.625,-0.75,0.0,-0.5625,-0.75,0.0,-0.5,-0.75,0.0,-0.4375,-0.75,0.0,-0.375,-0.75,0.0,-0.3125,-0.75,0.0,-0.25,-0.75,0.0,-0.1875,-0.75,0.0,-0.125,-0.75,0.0,-0.0625,-0.75,0.0,0.0,-0.75,0.0,0.0625,-0.75,0.0,0.125,-0.75,0.0,0.1875,-0.75,0.0,0.25,-0.75,0.0,0.3125,-0.75,0.0,0.375,-0.75,0.0,0.4375,-0.75,0.0,0.5,-0.75,0.0,0.5625,-0.75,0.0,0.625,-0.75,0.0,-0.6875,-0.6875,0.0,-0.625,-0.6875,0.0,-0.5625,-0.6875,0.0,-0.5,-0.6875,0.0,-0.4375,-0.6875,0.0,-0.375,-0.6875,0.0,-0.3125,-0.6875,0.0,-0.25,-0.6875,0.0,-0.1875,-0.6875,0.0,-0.125,-0.6875,0.0,-0.0625,-0.6875,0.0,0.0,-0.6875,0.0,0.0625,-0.6875,0.0,0.125,-0.6875,0.0,0.1875,-0.6875,0.0,0.25,-0.6875,0.0,0.3125,-0.6875,0.0,0.375,-0.6875,0.0,0.4375,-0.6875,0.0,0.5,-0.6875,0.0,0.5625,-0.6875,0.0,0.625,-0.6875,0.0,0.6875,-0.6875,0.0,-0.75,-0.625,0.0,-0.6875,-0.625,0.0,-0.625,-0.625,0.0,-0.5625,-0.625,0.0,-0.5,-0.625,0.0,-0.4375,-0.625,0.0,-0.375,-0.625,0.0,-0.3125,-0.625,0.0,-0.25,-0.625,0.0,-0.1875,-0.625,0.0,-0.125,-0.625,0.0,-0.0625,-0.625,0.0,0.0,-0.625,0.0,0.0625,-0.625,0.0,0.125,-0.625,0.0,0.1875,-0.625,0.0,0.25,-0.625,0.0,0.3125,-0.625,0.0,0.375,-0.625,0.0,0.4375,-0.625,0.0,0.5,-0.625,0.0,0.5625,-0.625,0.0,0.625,-0.625,0.0,0.6875,-0.625,0.0,0.75,-0.625,0.0,-0.8125,-0.5625,0.0,-0.75,-0.5625,0.0,-0.6875,-0.5625,0.0,-0.625,-0.5625,0.0,-0.5625,-0.5625,0.0,-0.5,-0.5625,0.0,-0.4375,-0.5625,0.0,-0.375,-0.5625,0.0,-0.3125,-0.5625,0.0,-0.25,-0.5625,0.0,-0.1875,-0.5625,0.0,-0.125,-0.5625,0.0,-0.0625,-0.5625,0.0,0.0,-0.5625,0.0,0.0625,-0.5625,0.0,0.125,-0.5625,0.0,0.1875,-0.5625,0.0,0.25,-0.5625,0.0,0.3125,-0.5625,0.0,0.375,-0.5625,0.0,0.4375,-0.5625,0.0,0.5,-0.5625,0.0,0.5625,-0.5625,0.0,0.625,-0.5625,0.0,0.6875,-0.5625,0.0,0.75,-0.5625,0.0,0.8125,-0.5625,0.0,-0.8125,-0.5,0.0,-0.75,-0.5,0.0,-0.6875,-0.5,0.0,-0.625,-0.5,0.0,-0.5625,-0.5,0.0,-0.5,-0.5,0.0,-0.4375,-0.5,0.0,-0.375,-0.5,0.0,-0.3125,-0.5,0.0,-0.25,-0.5,0.0,-0.1875,-0.5,0.0,-0.125,-0.5,0.0,-0.0625,-0.5,0.0,0.0,-0.5,0.0,0.0625,-0.5,0.0,0.125,-0.5,0.0,0.1875,-0.5,0.0,0.25,-0.5,0.0,0.3125,-0.5,0.0,0.375,-0.5,0.0,0.4375,-0.5,0.0,0.5,-0.5,0.0,0.5625,-0.5,0.0,0.625,-0.5,0.0,0.6875,-0.5,0.0,0.75,-0.5,0.0,0.8125,-0.5,0.0,-0.875,-0.4375,0.0,-0.8125,-0.4375,0.0,-0.75,-0.4375,0.0,-0.6875,-0.4375,0.0,-0.625,-0.4375,0.0,-0.5625,-0.4375,0.0,-0.5,-0.4375,0.0,-0.4375,-0.4375,0.0,-0.375,-0.4375,0.0,-0.3125,-0.4375,0.0,-0.25,-0.4375,0.0,-0.1875,-0.4375,0.0,-0.125,-0.4375,0.0,-0.0625,-0.4375,0.0,0.0,-0.4375,0.0,0.0625,-0.4375,0.0,0.125,-0.4375,0.0,0.1875,-0.4375,0.0,0.25,-0.4375,0.0,0.3125,-0.4375,0.0,0.375,-0.4375,0.0,0.4375,-0.4375,0.0,0.5,-0.4375,0.0,0.5625,-0.4375,0.0,0.625,-0.4375,0.0,0.6875,-0.4375,0.0,0.75,-0.4375,0.0,0.8125,-0.4375,0.0,0.875,-0.4375,0.0,-0.875,-0.375,0.0,-0.8125,-0.375,0.0,-0.75,-0.375,0.0,-0.6875,-0.375,0.0,-0.625,-0.375,0.0,-0.5625,-0.375,0.0,-0.5,-0.375,0.0,-0.4375,-0.375,0.0,-0.375,-0.375,0.0,-0.3125,-0.375,0.0,-0.25,-0.375,0.0,-0.1875,-0.375,0.0,-0.125,-0.375,0.0,-0.0625,-0.375,0.0,0.0,-0.375,0.0,0.0625,-0.375,0.0,0.125,-0.375,0.0,0.1875,-0.375,0.0,0.25,-0.375,0.0,0.3125,-0.375,0.0,0.375,-0.375,0.0,0.4375,-0.375,0.0,0.5,-0.375,0.0,0.5625,-0.375,0.0,0.625,-0.375,0.0,0.6875,-0.375,0.0,0.75,-0.375,0.0,0.8125,-0.375,0.0,0.875,-0.375,0.0,-0.9375,-0.3125,0.0,-0.875,-0.3125,0.0,-0.8125,-0.3125,0.0,-0.75,-0.3125,0.0,-0.6875,-0.3125,0.0,-0.625,-0.3125,0.0,-0.5625,-0.3125,0.0,-0.5,-0.3125,0.0,-0.4375,-0.3125,0.0,-0.375,-0.3125,0.0,-0.3125,-0.3125,0.0,-0.25,-0.3125,0.0,-0.1875,-0.3125,0.0,-0.125,-0.3125,0.0,-0.0625,-0.3125,0.0,0.0,-0.3125,0.0,0.0625,-0.3125,0.0,0.125,-0.3125,0.0,0.1875,-0.3125,0.0,0.25,-0.3125,0.0,0.3125,-0.3125,0.0,0.375,-0.3125,0.0,0.4375,-0.3125,0.0,0.5,-0.3125,0.0,0.5625,-0.3125,0.0,0.625,-0.3125,0.0,0.6875,-0.3125,0.0,0.75,-0.3125,0.0,0.8125,-0.3125,0.0,0.875,-0.3125,0.0,0.9375,-0.3125,0.0,-0.9375,-0.25,0.0,-0.875,-0.25,0.0,-0.8125,-0.25,0.0,-0.75,-0.25,0.0,-0.6875,-0.25,0.0,-0.625,-0.25,0.0,-0.5625,-0.25,0.0,-0.5,-0.25,0.0,-0.4375,-0.25,0.0,-0.375,-0.25,0.0,-0.3125,-0.25,0.0,-0.25,-0.25,0.0,-0.1875,-0.25,0.0,-0.125,-0.25,0.0,-0.0625,-0.25,0.0,0.0,-0.25,0.0,0.0625,-0.25,0.0,0.125,-0.25,0.0,0.1875,-0.25,0.0,0.25,-0.25,0.0,0.3125,-0.25,0.0,0.375,-0.25,0.0,0.4375,-0.25,0.0,0.5,-0.25,0.0,0.5625,-0.25,0.0,0.625,-0.25,0.0,0.6875,-0.25,0.0,0.75,-0.25,0.0,0.8125,-0.25,0.0,0.875,-0.25,0.0,0.9375,-0.25,0.0,-0.9375,-0.1875,0.0,-0.875,-0.1875,0.0,-0.8125,-0.1875,0.0,-0.75,-0.1875,0.0,-0.6875,-0.1875,0.0,-0.625,-0.1875,0.0,-0.5625,-0.1875,0.0,-0.5,-0.1875,0.0,-0.4375,-0.1875,0.0,-0.375,-0.1875,0.0,-0.3125,-0.1875,0.0,-0.25,-0.1875,0.0,-0.1875,-0.1875,0.0,-0.125,-0.1875,0.0,-0.0625,-0.1875,0.0,0.0,-0.1875,0.0,0.0625,-0.1875,0.0,0.125,-0.1875,0.0,0.1875,-0.1875,0.0,0.25,-0.1875,0.0,0.3125,-0.1875,0.0,0.375,-0.1875,0.0,0.4375,-0.1875,0.0,0.5,-0.1875,0.0,0.5625,-0.1875,0.0,0.625,-0.1875,0.0,0.6875,-0.1875,0.0,0.75,-0.1875,0.0,0.8125,-0.1875,0.0,0.875,-0.1875,0.0,0.9375,-0.1875,0.0,-0.9375,-0.125,0.0,-0.875,-0.125,0.0,-0.8125,-0.125,0.0,-0.75,-0.125,0.0,-0.6875,-0.125,0.0,-0.625,-0.125,0.0,-0.5625,-0.125,0.0,-0.5,-0.125,0.0,-0.4375,-0.125,0.0,-0.375,-0.125,0.0,-0.3125,-0.125,0.0,-0.25,-0.125,0.0,-0.1875,-0.125,0.0,-0.125,-0.125,0.0,-0.0625,-0.125,0.0,0.0,-0.125,0.0,0.0625,-0.125,0.0,0.125,-0.125,0.0,0.1875,-0.125,0.0,0.25,-0.125,0.0,0.3125,-0.125,0.0,0.375,-0.125,0.0,0.4375,-0.125,0.0,0.5,-0.125,0.0,0.5625,-0.125,0.0,0.625,-0.125,0.0,0.6875,-0.125,0.0,0.75,-0.125,0.0,0.8125,-0.125,0.0,0.875,-0.125,0.0,0.9375,-0.125,0.0,-0.9375,-0.0625,0.0,-0.875,-0.0625,0.0,-0.8125,-0.0625,0.0,-0.75,-0.0625,0.0,-0.6875,-0.0625,0.0,-0.625,-0.0625,0.0,-0.5625,-0.0625,0.0,-0.5,-0.0625,0.0,-0.4375,-0.0625,0.0,-0.375,-0.0625,0.0,-0.3125,-0.0625,0.0,-0.25,-0.0625,0.0,-0.1875,-0.0625,0.0,-0.125,-0.0625,0.0,-0.0625,-0.0625,0.0,0.0,-0.0625,0.0,0.0625,-0.0625,0.0,0.125,-0.0625,0.0,0.1875,-0.0625,0.0,0.25,-0.0625,0.0,0.3125,-0.0625,0.0,0.375,-0.0625,0.0,0.4375,-0.0625,0.0,0.5,-0.0625,0.0,0.5625,-0.0625,0.0,0.625,-0.0625,0.0,0.6875,-0.0625,0.0,0.75,-0.0625,0.0,0.8125,-0.0625,0.0,0.875,-0.0625,0.0,0.9375,-0.0625,0.0,-0.9375,0.0,0.0,-0.875,0.0,0.0,-0.8125,0.0,0.0,-0.75,0.0,0.0,-0.6875,0.0,0.0,-0.625,0.0,0.0,-0.5625,0.0,0.0,-0.5,0.0,0.0,-0.4375,0.0,0.0,-0.375,0.0,0.0,-0.3125,0.0,0.0,-0.25,0.0,0.0,-0.1875,0.0,0.0,-0.125,0.0,0.0,-0.0625,0.0,0.0,0.0,0.0,0.0,0.0625,0.0,0.0,0.125,0.0,0.0,0.1875,0.0,0.0,0.25,0.0,0.0,0.3125,0.0,0.0,0.375,0.0,0.0,0.4375,0.0,0.0,0.5,0.0,0.0,0.5625,0.0,0.0,0.625,0.0,0.0,0.6875,0.0,0.0,0.75,0.0,0.0,0.8125,0.0,0.0,0.875,0.0,0.0,0.9375,0.0,0.0,-0.9375,0.0625,0.0,-0.875,0.0625,0.0,-0.8125,0.0625,0.0,-0.75,0.0625,0.0,-0.6875,0.0625,0.0,-0.625,0.0625,0.0,-0.5625,0.0625,0.0,-0.5,0.0625,0.0,-0.4375,0.0625,0.0,-0.375,0.0625,0.0,-0.3125,0.0625,0.0,-0.25,0.0625,0.0,-0.1875,0.0625,0.0,-0.125,0.0625,0.0,-0.0625,0.0625,0.0,0.0,0.0625,0.0,0.0625,0.0625,0.0,0.125,0.0625,0.0,0.1875,0.0625,0.0,0.25,0.0625,0.0,0.3125,0.0625,0.0,0.375,0.0625,0.0,0.4375,0.0625,0.0,0.5,0.0625,0.0,0.5625,0.0625,0.0,0.625,0.0625,0.0,0.6875,0.0625,0.0,0.75,0.0625,0.0,0.8125,0.0625,0.0,0.875,0.0625,0.0,0.9375,0.0625,0.0,-0.9375,0.125,0.0,-0.875,0.125,0.0,-0.8125,0.125,0.0,-0.75,0.125,0.0,-0.6875,0.125,0.0,-0.625,0.125,0.0,-0.5625,0.125,0.0,-0.5,0.125,0.0,-0.4375,0.125,0.0,-0.375,0.125,0.0,-0.3125,0.125,0.0,-0.25,0.125,0.0,-0.1875,0.125,0.0,-0.125,0.125,0.0,-0.0625,0.125,0.0,0.0,0.125,0.0,0.0625,0.125,0.0,0.125,0.125,0.0,0.1875,0.125,0.0,0.25,0.125,0.0,0.3125,0.125,0.0,0.375,0.125,0.0,0.4375,0.125,0.0,0.5,0.125,0.0,0.5625,0.125,0.0,0.625,0.125,0.0,0.6875,0.125,0.0,0.75,0.125,0.0,0.8125,0.125,0.0,0.875,0.125,0.0,0.9375,0.125,0.0,-0.9375,0.1875,0.0,-0.875,0.1875,0.0,-0.8125,0.1875,0.0,-0.75,0.1875,0.0,-0.6875,0.1875,0.0,-0.625,0.1875,0.0,-0.5625,0.1875,0.0,-0.5,0.1875,0.0,-0.4375,0.1875,0.0,-0.375,0.1875,0.0,-0.3125,0.1875,0.0,-0.25,0.1875,0.0,-0.1875,0.1875,0.0,-0.125,0.1875,0.0,-0.0625,0.1875,0.0,0.0,0.1875,0.0,0.0625,0.1875,0.0,0.125,0.1875,0.0,0.1875,0.1875,0.0,0.25,0.1875,0.0,0.3125,0.1875,0.0,0.375,0.1875,0.0,0.4375,0.1875,0.0,0.5,0.1875,0.0,0.5625,0.1875,0.0,0.625,0.1875,0.0,0.6875,0.1875,0.0,0.75,0.1875,0.0,0.8125,0.1875,0.0,0.875,0.1875,0.0,0.9375,0.1875,0.0,-0.9375,0.25,0.0,-0.875,0.25,0.0,-0.8125,0.25,0.0,-0.75,0.25,0.0,-0.6875,0.25,0.0,-0.625,0.25,0.0,-0.5625,0.25,0.0,-0.5,0.25,0.0,-0.4375,0.25,0.0,-0.375,0.25,0.0,-0.3125,0.25,0.0,-0.25,0.25,0.0,-0.1875,0.25,0.0,-0.125,0.25,0.0,-0.0625,0.25,0.0,0.0,0.25,0.0,0.0625,0.25,0.0,0.125,0.25,0.0,0.1875,0.25,0.0,0.25,0.25,0.0,0.3125,0.25,0.0,0.375,0.25,0.0,0.4375,0.25,0.0,0.5,0.25,0.0,0.5625,0.25,0.0,0.625,0.25,0.0,0.6875,0.25,0.0,0.75,0.25,0.0,0.8125,0.25,0.0,0.875,0.25,0.0,0.9375,0.25,0.0,-0.9375,0.3125,0.0,-0.875,0.3125,0.0,-0.8125,0.3125,0.0,-0.75,0.3125,0.0,-0.6875,0.3125,0.0,-0.625,0.3125,0.0,-0.5625,0.3125,0.0,-0.5,0.3125,0.0,-0.4375,0.3125,0.0,-0.375,0.3125,0.0,-0.3125,0.3125,0.0,-0.25,0.3125,0.0,-0.1875,0.3125,0.0,-0.125,0.3125,0.0,-0.0625,0.3125,0.0,0.0,0.3125,0.0,0.0625,0.3125,0.0,0.125,0.3125,0.0,0.1875,0.3125,0.0,0.25,0.3125,0.0,0.3125,0.3125,0.0,0.375,0.3125,0.0,0.4375,0.3125,0.0,0.5,0.3125,0.0,0.5625,0.3125,0.0,0.625,0.3125,0.0,0.6875,0.3125,0.0,0.75,0.3125,0.0,0.8125,0.3125,0.0,0.875,0.3125,0.0,0.9375,0.3125,0.0,-0.875,0.375,0.0,-0.8125,0.375,0.0,-0.75,0.375,0.0,-0.6875,0.375,0.0,-0.625,0.375,0.0,-0.5625,0.375,0.0,-0.5,0.375,0.0,-0.4375,0.375,0.0,-0.375,0.375,0.0,-0.3125,0.375,0.0,-0.25,0.375,0.0,-0.1875,0.375,0.0,-0.125,0.375,0.0,-0.0625,0.375,0.0,0.0,0.375,0.0,0.0625,0.375,0.0,0.125,0.375,0.0,0.1875,0.375,0.0,0.25,0.375,0.0,0.3125,0.375,0.0,0.375,0.375,0.0,0.4375,0.375,0.0,0.5,0.375,0.0,0.5625,0.375,0.0,0.625,0.375,0.0,0.6875,0.375,0.0,0.75,0.375,0.0,0.8125,0.375,0.0,0.875,0.375,0.0,-0.875,0.4375,0.0,-0.8125,0.4375,0.0,-0.75,0.4375,0.0,-0.6875,0.4375,0.0,-0.625,0.4375,0.0,-0.5625,0.4375,0.0,-0.5,0.4375,0.0,-0.4375,0.4375,0.0,-0.375,0.4375,0.0,-0.3125,0.4375,0.0,-0.25,0.4375,0.0,-0.1875,0.4375,0.0,-0.125,0.4375,0.0,-0.0625,0.4375,0.0,0.0,0.4375,0.0,0.0625,0.4375,0.0,0.125,0.4375,0.0,0.1875,0.4375,0.0,0.25,0.4375,0.0,0.3125,0.4375,0.0,0.375,0.4375,0.0,0.4375,0.4375,0.0,0.5,0.4375,0.0,0.5625,0.4375,0.0,0.625,0.4375,0.0,0.6875,0.4375,0.0,0.75,0.4375,0.0,0.8125,0.4375,0.0,0.875,0.4375,0.0,-0.8125,0.5,0.0,-0.75,0.5,0.0,-0.6875,0.5,0.0,-0.625,0.5,0.0,-0.5625,0.5,0.0,-0.5,0.5,0.0,-0.4375,0.5,0.0,-0.375,0.5,0.0,-0.3125,0.5,0.0,-0.25,0.5,0.0,-0.1875,0.5,0.0,-0.125,0.5,0.0,-0.0625,0.5,0.0,0.0,0.5,0.0,0.0625,0.5,0.0,0.125,0.5,0.0,0.1875,0.5,0.0,0.25,0.5,0.0,0.3125,0.5,0.0,0.375,0.5,0.0,0.4375,0.5,0.0,0.5,0.5,0.0,0.5625,0.5,0.0,0.625,0.5,0.0,0.6875,0.5,0.0,0.75,0.5,0.0,0.8125,0.5,0.0,-0.8125,0.5625,0.0,-0.75,0.5625,0.0,-0.6875,0.5625,0.0,-0.625,0.5625,0.0,-0.5625,0.5625,0.0,-0.5,0.5625,0.0,-0.4375,0.5625,0.0,-0.375,0.5625,0.0,-0.3125,0.5625,0.0,-0.25,0.5625,0.0,-0.1875,0.5625,0.0,-0.125,0.5625,0.0,-0.0625,0.5625,0.0,0.0,0.5625,0.0,0.0625,0.5625,0.0,0.125,0.5625,0.0,0.1875,0.5625,0.0,0.25,0.5625,0.0,0.3125,0.5625,0.0,0.375,0.5625,0.0,0.4375,0.5625,0.0,0.5,0.5625,0.0,0.5625,0.5625,0.0,0.625,0.5625,0.0,0.6875,0.5625,0.0,0.75,0.5625,0.0,0.8125,0.5625,0.0,-0.75,0.625,0.0,-0.6875,0.625,0.0,-0.625,0.625,0.0,-0.5625,0.625,0.0,-0.5,0.625,0.0,-0.4375,0.625,0.0,-0.375,0.625,0.0,-0.3125,0.625,0.0,-0.25,0.625,0.0,-0.1875,0.625,0.0,-0.125,0.625,0.0,-0.0625,0.625,0.0,0.0,0.625,0.0,0.0625,0.625,0.0,0.125,0.625,0.0,0.1875,0.625,0.0,0.25,0.625,0.0,0.3125,0.625,0.0,0.375,0.625,0.0,0.4375,0.625,0.0,0.5,0.625,0.0,0.5625,0.625,0.0,0.625,0.625,0.0,0.6875,0.625,0.0,0.75,0.625,0.0,-0.6875,0.6875,0.0,-0.625,0.6875,0.0,-0.5625,0.6875,0.0,-0.5,0.6875,0.0,-0.4375,0.6875,0.0,-0.375,0.6875,0.0,-0.3125,0.6875,0.0,-0.25,0.6875,0.0,-0.1875,0.6875,0.0,-0.125,0.6875,0.0,-0.0625,0.6875,0.0,0.0,0.6875,0.0,0.0625,0.6875,0.0,0.125,0.6875,0.0,0.1875,0.6875,0.0,0.25,0.6875,0.0,0.3125,0.6875,0.0,0.375,0.6875,0.0,0.4375,0.6875,0.0,0.5,0.6875,0.0,0.5625,0.6875,0.0,0.625,0.6875,0.0,0.6875,0.6875,0.0,-0.625,0.75,0.0,-0.5625,0.75,0.0,-0.5,0.75,0.0,-0.4375,0.75,0.0,-0.375,0.75,0.0,-0.3125,0.75,0.0,-0.25,0.75,0.0,-0.1875,0.75,0.0,-0.125,0.75,0.0,-0.0625,0.75,0.0,0.0,0.75,0.0,0.0625,0.75,0.0,0.125,0.75,0.0,0.1875,0.75,0.0,0.25,0.75,0.0,0.3125,0.75,0.0,0.375,0.75,0.0,0.4375,0.75,0.0,0.5,0.75,0.0,0.5625,0.75,0.0,0.625,0.75,0.0,-0.5625,0.8125,0.0,-0.5,0.8125,0.0,-0.4375,0.8125,0.0,-0.375,0.8125,0.0,-0.3125,0.8125,0.0,-0.25,0.8125,0.0,-0.1875,0.8125,0.0,-0.125,0.8125,0.0,-0.0625,0.8125,0.0,0.0,0.8125,0.0,0.0625,0.8125,0.0,0.125,0.8125,0.0,0.1875,0.8125,0.0,0.25,0.8125,0.0,0.3125,0.8125,0.0,0.375,0.8125,0.0,0.4375,0.8125,0.0,0.5,0.8125,0.0,0.5625,0.8125,0.0,-0.4375,0.875,0.0,-0.375,0.875,0.0,-0.3125,0.875,0.0,-0.25,0.875,0.0,-0.1875,0.875,0.0,-0.125,0.875,0.0,-0.0625,0.875,0.0,0.0,0.875,0.0,0.0625,0.875,0.0,0.125,0.875,0.0,0.1875,0.875,0.0,0.25,0.875,0.0,0.3125,0.875,0.0,0.375,0.875,0.0,0.4375,0.875,0.0,-0.3125,0.9375,0.0,-0.25,0.9375,0.0,-0.1875,0.9375,0.0,-0.125,0.9375,0.0,-0.0625,0.9375,0.0,0.0,0.9375,0.0,0.0625,0.9375,0.0,0.125,0.9375,0.0,0.1875,0.9375,0.0,0.25,0.9375,0.0,0.3125,0.9375,0.0,0.0,1.0,0.0,0.8125,0.5811477899551392,0.0,0.47139671444892883,0.8819212913513184,0.0,0.48294419050216675,0.875,0.0,-0.3125,-0.9489915370941162,0.0,0.8263301849365234,-0.5625,0.0,0.8314696550369263,-0.5555701851844788,0.0,0.5,0.864777147769928,0.0,0.7799769639968872,0.625,0.0,-0.34461674094200134,-0.9375,0.0,0.8647770881652832,-0.5,0.0,0.8263301253318787,0.5625,0.0,0.5555702447891235,0.8314695954322815,0.0,-0.25,-0.9670311212539673,0.0,-0.8819212913513184,-0.47139668464660645,0.0,-0.2902846336364746,-0.9569403529167175,0.0,-0.875,-0.48294416069984436,0.0,0.5625,0.8263301253318787,0.0,0.5811477899551392,0.8125,0.0,-0.779977023601532,0.625,0.0,-0.7730104327201843,0.6343933343887329,0.0,-0.8979532718658447,-0.4375,0.0,-0.75,0.6597814559936523,0.0,-0.19509024918079376,-0.9807853102684021,0.0,-0.1875,-0.9819112420082092,0.0,-0.8647770881652832,-0.5,0.0,0.625,0.779977023601532,0.0,0.6343932747840881,0.7730104923248291,0.0,-0.7248773574829102,0.6875,0.0,0.6597813963890076,0.75,0.0,-0.125,-0.9911822080612183,0.0,0.75,0.6597813963890076,0.0,0.875,-0.4829441010951996,0.0,0.7248772978782654,0.6875,0.0,0.6875,0.7248772978782654,0.0,0.7071067690849304,0.7071067690849304,0.0,0.8979532122612,-0.4375,0.0,0.8819212913513184,-0.47139662504196167,0.0,-0.09801702946424484,-0.9951847195625305,0.0,-0.0625,-0.9969295859336853,0.0,0.7730104327201843,0.6343932747840881,0.0,-8.742277657347586e-08,-1.0,0.0,0.0,-1.0,0.0,-0.9238795042037964,-0.38268357515335083,0.0,-0.9266287088394165,-0.375,0.0,-0.70710688829422,0.7071067094802856,0.0,-0.6875,0.7248773574829102,0.0,0.0625,-0.9969295859336853,0.0,-0.6597813963890076,0.75,0.0,0.9266287088394165,-0.375,0.0,0.9238795638084412,-0.3826833963394165,0.0,0.8314695954322815,0.5555702447891235,0.0,-0.9375,-0.34461677074432373,0.0,0.09801709651947021,-0.9951847195625305,0.0,0.125,-0.9911822080612183,0.0,-0.9489915370941162,-0.3125,0.0,0.1875,-0.9819112420082092,0.0,0.8819212317466736,0.4713967740535736,0.0,0.875,0.48294416069984436,0.0,0.864777147769928,0.5,0.0,0.9375,-0.34461677074432373,0.0,-0.6343931555747986,0.7730105519294739,0.0,-0.625,0.779977023601532,0.0,0.25,-0.9670311212539673,0.0,0.8979532122612,0.4375,0.0,0.9489915370941162,-0.3125,0.0,0.19509030878543854,-0.9807853102684021,0.0,-0.5811478495597839,0.8125,0.0,-0.9569403529167175,-0.29028454422950745,0.0,0.9238795042037964,0.3826834261417389,0.0,0.3125,-0.948991596698761,0.0,-0.9670311212539673,-0.25,0.0,0.9266287088394165,0.375,0.0,0.9375,0.34461674094200134,0.0,0.2902847230434418,-0.9569403529167175,0.0,0.3446168005466461,-0.9375,0.0,0.9489915370941162,0.3125,0.0,0.9569403529167175,0.2902846336364746,0.0,0.9670311212539673,-0.25,0.0,0.9569402933120728,-0.2902847230434418,0.0,0.9670311212539673,0.25,0.0,-0.4375,-0.8979532122612,0.0,-0.4713967740535736,-0.8819212317466736,0.0,-0.9807852506637573,-0.1950903832912445,0.0,0.9807852506637573,0.19509035348892212,0.0,-0.48294416069984436,-0.875,0.0,-0.9819111824035645,-0.1875,0.0,-0.5625,0.8263301849365234,0.0,-0.3826834261417389,-0.9238795042037964,0.0,-0.375,-0.9266287088394165,0.0,0.9819111824035645,0.1875,0.0,-0.5,0.8647770881652832,0.0,0.9819111824035645,-0.1875,0.0,0.9807852506637573,-0.19509032368659973,0.0,0.9911822080612183,0.125,0.0,-0.5555703043937683,0.8314695954322815,0.0,0.9951847195625305,0.0980171337723732,0.0,0.9969295859336853,0.0625,0.0,-0.482944130897522,0.875,0.0,-0.9911821484565735,-0.125,0.0,0.375,-0.9266287088394165,0.0,1.0,0.0,0.0,1.0,-4.371138828673793e-08,0.0,0.9911822080612183,-0.125,0.0,-0.9951847195625305,-0.09801693260669708,0.0,0.9969295859336853,-0.0625,0.0,-0.9969295859336853,-0.0625,0.0,0.9951847195625305,-0.09801710397005081,0.0,-0.4713965356349945,0.8819213509559631,0.0,-0.4375,0.8979532122612,0.0,0.4375,-0.8979532122612,0.0,-0.3826834261417389,0.9238795638084412,0.0,-0.375,0.9266287088394165,0.0,0.38268348574638367,-0.9238795042037964,0.0,-1.0,0.0,0.0,0.48294422030448914,-0.875,0.0,0.4713968336582184,-0.8819212317466736,0.0,-0.3446168303489685,0.9375,0.0,0.375,0.9266287088394165,0.0,-0.5625,-0.8263301253318787,0.0,-0.5811477899551392,-0.8125,0.0,0.34461677074432373,0.9375,0.0,0.4375,0.8979532122612,0.0,-0.5,-0.8647770881652832,0.0,0.3826834559440613,0.9238795042037964,0.0,-0.5555703043937683,-0.8314695358276367,0.0,-0.9969295859336853,0.0625,0.0,-1.0,1.1924880638503055e-08,0.0,0.5,-0.864777147769928,0.0,-0.3125,0.948991596698761,0.0,0.5555701851844788,-0.8314696550369263,0.0,-0.9911821484565735,0.125,0.0,-0.9951847195625305,0.09801695495843887,0.0,0.5625,-0.8263301849365234,0.0,0.8125,-0.5811477899551392,0.0,-0.2902848422527313,0.9569402933120728,0.0,-0.25,0.9670311212539673,0.0,0.779977023601532,-0.625,0.0,0.7730104923248291,-0.6343932747840881,0.0,0.5811477899551392,-0.8125,0.0,0.75,-0.6597813963890076,0.0,-0.19509023427963257,0.9807853102684021,0.0,-0.1875,0.9819112420082092,0.0,-0.9819111824035645,0.1875,0.0,-0.6343932151794434,-0.7730105519294739,0.0,0.7248772978782654,-0.6875,0.0,-0.625,-0.779977023601532,0.0,0.7071067690849304,-0.7071067690849304,0.0,-0.125,0.9911822080612183,0.0,-0.6597814559936523,-0.75,0.0,0.6875,-0.7248772978782654,0.0,0.6597813963890076,-0.75,0.0,0.6343932747840881,-0.7730104923248291,0.0,-0.9807852506637573,0.1950904130935669,0.0,-0.0625,0.9969295859336853,0.0,0.625,-0.779977023601532,0.0,-0.9670311212539673,0.25,0.0,-0.09801724553108215,0.9951847195625305,0.0,0.0625,0.9969295859336853,0.0,-0.9569403529167175,0.29028457403182983,0.0,0.125,0.9911822080612183,0.0,-0.9489915370941162,0.3125,0.0,-0.7071067094802856,-0.7071068286895752,0.0,-0.6875,-0.7248773574829102,0.0,0.0980171412229538,0.9951847195625305,0.0,-0.7248772978782654,-0.6875,0.0,0.1875,0.9819111824035645,0.0,0.25,0.9670311212539673,0.0,-0.9375,0.34461671113967896,0.0,0.19509032368659973,0.9807852506637573,0.0,-0.9266287088394165,0.375,0.0,0.290284663438797,0.9569403529167175,0.0,0.3125,0.948991596698761,0.0,-0.75,-0.6597813963890076,0.0,-0.7730104327201843,-0.6343933343887329,0.0,-0.779977023601532,-0.625,0.0,-0.9238794445991516,0.3826836049556732,0.0,-0.8979532122612,0.4375,0.0,-0.8125,-0.5811477899551392,0.0,-0.8263301253318787,-0.5625,0.0,-0.8819212913513184,0.47139671444892883,0.0,-0.875,0.48294419050216675,0.0,-0.864777147769928,0.5,0.0,-0.8314694762229919,-0.5555704236030579,0.0,-0.8263301253318787,0.5625,0.0,-0.831469714641571,0.5555700659751892,0.0,-0.8125,0.5811477899551392,0.0],
	normal: [0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,0.999969482421875,0.0,0.0,1.0,0.0,0.0,0.999969482421875,0.0,0.0,0.999969482421875,0.0,0.0,0.999969482421875,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,0.999969482421875,0.0,0.0,1.0,0.0,0.0,0.999969482421875,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,0.999969482421875,0.0,0.0,1.0,0.0,0.0,0.999969482421875,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,0.999969482421875,0.0,0.0,0.999969482421875,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,0.999969482421875,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,0.999969482421875,0.0,0.0,0.999969482421875,0.0,0.0,0.999969482421875,0.0,0.0,0.999969482421875,0.0,0.0,0.999969482421875,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,0.999969482421875,0.0,0.0,0.999969482421875,0.0,0.0,0.999969482421875,0.0,0.0,1.0,0.0,0.0,0.999969482421875,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,0.999969482421875,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,0.999969482421875,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,0.999969482421875,0.0,0.0,0.999969482421875,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,0.999969482421875,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,0.999969482421875,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,0.999969482421875,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,0.999969482421875,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,0.999969482421875,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,0.999969482421875,0.0,0.0,0.999969482421875,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,0.999969482421875,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,0.999969482421875,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,0.999969482421875,0.0,0.0,0.999969482421875,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,0.999969482421875,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,0.999969482421875,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,0.999969482421875,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,0.999969482421875,0.0,0.0,1.0,0.0,0.0,0.999969482421875,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,0.999969482421875,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,0.999969482421875,0.0,0.0,1.0,0.0,0.0,0.999969482421875,0.0,0.0,1.0,0.0,0.0,0.999969482421875,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,0.999969482421875,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,0.999969482421875,0.0,0.0,0.999969482421875,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,0.999969482421875,0.0,0.0,0.999969482421875,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,0.999969482421875,0.0,0.0,1.0],
	uv: [0.34375,0.03125,0.375,0.03125,0.40625,0.03125,0.4375,0.03125,0.46875,0.03125,0.5,0.03125,0.53125,0.03125,0.5625,0.03125,0.59375,0.03125,0.625,0.03125,0.65625,0.03125,0.28125,0.0625,0.3125,0.0625,0.34375,0.0625,0.375,0.0625,0.40625,0.0625,0.4375,0.0625,0.46875,0.0625,0.5,0.0625,0.53125,0.0625,0.5625,0.0625,0.59375,0.0625,0.625,0.0625,0.65625,0.0625,0.6875,0.0625,0.71875,0.0625,0.21875,0.09375,0.25,0.09375,0.28125,0.09375,0.3125,0.09375,0.34375,0.09375,0.375,0.09375,0.40625,0.09375,0.4375,0.09375,0.46875,0.09375,0.5,0.09375,0.53125,0.09375,0.5625,0.09375,0.59375,0.09375,0.625,0.09375,0.65625,0.09375,0.6875,0.09375,0.71875,0.09375,0.75,0.09375,0.78125,0.09375,0.1875,0.125,0.21875,0.125,0.25,0.125,0.28125,0.125,0.3125,0.125,0.34375,0.125,0.375,0.125,0.40625,0.125,0.4375,0.125,0.46875,0.125,0.5,0.125,0.53125,0.125,0.5625,0.125,0.59375,0.125,0.625,0.125,0.65625,0.125,0.6875,0.125,0.71875,0.125,0.75,0.125,0.78125,0.125,0.8125,0.125,0.15625,0.15625,0.1875,0.15625,0.21875,0.15625,0.25,0.15625,0.28125,0.15625,0.3125,0.15625,0.34375,0.15625,0.375,0.15625,0.40625,0.15625,0.4375,0.15625,0.46875,0.15625,0.5,0.15625,0.53125,0.15625,0.5625,0.15625,0.59375,0.15625,0.625,0.15625,0.65625,0.15625,0.6875,0.15625,0.71875,0.15625,0.75,0.15625,0.78125,0.15625,0.8125,0.15625,0.84375,0.15625,0.125,0.1875,0.15625,0.1875,0.1875,0.1875,0.21875,0.1875,0.25,0.1875,0.28125,0.1875,0.3125,0.1875,0.34375,0.1875,0.375,0.1875,0.40625,0.1875,0.4375,0.1875,0.46875,0.1875,0.5,0.1875,0.53125,0.1875,0.5625,0.1875,0.59375,0.1875,0.625,0.1875,0.65625,0.1875,0.6875,0.1875,0.71875,0.1875,0.75,0.1875,0.78125,0.1875,0.8125,0.1875,0.84375,0.1875,0.875,0.1875,0.09375,0.21875,0.125,0.21875,0.15625,0.21875,0.1875,0.21875,0.21875,0.21875,0.25,0.21875,0.28125,0.21875,0.3125,0.21875,0.34375,0.21875,0.375,0.21875,0.40625,0.21875,0.4375,0.21875,0.46875,0.21875,0.5,0.21875,0.53125,0.21875,0.5625,0.21875,0.59375,0.21875,0.625,0.21875,0.65625,0.21875,0.6875,0.21875,0.71875,0.21875,0.75,0.21875,0.78125,0.21875,0.8125,0.21875,0.84375,0.21875,0.875,0.21875,0.90625,0.21875,0.09375,0.25,0.125,0.25,0.15625,0.25,0.1875,0.25,0.21875,0.25,0.25,0.25,0.28125,0.25,0.3125,0.25,0.34375,0.25,0.375,0.25,0.40625,0.25,0.4375,0.25,0.46875,0.25,0.5,0.25,0.53125,0.25,0.5625,0.25,0.59375,0.25,0.625,0.25,0.65625,0.25,0.6875,0.25,0.71875,0.25,0.75,0.25,0.78125,0.25,0.8125,0.25,0.84375,0.25,0.875,0.25,0.90625,0.25,0.0625,0.28125,0.09375,0.28125,0.125,0.28125,0.15625,0.28125,0.1875,0.28125,0.21875,0.28125,0.25,0.28125,0.28125,0.28125,0.3125,0.28125,0.34375,0.28125,0.375,0.28125,0.40625,0.28125,0.4375,0.28125,0.46875,0.28125,0.5,0.28125,0.53125,0.28125,0.5625,0.28125,0.59375,0.28125,0.625,0.28125,0.65625,0.28125,0.6875,0.28125,0.71875,0.28125,0.75,0.28125,0.78125,0.28125,0.8125,0.28125,0.84375,0.28125,0.875,0.28125,0.90625,0.28125,0.9375,0.28125,0.0625,0.3125,0.09375,0.3125,0.125,0.3125,0.15625,0.3125,0.1875,0.3125,0.21875,0.3125,0.25,0.3125,0.28125,0.3125,0.3125,0.3125,0.34375,0.3125,0.375,0.3125,0.40625,0.3125,0.4375,0.3125,0.46875,0.3125,0.5,0.3125,0.53125,0.3125,0.5625,0.3125,0.59375,0.3125,0.625,0.3125,0.65625,0.3125,0.6875,0.3125,0.71875,0.3125,0.75,0.3125,0.78125,0.3125,0.8125,0.3125,0.84375,0.3125,0.875,0.3125,0.90625,0.3125,0.9375,0.3125,0.03125,0.34375,0.0625,0.34375,0.09375,0.34375,0.125,0.34375,0.15625,0.34375,0.1875,0.34375,0.21875,0.34375,0.25,0.34375,0.28125,0.34375,0.3125,0.34375,0.34375,0.34375,0.375,0.34375,0.40625,0.34375,0.4375,0.34375,0.46875,0.34375,0.5,0.34375,0.53125,0.34375,0.5625,0.34375,0.59375,0.34375,0.625,0.34375,0.65625,0.34375,0.6875,0.34375,0.71875,0.34375,0.75,0.34375,0.78125,0.34375,0.8125,0.34375,0.84375,0.34375,0.875,0.34375,0.90625,0.34375,0.9375,0.34375,0.96875,0.34375,0.03125,0.375,0.0625,0.375,0.09375,0.375,0.125,0.375,0.15625,0.375,0.1875,0.375,0.21875,0.375,0.25,0.375,0.28125,0.375,0.3125,0.375,0.34375,0.375,0.375,0.375,0.40625,0.375,0.4375,0.375,0.46875,0.375,0.5,0.375,0.53125,0.375,0.5625,0.375,0.59375,0.375,0.625,0.375,0.65625,0.375,0.6875,0.375,0.71875,0.375,0.75,0.375,0.78125,0.375,0.8125,0.375,0.84375,0.375,0.875,0.375,0.90625,0.375,0.9375,0.375,0.96875,0.375,0.03125,0.40625,0.0625,0.40625,0.09375,0.40625,0.125,0.40625,0.15625,0.40625,0.1875,0.40625,0.21875,0.40625,0.25,0.40625,0.28125,0.40625,0.3125,0.40625,0.34375,0.40625,0.375,0.40625,0.40625,0.40625,0.4375,0.40625,0.46875,0.40625,0.5,0.40625,0.53125,0.40625,0.5625,0.40625,0.59375,0.40625,0.625,0.40625,0.65625,0.40625,0.6875,0.40625,0.71875,0.40625,0.75,0.40625,0.78125,0.40625,0.8125,0.40625,0.84375,0.40625,0.875,0.40625,0.90625,0.40625,0.9375,0.40625,0.96875,0.40625,0.03125,0.4375,0.0625,0.4375,0.09375,0.4375,0.125,0.4375,0.15625,0.4375,0.1875,0.4375,0.21875,0.4375,0.25,0.4375,0.28125,0.4375,0.3125,0.4375,0.34375,0.4375,0.375,0.4375,0.40625,0.4375,0.4375,0.4375,0.46875,0.4375,0.5,0.4375,0.53125,0.4375,0.5625,0.4375,0.59375,0.4375,0.625,0.4375,0.65625,0.4375,0.6875,0.4375,0.71875,0.4375,0.75,0.4375,0.78125,0.4375,0.8125,0.4375,0.84375,0.4375,0.875,0.4375,0.90625,0.4375,0.9375,0.4375,0.96875,0.4375,0.03125,0.46875,0.0625,0.46875,0.09375,0.46875,0.125,0.46875,0.15625,0.46875,0.1875,0.46875,0.21875,0.46875,0.25,0.46875,0.28125,0.46875,0.3125,0.46875,0.34375,0.46875,0.375,0.46875,0.40625,0.46875,0.4375,0.46875,0.46875,0.46875,0.5,0.46875,0.53125,0.46875,0.5625,0.46875,0.59375,0.46875,0.625,0.46875,0.65625,0.46875,0.6875,0.46875,0.71875,0.46875,0.75,0.46875,0.78125,0.46875,0.8125,0.46875,0.84375,0.46875,0.875,0.46875,0.90625,0.46875,0.9375,0.46875,0.96875,0.46875,0.03125,0.5,0.0625,0.5,0.09375,0.5,0.125,0.5,0.15625,0.5,0.1875,0.5,0.21875,0.5,0.25,0.5,0.28125,0.5,0.3125,0.5,0.34375,0.5,0.375,0.5,0.40625,0.5,0.4375,0.5,0.46875,0.5,0.5,0.5,0.53125,0.5,0.5625,0.5,0.59375,0.5,0.625,0.5,0.65625,0.5,0.6875,0.5,0.71875,0.5,0.75,0.5,0.78125,0.5,0.8125,0.5,0.84375,0.5,0.875,0.5,0.90625,0.5,0.9375,0.5,0.96875,0.5,0.03125,0.53125,0.0625,0.53125,0.09375,0.53125,0.125,0.53125,0.15625,0.53125,0.1875,0.53125,0.21875,0.53125,0.25,0.53125,0.28125,0.53125,0.3125,0.53125,0.34375,0.53125,0.375,0.53125,0.40625,0.53125,0.4375,0.53125,0.46875,0.53125,0.5,0.53125,0.53125,0.53125,0.5625,0.53125,0.59375,0.53125,0.625,0.53125,0.65625,0.53125,0.6875,0.53125,0.71875,0.53125,0.75,0.53125,0.78125,0.53125,0.8125,0.53125,0.84375,0.53125,0.875,0.53125,0.90625,0.53125,0.9375,0.53125,0.96875,0.53125,0.03125,0.5625,0.0625,0.5625,0.09375,0.5625,0.125,0.5625,0.15625,0.5625,0.1875,0.5625,0.21875,0.5625,0.25,0.5625,0.28125,0.5625,0.3125,0.5625,0.34375,0.5625,0.375,0.5625,0.40625,0.5625,0.4375,0.5625,0.46875,0.5625,0.5,0.5625,0.53125,0.5625,0.5625,0.5625,0.59375,0.5625,0.625,0.5625,0.65625,0.5625,0.6875,0.5625,0.71875,0.5625,0.75,0.5625,0.78125,0.5625,0.8125,0.5625,0.84375,0.5625,0.875,0.5625,0.90625,0.5625,0.9375,0.5625,0.96875,0.5625,0.03125,0.59375,0.0625,0.59375,0.09375,0.59375,0.125,0.59375,0.15625,0.59375,0.1875,0.59375,0.21875,0.59375,0.25,0.59375,0.28125,0.59375,0.3125,0.59375,0.34375,0.59375,0.375,0.59375,0.40625,0.59375,0.4375,0.59375,0.46875,0.59375,0.5,0.59375,0.53125,0.59375,0.5625,0.59375,0.59375,0.59375,0.625,0.59375,0.65625,0.59375,0.6875,0.59375,0.71875,0.59375,0.75,0.59375,0.78125,0.59375,0.8125,0.59375,0.84375,0.59375,0.875,0.59375,0.90625,0.59375,0.9375,0.59375,0.96875,0.59375,0.03125,0.625,0.0625,0.625,0.09375,0.625,0.125,0.625,0.15625,0.625,0.1875,0.625,0.21875,0.625,0.25,0.625,0.28125,0.625,0.3125,0.625,0.34375,0.625,0.375,0.625,0.40625,0.625,0.4375,0.625,0.46875,0.625,0.5,0.625,0.53125,0.625,0.5625,0.625,0.59375,0.625,0.625,0.625,0.65625,0.625,0.6875,0.625,0.71875,0.625,0.75,0.625,0.78125,0.625,0.8125,0.625,0.84375,0.625,0.875,0.625,0.90625,0.625,0.9375,0.625,0.96875,0.625,0.03125,0.65625,0.0625,0.65625,0.09375,0.65625,0.125,0.65625,0.15625,0.65625,0.1875,0.65625,0.21875,0.65625,0.25,0.65625,0.28125,0.65625,0.3125,0.65625,0.34375,0.65625,0.375,0.65625,0.40625,0.65625,0.4375,0.65625,0.46875,0.65625,0.5,0.65625,0.53125,0.65625,0.5625,0.65625,0.59375,0.65625,0.625,0.65625,0.65625,0.65625,0.6875,0.65625,0.71875,0.65625,0.75,0.65625,0.78125,0.65625,0.8125,0.65625,0.84375,0.65625,0.875,0.65625,0.90625,0.65625,0.9375,0.65625,0.96875,0.65625,0.0625,0.6875,0.09375,0.6875,0.125,0.6875,0.15625,0.6875,0.1875,0.6875,0.21875,0.6875,0.25,0.6875,0.28125,0.6875,0.3125,0.6875,0.34375,0.6875,0.375,0.6875,0.40625,0.6875,0.4375,0.6875,0.46875,0.6875,0.5,0.6875,0.53125,0.6875,0.5625,0.6875,0.59375,0.6875,0.625,0.6875,0.65625,0.6875,0.6875,0.6875,0.71875,0.6875,0.75,0.6875,0.78125,0.6875,0.8125,0.6875,0.84375,0.6875,0.875,0.6875,0.90625,0.6875,0.9375,0.6875,0.0625,0.71875,0.09375,0.71875,0.125,0.71875,0.15625,0.71875,0.1875,0.71875,0.21875,0.71875,0.25,0.71875,0.28125,0.71875,0.3125,0.71875,0.34375,0.71875,0.375,0.71875,0.40625,0.71875,0.4375,0.71875,0.46875,0.71875,0.5,0.71875,0.53125,0.71875,0.5625,0.71875,0.59375,0.71875,0.625,0.71875,0.65625,0.71875,0.6875,0.71875,0.71875,0.71875,0.75,0.71875,0.78125,0.71875,0.8125,0.71875,0.84375,0.71875,0.875,0.71875,0.90625,0.71875,0.9375,0.71875,0.09375,0.75,0.125,0.75,0.15625,0.75,0.1875,0.75,0.21875,0.75,0.25,0.75,0.28125,0.75,0.3125,0.75,0.34375,0.75,0.375,0.75,0.40625,0.75,0.4375,0.75,0.46875,0.75,0.5,0.75,0.53125,0.75,0.5625,0.75,0.59375,0.75,0.625,0.75,0.65625,0.75,0.6875,0.75,0.71875,0.75,0.75,0.75,0.78125,0.75,0.8125,0.75,0.84375,0.75,0.875,0.75,0.90625,0.75,0.09375,0.78125,0.125,0.78125,0.15625,0.78125,0.1875,0.78125,0.21875,0.78125,0.25,0.78125,0.28125,0.78125,0.3125,0.78125,0.34375,0.78125,0.375,0.78125,0.40625,0.78125,0.4375,0.78125,0.46875,0.78125,0.5,0.78125,0.53125,0.78125,0.5625,0.78125,0.59375,0.78125,0.625,0.78125,0.65625,0.78125,0.6875,0.78125,0.71875,0.78125,0.75,0.78125,0.78125,0.78125,0.8125,0.78125,0.84375,0.78125,0.875,0.78125,0.90625,0.78125,0.125,0.8125,0.15625,0.8125,0.1875,0.8125,0.21875,0.8125,0.25,0.8125,0.28125,0.8125,0.3125,0.8125,0.34375,0.8125,0.375,0.8125,0.40625,0.8125,0.4375,0.8125,0.46875,0.8125,0.5,0.8125,0.53125,0.8125,0.5625,0.8125,0.59375,0.8125,0.625,0.8125,0.65625,0.8125,0.6875,0.8125,0.71875,0.8125,0.75,0.8125,0.78125,0.8125,0.8125,0.8125,0.84375,0.8125,0.875,0.8125,0.15625,0.84375,0.1875,0.84375,0.21875,0.84375,0.25,0.84375,0.28125,0.84375,0.3125,0.84375,0.34375,0.84375,0.375,0.84375,0.40625,0.84375,0.4375,0.84375,0.46875,0.84375,0.5,0.84375,0.53125,0.84375,0.5625,0.84375,0.59375,0.84375,0.625,0.84375,0.65625,0.84375,0.6875,0.84375,0.71875,0.84375,0.75,0.84375,0.78125,0.84375,0.8125,0.84375,0.84375,0.84375,0.1875,0.875,0.21875,0.875,0.25,0.875,0.28125,0.875,0.3125,0.875,0.34375,0.875,0.375,0.875,0.40625,0.875,0.4375,0.875,0.46875,0.875,0.5,0.875,0.53125,0.875,0.5625,0.875,0.59375,0.875,0.625,0.875,0.65625,0.875,0.6875,0.875,0.71875,0.875,0.75,0.875,0.78125,0.875,0.8125,0.875,0.21875,0.90625,0.25,0.90625,0.28125,0.90625,0.3125,0.90625,0.34375,0.90625,0.375,0.90625,0.40625,0.90625,0.4375,0.90625,0.46875,0.90625,0.5,0.90625,0.53125,0.90625,0.5625,0.90625,0.59375,0.90625,0.625,0.90625,0.65625,0.90625,0.6875,0.90625,0.71875,0.90625,0.75,0.90625,0.78125,0.90625,0.28125,0.9375,0.3125,0.9375,0.34375,0.9375,0.375,0.9375,0.40625,0.9375,0.4375,0.9375,0.46875,0.9375,0.5,0.9375,0.53125,0.9375,0.5625,0.9375,0.59375,0.9375,0.625,0.9375,0.65625,0.9375,0.6875,0.9375,0.71875,0.9375,0.34375,0.96875,0.375,0.96875,0.40625,0.96875,0.4375,0.96875,0.46875,0.96875,0.5,0.96875,0.53125,0.96875,0.5625,0.96875,0.59375,0.96875,0.625,0.96875,0.65625,0.96875,0.5,1.0,0.90625,0.7905738949775696,0.7356982231140137,0.9409605860710144,0.7414721250534058,0.9375,0.34375,0.025504231452941895,0.9131650924682617,0.21875,0.9157348275184631,0.22221490740776062,0.75,0.9323885440826416,0.8899884819984436,0.8125,0.32769161462783813,0.03125,0.9323885440826416,0.25,0.9131650328636169,0.78125,0.7777850031852722,0.9157347679138184,0.375,0.016484439373016357,0.05903935059905052,0.2643016576766968,0.3548576831817627,0.021529823541641235,0.0625,0.258527934551239,0.78125,0.9131650328636169,0.7905738949775696,0.90625,0.11001148819923401,0.8125,0.11349478363990784,0.8171966671943665,0.05102336406707764,0.28125,0.125,0.8298907279968262,0.4024548828601837,0.00960734486579895,0.40625,0.009044378995895386,0.0676114559173584,0.25,0.8125,0.8899885416030884,0.8171967267990112,0.8865052461624146,0.13756132125854492,0.84375,0.8298907279968262,0.875,0.4375,0.004408895969390869,0.875,0.8298907279968262,0.9375,0.258527934551239,0.8624386787414551,0.84375,0.84375,0.8624386787414551,0.853553295135498,0.853553295135498,0.9489766359329224,0.28125,0.9409606456756592,0.26430168747901917,0.45099154114723206,0.002407640218734741,0.46875,0.0015352070331573486,0.8865051865577698,0.8171966075897217,0.4999999701976776,0.0,0.5,0.0,0.03806024789810181,0.3086582124233246,0.03668564558029175,0.3125,0.14644655585289001,0.853553295135498,0.15625,0.8624386787414551,0.53125,0.0015352070331573486,0.17010930180549622,0.875,0.9633143544197083,0.3125,0.961939811706543,0.30865830183029175,0.9157347679138184,0.777785062789917,0.03125,0.32769161462783813,0.5490085482597351,0.002407640218734741,0.5625,0.004408895969390869,0.025504231452941895,0.34375,0.59375,0.009044378995895386,0.9409605860710144,0.7356983423233032,0.9375,0.741472065448761,0.9323885440826416,0.75,0.96875,0.32769161462783813,0.1828034371137619,0.8865052461624146,0.1875,0.8899885416030884,0.625,0.016484439373016357,0.9489766359329224,0.71875,0.9744957685470581,0.34375,0.5975451469421387,0.00960734486579895,0.20942607522010803,0.90625,0.021529823541641235,0.35485774278640747,0.961939811706543,0.6913416981697083,0.65625,0.025504201650619507,0.016484439373016357,0.375,0.9633143544197083,0.6875,0.96875,0.6723083257675171,0.6451423764228821,0.021529823541641235,0.6723084449768066,0.03125,0.9744957685470581,0.65625,0.9784702062606812,0.6451423168182373,0.9835155606269836,0.375,0.9784701466560364,0.3548576533794403,0.9835155606269836,0.625,0.28125,0.051023393869400024,0.264301598072052,0.05903938412666321,0.009607374668121338,0.40245479345321655,0.9903926849365234,0.5975451469421387,0.258527934551239,0.0625,0.009044408798217773,0.40625,0.21875,0.9131650924682617,0.30865830183029175,0.03806024789810181,0.3125,0.03668564558029175,0.9909555912017822,0.59375,0.25,0.9323885440826416,0.9909555912017822,0.40625,0.9903925657272339,0.40245482325553894,0.9955911040306091,0.5625,0.22221484780311584,0.9157348275184631,0.9975923299789429,0.5490085482597351,0.998464822769165,0.53125,0.258527934551239,0.9375,0.004408925771713257,0.4375,0.6875,0.03668564558029175,1.0,0.5,1.0,0.4999999701976776,0.9955911040306091,0.4375,0.002407640218734741,0.45099151134490967,0.998464822769165,0.46875,0.0015352070331573486,0.46875,0.9975923895835876,0.4509914219379425,0.26430174708366394,0.9409606456756592,0.28125,0.9489766359329224,0.71875,0.051023393869400024,0.30865827202796936,0.9619397521018982,0.3125,0.9633143544197083,0.6913416385650635,0.03806024417281151,0.0,0.5,0.7414721250534058,0.0625,0.7356984615325928,0.05903938412666321,0.32769158482551575,0.96875,0.6875,0.9633143544197083,0.21875,0.08683493733406067,0.20942610502243042,0.09375,0.6723083853721619,0.96875,0.71875,0.9489766359329224,0.25,0.0676114559173584,0.691341757774353,0.961939811706543,0.22221486270427704,0.08426523208618164,0.0015352070331573486,0.53125,0.0,0.5,0.75,0.06761142611503601,0.34375,0.9744957685470581,0.7777851223945618,0.08426517993211746,0.004408925771713257,0.5625,0.002407640218734741,0.5490084886550903,0.78125,0.08683490753173828,0.90625,0.20942610502243042,0.35485759377479553,0.9784702062606812,0.375,0.9835155606269836,0.8899885416030884,0.1875,0.8865052461624146,0.18280336260795593,0.7905738949775696,0.09375,0.875,0.17010930180549622,0.40245485305786133,0.9903925657272339,0.40625,0.9909555912017822,0.009044408798217773,0.59375,0.18280339241027832,0.11349472403526306,0.8624386787414551,0.15625,0.1875,0.11001148819923401,0.8535533547401428,0.1464466154575348,0.4375,0.9955911040306091,0.17010927200317383,0.125,0.84375,0.1375613510608673,0.8298907279968262,0.125,0.8171966075897217,0.11349475383758545,0.009607374668121338,0.5975452065467834,0.46875,0.998464822769165,0.8125,0.11001148819923401,0.016484439373016357,0.625,0.4509913921356201,0.9975924491882324,0.53125,0.998464822769165,0.021529823541641235,0.6451422572135925,0.5625,0.9955911040306091,0.025504231452941895,0.65625,0.14644663035869598,0.1464465856552124,0.15625,0.13756132125854492,0.5490085482597351,0.9975922703742981,0.1375613510608673,0.15625,0.59375,0.9909555912017822,0.625,0.9835155606269836,0.03125,0.6723083257675171,0.5975451469421387,0.9903926849365234,0.03668564558029175,0.6875,0.6451421976089478,0.9784700870513916,0.65625,0.9744957685470581,0.125,0.17010930180549622,0.11349478363990784,0.18280333280563354,0.11001148819923401,0.1875,0.038060273975133896,0.691341757774353,0.051023393869400024,0.71875,0.09375,0.20942610502243042,0.08683493733406067,0.21875,0.05903935059905052,0.7356982827186584,0.0625,0.7414721250534058,0.06761142611503601,0.75,0.08426526188850403,0.22221478819847107,0.08683493733406067,0.78125,0.08426515012979507,0.7777851223945618,0.09375,0.7905738949775696],
  vertTimeOffset: [4.996183089593017,5.240775740190222,5.493603067780063,5.75297917799289,6.01691265207629,6.283185307179586,6.549457962282881,6.813391436366282,7.072767546579109,7.32559487416895,7.570187524766155,4.428594871176362,4.663618162039253,4.911089545496773,5.1699866711591405,5.438811974288599,5.71559708876293,5.997955448038424,6.283185307179586,6.568415166320747,6.850773525596241,7.127558640070572,7.396383943200031,7.6552810688624,7.90275245231992,8.13777574318281,3.8610066527597056,4.076565377065398,4.307419831501262,4.553554204897434,4.814489971906709,5.089189580834869,5.375989914964043,5.672587993598525,5.976097742100474,6.283185307179586,6.590272872258698,6.893782620760646,7.19038069939513,7.477181033524303,7.751880642452463,8.012816409461738,8.25895078285791,8.489805237293773,8.705363961599467,3.5042322023927728,3.709180872006449,3.9311748929893167,4.170887513474147,4.428594871176362,4.70402082838054,4.996183089593017,5.303270654672129,5.622590597521079,5.950620379625821,6.283185307179586,6.615750234733351,6.943780016838093,7.263099959687042,7.570187524766155,7.862349785978632,8.13777574318281,8.395483100885023,8.635195721369856,8.857189742352723,9.062138411966398,3.141592653589793,3.3319250666977265,3.5402672635544405,3.768000161517854,4.016268437085561,4.2857984204590664,4.576675334672082,4.888101292843958,5.218177110575884,5.563771308009673,5.920545758376606,6.283185307179586,6.645824855982567,7.002599306349499,7.348193503783287,7.678269321515214,7.989695279687091,8.280572193900106,8.550102177273612,8.798370452841318,9.026103350804732,9.234445547661446,9.42477796076938,2.7789531047868117,2.9512602404818598,3.141592653589793,3.351924900033559,3.584221538285375,3.8402814496227506,4.12150730609725,4.428594871176362,4.761159798730127,5.117358129268117,5.493603067780063,5.884510697214938,6.283185307179586,6.681859917144234,7.072767546579109,7.449012485091054,7.805210815629046,8.13777574318281,8.444863308261922,8.72608916473642,8.982149076073796,9.214445714325613,9.42477796076938,9.615110373877313,9.78741750957236,2.422178654419879,2.574004435173137,2.742918043625144,2.9312604071460253,3.141592653589793,3.376615944452684,3.639012631776838,3.9311748929893167,4.254791289610239,4.6102879888626696,4.996183089593017,5.4085095236838185,5.840556422484004,6.283185307179586,6.725814191875169,7.157861090675354,7.570187524766155,7.956082625496502,8.311579324748934,8.635195721369856,8.927357982582333,9.189754669906488,9.42477796076938,9.635110207213145,9.823452570734027,9.992366179186035,10.144191959939292,2.2066199301141864,2.3520104141902696,2.5151851456617305,2.6989637688942096,2.906569362726902,3.141592653589793,3.407865308693088,3.709180872006449,4.0487880458053365,4.428594871176362,4.8481026260972975,5.303270654672129,5.78576532899254,6.283185307179586,6.780605285366632,7.263099959687042,7.718267988261875,8.13777574318281,8.517582568553836,8.857189742352723,9.158505305666084,9.42477796076938,9.65980125163227,9.867406845464963,10.05118546869744,10.214360200168903,10.359750684244986,1.8545904360032246,1.9757654756783243,2.112297793705439,2.2669168700940254,2.442903857556834,2.6441726754027464,2.875319998486498,3.141592653589793,3.4486802186689047,3.8021873632483008,4.206600850193494,4.663618162039253,5.1699866711591405,5.71559708876293,6.283185307179586,6.850773525596241,7.396383943200031,7.90275245231992,8.359769764165677,8.764183251110872,9.117690395690268,9.42477796076938,9.691050615872674,9.922197938956424,10.123466756802339,10.299453744265147,10.454072820653733,10.590605138680848,10.711780178355948,1.6195671451403335,1.7296311022821502,1.8545904360032246,1.9973868867205198,2.161678001082336,2.3520104141902696,2.574004435173137,2.8345050885106797,3.141592653589793,3.5042322023927728,3.9311748929893167,4.428594871176362,4.996183089593017,5.622590597521079,6.283185307179586,6.943780016838093,7.570187524766155,8.13777574318281,8.635195721369856,9.062138411966398,9.42477796076938,9.731865525848491,9.992366179186035,10.214360200168903,10.404692613276836,10.568983727638653,10.711780178355948,10.83673951207702,10.946803469218839,1.2870022175865685,1.3720957616828127,1.4686953352728764,1.5791644787990453,1.7065099725075044,1.8545904360032246,2.0283940175693473,2.2343972613742498,2.4809979439312855,2.7789531047868117,3.141592653589793,3.584221538285375,4.12150730609725,4.761159798730127,5.493603067780063,6.283185307179586,7.072767546579109,7.805210815629046,8.444863308261922,8.982149076073796,9.42477796076938,9.78741750957236,10.085372670427887,10.331973352984923,10.537976596789825,10.711780178355948,10.859860641851668,10.987206135560127,11.097675279086296,11.194274852676358,11.279368396772604,1.0424095669893632,1.1131986360204458,1.193995726344717,1.2870022175865685,1.3950840143356267,1.5220255084494596,1.6728973183169167,1.8545904360032246,2.076584456986092,2.3520104141902696,2.6989637688942096,3.141592653589793,3.709180872006449,4.428594871176362,5.303270654672129,6.283185307179586,7.263099959687042,8.13777574318281,8.857189742352723,9.42477796076938,9.867406845464963,10.214360200168903,10.48978615737308,10.711780178355948,10.893473296042256,11.044345105909713,11.171286600023544,11.279368396772604,11.372374888014456,11.453171978338727,11.52396104736981,0.7895822393995218,0.844373332890985,0.9071953922155434,0.9799146525074569,1.065008196603701,1.165827177911467,1.2870022175865685,1.4350826810822888,1.6195671451403335,1.8545904360032246,2.161678001082336,2.574004435173137,3.141592653589793,3.9311748929893167,4.996183089593017,6.283185307179586,7.570187524766155,8.635195721369856,9.42477796076938,9.992366179186035,10.404692613276836,10.711780178355948,10.946803469218839,11.131287933276884,11.279368396772604,11.400543436447704,11.501362417755471,11.586455961851716,11.65917522214363,11.721997281468186,11.776788374959649,0.5302061291866949,0.5675882184166561,0.6105973135810601,0.6605947096585076,0.7194139991699124,0.7895822393995218,0.8746757834957677,0.9799146525074569,1.1131986360204458,1.2870022175865685,1.5220255084494596,1.8545904360032246,2.3520104141902696,3.141592653589793,4.428594871176362,6.283185307179586,8.13777574318281,9.42477796076938,10.214360200168903,10.711780178355948,11.044345105909713,11.279368396772604,11.453171978338727,11.586455961851716,11.691694830863405,11.776788374959649,11.84695661518926,11.905775904700665,11.955773300778112,11.998782395942516,12.036164485172476,0.266272655103295,0.28522985914116106,0.3070875650791116,0.332564927553765,0.36263954880297966,0.39867460996464743,0.4426288846955817,0.497419978187045,0.5675882184166561,0.6605947096585076,0.7895822393995218,0.9799146525074569,1.2870022175865685,1.8545904360032246,3.141592653589793,6.283185307179586,9.42477796076938,10.711780178355948,11.279368396772604,11.586455961851716,11.776788374959649,11.905775904700665,11.998782395942516,12.068950636172127,12.123741729663589,12.167696004394525,12.203731065556193,12.233805686805407,12.25928304928006,12.281140755218011,12.300097959255877,25.132741228718345,25.132741228718345,25.132741228718345,25.132741228718345,25.132741228718345,25.132741228718345,25.132741228718345,25.132741228718345,25.132741228718345,25.132741228718345,25.132741228718345,25.132741228718345,25.132741228718345,25.132741228718345,25.132741228718345,12.566370614359172,12.566370614359172,12.566370614359172,12.566370614359172,12.566370614359172,12.566370614359172,12.566370614359172,12.566370614359172,12.566370614359172,12.566370614359172,12.566370614359172,12.566370614359172,12.566370614359172,12.566370614359172,12.566370614359172,12.566370614359172,24.86646857361505,24.847511369577184,24.825653663639233,24.80017630116458,24.770101679915363,24.734066618753697,24.690112344022765,24.635321250531298,24.56515301030169,24.472146519059837,24.343158989318823,24.152826576210888,23.845739011131776,23.27815079271512,21.991148575128552,18.84955592153876,15.707963267948966,14.420961050362397,13.853372831945741,13.54628526686663,13.355952853758696,13.22696532401768,13.133958832775829,13.063790592546217,13.008999499054756,12.96504522432382,12.929010163162152,12.898935541912937,12.873458179438284,12.851600473500334,12.832643269462467,24.60253509953165,24.56515301030169,24.522143915137285,24.472146519059837,24.413327229548432,24.343158989318823,24.258065445222577,24.152826576210888,24.0195425926979,23.845739011131776,23.610715720268885,23.27815079271512,22.780730814528077,21.991148575128552,20.704146357541983,18.84955592153876,16.994965485535534,15.707963267948966,14.918381028549442,14.420961050362397,14.088396122808632,13.853372831945741,13.679569250379618,13.54628526686663,13.44104639785494,13.355952853758696,13.285784613529085,13.22696532401768,13.176967927940233,13.133958832775829,13.096576743545869,24.343158989318823,24.28836789582736,24.225545836502803,24.152826576210888,24.067733032114646,23.966914050806878,23.845739011131776,23.697658547636056,23.51317408357801,23.27815079271512,22.97106322763601,22.558736793545208,21.991148575128552,21.201566335729026,20.136558139125327,18.84955592153876,17.56255370395219,16.497545507348487,15.707963267948966,15.14037504953231,14.728048615441509,14.420961050362397,14.185937759499506,14.001453295441461,13.853372831945741,13.732197792270641,13.631378810962874,13.54628526686663,13.473566006574716,13.41074394725016,13.355952853758696,24.09033166172898,24.0195425926979,23.938745502373628,23.845739011131776,23.73765721438272,23.610715720268885,23.45984391040143,23.27815079271512,23.056156771732255,22.780730814528077,22.433777459824135,21.991148575128552,21.423560356711896,20.704146357541983,19.829470574046216,18.84955592153876,17.869641269031302,16.994965485535534,16.27555148636562,15.707963267948966,15.265334383253382,14.918381028549442,14.642955071345265,14.420961050362397,14.23926793267609,14.088396122808632,13.961454628694801,13.853372831945741,13.76036634070389,13.679569250379618,13.608780181348536,23.845739011131776,23.76064546703553,23.66404589344547,23.5535767499193,23.42623125621084,23.27815079271512,23.104347211148998,22.898343967344097,22.65174328478706,22.353788123931533,21.991148575128552,21.54851969043297,21.011233922621095,20.37158142998822,19.63913816093828,18.84955592153876,18.059973682139237,17.3275304130893,16.687877920456422,16.15059215264455,15.707963267948966,15.345323719145984,15.047368558290458,14.800767875733422,14.59476463192852,14.420961050362397,14.272880586866677,14.145535093158218,14.035065949632049,13.938466376041987,13.853372831945741,23.51317408357801,23.403110126436196,23.27815079271512,23.135354341997825,22.97106322763601,22.780730814528077,22.558736793545208,22.298236140207663,21.991148575128552,21.628509026325574,21.201566335729026,20.704146357541983,20.136558139125327,19.510150631197266,18.84955592153876,18.18896121188025,17.56255370395219,16.994965485535534,16.497545507348487,16.070602816751947,15.707963267948966,15.400875702869854,15.14037504953231,14.918381028549442,14.728048615441509,14.563757501079692,14.420961050362397,14.296001716641324,14.185937759499506,23.27815079271512,23.156975753040022,23.020443435012908,22.86582435862432,22.68983737116151,22.4885685533156,22.25742123023185,21.991148575128552,21.68406101004944,21.330553865470044,20.92614037852485,20.469123066679092,19.962754557559204,19.417144139955415,18.84955592153876,18.281967703122103,17.736357285518313,17.229988776398425,16.77297146455267,16.368557977607473,16.015050833028077,15.707963267948966,15.44169061284567,15.21054328976192,15.009274471916006,14.833287484453198,14.678668408064611,14.542136090037497,14.420961050362397,22.92612129860416,22.780730814528077,22.617556083056613,22.433777459824135,22.226171865991443,21.991148575128552,21.724875920025255,21.423560356711896,21.083953182913007,20.704146357541983,20.284638602621047,19.829470574046216,19.346975899725805,18.84955592153876,18.352135943351712,17.869641269031302,17.41447324045647,16.994965485535534,16.61515866016451,16.27555148636562,15.97423592305226,15.707963267948966,15.472939977086074,15.265334383253382,15.081555760020905,14.918381028549442,14.772990544473359,22.710562574298464,22.558736793545208,22.3898231850932,22.201480821572318,21.991148575128552,21.75612528426566,21.49372859694151,21.201566335729026,20.877949939108106,20.522453239855675,20.136558139125327,19.724231705034526,19.292184806234342,18.84955592153876,18.406927036843175,17.97488013804299,17.56255370395219,17.176658603221842,16.82116190396941,16.497545507348487,16.205383246136012,15.942986558811857,15.707963267948966,15.4976310215052,15.309288657984318,15.14037504953231,14.988549268779053,22.353788123931533,22.181480988236487,21.991148575128552,21.780816328684786,21.54851969043297,21.292459779095594,21.011233922621095,20.704146357541983,20.37158142998822,20.015383099450226,19.63913816093828,19.248230531503406,18.84955592153876,18.45088131157411,18.059973682139237,17.68372874362729,17.3275304130893,16.994965485535534,16.687877920456422,16.406652063981923,16.15059215264455,15.918295514392732,15.707963267948966,15.517630854841032,15.345323719145984,21.991148575128552,21.800816162020617,21.592473965163904,21.36474106720049,21.116472791632784,20.84694280825928,20.556065894046263,20.24463993587439,19.91456411814246,19.56896992070867,19.21219547034174,18.84955592153876,18.486916372735777,18.130141922368846,17.78454772493506,17.454471907203132,17.143045949031254,16.85216903481824,16.582639051444733,16.334370775877026,16.106637877913613,15.898295681056899,15.707963267948966,21.628509026325574,21.423560356711896,21.201566335729026,20.961853715244196,20.704146357541983,20.428720400337806,20.136558139125327,19.829470574046216,19.510150631197266,19.182120849092524,18.84955592153876,18.516990993984994,18.18896121188025,17.869641269031302,17.56255370395219,17.27039144273971,16.994965485535534,16.73725812783332,16.497545507348487,16.27555148636562,16.070602816751947,21.27173457595864,21.056175851652945,20.82532139721708,20.57918702382091,20.318251256811635,20.043551647883476,19.7567513137543,19.46015323511982,19.15664348661787,18.84955592153876,18.542468356459647,18.2389586079577,17.942360529323217,17.65556019519404,17.380860586265882,17.119924819256607,16.873790445860436,16.642935991424572,16.427377267118878,20.704146357541983,20.469123066679092,20.221651683221573,19.962754557559204,19.693929254429747,19.417144139955415,19.13478578067992,18.84955592153876,18.564326062397598,18.281967703122103,18.005182588647774,17.736357285518313,17.477460159855944,17.229988776398425,16.994965485535534,20.136558139125327,19.891965488528122,19.63913816093828,19.379762050725454,19.115828576642055,18.84955592153876,18.583283266435465,18.319349792352064,18.059973682139237,17.807146354549396,17.56255370395219,18.84955592153876,15.049944783135626,16.886060642900823,16.83224178172906,5.010731693819421,10.175693567277055,10.210176378228432,16.75266160573818,15.268517029867258,4.874147276877548,10.46947617909119,14.957047795655384,16.49336135471195,5.271248140989617,1.963495173504727,5.105088248996259,2.017314035382533,16.458878740242547,16.365981752762305,22.43059496237266,22.383847449147222,1.8134828931613125,22.24677880028645,5.497787452831052,5.528454649832655,2.0968944352679806,16.147409655193073,16.100662477518828,22.09698044844299,15.963593672312985,5.781386244126341,15.452332863584946,10.549056787830983,15.602131558858769,15.813794977039162,15.707963267948966,10.752887616652021,10.602875651120874,5.890486664019269,6.032743104743362,15.315264209630246,6.28318495748848,6.283185307179586,1.5707968978027171,1.5381814693005182,21.99114908089072,21.885316701814112,6.53362750961581,21.735518170764536,11.028189145058654,10.995574468605412,14.92256518118598,1.4090381423220943,6.675884217269253,6.784984370232832,1.272453613360165,7.037915964526516,14.529866215653264,14.583684649741706,14.663264930159752,11.157332472037078,21.59844884570743,21.551702187884445,7.295122473369555,14.379853612066324,11.293917000999008,7.0685833953655495,21.333130284440095,1.1780967159547817,14.137166961486795,7.555638845902676,1.011937166189968,14.10455208365969,13.975408644661211,7.461282707591441,7.692223561521734,13.838824227719337,13.7444676725425,11.554433448169203,11.388273144738047,13.578307780549142,4.469702309472435,4.319689705885494,0.7853984269959149,13.351768924436369,4.265871271797053,0.7547307020814653,21.24023296862088,4.712388960051965,4.745003837879067,13.321101316440638,20.946450356806743,11.811639912277707,11.780972421200694,13.068169677412417,21.205750686603363,12.959069672742922,12.816812816795396,20.866869852494123,0.5017990929132825,7.821366776480105,12.566370614359172,12.56637043951362,12.064571551305928,0.39269825759569343,12.315928411922949,0.25044220243622384,12.173671674610688,20.813050456987693,20.66303891924591,8.096668304886737,20.420352177427542,20.387737390839277,7.853981874577253,25.132741228718345,8.30049955141645,8.246681118740083,20.25859428790096,17.31137445223824,3.8925081258833725,3.799611138403133,17.440517779216663,17.036072923831608,4.186290871911604,17.278759464276114,3.9269904096566997,24.88229902628212,25.132741181018822,8.380079622980166,20.12200946026185,8.639379543310326,24.630942135805064,24.7400428821462,8.673862354261704,10.08279644558272,20.027653847464585,19.86149308772873,9.864224348013487,9.817477170339242,8.76675947595604,9.680408365133399,19.634953717427933,19.60428657888569,24.378010526636878,3.534292198710844,9.530609669859576,3.5810390408339003,9.42477796076938,19.351354984592003,3.397222878747691,9.318946251679183,9.16914755640536,9.032078751199517,24.347342684803714,19.099998123974984,8.985331573525272,24.12080406252838,19.242255424804746,18.599113719102533,23.95464439868738,18.347756858485514,23.86028761535818,3.141592990764586,3.247424526904231,18.456856833496193,3.0357609444995965,18.09482521945729,17.83761875534879,23.723703310436367,18.06415772838028,23.594559759417827,17.671458749279253,17.577102382815667,2.8859622492257735,2.748893779571123,2.702146266345686,23.561944129541736,23.319258231011197,2.483574168776453,2.390677181296212,23.16924595008041,23.115427088908646,23.03584691291777,2.3561954264567557,22.742064047422133,22.776547521521486,22.64916705994189],
	index: [797,0,802,806,1,0,817,2,1,823,3,2,832,4,3,835,5,4,840,6,5,847,7,6,849,8,7,856,9,8,863,10,9,868,10,863,874,11,878,882,12,11,802,0,13,0,1,14,1,2,15,2,3,16,3,4,17,4,5,18,5,6,19,6,7,20,7,8,21,8,9,22,9,10,23,893,24,23,903,25,24,909,908,25,912,26,913,916,27,26,878,11,28,11,12,29,12,13,30,13,14,31,14,15,32,15,16,33,16,17,34,17,18,35,18,19,36,19,20,37,20,21,38,21,22,39,22,23,40,23,24,41,24,25,42,921,43,42,926,44,43,932,44,926,939,45,942,913,26,46,26,27,47,27,28,48,28,29,49,29,30,50,30,31,51,31,32,52,32,33,53,33,34,54,34,35,55,35,36,56,36,37,57,37,38,58,38,39,59,39,40,60,40,41,61,41,42,62,42,43,63,43,44,64,948,65,64,945,944,65,956,66,958,942,45,67,45,46,68,46,47,69,47,48,70,48,49,71,49,50,72,50,51,73,51,52,74,52,53,75,53,54,76,54,55,77,55,56,78,56,57,79,57,58,80,58,59,81,59,60,82,60,61,83,61,62,84,62,63,85,63,64,86,64,65,87,943,88,87,940,938,88,966,89,968,958,66,90,66,67,91,67,68,92,68,69,93,69,70,94,70,71,95,71,72,96,72,73,97,73,74,98,74,75,99,75,76,100,76,77,101,77,78,102,78,79,103,79,80,104,80,81,105,81,82,106,82,83,107,83,84,108,84,85,109,85,86,110,86,87,111,87,88,112,933,113,112,931,930,113,971,114,972,968,89,115,89,90,116,90,91,117,91,92,118,92,93,119,93,94,120,94,95,121,95,96,122,96,97,123,97,98,124,98,99,125,99,100,126,100,101,127,101,102,128,102,103,129,103,104,130,104,105,131,105,106,132,106,107,133,107,108,134,108,109,135,109,110,136,110,111,137,111,112,138,112,113,139,927,140,139,798,140,927,972,114,141,114,115,142,115,116,143,116,117,144,117,118,145,118,119,146,119,120,147,120,121,148,121,122,149,122,123,150,123,124,151,124,125,152,125,126,153,126,127,154,127,128,155,128,129,156,129,130,157,130,131,158,131,132,159,132,133,160,133,134,161,134,135,162,135,136,163,136,137,164,137,138,165,138,139,166,139,140,167,803,167,140,809,168,814,818,141,169,141,142,170,142,143,171,143,144,172,144,145,173,145,146,174,146,147,175,147,148,176,148,149,177,149,150,178,150,151,179,151,152,180,152,153,181,153,154,182,154,155,183,155,156,184,156,157,185,157,158,186,158,159,187,159,160,188,160,161,189,161,162,190,162,163,191,163,164,192,164,165,193,165,166,194,166,167,195,195,167,803,830,829,196,814,168,197,168,169,198,169,170,199,170,171,200,171,172,201,172,173,202,173,174,203,174,175,204,175,176,205,176,177,206,177,178,207,178,179,208,179,180,209,180,181,210,181,182,211,182,183,212,183,184,213,184,185,214,185,186,215,186,187,216,187,188,217,188,189,218,189,190,219,190,191,220,191,192,221,192,193,222,193,194,223,194,195,224,195,196,225,843,842,225,845,226,848,837,197,227,197,198,228,198,199,229,199,200,230,200,201,231,201,202,232,202,203,233,203,204,234,204,205,235,205,206,236,206,207,237,207,208,238,208,209,239,209,210,240,210,211,241,211,212,242,212,213,243,213,214,244,214,215,245,215,216,246,216,217,247,217,218,248,218,219,249,219,220,250,220,221,251,221,222,252,222,223,253,223,224,254,224,225,255,255,225,842,858,256,853,848,226,257,226,227,258,227,228,259,228,229,260,229,230,261,230,231,262,231,232,263,232,233,264,233,234,265,234,235,266,235,236,267,236,237,268,237,238,269,238,239,270,239,240,271,240,241,272,241,242,273,242,243,274,243,244,275,244,245,276,245,246,277,246,247,278,247,248,279,248,249,280,249,250,281,250,251,282,251,252,283,252,253,284,253,254,285,254,255,286,255,256,287,872,871,287,864,257,288,257,258,289,258,259,290,259,260,291,260,261,292,261,262,293,262,263,294,263,264,295,264,265,296,265,266,297,266,267,298,267,268,299,268,269,300,269,270,301,270,271,302,271,272,303,272,273,304,273,274,305,274,275,306,275,276,307,276,277,308,277,278,309,278,279,310,279,280,311,280,281,312,281,282,313,282,283,314,283,284,315,284,285,316,285,286,317,286,287,318,886,885,318,879,288,319,288,289,320,289,290,321,290,291,322,291,292,323,292,293,324,293,294,325,294,295,326,295,296,327,296,297,328,297,298,329,298,299,330,299,300,331,300,301,332,301,302,333,302,303,334,303,304,335,304,305,336,305,306,337,306,307,338,307,308,339,308,309,340,309,310,341,310,311,342,311,312,343,312,313,344,313,314,345,314,315,346,315,316,347,316,317,348,317,318,349,896,349,318,892,319,350,319,320,351,320,321,352,321,322,353,322,323,354,323,324,355,324,325,356,325,326,357,326,327,358,327,328,359,328,329,360,329,330,361,330,331,362,331,332,363,332,333,364,333,334,365,334,335,366,335,336,367,336,337,368,337,338,369,338,339,370,339,340,371,340,341,372,341,342,373,342,343,374,343,344,375,344,345,376,345,346,377,346,347,378,347,348,379,348,349,380,898,380,349,899,350,381,350,351,382,351,352,383,352,353,384,353,354,385,354,355,386,355,356,387,356,357,388,357,358,389,358,359,390,359,360,391,360,361,392,361,362,393,362,363,394,363,364,395,364,365,396,365,366,397,366,367,398,367,368,399,368,369,400,369,370,401,370,371,402,371,372,403,372,373,404,373,374,405,374,375,406,375,376,407,376,377,408,377,378,409,378,379,410,379,380,411,894,411,380,907,381,412,381,382,413,382,383,414,383,384,415,384,385,416,385,386,417,386,387,418,387,388,419,388,389,420,389,390,421,390,391,422,391,392,423,392,393,424,393,394,425,394,395,426,395,396,427,396,397,428,397,398,429,398,399,430,399,400,431,400,401,432,401,402,433,402,403,434,403,404,435,404,405,436,405,406,437,406,407,438,407,408,439,408,409,440,409,410,441,410,411,442,890,442,411,412,443,924,412,413,444,413,414,445,414,415,446,415,416,447,416,417,448,417,418,449,418,419,450,419,420,451,420,421,452,421,422,453,422,423,454,423,424,455,424,425,456,425,426,457,426,427,458,427,428,459,428,429,460,429,430,461,430,431,462,431,432,463,432,433,464,433,434,465,434,435,466,435,436,467,436,437,468,437,438,469,438,439,470,439,440,471,440,441,472,441,442,473,887,473,442,443,474,936,443,444,475,444,445,476,445,446,477,446,447,478,447,448,479,448,449,480,449,450,481,450,451,482,451,452,483,452,453,484,453,454,485,454,455,486,455,456,487,456,457,488,457,458,489,458,459,490,459,460,491,460,461,492,461,462,493,462,463,494,463,464,495,464,465,496,465,466,497,466,467,498,467,468,499,468,469,500,469,470,501,470,471,502,471,472,503,472,473,504,883,504,473,946,936,474,474,475,506,475,476,507,476,477,508,477,478,509,478,479,510,479,480,511,480,481,512,481,482,513,482,483,514,483,484,515,484,485,516,485,486,517,486,487,518,487,488,519,488,489,520,489,490,521,490,491,522,491,492,523,492,493,524,493,494,525,494,495,526,495,496,527,496,497,528,497,498,529,498,499,530,499,500,531,500,501,532,501,502,533,502,503,534,503,504,535,873,535,504,952,949,505,505,506,537,506,507,538,507,508,539,508,509,540,509,510,541,510,511,542,511,512,543,512,513,544,513,514,545,514,515,546,515,516,547,516,517,548,517,518,549,518,519,550,519,520,551,520,521,552,521,522,553,522,523,554,523,524,555,524,525,556,525,526,557,526,527,558,527,528,559,528,529,560,529,530,561,530,531,562,531,532,563,532,533,564,533,534,565,534,535,566,869,566,535,954,536,961,961,536,537,537,538,568,538,539,569,539,540,570,540,541,571,541,542,572,542,543,573,543,544,574,544,545,575,545,546,576,546,547,577,547,548,578,548,549,579,549,550,580,550,551,581,551,552,582,552,553,583,553,554,584,554,555,585,555,556,586,556,557,587,557,558,588,558,559,589,559,560,590,560,561,591,561,562,592,562,563,593,563,564,594,564,565,595,865,595,565,866,566,869,969,963,567,567,568,597,568,569,598,569,570,599,570,571,600,571,572,601,572,573,602,573,574,603,574,575,604,575,576,605,576,577,606,577,578,607,578,579,608,579,580,609,580,581,610,581,582,611,582,583,612,583,584,613,584,585,614,585,586,615,586,587,616,587,588,617,588,589,618,589,590,619,590,591,620,591,592,621,592,593,622,593,594,623,594,595,624,857,624,595,973,970,596,974,596,597,597,598,626,598,599,627,599,600,628,600,601,629,601,602,630,602,603,631,603,604,632,604,605,633,605,606,634,606,607,635,607,608,636,608,609,637,609,610,638,610,611,639,611,612,640,612,613,641,613,614,642,614,615,643,615,616,644,616,617,645,617,618,646,618,619,647,619,620,648,620,621,649,621,622,650,622,623,651,852,651,623,851,624,857,975,625,652,625,626,653,626,627,654,627,628,655,628,629,656,629,630,657,630,631,658,631,632,659,632,633,660,633,634,661,634,635,662,635,636,663,636,637,664,637,638,665,638,639,666,639,640,667,640,641,668,641,642,669,642,643,670,643,644,671,644,645,672,645,646,673,646,647,674,647,648,675,648,649,676,649,650,677,650,651,678,804,678,651,652,979,977,979,652,653,653,654,680,654,655,681,655,656,682,656,657,683,657,658,684,658,659,685,659,660,686,660,661,687,661,662,688,662,663,689,663,664,690,664,665,691,665,666,692,666,667,693,667,668,694,668,669,695,669,670,696,670,671,697,671,672,698,672,673,699,673,674,700,674,675,701,675,676,702,676,677,703,801,703,677,794,678,804,813,812,679,815,679,680,680,681,705,681,682,706,682,683,707,683,684,708,684,685,709,685,686,710,686,687,711,687,688,712,688,689,713,689,690,714,690,691,715,691,692,716,692,693,717,693,694,718,694,695,719,695,696,720,696,697,721,697,698,722,698,699,723,699,700,724,700,701,725,701,702,726,826,726,702,824,703,801,838,821,704,839,704,705,705,706,728,706,707,729,707,708,730,708,709,731,709,710,732,710,711,733,711,712,734,712,713,735,713,714,736,714,715,737,715,716,738,716,717,739,717,718,740,718,719,741,719,720,742,720,721,743,721,722,744,722,723,745,723,724,746,724,725,747,822,747,725,827,726,826,854,841,727,855,727,728,728,729,749,729,730,750,730,731,751,731,732,752,732,733,753,733,734,754,734,735,755,735,736,756,736,737,757,737,738,758,738,739,759,739,740,760,740,741,761,741,742,762,742,743,763,743,744,764,744,745,765,745,746,766,811,766,746,819,747,822,748,880,860,880,748,749,884,749,750,750,751,768,751,752,769,752,753,770,753,754,771,754,755,772,755,756,773,756,757,774,757,758,775,758,759,776,759,760,777,760,761,778,761,762,779,762,763,780,763,764,781,781,764,765,800,765,766,810,766,811,901,891,767,902,767,768,905,768,769,769,770,783,770,771,784,771,772,785,772,773,786,773,774,787,774,775,788,775,776,789,776,777,790,777,778,791,778,779,792,792,779,780,911,780,781,915,781,796,910,782,922,922,782,783,929,783,784,935,784,785,941,785,786,947,786,787,793,787,788,951,788,789,953,789,790,959,790,791,960,791,792,965,792,914,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251,252,253,254,255,256,257,258,259,260,261,262,263,264,265,266,267,268,269,270,271,272,273,274,275,276,277,278,279,280,281,282,283,284,285,286,287,288,289,290,291,292,293,294,295,296,297,298,299,300,301,302,303,304,305,306,307,308,309,310,311,312,313,314,315,316,317,318,319,320,321,322,323,324,325,326,327,328,329,330,331,332,333,334,335,336,337,338,339,340,341,342,343,344,345,346,347,348,349,350,351,352,353,354,355,356,357,358,359,360,361,362,363,364,365,366,367,368,369,370,371,372,373,374,375,376,377,378,379,380,381,382,383,384,385,386,387,388,389,390,391,392,393,394,395,396,397,398,399,400,401,402,403,404,405,406,407,408,409,410,411,412,413,414,415,416,417,418,419,420,421,422,423,424,425,426,427,428,429,430,431,432,433,434,435,436,437,438,439,440,441,442,443,444,445,446,447,448,449,450,451,452,453,454,455,456,457,458,459,460,461,462,463,464,465,466,467,468,469,470,471,472,473,474,475,476,477,478,479,480,481,482,483,484,485,486,487,488,489,490,491,492,493,494,495,496,497,498,499,500,501,502,503,504,505,506,507,508,509,510,511,512,513,514,515,516,517,518,519,520,521,522,523,524,525,526,527,528,529,530,531,532,533,534,535,536,537,538,539,540,541,542,543,544,545,546,547,548,549,550,551,552,553,554,555,556,557,558,559,560,561,562,563,564,565,566,567,568,569,570,571,572,573,574,575,576,577,578,579,580,581,582,583,584,585,586,587,588,589,590,591,592,593,594,595,596,597,598,599,600,601,602,603,604,605,606,607,608,609,610,611,612,613,614,615,616,617,618,619,620,621,622,623,624,625,626,627,628,629,630,631,632,633,634,635,636,637,638,639,640,641,642,643,644,645,646,647,648,649,650,651,652,653,654,655,656,657,658,659,660,661,662,663,664,665,666,667,668,669,670,671,672,673,674,675,676,677,678,679,680,681,682,683,684,685,686,687,688,689,690,691,692,693,694,695,696,697,698,699,700,701,702,703,704,705,706,707,708,709,710,711,712,713,714,715,716,717,718,719,720,721,722,723,724,725,726,727,728,729,730,731,732,733,734,735,736,737,738,739,740,741,742,743,744,745,746,747,748,749,750,751,752,753,754,755,756,757,758,759,760,761,762,763,764,765,766,767,768,769,770,771,772,773,774,775,776,777,778,779,780,781,782,783,784,785,786,787,788,789,790,791,792,793,794,795,796,797,798,799,800,801,802,803,804,805,806,807,808,809,810,811,812,813,814,815,816,817,818,819,820,821,822,823,824,825,826,827,828,829,830,831,832,833,834,835,836,837,838,839,840,841,842,843,844,845,846,847,848,849,850,851,852,853,854,855,856,857,858,859,860,861,862,863,864,865,866,867,868,869,870,871,872,873,874,875,876,877,878,879,880,881,882,883,884,885,886,887,888,889,890,891,892,893,894,895,896,897,898,899,900,901,902,903,904,905,906,907,908,909,910,911,912,913,914,915,916,917,918,919,920,921,922,923,924,925,926,927,928,929,930,931,932,933,934,935,936,937,938,939,940,941,942,943,944,945,946,947,948,949,950,951,952,953,954,955,956,957,958,959,960,961,962,963,964,965,966,967,968,969,970,971,972,973,974,975,976,977,978,979]
};