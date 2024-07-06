import React, { useRef, useEffect, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useStoreEntity from './useStoreEntity';
import * as TME from '@immugio/three-math-extensions';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

const Blob = ({ color, node, centerRef, entityNodes, getGeometryRef }) => {
    const worldVector = new THREE.Vector3();
    const blobRef = useRef()
    const blobData = useRef()
    const { getNode, propagateVisualConfigValue, getNodeProperty } = useStoreEntity.getState();
    const { chainRef, id, particlesRef: { current: particles } } = node;
    const worldToLocalFn = node.ref.current.worldToLocal;
    const particleRadius = useMemo(() => getNodeProperty('root', 'particleRadius'), []);
    const [pressStart, setPressStart] = useState(0);
    const longPressThreshold = 500; // Time in milliseconds to distinguish a long press

    // This only runs once upon mounting to build the blobData which acts as a cache for objects
    useEffect(() => {

        blobData.current = {
            positions: [],
            flattenedIndexes: [],

            // New
            positions2: [],
            circlePoints: [],
            circleSegments: [],
            utilityVector3s: Array.from(Array(5).keys()).map((e) => new THREE.Vector3()),
            utilityVector2s: Array.from(Array(5).keys()).map((e) => new THREE.Vector2()),
            utilityLines: Array.from(Array(5).keys()).map((e) => new TME.Line2D(new TME.Vec2(), new TME.Vec2())),
        }

        let blobOuterUniqueIds = [];
        let flattenedIndexes = [];
        for (let i = 0; i < particles.length; ++i) {
            const outerChain = particles[i].current.getVisualConfig().outerChain;
            if (outerChain) {
                let outer = outerChain[node.depth];
                if (outer) {
                    for (let j = Object.keys(outerChain).length - 1;j > node.depth; j--) {
                        if (!outerChain[j.toString()]) {
                            outer = false;
                            break;
                        }
                    }
                }
                if (outer) {
                    const uniqueId = particles[i].current.getVisualConfig().uniqueId;
                    blobOuterUniqueIds.push(uniqueId);
                    flattenedIndexes.push(i);
                }
            }
        }

        if (blobOuterUniqueIds.length < 3) {
            console.error("blobOuterUniqueIds less than 3!", id, blobOuterUniqueIds.length, particles.length);
            // Dealing with the case where there is only one particle
            // Which means there will be no blob, so no way to click on the blob ansds show the particle
            entityNodes[0].ref.current.setVisualConfig(p => ({ ...p, visible: true }));
            if (particles.length == 2) {
                entityNodes[1].ref.current.setVisualConfig(p => ({ ...p, visible: true }));
            }
        }

        // buildOrderedIds can return null if there are no blobOuterUniqueIds
        const orderedIds = buildOrderedIds(chainRef, blobOuterUniqueIds) || [];
        if (!orderedIds.length) console.error("orderedIds is empty!", id);
        //blobIndexes = filterMiddleIndexes(chainRef, orderedIds);
        const blobIndexes = orderedIds;

        //console.log("Blob", id, blobOuterUniqueIds, blobIndexes)

        for (let i = 0; i < blobIndexes.length; ++i) {
            blobData.current.positions.push(new THREE.Vector3());

            blobData.current.positions2.push(...Array.from(Array(points_to_geometry2_circle_segments + 2).keys()).map((e) => new THREE.Vector3()));
            blobData.current.circlePoints.push(Array.from(Array(points_to_geometry2_circle_segments).keys()).map((e) => new THREE.Vector3()));
            blobData.current.circleSegments.push(Array.from(Array(points_to_geometry2_circle_segments).keys()).map((e) => new TME.Line2D(new TME.Vec2(), new TME.Vec2())));

            const indexInOuter = blobOuterUniqueIds.indexOf(blobIndexes[i]);
            const flattenedIndex = flattenedIndexes[indexInOuter];
            blobData.current.flattenedIndexes.push(flattenedIndex);
        }

    },[]);

    useFrame(() => {

        if (!blobData.current) return;

        if (node.ref.current.getVisualConfig().visible || getGeometryRef) {

            const shouldBeVisible = node.ref.current.getVisualConfig().visible;

            const blobPoints = blobData.current.positions.map((positiion, i) => {
                const flattenedIndex = blobData.current.flattenedIndexes[i]
                const pos = particles[flattenedIndex].current.translation();
                worldVector.set(pos.x, pos.y, pos.z);
                positiion.copy(worldToLocalFn(worldVector))
                return positiion;
            });

            if (blobPoints.length) {
                //const geometry = points_to_geometry(blobPoints, blobPointsCenter, particleRadius, centerRef);
                const geometry = points_to_geometry2(blobPoints, particleRadius, blobData.current);
                blobRef.current.geometry.dispose();
                blobRef.current.geometry = geometry;
                blobRef.current.visible = shouldBeVisible;

                if (getGeometryRef) {
                    getGeometryRef.current.geometry = geometry;
                    getGeometryRef.current.visible = true;
                    getGeometryRef.current.blobRadius = getBlobRadius(blobPoints, particleRadius, centerRef);
                }
            }

        } else {
            blobRef.current.visible = false;
        }

    });

    const handleOnClick = (event) => {
        //console.log("Blob handleOnClick", event);
        if (event.shiftKey) {
            return;
        }
        if (event.button !== 0) return;  // ignore two finger tap
        
        const pressDuration = Date.now() - pressStart;

        if (pressDuration < longPressThreshold) {
            let ancestorId = node.parentId;
            for (let i = node.depth - 1; i >= 0; i--) {
                const ancestorNode = getNode(ancestorId);
                if (ancestorNode.ref.current.getVisualConfig().visible) return;
                ancestorId = ancestorNode.parentId;
            }
            event.stopPropagation();
            // If the node is about to become invisible
            if (node.ref.current.getVisualConfig().visible) {
                entityNodes.forEach(nodeEntity => {
                    nodeEntity.ref.current.setVisualConfig(p => ({ ...p, visible: true }));
                });
                node.ref.current.setVisualConfig(p => ({ ...p, visible: false }));
            } else {
                // The order of the blob rendering means everything will disappear
                // causing a "flashing" effect
                node.ref.current.setVisualConfig(p => ({ ...p, visible: true }));
                setTimeout(() => {
                    entityNodes.forEach(nodeEntity => {
                        propagateVisualConfigValue(nodeEntity.id, 'visible', false);
                    });
                }, 0); // Introduce a slight delay to avoid flashing
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
            <meshBasicMaterial color={color} wireframe={false} />
        </mesh>
    );
};

export default Blob;

const getCirclePointsForPoints = (points, radius, segments, outCirclePoints) => {
    if (segments < 3) { segments = 3; }

    let ret = outCirclePoints;
    let stepAngle = 2*Math.PI / segments;
    for (let i=0; i<points.length; ++i) {
        let p = points[i];

        /** @type {Array<THREE.Vector3>} */
        let circlePoints = ret[i];
        for (let n=0; n<segments; ++n) {
            let pt = circlePoints[n];
            let angle = stepAngle * n;

            let x = p.x + Math.cos(angle) * radius;
            let y = p.y + Math.sin(angle) * radius;
            let z = 0;
            pt.set(x, y, z);
        }
    }
}

const expandPointsFromCenter = (points, distance, center) => {
    return points.map(point => {
        const direction = new THREE.Vector3().subVectors(point, center).normalize();
        return new THREE.Vector3(
            point.x + direction.x * distance,
            point.y + direction.y * distance,
            point.z + direction.z * distance
        );
    });
        
    //if (divisions < 1) divisions = 1;
    //if (divisions === 1) {
    //    return points.map((point, i) => {
    //        const direction = new THREE.Vector3().subVectors(point, center).normalize();
    //        return new THREE.Vector3(
    //            point.x + direction.x * distance,
    //            point.y + direction.y * distance,
    //            point.z + direction.z * distance
    //        );
    //    });
    //}
    //else {
    //    let ret = [];
    //
    //    let stepCount = Math.pow(2, (divisions - 1));
    //    let stepAngle = -Math.PI / stepCount;
    //    for (let n=0; n<points.length; ++n)
    //    {
    //        let point = points[n];
    //        let pointCenter = pointsCenter[n];
    //        const direction = new THREE.Vector3().subVectors(point, pointCenter).normalize();
    //        let angleFromOrigin = Math.atan2(direction.y, direction.x);
    //        let startAngle = angleFromOrigin + 0.5*Math.PI;
    //        for (let i=0; i<=stepCount; ++i)
    //        {
    //            let angle = startAngle + stepAngle * i;
    //            let newDir = new THREE.Vector2(Math.cos(angle), Math.sin(angle));
    //            let newDir2 = newDir;
    //            let p = new THREE.Vector3(point.x + Math.cos(angle) * distance, point.y + Math.sin(angle) * distance, 0.0);
    //            ret.push(p);
    //        }
    //    }
    //
    //    return ret;
    //}
}

// Outside of component to avoid recreation on render
const getBlobRadius = (points, particleRadius, centerRef) => {
    const center = centerRef.current;
    const expandedPoints = expandPointsFromCenter(points, particleRadius, center);
    const dist2 = expandedPoints.reduce((a, b) => Math.max(a, b.lengthSq()), 0);
    return Math.sqrt(dist2);
}

// isLeftOfLine(): tests if a point is Left|On|Right of an infinite line.
//    Input:  three points a, b, and p
//    Return: >0 for p left of the line through a and b
//            =0 for p on the line
//            <0 for p right of the line
const isLeftOfLine = (a, b, p) => 
    ( (b.x - a.x)*(p.y - a.y)
    - (p.x - a.x)*(b.y - a.y))
    
// getPolygonWindingNumber(): winding number test for a point in a polygon
//      Input:   p = a point,
//               polygonPoints[] = vertex points of a polygon V[n+1] with V[n]=V[0]
//      Return:  wn = the winding number (=0 only when p is outside)
const getPolygonWindingNumber = (p, polygonPoints) => {
    const pp = polygonPoints;
    let wn = 0; // the  winding number counter
    
    // loop through all edges of the polygon
    for (let i = 0, n = pp.length-1; i < n; i++) {  // edge from pp[i] to  pp[i+1]
      if (pp[i][1] <= p[1]) {                       // start y <= p.y
        if (pp[i + 1][1] > p[1])                    // an upward crossing
          if (isLeft(pp[i], pp[i + 1], p) > 0)       // p left of  edge
            ++wn;                                  // valid up intersection
      }
      else {                                       // start y > p.y (no test needed)
        if (pp[i + 1][1] <= p[1])                   // a downward crossing
          if (isLeft(pp[i], pp[i + 1], p) < 0)       // p right of  edge
            --wn;                                  // valid down intersection
      }
    }
    return wn;
}

const isInsidePolygon = (point, vs) => {

    var x = point.x,
        y = point.z;

    var inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        var xi = vs[i].x,
            yi = vs[i].z;
        var xj = vs[j].x,
            yj = vs[j].z;

        var intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }

    return inside;
}

/**
 * Phong https://forum.unity.com/threads/closest-point-on-a-line.121567/
 * @param {THREE.Vector2} origin 
 * @param {THREE.Vector2} direction 
 * @param {THREE.Vector2} point 
 * @returns 
 */
const getDistPointToLine = (origin, direction, point) => {
    _direction.set(direction.x, direction.y, 0);
    _point2origin.set(origin.x, origin.y, 0).sub(point);
    _point2closestPointOnLine.copy(_point2origin).sub(_direction.multiplyScalar(_point2origin.dot(_direction)));
    return _point2closestPointOnLine.clone();

    //let point2origin = origin.clone().sub(point);
    //let point2closestPointOnLine = point2origin.clone().sub(direction.multiplyScalar(point2origin.dot(direction)));
    //return point2closestPointOnLine.length();
}
const _point2origin = new THREE.Vector3();
const _direction = new THREE.Vector3();
const _point2closestPointOnLine = new THREE.Vector3();

const setLine2D = (line, x1, y1, x2, y2) => {
    line.start.set(x1, y1);
    line.end.set(x2, y2);
}

const points_to_geometry2_circle_segments = 16;
const points_to_geometry2 = (points, particleRadius, blobData) => {
    const { circlePoints, circleSegments, utilityVector2s, utilityVector3s, utilityLines, positions2 } = blobData;
    let pointCount = 0;

    getCirclePointsForPoints(points, particleRadius, points_to_geometry2_circle_segments, circlePoints);
    for (let i=0; i<circlePoints.length; ++i) {
        let cp = circlePoints[i];
        for (let n=0; n<cp.length; ++n) {
            let p = cp[n];
            let np = n === cp.length - 1 ? cp[0] : cp[n + 1];
            setLine2D(circleSegments[i][n], p.x, p.y, np.x, np.y);
        }
    }

    const finalPoints = circlePoints.map((cp, i) => {
        let p = points[i];
        let lp = points[i === 0 ? points.length - 1 : i - 1];
        let np = points[i === points.length - 1 ? 0 : i + 1];
        
        let lineToLast = utilityLines[0];
        let lineToNext = utilityLines[1];
        setLine2D(lineToLast, p.x, p.y, lp.x, lp.y);
        setLine2D(lineToNext, p.x, p.y, np.x, np.y);

        let dir = utilityVector2s[0]
        let perpendicularEnd = utilityVector2s[1];

        /** @type {Array<TME.Vec2>} */
        let firstIntersections = circleSegments[i].reduce((a, cs) => {
            let intersect = lineToLast.intersect(cs, true);
            if (intersect != null) { a.push(intersect); }
            return a;
        }, []);
        let firstPoint;
        if (firstIntersections.length === 0) {
            // Shouldn't happen but does - probably the intersection is on one of the circle segment end points, so just find the closest one
            let start = lineToLast.start;
            dir.copy(lineToLast.end).sub(start);
            perpendicularEnd.copy(dir.y, -dir.x).add(start); // 90 degrees clockwise
            
            firstPoint = cp.filter((cpp) => isLeftOfLine(start, perpendicularEnd, cpp) >= 0).map((cpp) => getDistPointToLine(start, dir, cpp)).sort((a, b) => a - b)[0];
        }
        else { firstPoint = firstIntersections.reduce((a, b) => a.add(b)).divideScalar(firstIntersections.length); }

        /** @type {Array<TME.Vec2>} */
        let lastIntersections = circleSegments[i].reduce((a, cs) => {
            let intersect = lineToNext.intersect(cs, true);
            if (intersect != null) { a.push(intersect); }
            return a;
        }, []);
        let lastPoint;
        if (lastIntersections.length === 0) {
            // Shouldn't happen but does - probably the intersection is on one of the circle segment end points, so just find the closest one
            let start = lineToNext.start;
            dir.copy(lineToNext.end).sub(start);
            perpendicularEnd.copy(dir.y, -dir.x).add(start); // 90 degrees clockwise

            lastPoint = cp.filter((cpp) => isLeftOfLine(start, perpendicularEnd, cpp) >= 0).map((cpp) => getDistPointToLine(start, dir, cpp)).sort((a, b) => a - b)[0];
        }
        else { lastPoint = lastIntersections.reduce((a, b) => a.add(b)).divideScalar(lastIntersections.length); }

        let startAngle = Math.atan2(firstPoint.y - p.y, firstPoint.x - p.x);
        let endAngle = Math.atan2(lastPoint.y - p.y, lastPoint.x - p.x);
        let angleDif = endAngle - startAngle;
        let clockwiseAngleRange = angleDif < 0 ? -angleDif : 2*Math.PI - angleDif;

        let ret = [ firstPoint ];
        ret.push(...cp.map((ccp) => {
            let angle = Math.atan2(ccp.y - p.y, ccp.x - p.x);
            angleDif = angle - startAngle;
            let clockwiseAngle = angleDif < 0 ? -angleDif : 2*Math.PI - angleDif;
            return { point: ccp, angle: clockwiseAngle, keep: clockwiseAngle > 0 && clockwiseAngle < clockwiseAngleRange };
        }).filter((e) => e.keep).sort((a, b) => a.angle - b.angle).map((e) => e.point));
        ret.push(lastPoint);

        return ret;
    }).reduce((a, b) => { a.push(...b); return a; }, []);

    // Line segment geometry
    let shape = new THREE.Shape();
    shape.moveTo(finalPoints[0].x, finalPoints[0].y);
    for (let i=1; i<finalPoints.length; ++i) {
        let p = finalPoints[i];
        shape.lineTo(p.x, p.y);
    }
    shape.closePath();
    let shapeGeometry = new THREE.ShapeGeometry(shape);

    // Catmull geometry
    //const finalPoints3 = finalPoints.map((p) => new THREE.Vector3(p.x, p.y, 0));
    //const curve = new THREE.CatmullRomCurve3(finalPoints3, true);
    //const curvePoints = curve.getPoints(finalPoints.length);
    //const shape = new THREE.Shape(curvePoints);
    //const shapeGeometry = new THREE.ShapeGeometry(shape);


    let nanCount = finalPoints.reduce((a, b) => a + (Number.isNaN(b.x) || Number.isNaN(b.y) || Number.isNaN(b.z)) ? 1 : 0, 0);
    if (nanCount != 0) console.log(`Nan Count ${nanCount}`);
    //else console.log('No NaNs!');
    return shapeGeometry;

    //let geometries = finalPoints.map((p) => { const g = new THREE.CircleGeometry(particleRadius*0.1, 8); g.translate(p.x, p.y, 0.0); return g; });
    //geometries.push(...points.map((p) => { const g = new THREE.CircleGeometry(particleRadius, 8); g.translate(p.x, p.y, 0.0); return g; }));
    //geometries.push(shapeGeometry);
    //return BufferGeometryUtils.mergeGeometries(geometries, false);


    //return new THREE.ShapeGeometry(new THREE.Shape(new THREE.CatmullRomCurve3(finalPoints, true).getPoints(finalPoints.length)));
    
}
 
const points_to_geometry = (points, pointsCenter, particleRadius = 0, centerRef) => {

    // Ensure centerRef is a Vector3
    const center = centerRef.current;

    // Offset the points before creating the curve
    const expandedPoints = expandPointsFromCenter(points, particleRadius, center);

    const curve = new THREE.CatmullRomCurve3(expandedPoints, true);
    const oneToOnePoints = curve.getPoints(expandedPoints.length);
    const shape = new THREE.Shape(oneToOnePoints);
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

function buildOrderedIds(chainRef, blobOuterUniqueIds, uniqueId = null, visited = new Set()) {
    let initial = false;
    // Initialize uniqueId with the first element of blobOuterUniqueIds if null
    if (uniqueId === null) {
        uniqueId = blobOuterUniqueIds[0];
        initial = true;
    }

    // Guard clause to prevent infinite loops
    if (visited.has(uniqueId)) return null;
    
    // Guard clause to check if uniqueId is in blobOuterUniqueIds
    if (!blobOuterUniqueIds.includes(uniqueId)) return null;

    // Do not add the initial index so we get a full loop
    if (!initial) visited.add(uniqueId);
    
    const result = [uniqueId];
    const linkedIndexes = chainRef.current[uniqueId] || [];
    
    // Search for the longest loop
    let foundChain = [];
    for (let linkedIndex of linkedIndexes) {
        const clonedVisited = new Set([...visited]);
        const recursiveResult = buildOrderedIds(chainRef, blobOuterUniqueIds, linkedIndex, clonedVisited);
        if (recursiveResult) {
            if (recursiveResult.length > foundChain.length) foundChain = recursiveResult;
        }
        visited.add(linkedIndex);
    }
    linkedIndexes.forEach((id) => {visited.add(id)});
    foundChain.forEach((id) => {visited.add(id)});
    result.push(...foundChain);
    
    return result;
}