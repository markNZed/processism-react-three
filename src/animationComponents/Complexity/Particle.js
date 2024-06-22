import React, { useEffect, useMemo, useRef, useImperativeHandle, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import ParticleRigidBody from './ParticleRigidBody';
import { BallCollider } from '@react-three/rapier';
import { getColor, calculateCircleArea } from './utils.js';
import useStoreEntity from './useStoreEntity';

// Should we maintian node.visualConfig syned with ParticleRigidBody visualConfig ?
// Coud store visualConfig only in node but would slow data access when rendering the instanced mesh of particles
// At leasst keep uniqueId aligned with id

// The Particle uses ParticleRigidBody which extends RigidBody to allow for impulses to be accumulated before being applied
const Particle = React.memo(React.forwardRef(({ id, initialPosition, radius, config, ...props }, ref) => {

    useImperativeHandle(ref, () => nodeRef.current);

    const isDebug = props.debug || config.debug;
    const [colliderRadius, setColliderRadius] = useState(radius);
    const [initialize, setInitialize] = useState(true);
    // Direct access to the state outside of React's render flow
    const directUpdateNode = useStoreEntity.getState().updateNode;
    const directGetNode = useStoreEntity.getState().getNode; 
    const node = useStoreEntity(useCallback((state) => state.nodes[id], [id]));
    const nodeRef = node.ref; // because we forwardRef and want to use the ref locally too
    const configColor = config.colors[node.depth];
    const color = useMemo(() => getColor(configColor, props.color));
    const parentNode = useMemo(() => directGetNode(node.parentId), [node.parentId]);
    const parentNodeRef = parentNode.ref
    // So we can get the particle position relative to the parent's position
    // Rapier uses world coordinates
    const worldToLocal = useCallback((worldPos) => (parentNodeRef.current.worldToLocal(worldPos)) , [parentNodeRef]);

    // When scaling a Particle we need to modify the joint positions
    useFrame(() => {
        if (!nodeRef.current) return;
        if (nodeRef.current.applyImpulses) {
            nodeRef.current.applyImpulses();
        }
        //
        const visualConfig = nodeRef.current.getVisualConfig();
        // Could adjust scale over multiple frames
        if (visualConfig?.scale !== visualConfig?.rigidScale) {
            let relativeScale = visualConfig.scale;
            if (visualConfig.rigidScale) {
                relativeScale = visualConfig.scale / visualConfig.rigidScale;
            }
            const newRadius = relativeScale * colliderRadius
            setColliderRadius(newRadius);
            nodeRef.current.setVisualConfig(visualConfig)
            node.jointsRef.current.forEach((jointIndex) => {
                const joint = props.jointRefsRef.current[jointIndex].current;
                const scaleAnchor = (anchor) => ({
                    x: anchor.x * relativeScale,
                    y: anchor.y * relativeScale,
                    z: anchor.z * relativeScale,
                });

                if (joint.body1().visualConfig.uniqueId === id) {
                    joint.setAnchor1(scaleAnchor(joint.anchor1()));
                }
                if (joint.body2().visualConfig.uniqueId === id) {
                    joint.setAnchor2(scaleAnchor(joint.anchor2()));
                }
            })
            visualConfig.rigidScale = visualConfig.scale;
            nodeRef.current.setVisualConfig(visualConfig);
        }
    });

    // Set the initial visualConfig, don't do this in JSX (it would overwrite on renders)
    useEffect(() => {
        if (initialize && nodeRef.current) {
            //console.log(`Initialize particle ${id} begin`)
            nodeRef.current.setVisualConfig({ color: color, uniqueId: id });
            //updateNode(id, {isParticle: true});
            const rootNode = directGetNode("root");
            if (!rootNode.particleRadius) {
                directUpdateNode("root", {
                    particleRadius: radius,
                    particleArea: calculateCircleArea(radius),
                })
            }
            setInitialize(false);
            console.log(`Initialize particle ${id}`, initialPosition, radius)
        }
    }, [nodeRef]);

    //console.log("Particle rendering");

    return (
        <>
            <ParticleRigidBody
                ref={nodeRef}
                position={initialPosition}
                type={"dynamic"}
                colliders={false}
                linearDamping={0.5}
                angularDamping={0.5}
                enabledTranslations={[true, true, false]}
                enabledRotations={[false, false, true]}
                restitution={config.particleRestitution}
                ccd={config.ccd}
                worldToLocal={worldToLocal}
            >
                <BallCollider args={[colliderRadius]} />
            </ParticleRigidBody>
            {isDebug && (
                <>
                    <Text
                        position={[initialPosition[0], initialPosition[1], 0.1]} // Slightly offset in the z-axis to avoid z-fighting
                        fontSize={radius / 2}
                        color="black"
                        anchorX="center"
                        anchorY="middle"
                    >
                        {id}
                    </Text>
                </>
            )}
        </>
    );
}));

Particle.displayName = 'Particle'; // the name property doesn't exist because it uses forwardRef

export default Particle;