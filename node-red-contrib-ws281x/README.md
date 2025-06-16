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

See the node's help information in the Node-RED editor for more details.

## Prerequisites

*   A Raspberry Pi with Raspbian or a similar OS.
*   Node.js and Node-RED installed.
*   WS281x LEDs properly connected to the Raspberry Pi's GPIO pins, including a logic level shifter.
*   The user running Node-RED must have permission to access GPIO memory. It is often easiest to run `sudo node-red-start`.

## License

This project is licensed under the MIT License. 