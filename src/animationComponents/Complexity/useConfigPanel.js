import { useControls } from 'leva';
import * as utils from './utils';

const useConfigPanel = (defaultSettings) => {
    
    const controlsConfig = {
        radius: { value: defaultSettings.radius || 10, min: 1, max: 20 },
        animDelayMs: { value: 50, min: 0, max: 1000, step: 1, label: "Animation Delay" },
        impulsePerParticle: { value: 1.5, min: 0, max: 100, step: 0.1, label: "Impulse per Particle" },
        overshootScaling: { value: 1.0, min: 1, max: 10, step: 1, label: "Overshoot Scaling" },
        maxDisplacementScaling: { value: 1, min: 0.1, max: 3, step: 0.1, label: "Max Displacement Scaling" },
        particleRestitution: { value: 0, min: 0, max: 5, step: 0.1, label: "Particle Restitution" },
        initialScaling: { value: 1, min: 0.001, max: 10, step: 0.1, label: "Initial Scaling" },
        initialImpulse: { value: true, label: "Initial Impulse" },
        showRelations: { value: false, label: "Show Relations" },
        attractor: { value: false, label: "Enable attractor" },
        detach: { value: false, label: "Detach Experiment" },
        slowdown: { value: 1.0, min: 1, max: 10, step: 0.1, label: "Slowdown Physics" },
    };

    const [controls] = useControls(() => controlsConfig);

    // Configuration object for your simulation, does not include config that needs to remount
    const config = {
        debug: false,
        radius: controls.radius,
        animDelayMs: controls.animDelayMs,
        colors: [defaultSettings.color || null, utils.getRandomColorFn, null],
        impulsePerParticle: controls.impulsePerParticle / 1000,
        overshootScaling: controls.overshootScaling,
        attractorScaling: controls.attractorScaling,
        maxDisplacementScaling: controls.maxDisplacementScaling,
        particleRestitution: controls.particleRestitution,
        ccd: false,
        initialScaling: controls.initialScaling,
        initialImpulse: controls.initialImpulse,
        showRelations: controls.showRelations,
        detach: controls.detach,
        maxRelations: 200,
        slowdown: controls.slowdown,
    };

    return config
};

export default useConfigPanel;
