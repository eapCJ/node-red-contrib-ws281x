/* eslint-disable no-unused-vars */

const os = require('os');

// In a real Raspberry Pi environment, this will be `rpi-ws281x-native`.
// For testing on other platforms, we create a mock.
let ws281x;

// The is-pi check is not foolproof, but it's a good first line of defense.
// A more robust check might involve checking /proc/cpuinfo or /sys/firmware/devicetree/base/model
const isPi = os.arch() === 'arm' || os.arch() === 'arm64';

if (process.env.WS281X_MOCK || !isPi) {
    ws281x = {
        init: (config) => {
            // Mock the channel array structure
            return config.channels.map(channelConfig => ({
                ...channelConfig,
                array: new Uint32Array(channelConfig.count),
                buffer: Buffer.from(new Uint32Array(channelConfig.count).buffer),
            }));
        },
        render: () => {},
        reset: () => {},
        finalize: () => {},
        stripType: {
            WS2812: 'ws2812',
            SK6812: 'sk6812',
            SK6812W: 'sk6812w',
        }
    };
} else {
    ws281x = require('rpi-ws281x-native');
}

// This will hold the initialized driver instance. We only want one.
let driverInstance = null;
// This will keep track of how many nodes are using the driver.
let refCount = 0;

/**
 * Returns a key for storing/retrieving driver instances.
 * For now, we only support one global driver instance.
 * In the future, this could be extended to support multiple DMA channels.
 * @returns {string} A static key.
 */
function getInstanceKey(options) {
    // A more complex key could be `dma-${options.dma}-freq-${options.freq}`;
    return 'singleton';
}

/**
 * Initializes the ws281x driver with the given options.
 * This is a singleton; subsequent calls will return the existing instance.
 * @param {object} options - The options for the driver.
 * @param {number} options.dma - The DMA channel.
 * @param {number} options.freq - The frequency.
 * @param {object[]} options.channels - The channel configurations.
 * @returns {object} The initialized driver channels.
 */
function init(options) {
    const key = getInstanceKey(options);

    if (driverInstance) {
        refCount++;
        return driverInstance;
    }

    try {
        driverInstance = ws281x.init(options);
        refCount = 1;
        return driverInstance;
    } catch (e) {
        console.error('Failed to initialize ws281x driver:', e.message);
        // In a real scenario, you might want to throw or handle this more gracefully.
        // For Node-RED, logging the error is often the best approach.
        driverInstance = null;
        refCount = 0;
        throw e;
    }
}

/**
 * Decrements the reference count and finalizes the driver if no nodes are using it.
 */
function finalize() {
    refCount--;

    if (refCount <= 0 && driverInstance) {
        try {
            ws281x.reset();
            ws281x.finalize();
        } catch (e) {
            console.error('Error during ws281x finalization:', e.message);
        } finally {
            driverInstance = null;
            refCount = 0;
        }
    }
}

/**
 * Renders the current LED state to the strip
 */
function render() {
    return ws281x.render();
}

/**
 * Resets (clears) the LED strip
 */
function reset() {
    return ws281x.reset();
}

module.exports = {
    init,
    finalize,
    render,
    reset,
    get stripType() { return ws281x.stripType; },
    // Expose ws281x for testing
    get _ws281x() { return ws281x; },
    // Allow setting ws281x for testing
    _setWs281x(mockWs281x) { ws281x = mockWs281x; }
}; 