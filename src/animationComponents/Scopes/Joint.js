import { useSphericalJoint } from '@react-three/rapier';

// Joints connect Particles and when the joints form a loop the group of Particles will behave like a soft body
const Joint = ({ a, b, jointRefsRef }) => {
    const aUserData = a.ref.getUserData()
    const bUserData = b.ref.getUserData()
    const jointRefsIndex = `${aUserData.uniqueIndex}-${bUserData.uniqueIndex}`;
    jointRefsRef.current[jointRefsIndex] = useSphericalJoint(a.ref, b.ref, [
        [a.offset.x, a.offset.y, a.offset.z],
        [b.offset.x, b.offset.y, b.offset.z]
    ])
    return null
}

export default Joint;