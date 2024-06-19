import * as THREE from 'three';
import useStoreEntity from './useStoreEntity';
import useStoreScope from './useStoreScope';
import useStoreJoint from './useStoreJoint';

// Should follow a CRUD pattern for joints (missing R & U)

// Be careful not to have this sensitive to updates to nodes
// Direct access to the state outside of React's render flow
const updateNode = useStoreEntity.getState().updateNode;
const getNode = useStoreEntity.getState().getNode;
const getNodeProperty = useStoreEntity.getState().getNodeProperty;
const updateScope = useStoreScope.getState().updateScope;
const getJoint = useStoreJoint.getState().getJoint;
const addJoint = useStoreJoint.getState().addJoint;
const deleteJointStore = useStoreJoint.getState().deleteJoint;

export const createJoint = (world, rapier, a, b, scope, batch=false) => {
    const aUserData = a.ref.current.userData || a.ref.getUserData();
    const bUserData = b.ref.current.userData || b.ref.getUserData();
    const jointRefsRefIndex = `${aUserData.uniqueId}-${bUserData.uniqueId}`;
    const jointRefsRefIndexReverse = `${bUserData.uniqueId}-${aUserData.uniqueId}`;
    const jointRef = { current: null }; // Create a plain object to hold the reference
    jointRef.current = world.createImpulseJoint(
        rapier.JointData.spherical(a.offset, b.offset),
        a.ref.current,
        b.ref.current,
        true
    );
    if (!batch) {
        addJoint(jointRefsRefIndex, jointRef);
        addJoint(jointRefsRefIndexReverse, jointRef);
        const aNode = getNode(aUserData.uniqueId);
        const aNodeJoints = aNode.jointsRef.current;
        aNode.jointsRef.current = aNodeJoints.includes(jointRefsRefIndex) ? aNodeJoints : aNode.jointsRef.current.push(jointRefsRefIndex);
        const bNode = getNode(bUserData.uniqueId);
        const bNodeJoints = bNode.jointsRef.current;
        bNode.jointsRef.current = bNodeJoints.includes(jointRefsRefIndex) ? bNodeJoints : bNode.jointsRef.current.push(jointRefsRefIndex);
        updateScope(scope, p => ({
            joints: [...p.joints, jointRefsRefIndex, jointRefsRefIndexReverse]
        }));
    }
    //console.log("createJoint", id, jointRefsRefIndex, jointRef);
    return [jointRefsRefIndex, jointRefsRefIndexReverse, jointRef];
};

export const deleteJoint = (world, jointKey, scope) => {
    const jointRef = getJoint(jointKey);
    const body1 = jointRef.current.body1();
    const body2 = jointRef.current.body2();
    const aNode = getNode(aUserData.uniqueId);
    aNode.jointsRef.current = aNode.jointsRef.current.filter(obj => obj !== jointKey);
    const bNode = getNode(bUserData.uniqueId);
    bNode.jointsRef.current = bNode.jointsRef.current.filter(obj => obj !== jointKey);
    const jointIndex = `${body1.userData.uniqueId}-${body2.userData.uniqueId}`;
    const jointIndexReverse = `${body2.userData.uniqueId}-${body1.userData.uniqueId}`;
    updateScope(scope, p => ({
        joints: p.joints.filter(joint => joint !== jointIndex && joint !== jointIndexReverse)
    }));
    if (jointRef.current) {
        const joint = jointRef.current;
        jointRef.current = undefined;
        if (world.getImpulseJoint(joint.handle)) {
            world.removeImpulseJoint(joint, true);
        }
        deleteJointStore(jointKey);
    }
};

export const calculateJointOffsets = (body1, body2, particleRadius) => {
    const body1position = body1.translation();
    const body2position = body2.translation();
    const direction = new THREE.Vector3()
        .subVectors(body1position, body2position)
        .normalize();
    const offset1 = direction.clone().multiplyScalar(-particleRadius);
    const offset2 = direction.clone().multiplyScalar(particleRadius);
    return { offset1, offset2 };
};