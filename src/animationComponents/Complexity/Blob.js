import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Blob = ({ color, node, entityNodes, config }) => {
    const worldVector = new THREE.Vector3();
    const blobRef = useRef()
    const blobData = useRef()
    const { getNode, propagateVisualConfigValue, getParticlesHash, getAllParticleRefs, updateNode } = config.entityStore.getState();
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
            uniqueIds: [],
            refs: [],
        };

        let blobOuterUniqueIds = [];
        let mapIdToIndex = {};
        let radii = [];
        let refs = [];
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
                let outerDepth = true;//outer[node.depth];
                // if this is a child then it is outer at this level
                //console.log("outerDepth", id, outerDepth, outer);
                if (entityNodeIds.includes(uniqueId)) {
                    //outerDepth = true;
                    //console.log("outerDepth entityNodeIds.includes", id, outerDepth);
                }
                if (outerDepth) {
                    for (let j = Object.keys(outer).length - 1;j > node.depth; j--) {
                        if (!outer[j.toString()]) {
                            //console.log("outer[j] was empty", id, j);
                            outerDepth = false;
                            break;
                        }
                    }
                }
                
                if (outerDepth) { 
                    blobOuterUniqueIds.push(uniqueId);
                    mapIdToIndex[uniqueId] = i;
                    radii.push(particles[i].current.getVisualConfig().origRadius);
                    refs.push(particles[i]);
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

        // Make sure the first id has the most joints 
        let maxJoints = 0;
        let firstId;
        blobOuterUniqueIds.forEach(id => {
            if (!chainRef.current[id]) return;
            const linkJoints = chainRef.current[id].length;
            if (linkJoints > maxJoints) {
                maxJoints = linkJoints;
                firstId = id;
            }
        });
        // Move firstId to the front
        blobOuterUniqueIds = blobOuterUniqueIds.filter(id => id !== firstId);
        blobOuterUniqueIds.unshift(firstId);

        // buildOrderedIds can return null if there are no blobOuterUniqueIds
        const blobIndexes = buildOrderedIds(id, chainRef, blobOuterUniqueIds) || [];
        if (!blobIndexes.length) console.error("blobIndexes is empty!", id, chainRef.current, blobOuterUniqueIds);

        console.log("buildBlobData", id, "blobData", blobData, "chianRef", chainRef.current, "particles",particles, "blobOuterUniqueIds",blobOuterUniqueIds, "blobIndexes", blobIndexes)

        for (let i = 0; i < blobIndexes.length; ++i) {
            blobData.current.positions.push(new THREE.Vector3());
            const flattenedIndex = mapIdToIndex[blobIndexes[i]];
            blobData.current.flattenedIndexes.push(flattenedIndex);
            blobData.current.radii.push(radii[flattenedIndex]);
            blobData.current.uniqueIds.push(blobIndexes[i]);
            blobData.current.refs.push(refs[flattenedIndex]);
        }
    
    }

    useFrame(() => {

        const visualConfig = node.ref.current.getVisualConfig();

        if (visualConfig.visible) {

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

            // Could make the boundary particles visible
            // Only once per blob
            blobData.current.refs.forEach(ref => {
                // compoundEntity will not have Particle ref
                if (ref) {
                    ref.current.setVisualConfig(p => ({ ...p, visible: true, color: visualConfig.color}));
                }
            })

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
 
const points_to_geometry = (points, radii) => {

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
        if (uniqueId === firstId) {
            //console.log("buildOrderedIds found loop", id, uniqueId, visited, path);
            return path;
        }
    }

    //console.log("buildOrderedIds input", id, uniqueId); 
    
    // Guard clause to check if uniqueId is in blobOuterUniqueIds
    if (!blobOuterUniqueIds.includes(uniqueId)) {
        //console.log("buildOrderedIds uniqueId not in blobOuterUniqueIds", id, uniqueId); 
        return null;
    }

    const localPath = [...path, uniqueId];
    
    const linkedIndexes = chainRef.current[uniqueId] || [];

    // Depth first search

    // Search for the longest loop
    let foundChain = [];
    for (let linkedIndex of linkedIndexes) {
        // Clone so we can mark as visited without interfering in parallel branches of the search
        const clonedVisited = new Set(visited);
        const recursiveResult = buildOrderedIds(id, chainRef, blobOuterUniqueIds, linkedIndex, clonedVisited, firstId, localPath);
        if (recursiveResult) {
            // We only want the longest chain
            if (recursiveResult.length > foundChain.length) {
                foundChain = recursiveResult;
            }
        } else {
            // If there was no path to a loop then this is a dead end
            visited.add(linkedIndex);
        }
    }
    if (!foundChain.length) {
        return null;
    }

    //console.log("buildOrderedIds foundChain", id, foundChain); 

    return foundChain;
}