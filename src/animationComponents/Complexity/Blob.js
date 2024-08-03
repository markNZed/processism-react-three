import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useStoreEntity from './useStoreEntity';

const Blob = ({ color, node, entityNodes }) => {
    const worldVector = new THREE.Vector3();
    const blobRef = useRef()
    const blobData = useRef()
    const { getNode, propagateVisualConfigValue, getParticlesHash, getAllParticleRefs, updateNode } = useStoreEntity.getState();
    const { chainRef, id} = node;
    const worldToLocalFn = node.ref.current.worldToLocal;
    const [pressStart, setPressStart] = useState(0);
    const longPressThreshold = 500; // Time in milliseconds to distinguish a long press
    const particlesRef = useRef();
    const particlesHashRef = useRef();

    function buildBlobData(reason) {

        console.log("buildBlobData", id, reason);
        blobData.current = {
            positions: [],
            flattenedIndexes: [],
            radii: [],
        };

        let blobOuterUniqueIds = [];
        let flattenedIndexes = [];
        let radii = [];
        const entityNodeIds = entityNodes.map(n => n.id);
        particlesRef.current = getAllParticleRefs(id);
        particlesHashRef.current = getParticlesHash(id);
        const particles = particlesRef.current;
        for (let i = 0; i < particles.length; ++i) {
            if (!particles[i].current) {
                console.warn(`particles[i] ${i}, was empty`);
                continue;
            }
            const uniqueId = particles[i].current.getVisualConfig().uniqueId;
            let outer = particles[i].current.getVisualConfig().outer;
            if (outer) {
                let outerDepth = outer[node.depth];
                // if this is a child then it is outer at this level
                if (entityNodeIds.includes(uniqueId)) {
                    outerDepth = true;
                }
                if (outerDepth) {
                    for (let j = Object.keys(outer).length - 1;j > node.depth; j--) {
                        if (!outer[j.toString()]) {
                            outerDepth = false;
                            break;
                        }
                    }
                }
                
                if (outerDepth) { 
                    blobOuterUniqueIds.push(uniqueId);
                    flattenedIndexes.push(i);
                    radii.push(particles[i].current.getVisualConfig().origRadius);
                    //console.log("buildBlobData Outer", uniqueId)
                } else {
                    //console.log("buildBlobData Inner", uniqueId)
                }
            }
        }

        if (blobOuterUniqueIds.length < 3) {
            console.error("blobOuterUniqueIds < 3", id, blobOuterUniqueIds.length, particles.length);
            // Dealing with the case where there is only one or two particles
            // Which means there will be no blob, so no way to click on the blob and show the particle
            // This no longer works as there can be an intermediate state where blobOuterUniqueIds.length is < 3 but the
            // number of entities wil lbe more thean three.
            if (entityNodes.length < 3) {
                entityNodes.forEach(e => e.ref.current.setVisualConfig(p => ({ ...p, visible: false })));
            }
        }

        // buildOrderedIds can return null if there are no blobOuterUniqueIds
        const orderedIds = buildOrderedIds(id, chainRef, blobOuterUniqueIds) || [];
        if (!orderedIds.length) console.error("orderedIds is empty!", id, chainRef.current, blobOuterUniqueIds);
        const blobIndexes = orderedIds;

        //console.log("buildBlobData", id, "blobData", blobData, "chianRef", chainRef.current, "particles",particles, "blobOuterUniqueIds",blobOuterUniqueIds, "blobIndexes", blobIndexes)

        for (let i = 0; i < blobIndexes.length; ++i) {
            blobData.current.positions.push(new THREE.Vector3());
            const indexInOuter = blobOuterUniqueIds.indexOf(blobIndexes[i]);
            const flattenedIndex = flattenedIndexes[indexInOuter];
            blobData.current.flattenedIndexes.push(flattenedIndex);
            blobData.current.radii.push(radii[indexInOuter]);
        }
    
    }

    useFrame(() => {

        if (node.ref.current.getVisualConfig().visible) {

            const hash = getParticlesHash(id);
            const prevHash = particlesHashRef.current;

            if (hash === undefined || hash !== prevHash) {
                if (hash !== undefined) {
                    buildBlobData(`hash mismatch ${id} ${JSON.stringify(hash)} != ${JSON.stringify(prevHash)}`);
                }
            }
    
            if (!blobData.current) {
                console.log("!blobData.current", id);
                buildBlobData("empty");
                return;
            }

            const particles = particlesRef.current;

            const blobPoints = blobData.current.positions.map((position, i) => {
                const flattenedIndex = blobData.current.flattenedIndexes[i]
                const pos = particles[flattenedIndex].current.translation();
                worldVector.set(pos.x, pos.y, pos.z);
                position.copy(worldToLocalFn(worldVector))
                return position;
            });

            if (blobPoints.length) {
                const geometry = points_to_geometry(blobPoints, blobData.current.radii);
                blobRef.current.geometry.dispose();
                blobRef.current.geometry = geometry;
                blobRef.current.visible = true;
            }

            //if (id == "root") console.log("blobData visible", blobPoints);


        } else {
            //if (id == "root") console.log("blobData blobRef.current.visible = false;", id);
            blobRef.current.visible = false;
        }

    });

    const handleOnClick = (event) => {
        //console.log("Blob handleOnClick", id, event);
        if (event.shiftKey) {
            return;
        }
        if (event.button !== 0) return;  // ignore two finger tap
        
        const pressDuration = Date.now() - pressStart;

        if (pressDuration < longPressThreshold) {
            let ancestorId = node.parentId;
            for (let i = node.depth - 1; i >= 0; i--) {
                const ancestorNode = getNode(ancestorId);
                if (ancestorNode.ref.current.getVisualConfig().visible) {
                    //console.log(`Blob handleOnClick return because ${ancestorId} visible`, id);
                    return;
                }
                ancestorId = ancestorNode.parentId;
            }
            // If the node is about to become invisible
            if (node.ref.current.getVisualConfig().visible) {
                //console.log("Blob handleOnClick visible", id);
                event.stopPropagation();
                entityNodes.forEach(nodeEntity => {
                    console.log("Blob handleOnClick set visible", nodeEntity.id);
                    nodeEntity.ref.current.setVisualConfig(p => ({ ...p, visible: true }));
                    updateNode(nodeEntity.id, {visible: true});
                });
                node.ref.current.setVisualConfig(p => ({ ...p, visible: false }));
                updateNode(id, {visible: true});
            // If the number of overlapping blobs (intersections) is equal to the depth of this blob
            // then we will show this blob
            } else if (event.intersections.length === (node.depth + 1)) { 
                //console.log("Blob handleOnClick event.intersections.length is node.depth + 1", id, event.intersections.length);
                event.stopPropagation();
                // The order of the blob rendering means everything will disappear
                // causing a "flashing" effect
                node.ref.current.setVisualConfig(p => ({ ...p, visible: true }));
                console.log("Blob handleOnClick set visible", node.id);
                updateNode(id, {visible: true});
                setTimeout(() => {
                    entityNodes.forEach(nodeEntity => {
                        propagateVisualConfigValue(nodeEntity.id, 'visible', false);
                    });
                }, 0); // Introduce a slight delay to avoid flashing
            } else {
                //console.log("Blob handleOnClick event.intersections.length", id, event.intersections.length);
            }
        }
    };

    const handleOnContextMenu = handleOnContextMenuFn(getNode, propagateVisualConfigValue);

    const handlePointerDown = (event) => {
        //console.log("Blob handlePointerDown", event);
        if (event.button !== 0) return; // ignore two finger tap
        setPressStart(Date.now());
    };
    
    return (
        <mesh ref={blobRef}
            onPointerDown={handlePointerDown}
            onPointerUp={handleOnClick}
            onContextMenu={(event) => handleOnContextMenu(event)}>
            <meshBasicMaterial color={color} />
        </mesh>
    );
};

export default Blob;

// Outside of component to avoid recreation on render

function calculateCenter(points) {
    let sum = new THREE.Vector3(0, 0, 0);
    points.forEach(point => {
        sum.add(point);
    });
    return sum.divideScalar(points.length);
}
 
const points_to_geometry = (points, radii) => {

    // Function to calculate the normals that point outward
    function calculateOutwardNormals(points, centroid) {
        const normals = [];
        for (let i = 0; i < points.length; i++) {
            const prevPoint = points[i === 0 ? points.length - 1 : i - 1];
            const currPoint = points[i];
            const nextPoint = points[(i + 1) % points.length];

            // Midpoints for more accurate normal calculation
            const midPrev = new THREE.Vector3().addVectors(prevPoint, currPoint).multiplyScalar(0.5);
            const midNext = new THREE.Vector3().addVectors(currPoint, nextPoint).multiplyScalar(0.5);

            // Vector from midPrev to midNext
            const edgeVector = new THREE.Vector3().subVectors(midNext, midPrev).normalize();

            // Normal is perpendicular to edgeVector
            let normal = new THREE.Vector3(-edgeVector.y, edgeVector.x, 0); // Rotate 90 degrees

            // Ensure the direction of the normal is outward
            const toCentroid = new THREE.Vector3().subVectors(centroid, currPoint).normalize();
            if (normal.dot(toCentroid) > 0) {
                normal.negate(); // Reverse the normal if it's pointing inward
            }

            normals.push(normal);
        }
        return normals;
    }

    // Function to expand points using normals
    function expandPoints(points, normals, radii) {
        return points.map((point, index) => {
            const amount = radii[index];
            //console.log("Adding amount", amount);
            return point.clone().addScaledVector(normals[index], amount);
        });
    }

    /*
    // We calculate the center rather than using the entity center (which is more like a center of gravity than a geometric center)
    const center = calculateCenter(points);

    // Calculate normals
    const normals = calculateOutwardNormals(points, center);

    // Expand the points
    const expandedPoints = expandPoints(points, normals, radii);
    */

    // Offset the points before creating the curve
    const expandedPoints = points;

    const curve = new THREE.CatmullRomCurve3(expandedPoints, true);
    const expandedPointsMultiplier = expandedPoints.length < 100 ? 5 : 1;
    const curvePoints = curve.getPoints(expandedPoints.length * expandedPointsMultiplier);
    //const curvePoints = expandedPoints;
    const shape = new THREE.Shape(curvePoints);
    const shape_geometry = new THREE.ShapeGeometry(shape);

    return shape_geometry;
};

function handleOnContextMenuFn(getNode, propagateVisualConfigValue) {
    return (event) => {
        //console.log("Blob handleOnContextMenuFn", event);
        event.stopPropagation();
        const rootNode = getNode("root");
        rootNode.ref.current.setVisualConfig(p => ({ ...p, visible: true }));
        setTimeout(() => {
            rootNode.childrenIds.forEach(childId => {
                propagateVisualConfigValue(childId, 'visible', false);
            });
        }, 0); // Introduce a slight delay to avoid flashing
    };
}

/**
 * Recursively builds the ordered list of indexes.
 * @param {Object} chainRef - Reference object containing the current state of chains.
 * @param {Array} blobOuterUniqueIds - Array of unique IDs representing the outer blob.
 * @param {string|null} [uniqueId=null] - The current unique ID to process.
 * @param {Set} [visited=new Set()] - A set of visited unique IDs to prevent infinite loops.
 * @returns {Array|null} Ordered list of indexes or null if a chainRef is dangling.
 */

// We use a chain of aprticles and it is possible that this excludes "points" e.g. three points can be on the outer and
// all have links, so the outer chain can "exclude" one of the points. Ideally we would not exclude points like this,
// It is visible in a [3,3,3] entity configuration

// visited should be specific to a "search" of the chain

function buildOrderedIds(id, chainRef, blobOuterUniqueIds, uniqueId = null, visited = new Set(), firstId = null, path = []) {

    //console.log("buildOrderedIds", id, path, uniqueId);
    // Guard clause to prevent infinite loops
    if (visited.has(uniqueId)) {
        //console.log("buildOrderedIds visited", id, uniqueId);
        return null;
    }

    // Initialize uniqueId with the first element of blobOuterUniqueIds if null
    if (uniqueId === null) {
        uniqueId = blobOuterUniqueIds[0];
        firstId = uniqueId;
        //console.log("buildOrderedIds firstId", id, firstId, JSON.stringify(chainRef.current), blobOuterUniqueIds);
    } else {
        visited.add(uniqueId);
        if (uniqueId === firstId) return [...path, uniqueId];
    }

    //console.log("buildOrderedIds input", id, uniqueId); 
    
    // Guard clause to check if uniqueId is in blobOuterUniqueIds
    if (!blobOuterUniqueIds.includes(uniqueId)) {
        //console.log("buildOrderedIds not in outer", id, uniqueId); 
        return null;
    }

    const localPath = [...path, uniqueId];
    
    const linkedIndexes = chainRef.current[uniqueId] || [];

    // Depth first search

    // Search for the longest loop
    let foundChain = [];
    for (let linkedIndex of linkedIndexes) {
        // Close so we can mark as visited without interfering in parallel branches of th esearch
        const clonedVisited = new Set([...visited]);
        const recursiveResult = buildOrderedIds(id, chainRef, blobOuterUniqueIds, linkedIndex, clonedVisited, firstId, localPath);
        if (recursiveResult) {
            // We only want the longest chain
            if (recursiveResult.length > foundChain.length) {
                foundChain = [uniqueId, ...recursiveResult];
            }
        } else {
            // If there was no path to a loop then we can consider this a dead end
            visited.add(linkedIndex);
        }
    }
    if (!foundChain.length) {
        return null;
    }

    return foundChain;
}