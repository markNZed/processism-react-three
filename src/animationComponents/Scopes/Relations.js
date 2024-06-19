import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useStoreRelation from './useStoreRelation';
import useStoreEntity from './useStoreEntity';

function LineWidthChecker() {
    const { gl } = useThree();
  
    useEffect(() => {
      if (gl && gl.getContext) {
        // Three.js WebGLRenderer exposes the rendering context via `getContext()`
        const context = gl.getContext();
        // Check if the context supports querying parameters directly
        if (context && context.getParameter) {
          const lineWidthRange = context.getParameter(context.ALIASED_LINE_WIDTH_RANGE);
          console.log('Supported line width range:', lineWidthRange);
        } else {
          console.log('WebGL context does not support getParameter');
        }
      }
    }, [gl]); // Depend on gl to ensure it's available
  
    return null; // This component does not render anything
}

function Relations({internalRef}) {
    const segmentIndexRef = useRef({}); // Keeps track of the current segment index
    const numPoints = 12;
    const [linesUpdate, setLinesUpdate] = useState(0);
    const linesRef = useRef({});
    const newLinesRef = useRef({});
    const getNode = useStoreEntity.getState().getNode;
    const getPropertyAllKeys = useStoreEntity.getState().getPropertyAllKeys;
    const maxDepth = getPropertyAllKeys('depth').length;
    const getAllRelations = useStoreRelation.getState().getAllRelations;

    useFrame(() => {
        let update = false;
        // Create new lines (only if relation is new)
        const allRelations = getAllRelations();

        Object.keys(allRelations).forEach(fromId => {
            Object.keys(allRelations[fromId]).forEach(toId => {
                if (linesRef.current[fromId] && linesRef.current[fromId][toId]) return;
                const geometry = new THREE.BufferGeometry();
                const positions = new Float32Array(numPoints * 3);
                geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
                const fromNode = getNode(fromId)
                const lineWidth = (maxDepth - fromNode.depth) + 1;
                const material = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: lineWidth * 1.0 });
                const line = new THREE.Line(geometry, material);
                if (!linesRef.current[fromId]) linesRef.current[fromId] = {};
                linesRef.current[fromId][toId] = { ref: React.createRef(), line };
                newLinesRef.current[`${fromId}-${toId}`] = true;
                update = true;
            });
        });

        if (update) {
            setLinesUpdate(prev => prev + 1);
            if (Node.id == "root") console.log("Total relation count", Object.keys(allRelations).length);
        }

        Object.keys(linesRef.current).forEach(fromId => {
            Object.keys(linesRef.current[fromId]).forEach(toId => {
                // Remove lineRef for relations that no longer exist
                const relationFrom = allRelations[fromId];
                const relationFromTo = allRelations[fromId][toId];
                if (!relationFrom) {
                    delete linesRef.current[fromId];
                    return;
                } else if (!relationFromTo) {
                    delete linesRef.current[fromId][toId];
                    return;
                }
                const { ref, line } = linesRef.current[fromId][toId];
                if (ref.current) {
                    const fromNode = getNode(fromId);
                    const toNode = getNode(toId);
                    const startPoint = internalRef.current.worldToLocal(fromNode.ref.current.getCenter());
                    const endPoint = internalRef.current.worldToLocal(toNode.ref.current.getCenter());
                    const start = new THREE.Vector3(startPoint.x, startPoint.y, startPoint.z);
                    const end = new THREE.Vector3(endPoint.x, endPoint.y, endPoint.z);
                    const distance = start.distanceTo(end);
                    const curveAmount = distance * 0.5;
                    const mid = new THREE.Vector3(
                        (start.x + end.x) / 2 + curveAmount * 0.2,
                        (start.y + end.y) / 2 + curveAmount * 0.2,
                        (start.z + end.z) / 2 + curveAmount,
                    );

                    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
                    const points = curve.getPoints(numPoints - 1); // This return one more point than numPoints - number of segments ?
                    const positions = line.geometry.attributes.position.array;

                    if (!segmentIndexRef.current[`${fromId}-${toId}`]) {
                        segmentIndexRef.current[`${fromId}-${toId}`] = 1;
                    }

                    if (newLinesRef.current[`${fromId}-${toId}`]) {
                        if (segmentIndexRef.current[`${fromId}-${toId}`] == numPoints) {
                            delete newLinesRef.current[`${fromId}-${toId}`];
                        }
                    } else {
                        segmentIndexRef.current[`${fromId}-${toId}`] = numPoints;
                    }

                    // Determine the number of segments to reveal
                    const segmentCount = Math.min(numPoints, segmentIndexRef.current[`${fromId}-${toId}`]);

                    // segmentCount is initialized to 1 so we get a first segment
                    for (let j = 0; j < segmentCount; j++) {
                        positions[j * 3] = points[j].x;
                        positions[j * 3 + 1] = points[j].y;
                        positions[j * 3 + 2] = points[j].z;
                    }

                    if (segmentCount < numPoints) {
                        // Set remaining positions to the last revealed point
                        const lastVisiblePoint = points[segmentCount - 1];
                        for (let j = segmentCount; j < numPoints; j++) {
                            positions[j * 3] = lastVisiblePoint.x;
                            positions[j * 3 + 1] = lastVisiblePoint.y;
                            positions[j * 3 + 2] = lastVisiblePoint.z;
                        }
                    }

                    line.geometry.attributes.position.needsUpdate = true;

                    // Increment the segment index for the next frame
                    segmentIndexRef.current[`${fromId}-${toId}`] = Math.min(segmentIndexRef.current[`${fromId}-${toId}`] + 1, numPoints);
                }
            });
        });
    });

    return (
        <>
            {linesRef.current && (
                <group>
                    {Object.keys(linesRef.current).map(fromId =>
                        Object.keys(linesRef.current[fromId]).map((toId) => {
                            const { ref, line } = linesRef.current[fromId][toId];
                            return (
                                <primitive key={`${linesUpdate}-${fromId}-${toId}`} object={line} ref={ref} />
                            );
                        })
                    )}
                </group>
            )}
            {/*<LineWidthChecker />*/}
        </>
    );
}

export default Relations;
