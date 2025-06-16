# node-red-contrib-ws281x

[![npm](https://img.shields.io/npm/v/node-red-contrib-ws281x.svg)](https://www.npmjs.com/package/node-red-contrib-ws281x) [![downloads](https://img.shields.io/npm/dm/node-red-contrib-ws281x.svg)](https://www.npmjs.com/package/node-red-contrib-ws281x) [![Node-RED](https://img.shields.io/badge/Node--RED-2.x%20%2F%203.x%20%7C%204.x-brightgreen)](https://nodered.org/) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Node-RED nodes to control WS281x (Neopixel) LEDs on a Raspberry Pi.

This package provides nodes to interface with `rpi-ws281x-native`, a library that provides native bindings to the rpi_ws281x library by Jeremy Garff.

**Note: This will only work on a Raspberry Pi and requires running Node-RED with root privileges (except for SPI interface).**

## Installation

> **Important:** As of 31 Jan 2022 the Node-RED community encourages **scoped package names** for newly-published nodes ([Packaging guidelines](https://nodered.org/docs/creating-nodes/packaging#naming)).  
> This module predates that change, so the un-scoped name remains available for backwards-compatibility.  
> If you are forking or creating a brand-new package we recommend publishing it as `@your-scope/node-red-ws281x` (or similar) and replacing the command below accordingly.

Run the following command in your Node-RED user directory (typically `~/.node-red`):

```bash
npm install node-red-contrib-ws281x # or: npm install @your-scope/node-red-ws281x
```

## Interface Options

This package supports **three different interfaces** for controlling WS281x LEDs:

### 🎯 **PWM (Default)**

- **GPIO Pins**: 12, 18 (only these available on Pi 4B)
- **Pros**: Standard interface, well-tested
- **Cons**: Conflicts with analog audio
- **Setup**: Disable audio in `/boot/config.txt` with `dtparam=audio=off`

### ⭐ **PCM (Recommended for Audio Users)**

- **GPIO Pin**: 21 (Physical pin 40)
- **Pros**: **Keeps analog audio working**, good performance
- **Cons**: Conflicts with I2S digital audio devices
- **Best for**: Users who need analog audio output

### 🚀 **SPI (Highest Performance)**

- **GPIO Pin**: 10 (SPI0 MOSI)
- **Pros**: **Lowest CPU usage (1% vs 5%)**, no root required\*, both analog and digital audio work
- **Cons**: Requires SPI bus exclusive access
- **Setup Required**: See SPI configuration below

## SPI Interface Setup

For **SPI interface** (recommended for performance):

### Pi 4B Configuration:

```bash
# Add to /boot/cmdline.txt (append to existing line)
spidev.bufsiz=32768

# Add to /boot/config.txt
core_freq=500
core_freq_min=500
```

### Pi 3B Configuration:

```bash
# Add to /boot/cmdline.txt (append to existing line)
spidev.bufsiz=32768

# Add to /boot/config.txt
core_freq=250
```

### User Permissions:

```bash
sudo usermod -a -G gpio pi
```

\*SPI interface doesn't require root when user is in gpio group.

## Usage

This package provides two nodes:

- **ws281x-config**: A configuration node to initialize the LED driver.
- **ws281x-output**: An output node to send color data to the LEDs.

### Configuration

1.  Add a `ws281x-output` node to your flow.
2.  In the node's properties, click the pencil icon to add a new `ws281x-config` controller.
3.  **Select your preferred interface** (PWM/PCM/SPI) and configure:
    - **60 LEDs**: Set LED count to 60
    - **PCM Interface**: Select PCM, GPIO will auto-set to 21
    - **SPI Interface**: Select SPI, GPIO will auto-set to 10
4.  Deploy the flow to initialize the driver.

### Sending Data

The `ws281x-output` node accepts various `msg.payload` formats:

#### String Commands

- `"clear"`: Sets all LEDs to black.
- `"render"` or `"show"`: Sends the current color data to the LEDs.
- Any CSS color string (e.g., `"red"`, `"#ff0000"`): Fills the entire strip with that color.

**Example:**

```json
{ "payload": "red" }
```

#### Numeric Color

A number representing a **24-bit RGB** colour in the form `0xRRGGBB` (e.g. `0xff0000` for red).  
⚠️ **Important:** Do <u>not</u> include an alpha byte – values like `0xff0000ff` (RGBA) will produce incorrect colours on the strip.

**Example:**

```json
{ "payload": 16711680 }
```

#### Object Payloads

For more specific control, you can send an object:

- **Set a single pixel:** `{ "index": 5, "color": "blue" }`
- **Set multiple pixels:** `{ "pixels": [0xff0000, 0x00ff00, 0x0000ff] }`
- **Change brightness:** `{ "brightness": 128 }`
- **Prevent immediate rendering:** `{ "pixels": [...], "render": false }`

## Prerequisites

- A Raspberry Pi with Raspbian or a similar OS.
- Node.js and Node-RED installed.
- External 5V power supply for 60 LEDs (5A+ recommended)
- Logic level shifter (74AHCT125 or similar) for 3.3V→5V conversion

## Performance Comparison

For 60 LEDs on Pi 4B:

| Interface | CPU Usage | Audio Compatibility | Root Required |
| --------- | --------- | ------------------- | ------------- |
| **PWM**   | 5%        | ❌ Conflicts        | ✅ Yes        |
| **PCM**   | 5%        | ✅ Analog only      | ✅ Yes        |
| **SPI**   | 1%        | ✅ Both types       | ❌ No\*       |

\*When user is in gpio group

## Example Configuration

**For PCM (keeps analog audio):**

```javascript
{
  "interface": "PCM",
  "gpio": 21,
  "leds": 60,
  "brightness": 150
}
```

**For SPI (best performance):**

```javascript
{
  "interface": "SPI",
  "gpio": 10,
  "leds": 60,
  "brightness": 150
}
```

## License

This project is licensed under the MIT License.

#### **SPI Interface Detailed Analysis**

**Pros:**

- **Superior Performance**: Lowest CPU usage (~1% vs 5% for PWM/PCM) - hardware-driven timing
- **Audio Compatibility**: Both analog AND digital audio work perfectly - no conflicts with audio subsystems
- **System Stability**: No root privileges required when user is in `gpio` group, more predictable timing
- **Mature Implementation**: Well-established protocol with hardware acceleration via dedicated SPI controller

**Cons:**

- **Hardware Limitations**: Single GPIO pin only (GPIO 10), shared SPI bus conflicts with other SPI devices
- **Setup Requirements**: SPI interface must be enabled via `raspi-config`, slightly more complex configuration
- **Protocol Constraints**: Fixed timing ratios, each WS2812 bit requires 3 SPI bits encoding

**References:**

- [rpi-ws281x Official Documentation](https://pypi.org/project/rpi-ws281x/)
- [ws2812-spi Python Implementation](https://github.com/joosteto/ws2812-spi)
- [Jeremy Garff's rpi_ws281x Library](https://github.com/jgarff/rpi_ws281x)

## Open-Source, Naming & Packaging

This project follows the [official Node-RED packaging best-practices](https://nodered.org/docs/creating-nodes/packaging):

* `node-red` is included in the `keywords` field of `package.json` so the node can be discovered in the palette manager.
* A valid [`node-red` block](https://nodered.org/docs/creating-nodes/packaging#packagejson) declares the runtime files for the flow engine.
* The repository is licensed under the permissive **MIT License** making it suitable for both private and commercial use.
* Continuous integration is provided by the public test-suite (`npm test`) so you can verify behaviour after every contribution.

If you intend to publish your own fork to npm please ensure you:

1. Use a **scoped name** such as `@my-org/node-red-awesome`.
2. Include a clear `README.md`, `LICENSE`, and at least one example flow (see `examples/` in the docs).
3. Validate the package locally with `npx node-red-dev validate` to achieve a green **Node Scorecard** before releasing.

By following these steps your node will be eligible for inclusion in the [Node-RED Flow Library](https://flows.nodered.org/) and receive a public **scorecard** that helps users judge quality and maintenance status.

---
