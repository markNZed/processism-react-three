import * as THREE from 'three';
import useStoreEntity from './useStoreEntity';
import useStoreScope from './useStoreScope';
import useStoreJoint from './useStoreJoint';

// Be careful not to have this sensitive to updates to nodes
// Direct access to the state outside of React's render flow
const updateNode = useStoreEntity.getState().updateNode;
const getNodeProperty = useStoreEntity.getState().getNodeProperty;
const updateScope = useStoreScope.getState().updateScope;
const getJoint = useStoreJoint.getState().getJoint;
const addJoint = useStoreJoint.getState().addJoint;
const removeJointStore = useStoreJoint.getState().removeJoint;

export const createJoint = (world, rapier, a, b, scope, batch=false) => {
    const aUserData = a.ref.userData || a.ref.getUserData();
    const bUserData = b.ref.userData || b.ref.getUserData();
    const jointRefsRefIndex = `${aUserData.uniqueId}-${bUserData.uniqueId}`;
    const jointRefsRefIndexReverse = `${bUserData.uniqueId}-${aUserData.uniqueId}`;
    const jointRef = { current: null }; // Create a plain object to hold the reference
    jointRef.current = world.createImpulseJoint(
        rapier.JointData.spherical(a.offset, b.offset),
        a.ref,
        b.ref,
        true
    );
    if (!batch) {
        addJoint(jointRefsRefIndex, jointRef);
        addJoint(jointRefsRefIndexReverse, jointRef);
        updateNode(aUserData.uniqueId, p => ({
            joints: p.joints.includes(jointRefsRefIndex) ? p.joints : [...p.joints, jointRefsRefIndex]
        }));
        updateScope(scope, p => ({
            joints: [...p.joints, jointRefsRefIndex, jointRefsRefIndexReverse]
        }));
    }
    //console.log("createJoint", id, jointRefsRefIndex, jointRef);
    return [jointRefsRefIndex, jointRefsRefIndexReverse, jointRef];
};

export const removeJoint = (world, jointKey, scope) => {
    const jointRef = getJoint(jointKey);
    const body1 = jointRef.current.body1();
    const body2 = jointRef.current.body2();
    let body1Joints = getNodeProperty(body1.userData.uniqueId, joints);
    let body2Joints = getNodeProperty(body2.userData.uniqueId, joints);
    body1Joints = body1Joints.filter(obj => obj !== jointKey);
    body2Joints = body2Joints.filter(obj => obj !== jointKey);
    updateNode(body1.userData.uniqueId, {joints: body1Joints});
    updateNode(body2.userData.uniqueId, {joints: body2Joints});
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
        removeJointStore(jointKey);
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