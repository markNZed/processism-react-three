import * as THREE from 'three';
import useBlobGeometryWorker from './useBlobGeometryWorker';

/** @type {Map<Number, { delete: Boolean, done: Number, results: Map<String, THREE.BufferGeometry> }} */
const resultMap = new Map();

const geometryWorker = useBlobGeometryWorker();
geometryWorker.onmessage = (e) => {
    BlobGeometryWebworkerComputer.onResult(e.data);
}

class BlobGeometryWebworkerComputer {
    /** @type {Map<Number, { finished: Boolean, count: Number, resultCount: Number, geometry: Map<String, THREE.BufferGeometry> }} */
    static results = new Map();

    static onResult(data) {
        const { id, frameId, position, normal, uv, index } = data;

        let frame = this.results.get(frameId);
        if (frame == null) return;

        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(position), 3));
        g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normal), 3));
        g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uv), 2));
        g.setIndex(new THREE.BufferAttribute(new Uint16Array(index), 1));

        let oldG = frame.geometry.get(id);
        if (oldG != null) { oldG.dispose(); frame.resultCount--; }
        frame.geometry.set(id, g);
        frame.resultCount++;
    }

    static points_to_geometry(id, frameId, points, particleRadius) {
        let sendFrame = this.results.get(frameId);
        if (sendFrame == null) { sendFrame = { finished: false, count: 0, resultCount: 0, geometry: new Map() }; this.results.set(frameId, sendFrame); }
        sendFrame.count++;
        geometryWorker.postMessage({ id, frameId, points, particleRadius });

        let ret;
        //let doneFrameIds = Array.from(resultMap.keys()).sort((a, b) => a - b).filter((fid) => { let fm = resultMap.get(fid); return fm.done === fm.results.size && !fm.delete; });
        let doneFrames = Array  .from(this.results.keys())
                                .map((k) => ({ frameId: k, results: this.results.get(k) }))
                                .filter((kvp) => kvp.results.resultCount === kvp.results.count)
                                .sort((a, b) => a.frameId - b.frameId);
        if (doneFrames.length !== 0) {
            let doneFrame = doneFrames[0];
            doneFrame.results.finished = true;
            ret = doneFrame.results.geometry.get(id);
            if (ret != null) {
                doneFrame.results.geometry.delete(id);
            }
        }

        let toDelete = Array.from(this.results.entries()).filter((e) => (e[1].finished && e[1].geometry.size === 0) || frameId - e[0] >= 10);
        for (let i=0; i<toDelete.length; ++i) {
            let del = toDelete[i];
            del[1].geometry.forEach((geo, nodeId) => geo.dispose());
            this.results.delete(del[0]);
        }
        
        return ret;


        //if (frameId > this.lastFrame.frameId) {
        //    let ret;
        //    /** @type {Map<String, THREE.BufferGeometry>} */
        //    let frame = resultMap.get(this.lastFrame.frameId);
        //    if (frame != null) { ret = frame.get(id); if (ret != null) { frame.delete(id); } }
        //
        //    if (frameId > this.currentFrame.frameId) { this.currentFrame.frameId = frameId; this.currentFrame.data.clear(); }
        //    if (frameId === this.currentFrame.frameId) { this.currentFrame.data.set(id, { id, frameId, points, particleRadius }); }
        //}
        

        //let ret = resultMap.get(id);
        //if (ret != null) { 
        //    resultMap.delete(id);
        //    const { position, normal, uv, index } = ret;
        //
        //    const g = new THREE.BufferGeometry();
        //    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(position), 3));
        //    g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normal), 3));
        //    g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uv), 2));
        //    g.setIndex(new THREE.BufferAttribute(new Uint16Array(index), 1));
        //
        //    return g;
        //
        //    new Float32Array().buffer
        //    
        //    // Line segment geometry
        //    //let shape = new THREE.Shape();
        //    //shape.moveTo(finalPoints[0].x, finalPoints[0].y);
        //    //for (let i=1; i<finalPoints.length; ++i) {
        //    //    let p = finalPoints[i];
        //    //    shape.lineTo(p.x, p.y);
        //    //}
        //    //shape.closePath();
        //    //return new THREE.ShapeGeometry(shape);
        //}
        return null;
    }
}

export default BlobGeometryWebworkerComputer;