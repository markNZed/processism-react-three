/**
 * Retrieves a color setting from a configuration object.
 * Allows for the color setting to be a static value or a function.
 *
 * @param {Object} config - Configuration object containing color settings.
 * @param {string} scope - The key under which the color setting is stored.
 * @param {*} defaultValue - A default value to return if the specific setting is not found.
 * @returns {*} - The color setting from the configuration or the default return value.
 */
export const getColor = (colorConfig, defaultValue) => {
    if (colorConfig === null || colorConfig === undefined) {
        return defaultValue;
    }
    if (typeof colorConfig === 'function') {
        return colorConfig();
    }
    return colorConfig;
};

export const calculateCircleArea = (radius) => {
    if (radius <= 0) {
        return "Radius must be a positive number.";
    }
    return Math.PI * Math.pow(radius, 2);
};

export const getRandomColorFn = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
};