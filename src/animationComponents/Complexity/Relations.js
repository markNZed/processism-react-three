import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function Relations({ node, config }) {
    const segmentIndexRef = useRef({}); // Keeps track of the current segment index
    const numPoints = 12;
    const [linesUpdate, setLinesUpdate] = useState(0);
    const linesRef = useRef({});
    const newLinesRef = useRef({});
    const { getNode, getRelations } = config.entityStore.getState();
    const getPropertyAllKeys = config.entityStore.getState().getPropertyAllKeys;
    const maxDepth = getPropertyAllKeys('depth').length;
    const nodeRef = node.ref;
    // Access relationRefs and make the component re-render when it changes
    //const relations = config.entityStore(state => state.relations);

    useEffect(() => {
        console.log(`Mounting Relations ${node.id}`);
    }, []);

    useFrame(() => {
        let update = false;
        // Create new lines (only if relation is new)

        const relations = getRelations();

        Object.keys(relations).forEach(fromId => {
            relations[fromId].forEach(toId => {
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
            //console.log("Total nodes initiating at least one relation", Object.keys(relations).length, linesRef);
        }

        Object.keys(linesRef.current).forEach(fromId => {
            Object.keys(linesRef.current[fromId]).forEach(toId => {
                // Remove lineRef for relations that no longer exist
                const relationFrom = relations[fromId];
                if (!relationFrom) {
                    delete linesRef.current[fromId];
                    return;
                } else if (!relationFrom.includes(toId)) {
                    delete linesRef.current[fromId][toId];
                    return;
                }
                const { ref, line } = linesRef.current[fromId][toId];
                if (ref.current) {
                    const fromNode = getNode(fromId);
                    const toNode = getNode(toId);
                    const startPoint = nodeRef.current.worldToLocal(fromNode.ref.current.getCenterWorld());
                    const endPoint = nodeRef.current.worldToLocal(toNode.ref.current.getCenterWorld());
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
