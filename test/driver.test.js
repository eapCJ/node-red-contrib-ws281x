const { expect } = require('chai');
const sinon = require('sinon');

// Set this before requiring the driver to ensure the mock is used.
process.env.WS281X_MOCK = '1';

// We need to bust the require cache to re-import the driver in a clean state for each test.
function requireDriver() {
    const driverPath = require.resolve('../lib/driver');
    delete require.cache[driverPath];
    return require(driverPath);
}

describe('Driver Wrapper', () => {
    let driver;
    const channelConfig = {
        dma: 10,
        freq: 800000,
        channels: [
            {
                count: 10,
                gpio: 18,
                invert: false,
                brightness: 255,
                stripType: 'ws2812',
            },
        ],
    };

    beforeEach(() => {
        // Get a fresh driver instance for each test.
        driver = requireDriver();
    });

    afterEach(() => {
        // Clean up any lingering driver instance.
        driver.finalize();
        sinon.restore();
    });

    it('should initialize the driver and return a channel array', () => {
        const channels = driver.init(channelConfig);
        expect(channels).to.be.an('array');
        expect(channels).to.have.lengthOf(1);
        expect(channels[0]).to.have.property('count', 10);
        expect(channels[0]).to.have.property('array').that.is.a('Uint32Array');
    });

    it('should act as a singleton, returning the same instance on subsequent inits', () => {
        const channels1 = driver.init(channelConfig);
        const channels2 = driver.init(channelConfig);
        expect(channels1).to.equal(channels2);
    });

    describe('Reference Counting', () => {
        it('should initialize with refCount 1', () => {
            driver.init(channelConfig);
            // We can't access refCount directly, so we test its effects.
            // We'll infer it by calling finalize and then initing again.
            driver.finalize(); // refCount becomes 0, driver is reset.

            const channels = driver.init(channelConfig); // Should re-initialize.
            expect(channels).to.be.an('array'); // Confirms it re-initialized.
        });

        it('should increment refCount on subsequent inits', () => {
            driver.init(channelConfig); // refCount = 1
            driver.init(channelConfig); // refCount = 2
            driver.finalize(); // refCount = 1, driver should not be reset.

            const channels = driver.init(channelConfig); // refCount = 2, should be same instance
            expect(channels).to.be.an('array');

            // Finalize twice to clean up
            driver.finalize(); // refCount = 1
            driver.finalize(); // refCount = 0
        });

        it('should finalize the driver only when refCount reaches 0', () => {
            // To test this, we need to spy on the underlying ws281x.finalize.
            // Since we are mocking, we can't directly spy on the `require`.
            // This is a limitation of the current mock setup.
            // We can only test the observable behavior.

            driver.init(channelConfig); // refCount = 1
            driver.init(channelConfig); // refCount = 2

            driver.finalize(); // refCount becomes 1. Driver should NOT be finalized.

            // If the driver were finalized, this would throw or return a new instance.
            const channels1 = driver.init(channelConfig);

            driver.finalize(); // refCount becomes 1 again
            driver.finalize(); // refCount becomes 0. Driver IS finalized.

            // Now, init should return a new instance.
            const channels2 = driver.init(channelConfig);

            expect(channels1).to.not.equal(
                channels2,
                'A new driver instance should be created after finalization.',
            );
        });
    });

    it('should expose stripType constants', () => {
        const stripTypes = driver.stripType;
        expect(stripTypes).to.have.property('WS2812', 'ws2812');
        expect(stripTypes).to.have.property('SK6812', 'sk6812');
    });

    it('should expose render and reset functions', () => {
        expect(driver.render).to.be.a('function');
        expect(driver.reset).to.be.a('function');
        // We don't test their internals as they are direct pass-throughs to the mock.
    });
});
