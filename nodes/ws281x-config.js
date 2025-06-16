module.exports = function (RED) {
    'use strict';
    const driver = require('../lib/driver');

    function Ws281xConfigNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        // Configuration from the editor
        node.leds = parseInt(config.leds, 10) || 1;
        node.gpio = parseInt(config.gpio, 10) || 18;
        node.interface = config.interface || 'PWM';
        node.freq = parseInt(config.freq, 10) || 800000;
        node.dma = parseInt(config.dma, 10) || 10;
        node.stripType = config.stripType || 'WS2812';
        node.brightness = parseInt(config.brightness, 10) || 255;
        node.invert = config.invert || false;

        // Adjust GPIO defaults based on interface selection
        if (node.interface === 'PCM' && node.gpio === 18) {
            node.gpio = 21; // Default PCM pin
        } else if (node.interface === 'SPI' && node.gpio === 18) {
            node.gpio = 10; // Default SPI pin
        }

        // We only support a single channel for now, but the driver is written
        // to support multiple.
        const driverConfig = {
            freq: node.freq,
            dma: node.dma,
            interface: node.interface,
            channels: [
                {
                    count: node.leds,
                    gpio: node.gpio,
                    brightness: node.brightness,
                    stripType: driver.stripType[node.stripType],
                    invert: node.invert,
                },
            ],
        };

        try {
            // init() returns an array of channels
            const channels = driver.init(driverConfig);
            node.channel = channels[0];
            node.log(
                `Initialized ws281x driver for ${node.leds} LEDs on GPIO ${node.gpio} using ${node.interface} interface`,
            );
        } catch (err) {
            node.error(
                `Failed to initialize ws281x driver: ${err.message}`,
                err,
            );
            // We can set a status to indicate the error in the editor
            node.status({ fill: 'red', shape: 'dot', text: 'Init Failed' });
        }

        node.on('close', (done) => {
            driver.finalize();
            node.log('ws281x driver finalized.');
            done();
        });
    }

    RED.nodes.registerType('ws281x-config', Ws281xConfigNode);
};
