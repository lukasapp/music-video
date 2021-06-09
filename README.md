# Music Video Generator

Generate a simple music video easily.

![Alt text](./docs/example.gif 'Example of video')

([Full example](https://www.youtube.com/watch?v=XanW5kBm-rk))

## Getting started

> node.js 12 or later will need to be installed

```bash
git clone
cd ./music-video-generator
npm install
```

## How it works

To start your video generation run:

```bash
npm start
```

Following setting are asked:

```bash
? Path to song file:            # Full path to song file in WAV format
? First color as HEX:           # First color of the background
? Second color as HEX:          # Second color of the background
? FPS                           # Frames per second of the video
? Video resolution:             # Video resolution
? Path to output file:          # Where the output mp4 file should be saved
? Display logo in the center?   # If a logo should be displayed
? Path to logo:                 # Path to the logo. (This is only asked if the a logo should be displayed)
```
