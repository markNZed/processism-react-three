import { useRapier } from '@react-three/rapier';

// Remember custom hook can generate renders in the Component so be careful with Zustand stores

const useJoints = (config) => {

    const { world, rapier } = useRapier();
    // Be careful not to have this sensitive to updates to nodes
    // Direct access to the state outside of React's render flow
    const { getJoint: directGetJoint,
            addJoint: directAddJoint, 
            deleteJoint: storeDeleteJoint,
            updateJoint: directUpdateJoint,
    } = config.entityStore.getState();

    const addLink = (chainRef, uniqueIdA, uniqueIdB) => {
        //console.log("Before addLink", JSON.stringify(chainRef.current), uniqueIdA, uniqueIdB);
        if (chainRef.current[uniqueIdA]) {
            if (!chainRef.current[uniqueIdA].includes(uniqueIdB)) chainRef.current[uniqueIdA].push(uniqueIdB);
        } else {
            chainRef.current[uniqueIdA] = [uniqueIdB];
        }
    }

    const removeLink = (chainRef, uniqueIdA, uniqueIdB) => {
        //console.log("removeLink", uniqueIdA, uniqueIdB);
        if (chainRef.current[uniqueIdA]) {
            chainRef.current[uniqueIdA] = chainRef.current[uniqueIdA].filter(id => id !== uniqueIdB);
        }
    }

    const createJoint = (chainRef, aRef, aOffset, bRef, bOffset, batch=false) => {
        const aVisualConfig = aRef.getVisualConfig();
        const bVisualConfig = bRef.getVisualConfig();
        const jointRef = { current: null }; // Create a plain object to hold the reference
        jointRef.current = world.createImpulseJoint(
            rapier.JointData.spherical(aOffset, bOffset),
            aRef.current,
            bRef.current,
            true
        );
        addLink(chainRef, aVisualConfig.uniqueId, bVisualConfig.uniqueId);
        if (!batch) {
            directAddJoint(aVisualConfig.uniqueId, bVisualConfig.uniqueId, jointRef);
        }
        //console.log("createJoint", `${aVisualConfig.uniqueId}-${bVisualConfig.uniqueId}`, jointRef.current)
        return jointRef;
    };
    
    const deleteJoint = (chainRef, jointKey) => {
        //console.log("deleteJoint", jointKey)
        const {jointRef, body1Id, body2Id} = directGetJoint(jointKey);
        if (jointRef.current) {
            const joint = jointRef.current;
            jointRef.current = undefined;
            if (world.getImpulseJoint(joint.handle)) {
                world.removeImpulseJoint(joint, true);
            }
            storeDeleteJoint(body1Id, body2Id);
        }
        removeLink(chainRef, body1Id, body2Id)
    };

    const updateJoint = (chainRef, jointId, aRef, aOffset, bRef, bOffset) => {
        //console.log("updateJoint", jointId, aRef, aOffset, bRef, bOffset);
        const {jointRef, body1Id, body2Id} = directGetJoint(jointId);
        const aVisualConfig = aRef.getVisualConfig();
        const bVisualConfig = bRef.getVisualConfig();
        //console.log("updateJoint", jointId, body1Id, body2Id, aVisualConfig.uniqueId, bVisualConfig.uniqueId);
        //console.log("updateJoint ref", jointId, aRef.current, bRef.current);
        if (jointRef.current) {
            const joint = jointRef.current;
            jointRef.current = undefined;
            if (world.getImpulseJoint(joint.handle)) {
                world.removeImpulseJoint(joint, true);
            }
        }
        const newJointRef = { current: null }; // Create a plain object to hold the reference
        if (aRef.current?.type !== "Group" && bRef.current?.type !== "Group") {
            newJointRef.current = world.createImpulseJoint(
                rapier.JointData.spherical(aOffset, bOffset),
                aRef.current,
                bRef.current,
                true
            );
        } else {
            //console.warn("No aRef or bRef for updateJoint", jointId, aRef.current.type, bRef.current.type);
        }
        removeLink(chainRef, body1Id, body2Id);
        addLink(chainRef, aVisualConfig.uniqueId, bVisualConfig.uniqueId);
        directUpdateJoint(jointId, aVisualConfig.uniqueId, bVisualConfig.uniqueId, newJointRef);
    };
    return {deleteJoint, createJoint, updateJoint, addLink};
};

export default useJoints;