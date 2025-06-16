module.exports = function (RED) {
    'use strict';
    const driver = require('../lib/driver');
    const tinycolor = require('tinycolor2');

    function Ws281xOutputNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.server = RED.nodes.getNode(config.server);
        node.renderOnMsg = config.renderOnMsg;

        if (!node.server) {
            node.status({ fill: 'red', shape: 'dot', text: 'Not configured' });
            return;
        }

        node.status({ fill: 'green', shape: 'dot', text: 'Ready' });

        node.on('input', function (msg, send, done) {
            console.log('Output node received message:', msg.payload);
            
            // Get the channel from the config node instance
            const channel = node.server.channel;
            if (!channel) {
                console.log('No channel available');
                node.error('ws281x driver not initialized. Deploy config first.', msg);
                node.status({ fill: 'red', shape: 'dot', text: 'Driver Error' });
                if (done) done();
                return;
            }

            console.log('Channel available, processing payload');
            const payload = msg.payload;
            let render = true; // Default to rendering after a change.

            try {
                if (typeof payload === 'string') {
                    console.log('Processing string payload:', payload);
                    // Handle commands or a single color for the whole strip
                    if (payload.toLowerCase() === 'clear') {
                        console.log('Calling driver.reset()');
                        driver.reset(); // reset() clears and renders
                        render = false;
                        node.status({ fill: 'green', shape: 'dot', text: 'Ready' });
                    } else if (payload.toLowerCase() === 'render' || payload.toLowerCase() === 'show') {
                        // Just render the current state
                        render = true;
                    }
                    else {
                        const color = tinycolor(payload);
                        if (color.isValid()) {
                            const hexColor = parseInt(color.toHex8(), 16);
                            console.log('Setting color:', hexColor);
                            for (let i = 0; i < channel.count; i++) {
                                channel.array[i] = hexColor;
                            }
                        } else {
                            throw new Error(`Invalid color string: ${payload}`);
                        }
                    }
                } else if (typeof payload === 'number') {
                    console.log('Processing numeric payload:', payload);
                    // Fill strip with a single numeric color
                    for (let i = 0; i < channel.count; i++) {
                        channel.array[i] = payload;
                    }
                } else if (typeof payload === 'object' && payload !== null) {
                    console.log('Processing object payload:', payload);
                    if (Array.isArray(payload.pixels)) {
                        const pixelData = payload.pixels;
                        const len = Math.min(channel.count, pixelData.length);
                        for (let i = 0; i < len; i++) {
                            channel.array[i] = pixelData[i];
                        }
                    } else if (payload.index !== undefined && payload.color !== undefined) {
                        const color = tinycolor(payload.color);
                        if (color.isValid()) {
                            const hexColor = parseInt(color.toHex8(), 16);
                            if (payload.index >= 0 && payload.index < channel.count) {
                                channel.array[payload.index] = hexColor;
                            }
                        }
                    } else if (payload.brightness !== undefined) {
                        const brightness = parseInt(payload.brightness, 10);
                        if (brightness >= 0 && brightness <= 255) {
                            channel.brightness = brightness;
                        }
                    }

                    if (payload.render === false) {
                        render = false;
                    }
                }

                // Render if not explicitly told not to, or if the node is configured to render on every message.
                if (render || node.renderOnMsg) {
                    console.log('Calling driver.render()');
                    driver.render();
                }

                node.status({ fill: 'green', shape: 'dot', text: 'Ready' });

                if (done) {
                    done();
                }
            } catch (err) {
                console.log('Error in output node:', err);
                if (done) {
                    done(err);
                } else {
                    node.error(err, msg);
                }
                node.status({ fill: 'red', shape: 'dot', text: 'Error' });
            }
        });

        node.on('close', function () {
            // The config node handles finalization, but we can clear status.
            node.status({});
        });
    }

    RED.nodes.registerType('ws281x-output', Ws281xOutputNode);
}; 