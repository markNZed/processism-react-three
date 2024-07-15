import * as THREE from 'three';

//const queue = [];
var currentFrame = { frameId: -1, queue: [] };
var nextFrame = { frameId: -1, queue: [] };

onmessage = (e) => {
    const data = e.data;
    const { id, frameId } = data;

    if (currentFrame.queue.length === 0) {
        if (frameId > currentFrame.frameId) { currentFrame.frameId = frameId; }

        if (frameId === currentFrame.frameId) {
            currentFrame.queue.push(data);
            dispatch();
        }
    }
    else {
        if (frameId === currentFrame.frameId) {
            currentFrame.queue.push(data);
            dispatch();
        }
        else {
            if (frameId > currentFrame.frameId) {
                if (frameId > nextFrame.frameId) { nextFrame.frameId = frameId; nextFrame.queue = []; }

                if (frameId === nextFrame.frameId) {
                    nextFrame.queue.push(data);
                    dispatch();
                }
            }
        }
    }

    //for (let i=0; i<queue.length; ++i) {
    //    if (queue[i].id === id) { 
    //        queue[i] = data; 
    //        dispatch(); 
    //        return; 
    //    }
    //}
    //queue.push(data);
    //dispatch();
}

function delay(ms) {
    return new Promise((resolve, reject) => {
        setTimeout(() => resolve(undefined), ms);
    });
}

var isDispatching = false;
async function dispatch() {
    if (isDispatching) return;
    
    if (currentFrame.queue.length === 0 && nextFrame.queue.length !== 0) {
        let temp = currentFrame;
        currentFrame = nextFrame;
        nextFrame = currentFrame;
    }
    let queue = currentFrame.queue;
    if (queue.length === 0) return;

    try {
        isDispatching = true;

        while (queue.length !== 0) {
            let data = queue.shift();
            const { id, frameId, points, particleRadius } = data;

            const finalPoints = points_to_geometry(points.map((p) => new THREE.Vector3(p.x, p.y, p.z)), particleRadius);
            //postMessage({ id, finalPoints });

            // Line segment geometry
            let shape = new THREE.Shape();
            shape.moveTo(finalPoints[0].x, finalPoints[0].y);
            for (let i=1; i<finalPoints.length; ++i) {
                let p = finalPoints[i];
                shape.lineTo(p.x, p.y);
            }
            shape.closePath();
            const geometry = new THREE.ShapeGeometry(shape);

            const position = geometry.getAttribute('position').array.buffer;
            const normal = geometry.getAttribute('normal').array.buffer;
            const uv = geometry.getAttribute('uv').array.buffer;
            const index = geometry.getIndex().array.buffer;
            postMessage({ id, frameId, position, normal, uv, index }, [position, normal, uv, index ]);

            geometry.dispose();

            if (currentFrame.queue.length === 0 && nextFrame.queue.length !== 0) {
                let temp = currentFrame;
                currentFrame = nextFrame;
                nextFrame = currentFrame;
                queue = currentFrame.queue;
            }
            await delay(0);
        }

        //while (queue.length !== 0) {
        //    let data = queue.shift();
        //    const { id, points, particleRadius } = data;
        //
        //    const finalPoints = points_to_geometry(points.map((p) => new THREE.Vector3(p.x, p.y, p.z)), particleRadius);
        //    //postMessage({ id, finalPoints });
        //
        //    // Line segment geometry
        //    let shape = new THREE.Shape();
        //    shape.moveTo(finalPoints[0].x, finalPoints[0].y);
        //    for (let i=1; i<finalPoints.length; ++i) {
        //        let p = finalPoints[i];
        //        shape.lineTo(p.x, p.y);
        //    }
        //    shape.closePath();
        //    const geometry = new THREE.ShapeGeometry(shape);
        //
        //    const position = geometry.getAttribute('position').array.buffer;
        //    const normal = geometry.getAttribute('normal').array.buffer;
        //    const uv = geometry.getAttribute('uv').array.buffer;
        //    const index = geometry.getIndex().array.buffer;
        //    postMessage({ id, position, normal, uv, index }, [position, normal, uv, index ]);
        //
        //    geometry.dispose();
        //
        //    await delay(0);
        //}
    }
    finally { isDispatching = false; }
}

const points_to_geometry_circle_segments = 16;
const points_to_geometry = (points, particleRadius) => {

    const circlePoints = getCirclePointsForPoints(points, particleRadius, points_to_geometry_circle_segments);
    const circleSegments = [];
    for (let i=0; i<circlePoints.length; ++i) {
        let cp = circlePoints[i];
        let seg = [];
        circleSegments.push(seg);
        for (let n=0; n<cp.length; ++n) {
            let p = cp[n];
            let np = n === cp.length - 1 ? cp[0] : cp[n + 1];
            seg.push({ start: p.clone(), end: np.clone() });
            //setLine2D(circleSegments[i][n], p.x, p.y, np.x, np.y);
        }
    }

    const circlePoints2 = circlePoints.map((cp, i) => {
        let p = points[i];
        let lp = points[i === 0 ? points.length - 1 : i - 1];
        let np = points[i === points.length - 1 ? 0 : i + 1];
        
        //let lineToLast = utilityLines[0];
        //let lineToNext = utilityLines[1];
        //setLine2D(lineToLast, p.x, p.y, lp.x, lp.y);
        //setLine2D(lineToNext, p.x, p.y, np.x, np.y);
        let lineToLast = { start: p.clone(), end: lp.clone() };
        let lineToNext = { start: p.clone(), end: np.clone() };

        let dir = new THREE.Vector2();
        let perpendicularEnd = new THREE.Vector2();

        /** @type {Array<TME.Vec2>} */
        let firstIntersections = circleSegments[i].reduce((a, cs) => {
            let ip = intersect(lineToLast.start, lineToLast.end, cs.start, cs.end, true);
            //let ip = lineToLast.intersect(cs, true);
            if (ip != null) { a.push(ip); }
            return a;
        }, []);
        let firstPoint;
        if (firstIntersections.length === 0) {
            // Shouldn't happen but does - probably the intersection is on one of the circle segment end points, so just find the closest one
            let start = lineToLast.start;
            dir.copy(lineToLast.end).sub(start);
            perpendicularEnd.copy(dir.y, -dir.x).add(start); // 90 degrees clockwise
            
            firstPoint = cp.filter((cpp) => isLeftOfLine(start, perpendicularEnd, cpp) >= 0).map((cpp) => { return { pt: cpp, dist: getDistPointToLine(start, dir, cpp) }; }).sort((a, b) => a.dist - b.dist);
            firstPoint = firstPoint.length !== 0 ? firstPoint[0].pt : undefined;
        }
        else { firstPoint = firstIntersections.reduce((a, b) => a.add(b)).divideScalar(firstIntersections.length); }
        if (firstPoint) firstPoint = new THREE.Vector3(firstPoint.x, firstPoint.y, 0);
        else return cp;

        /** @type {Array<TME.Vec2>} */
        let lastIntersections = circleSegments[i].reduce((a, cs) => {
            let ip = intersect(lineToNext.start, lineToNext.end, cs.start, cs.end, true);
            //let ip = lineToNext.intersect(cs, true);
            if (ip != null) { a.push(ip); }
            return a;
        }, []);
        let lastPoint;
        if (lastIntersections.length === 0) {
            // Shouldn't happen but does - probably the intersection is on one of the circle segment end points, so just find the closest one
            let start = lineToNext.start;
            dir.copy(lineToNext.end).sub(start);
            perpendicularEnd.copy(dir.y, -dir.x).add(start); // 90 degrees clockwise

            lastPoint = cp.filter((cpp) => isLeftOfLine(start, perpendicularEnd, cpp) >= 0).map((cpp) => { return { pt: cpp, dist: getDistPointToLine(start, dir, cpp) }; }).sort((a, b) => a.dist - b.dist);
            lastPoint = lastPoint.length !== 0 ? lastPoint[0].pt : undefined;
        }
        else { lastPoint = lastIntersections.reduce((a, b) => a.add(b)).divideScalar(lastIntersections.length); }
        if (lastPoint) lastPoint = new THREE.Vector3(lastPoint.x, lastPoint.y, 0);
        else return cp;

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
    });
    
    const finalPoints = circlePoints2.reduce((a, b) => { a.push(...b); return a; }, []);
    
    return finalPoints;
    
}

function intersect(thisStart, thisEnd, otherStart, otherEnd, lineSegmentOnly) {
    // Check if none of the lines are of length 0
    if ((thisStart.x === thisEnd.x && thisStart.y === thisEnd.y) || (otherStart.x === otherEnd.x && otherStart.y === otherEnd.y)) {
        return null;
    }

    const denominator = ((otherEnd.y - otherStart.y) * (thisEnd.x - thisStart.x) - (otherEnd.x - otherStart.x) * (thisEnd.y - thisStart.y));

    // Lines are parallel
    if (denominator === 0) {
        return null;
    }

    const ua = ((otherEnd.x - otherStart.x) * (thisStart.y - otherStart.y) - (otherEnd.y - otherStart.y) * (thisStart.x - otherStart.x)) / denominator;

    // Check if the intersection point is within the bounds of the line segments if required
    if (lineSegmentOnly) {
        const ub = ((thisEnd.x - thisStart.x) * (thisStart.y - otherStart.y) - (thisEnd.y - thisStart.y) * (thisStart.x - otherStart.x)) / denominator;
        if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
            return null;
        }
    }

    // Return an object with the x and y coordinates of the intersection
    const x = thisStart.x + ua * (thisEnd.x - thisStart.x);
    const y = thisStart.y + ua * (thisEnd.y - thisStart.y);

    return new THREE.Vector3(x, y, 0);
}


/**
 * @private
 * @param {List<THREE.Vector3>} points 
 * @param {Number} radius 
 * @param {Number} segments 
 * @param {Array<Array<THREE.Vector3>>} outCirclePoints 
 */
function getCirclePointsForPoints(points, radius, segments) {
    if (segments < 3) { segments = 3; }

    let ret = [];
    let stepAngle = 2*Math.PI / segments;
    for (let i=0; i<points.length; ++i) {
        let p = points[i];

        /** @type {Array<THREE.Vector3>} */
        let circlePoints = [];
        ret.push(circlePoints);
        for (let n=0; n<segments; ++n) {
            let pt = new THREE.Vector3();
            circlePoints.push(pt);
            let angle = stepAngle * n;

            let x = p.x + Math.cos(angle) * radius;
            let y = p.y + Math.sin(angle) * radius;
            let z = 0;
            pt.set(x, y, z);
        }
    }

    return ret;
}

/**
 * @private
 * @param {TME.Line2D} line 
 * @param {Number} x1 
 * @param {Number} y1 
 * @param {Number} x2 
 * @param {Number} y2 
 */
function setLine2D(line, x1, y1, x2, y2) {
    line.start.set(x1, y1);
    line.end.set(x2, y2);
}

/**
 * @private
 * Phong https://forum.unity.com/threads/closest-point-on-a-line.121567/
 * @param {THREE.Vector2} origin 
 * @param {THREE.Vector2} direction 
 * @param {THREE.Vector2} point 
 * @returns 
 */
function getDistPointToLine(origin, direction, point) {
    _direction.set(direction.x, direction.y, 0);
    _point2origin.set(origin.x, origin.y, 0).sub(point);
    _point2closestPointOnLine.copy(_point2origin).sub(_direction.multiplyScalar(_point2origin.dot(_direction)));
    return _point2closestPointOnLine.clone();
}

/** @private @type {THREE.Vector3} */
_point2origin = new THREE.Vector3();

/** @private @type {THREE.Vector3} */
_direction = new THREE.Vector3();

/** @private @type {THREE.Vector3} */
_point2closestPointOnLine = new THREE.Vector3();

/**
 * @private
 *  isLeftOfLine(): tests if a point is Left|On|Right of an infinite line.
 *  Input:  three points a, b, and p
 *  Return: >0 for p left of the line through a and b
 *      =0 for p on the line
 *      <0 for p right of the line
 * @param {THREE.Vector3} a 
 * @param {THREE.Vector3} b 
 * @param {THREE.Vector3} p 
 * @returns {Boolean}
 */
function isLeftOfLine(a, b, p) {
    return ( (b.x - a.x)*(p.y - a.y)
    - (p.x - a.x)*(b.y - a.y));
}