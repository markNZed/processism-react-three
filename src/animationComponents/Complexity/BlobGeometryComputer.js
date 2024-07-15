import * as THREE from 'three';
import * as TME from '@immugio/three-math-extensions';

class BlobGeometryComputer {

    /** @private @type {Array<THREE.Vector3>} */
    points = undefined;

    /** @private @type {Number} */
    particleRadius = undefined;

    /** @private @type {{ circlePoints: Array<Array<THREE.Vector3>>, circleSegments: Array<Array<TME.Line2D>>, utilityVector2s: Array<THREE.Vector2>, utilityVector3s: Array<THREE.Vector3>, utilityLines: Array<TME.Line2D> }} */
    blobData = undefined;

    /** @private @type {Number} */
    circlePointIndex = 0;

    /** @private @type {Array<Array<THREE.Vector3>>} */
    circlePoints2 = undefined;

    /** @private @type {THREE.BufferGeometry} */
    resultGeometry = undefined;

    /** @private @type {Number} */
    frameCount = 1;

    /** @private @type {Number} */
    circlePointsPerFrame = 1;

    /** @private @type {Number} */
    points_to_geometry_circle_segments = 16;

    /**
     * 
     * @returns {Boolean}
     */
    isComputing() {
        if (this.blobData == null) return false;
        const { circlePoints, circleSegments, utilityVector2s, utilityVector3s, utilityLines } = this.blobData;
        return this.circlePointIndex < circlePoints.length;
     }

     continueCompute() {
        this.doCompute();
     }

     /**
      * 
      * @returns {Array<THREE.Vector3> | Null}
      */
     getResult() {
        if (this.blobData == null) return undefined;
        const { circlePoints, circleSegments, utilityVector2s, utilityVector3s, utilityLines } = this.blobData;
        if (this.circlePointIndex>=circlePoints.length && this.resultGeometry) return this.resultGeometry;
        else return undefined;
     }

    /**
     * 
     * @param {Array<THREE.Vector3>} points 
     * @param {Number} particleRadius 
     * @param {{ circlePoints: Array<Array<THREE.Vector3>>, circleSegments: Array<Array<TME.Line2D>>, utilityVector2s: Array<THREE.Vector2>, utilityVector3s: Array<THREE.Vector3>, utilityLines: Array<TME.Line2D> }} blobData 
     * @param {Number} frameCount 
     */
    startCompute(points, particleRadius, blobData, frameCount) {

        const { circlePoints, circleSegments, utilityVector2s, utilityVector3s, utilityLines } = blobData;

        this.points = points;
        this.particleRadius = particleRadius;
        this.blobData = blobData;
        this.circlePointIndex = 0;
        this.circlePointsPerFrame = Math.ceil(circlePoints.length / frameCount);
        this.circlePoints2 = [];

    
        this.getCirclePointsForPoints(points, particleRadius, this.points_to_geometry_circle_segments, circlePoints);
        for (let i=0; i<circlePoints.length; ++i) {
            let cp = circlePoints[i];
            for (let n=0; n<cp.length; ++n) {
                let p = cp[n];
                let np = n === cp.length - 1 ? cp[0] : cp[n + 1];
                this.setLine2D(circleSegments[i][n], p.x, p.y, np.x, np.y);
            }
        }

        this.doCompute();
    }

    /**
     * @private
     */
    doCompute() {

        const { circlePoints, circleSegments, utilityVector2s, utilityVector3s, utilityLines } = this.blobData;

        for (let n=0; this.circlePointIndex<circlePoints.length && n<this.circlePointsPerFrame; ++this.circlePointIndex, ++n) {
            let i = this.circlePointIndex;
            let cp = circlePoints[i];

            let p = this.points[i];
            let lp = this.points[i === 0 ? this.points.length - 1 : i - 1];
            let np = this.points[i === this.points.length - 1 ? 0 : i + 1];

            let lineToLast = utilityLines[0];
            let lineToNext = utilityLines[1];
            this.setLine2D(lineToLast, p.x, p.y, lp.x, lp.y);
            this.setLine2D(lineToNext, p.x, p.y, np.x, np.y);

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
                
                firstPoint = cp.filter((cpp) => this.isLeftOfLine(start, perpendicularEnd, cpp) >= 0).map((cpp) => this.getDistPointToLine(start, dir, cpp)).sort((a, b) => a - b);
                if (firstPoint.length !== 0) firstPoint = firstPoint[0];
                else firstPoint = undefined;
            }
            else { firstPoint = firstIntersections.reduce((a, b) => a.add(b)).divideScalar(firstIntersections.length); }
            if (firstPoint) firstPoint = new THREE.Vector3(firstPoint.x, firstPoint.y, 0);
            else { this.circlePoints2.push(...cp); continue; }
            
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
    
                lastPoint = cp.filter((cpp) => this.isLeftOfLine(start, perpendicularEnd, cpp) >= 0).map((cpp) => this.getDistPointToLine(start, dir, cpp)).sort((a, b) => a - b);
                if (lastPoint.length !== 0) lastPoint = lastPoint[0];
                else lastPoint = undefined;
            }
            else { lastPoint = lastIntersections.reduce((a, b) => a.add(b)).divideScalar(lastIntersections.length); }
            if (lastPoint) lastPoint = new THREE.Vector3(lastPoint.x, lastPoint.y, 0);
            else { this.circlePoints2.push(...cp); continue; }

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

            this.circlePoints2.push(ret);
        }

        if (this.circlePointIndex>=circlePoints.length) {
            const finalPoints = this.circlePoints2.reduce((a, b) => { a.push(...b); return a; }, []);
        
            // Line segment geometry
            let shape = new THREE.Shape();
            shape.moveTo(finalPoints[0].x, finalPoints[0].y);
            for (let i=1; i<finalPoints.length; ++i) {
                let p = finalPoints[i];
                shape.lineTo(p.x, p.y);
            }
            shape.closePath();
            let shapeGeometry = new THREE.ShapeGeometry(shape);
        
            this.resultGeometry = shapeGeometry;
        }
    }
    
    /**
     * @private
     * @param {List<THREE.Vector3>} points 
     * @param {Number} radius 
     * @param {Number} segments 
     * @param {Array<Array<THREE.Vector3>>} outCirclePoints 
     */
    getCirclePointsForPoints(points, radius, segments, outCirclePoints) {
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

    /**
     * @private
     * @param {TME.Line2D} line 
     * @param {Number} x1 
     * @param {Number} y1 
     * @param {Number} x2 
     * @param {Number} y2 
     */
    setLine2D(line, x1, y1, x2, y2) {
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
    getDistPointToLine(origin, direction, point) {
        this._direction.set(direction.x, direction.y, 0);
        this._point2origin.set(origin.x, origin.y, 0).sub(point);
        this._point2closestPointOnLine.copy(this._point2origin).sub(this._direction.multiplyScalar(this._point2origin.dot(this._direction)));
        return this._point2closestPointOnLine.clone();

        //let point2origin = origin.clone().sub(point);
        //let point2closestPointOnLine = point2origin.clone().sub(direction.multiplyScalar(point2origin.dot(direction)));
        //return point2closestPointOnLine.length();
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
    isLeftOfLine(a, b, p) {
        return ( (b.x - a.x)*(p.y - a.y)
        - (p.x - a.x)*(b.y - a.y));
    }
}

export default BlobGeometryComputer;