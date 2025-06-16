const helper = require('node-red-node-test-helper');
const { expect } = require('chai');
const sinon = require('sinon');

// Set mock environment variable before any other requires
process.env.WS281X_MOCK = '1';

// Create a mock ws281x with spies BEFORE requiring any modules
const mockWs281x = {
    init: sinon.stub(),
    render: sinon.spy(),
    reset: sinon.spy(),
    finalize: sinon.spy(),
    stripType: {
        WS2812: 'ws2812',
        SK6812: 'sk6812',
        SK6812W: 'sk6812w',
    }
};

// Set up the mock init to return proper channel structure
mockWs281x.init.callsFake((config) => {
    return config.channels.map(channelConfig => ({
        ...channelConfig,
        array: new Uint32Array(channelConfig.count),
        buffer: Buffer.from(new Uint32Array(channelConfig.count).buffer),
    }));
});

// Now require the modules - the driver will use its own mock, but we'll replace it
const configNode = require('../nodes/ws281x-config.js');
const outputNode = require('../nodes/ws281x-output.js');
const driver = require('../lib/driver');

helper.init(require.resolve('node-red'));

describe('WS281x Output Node', () => {
    beforeEach((done) => {
        // The driver tests may have reloaded the driver module, so we need to
        // re-require it to get the current instance
        const driverPath = require.resolve('../lib/driver');
        delete require.cache[driverPath];
        const freshDriver = require('../lib/driver');
        
        // Set our spy-enabled mock in the fresh driver instance
        freshDriver._setWs281x(mockWs281x);
        
        // Reset spies
        mockWs281x.render.resetHistory();
        mockWs281x.reset.resetHistory();
        mockWs281x.finalize.resetHistory();
        
        helper.startServer(done);
    });

    afterEach((done) => {
        helper.unload().then(() => {
            helper.stopServer(done);
        });
    });

    const flow = [
        {
            id: 'n1',
            type: 'ws281x-output',
            name: 'ws281x-out',
            server: 'n2',
            wires: [],
        },
        {
            id: 'n2',
            type: 'ws281x-config',
            name: 'ws281x-config',
            leds: '10',
        },
    ];

    it('should be loaded', (done) => {
        helper.load([outputNode, configNode], flow, () => {
            try {
                const n1 = helper.getNode('n1');
                expect(n1).to.have.property('name', 'ws281x-out');
                const n2 = helper.getNode('n2');
                expect(n2).to.have.property('name', 'ws281x-config');
                done();
            } catch (err) {
                done(err);
            }
        });
    });

    it('should be ready when configured', (done) => {
        helper.load([outputNode, configNode], flow, () => {
            const n1 = helper.getNode('n1');
            n1.on('call:status', (call) => {
                if (call.firstArg.text === 'Ready') {
                    try {
                        expect(call.firstArg.fill).to.equal('green');
                        done();
                    } catch (err) {
                        done(err);
                    }
                }
            });
        });
    });

    it('should fill the strip with a color string', (done) => {
        helper.load([outputNode, configNode], flow, () => {
            const n1 = helper.getNode('n1');
            const n2 = helper.getNode('n2');

            // Get the current driver instance (may have been reloaded)
            const currentDriver = require('../lib/driver');
            
            // Verify our mock is in place
            expect(currentDriver._ws281x).to.equal(mockWs281x);
            
            n1.receive({ payload: '#ff0000' });

            setTimeout(() => {
                try {
                    expect(mockWs281x.render.calledOnce).to.be.true;
                    const expectedColor = 0xff0000; // tinycolor('#ff0000').toHex() = 'ff0000'
                    for (const color of n2.channel.array) {
                        expect(color).to.equal(expectedColor);
                    }
                    done();
                } catch (err) {
                    done(err);
                }
            }, 100);
        });
    });

    it('should fill the strip with a numeric color', (done) => {
        helper.load([outputNode, configNode], flow, () => {
            const n1 = helper.getNode('n1');
            const n2 = helper.getNode('n2');

            n1.receive({ payload: 0x00ff00 });

            setTimeout(() => {
                try {
                    expect(mockWs281x.render.calledOnce).to.be.true;
                    const expectedColor = 0x00ff00;
                    for (const color of n2.channel.array) {
                        expect(color).to.equal(expectedColor);
                    }
                    done();
                } catch (err) {
                    done(err);
                }
            }, 100);
        });
    });

    it('should clear the strip with "clear" command', (done) => {
        helper.load([outputNode, configNode], flow, () => {
            const n1 = helper.getNode('n1');

            n1.receive({ payload: 'clear' });

            setTimeout(() => {
                try {
                    expect(mockWs281x.reset.calledOnce).to.be.true;
                    done();
                } catch (err) {
                    done(err);
                }
            }, 100);
        });
    });

    it('should set a single pixel', (done) => {
        helper.load([outputNode, configNode], flow, () => {
            const n1 = helper.getNode('n1');
            const n2 = helper.getNode('n2');

            n1.receive({ payload: { index: 3, color: 'blue' } });

            setTimeout(() => {
                try {
                    expect(mockWs281x.render.calledOnce).to.be.true;
                    expect(n2.channel.array[3]).to.equal(0x0000ff); // tinycolor('blue').toHex() = '0000ff'
                    done();
                } catch (err) {
                    done(err);
                }
            }, 100);
        });
    });

    it('should set pixels from an array', (done) => {
        helper.load([outputNode, configNode], flow, () => {
            const n1 = helper.getNode('n1');
            const n2 = helper.getNode('n2');
            const pixelData = [0xff0000, 0x00ff00, 0x0000ff];

            n1.receive({ payload: { pixels: pixelData } });

            setTimeout(() => {
                try {
                    expect(mockWs281x.render.calledOnce).to.be.true;
                    expect(n2.channel.array[0]).to.equal(pixelData[0]);
                    expect(n2.channel.array[1]).to.equal(pixelData[1]);
                    expect(n2.channel.array[2]).to.equal(pixelData[2]);
                    done();
                } catch (err) {
                    done(err);
                }
            }, 100);
        });
    });

    it('should change brightness', (done) => {
        helper.load([outputNode, configNode], flow, () => {
            const n1 = helper.getNode('n1');
            const n2 = helper.getNode('n2');

            n1.receive({ payload: { brightness: 128 } });

            setTimeout(() => {
                try {
                    expect(mockWs281x.render.calledOnce).to.be.true;
                    expect(n2.channel.brightness).to.equal(128);
                    done();
                } catch (err) {
                    done(err);
                }
            }, 100);
        });
    });

    it('should not render when payload contains render: false', (done) => {
        helper.load([outputNode, configNode], flow, () => {
            const n1 = helper.getNode('n1');

            n1.receive({ payload: { pixels: [0xff0000], render: false } });

            setTimeout(() => {
                try {
                    expect(mockWs281x.render.called).to.be.false;
                    done();
                } catch (err) {
                    done(err);
                }
            }, 50);
        });
    });
}); 