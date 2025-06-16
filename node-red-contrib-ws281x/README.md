# node-red-contrib-ws281x

Node-RED nodes to control WS281x (Neopixel) LEDs on a Raspberry Pi.

This package provides nodes to interface with `rpi-ws281x-native`, a library that provides native bindings to the rpi_ws281x library by Jeremy Garff.

**Note: This will only work on a Raspberry Pi and requires running Node-RED with root privileges.**

## Installation

Run the following command in your Node-RED user directory (typically `~/.node-red`):

```bash
npm install node-red-contrib-ws281x
```

## Usage

This package provides two nodes:

*   **ws281x-config**: A configuration node to initialize the LED driver.
*   **ws281x-output**: An output node to send color data to the LEDs.

### Configuration

1.  Add a `ws281x-output` node to your flow.
2.  In the node's properties, click the pencil icon to add a new `ws281x-config` controller.
3.  Configure the controller with the number of LEDs, GPIO pin, and other settings for your LED strip.
4.  Deploy the flow to initialize the driver.

### Sending Data

The `ws281x-output` node accepts various `msg.payload` formats:

#### String Commands

*   `"clear"`: Sets all LEDs to black.
*   `"render"` or `"show"`: Sends the current color data to the LEDs.
*   Any CSS color string (e.g., `"red"`, `"#ff0000"`): Fills the entire strip with that color.

**Example:**

```json
{ "payload": "red" }
```

#### Numeric Color

A number representing a 24-bit RGB color (e.g., `0xff0000` for red). Fills the entire strip.

**Example:**

```json
{ "payload": 16711680 }
```

#### Object Payloads

For more specific control, you can send an object:

*   **Set a single pixel:** `{ "index": 5, "color": "blue" }`
*   **Set multiple pixels:** `{ "pixels": [0xff0000, 0x00ff00, 0x0000ff] }`
*   **Change brightness:** `{ "brightness": 128 }`
*   **Prevent immediate rendering:** `{ "pixels": [...], "render": false }`

## Prerequisites

*   A Raspberry Pi with Raspbian or a similar OS.
*   Node.js and Node-RED installed.
*   WS281x LEDs properly connected to the Raspberry Pi's GPIO pins, including a logic level shifter.
*   The user running Node-RED must have permission to access GPIO memory. It is often easiest to run `sudo node-red-start`.

## License

This project is licensed under the MIT License. 