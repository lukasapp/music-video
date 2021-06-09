'use strict';

const fs = require('fs');
const { spawn } = require('child_process');
const { createCanvas, loadImage } = require('canvas');
const ft = require('fourier-transform');
const { animate, easeInOut } = require('popmotion');

const renderDefaultVideo = (samples, path, outputPath, logoPath, duration, startColor, endColor, fps, resolution) => {
  return new Promise(async (resolve, reject) => {
    if (fs.existsSync(`${process.cwd()}/build`) === false) fs.mkdirSync(`${process.cwd()}/build`);

    // Delete file
    try {
      if (outputPath) fs.unlinkSync(outputPath);
    } catch (e) {}

    const loopEvery = 4;

    const sqrSize = 192;

    // Convert colors.
    const startRgbHex = startColor.replace('#', '').match(/.{1,2}/g);
    const startRgb = [parseInt(startRgbHex[0], 16), parseInt(startRgbHex[1], 16), parseInt(startRgbHex[2], 16)];
    const endRgbHex = endColor.replace('#', '').match(/.{1,2}/g);
    const endRgb = [parseInt(endRgbHex[0], 16), parseInt(endRgbHex[1], 16), parseInt(endRgbHex[2], 16)];

    const stepHeight = Math.ceil(resolution.height / sqrSize);
    const stepWidth = Math.ceil(resolution.width / sqrSize);
    let rDiff = Math.abs(startRgb[0] - endRgb[0]) / stepWidth;
    let gDiff = Math.abs(startRgb[1] - endRgb[1]) / stepWidth;
    let bDiff = Math.abs(startRgb[2] - endRgb[2]) / stepWidth;
    if (startRgb[0] > endRgb[0]) {
      rDiff *= -1;
    }
    if (startRgb[1] > endRgb[1]) {
      gDiff *= -1;
    }
    if (startRgb[2] > endRgb[2]) {
      bDiff *= -1;
    }

    const colorGrid = [];
    const offsets = await _getAnimation(fps);

    for (var i = 0; i < stepWidth; i++) {
      colorGrid[i] = [];
      for (var j = 0; j < stepHeight; j++) {
        let currentR;
        let currentG;
        let currentB;
        currentR = startRgb[0] + rDiff * i;
        currentG = startRgb[1] + gDiff * i;
        currentB = startRgb[2] + bDiff * i;

        colorGrid[i][j] = {
          r: Math.floor(currentR),
          g: Math.floor(currentG),
          b: Math.floor(currentB),
        };
      }
    }
    for (var i = 0; i < stepWidth; i++) {
      colorGrid[i + stepWidth] = [];
      for (var j = 0; j < stepHeight; j++) {
        let currentR;
        let currentG;
        let currentB;
        currentR = endRgb[0] - rDiff * i;
        currentG = endRgb[1] - gDiff * i;
        currentB = endRgb[2] - bDiff * i;

        colorGrid[i + stepWidth][j] = {
          r: Math.floor(currentR),
          g: Math.floor(currentG),
          b: Math.floor(currentB),
        };
      }
    }

    const shiftEveryXFps = Math.ceil((fps * loopEvery) / colorGrid.length);

    let waitFor = [];

    let logo = null;
    if (logoPath) {
      logo = await loadImage(`${process.cwd()}/logo.png`);
    }

    for (let i = 0; i < Math.floor(fps * duration); i++) {
      if (i % shiftEveryXFps === 0) {
        const first = colorGrid[0];
        colorGrid.shift();
        colorGrid.push(first);
      }
      waitFor.push(
        _renderFrame(
          samples,
          i,
          {
            ...resolution,
            colorGrid,
            logoOffset: offsets[i % offsets.length],
          },
          logo,
        ),
      );
      console.log(`${i}/${fps * duration}`);
      if (i % (fps * 2) === 0) {
        console.log('Wait for render to finish');

        await Promise.all(waitFor);
        waitFor = [];
      }
    }

    console.log('Wait for render to finish');
    await Promise.all(waitFor);
    console.log('Done');

    console.log('Generating Video...');
    const ffmpeg = spawn('ffmpeg', [
      '-t',
      duration,
      '-i',
      `${process.cwd()}/build/%d-frame.png`,
      '-i',
      path,
      '-preset',
      'slower',
      '-f',
      'mp4',
      '-r',
      fps,
      outputPath,
    ]);
    ffmpeg.stdout.on('data', (data) => {
      console.log(`${data}`);
    });

    ffmpeg.stderr.on('data', (data) => {
      console.log(`${data}`);
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject();
      }
    });
  });
};

const _renderFrame = (samples, frameCounter, options, logo) => {
  return new Promise(async (resolve) => {
    const image = createCanvas(options.width, options.height);
    const ctx = image.getContext('2d');

    const sqrSize = 192;
    const stepHeight = Math.ceil(options.height / sqrSize);
    const stepWidth = Math.ceil(options.width / sqrSize);

    // Background.
    for (var x = 0; x < stepWidth; x++) {
      for (var y = 0; y < stepHeight; y++) {
        ctx.fillStyle = `rgb(${options.colorGrid[x + (y % options.colorGrid.length)][y].r},${
          options.colorGrid[x + (y % options.colorGrid.length)][y].g
        },${options.colorGrid[x + (y % options.colorGrid.length)][y].b})`;

        ctx.fillRect(x * sqrSize, y * sqrSize, sqrSize, sqrSize);
      }
    }

    const logoSize = options.height / 4;

    if (logo) {
      ctx.drawImage(
        logo,
        options.width / 2 - logoSize / 2,
        options.height / 2 - logoSize / 2 + options.logoOffset,
        logoSize,
        logoSize,
      );
    }
    const out = fs.createWriteStream(`${process.cwd()}/build/${frameCounter}-frame.png`);

    const stream = image.createPNGStream();
    stream.pipe(out);
    out.on('finish', () => resolve());
  });
};

const _getAnimation = (fps) => {
  return new Promise((resolve) => {
    let offset = [];
    let count = 0;
    const duration = 3;
    animate({
      from: -100,
      to: 100,
      duration: duration * 1000,
      ease: easeInOut,
      onUpdate: (latest) => (offset[count++] = latest),
      onComplete: () => {
        const points = [];

        const every = Math.ceil(offset.length / (duration * fps));

        for (let i = 0; i < duration * fps; i++) {
          if (every * i < offset.length) points[i] = offset[every * i];
          else points[i] = 100;
        }

        resolve([...points, ...points.reverse()]);
      },
    });
  });
};

const _renderFreqFrame = (samples, frameCounter, options) => {
  return new Promise(async (resolve) => {
    const image = createCanvas(options.width, options.height);
    const ctx = image.getContext('2d');

    const frequency = 440;
    const size = 1024;
    const sampleRate = 48000;
    const waveform = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      waveform[i] = Math.sin(frequency * Math.PI * 2 * (i / sampleRate));
    }

    //get normalized magnitudes for frequencies from 0 to 22050 with interval 44100/1024 ≈ 43Hz
    const spectrum = ft(samples);
    const pos = options.width / spectrum.length;

    const logo = await loadImage(`${process.cwd()}/logo.png`);
    const logoSize = options.height / 4;
    ctx.drawImage(logo, 0, 0, 512, 512);
    const out = fs.createWriteStream(`${process.cwd()}/build/${frameCounter}-frame.jpg`);
    const stream = image.createJPEGStream();
    stream.pipe(out);
    out.on('finish', () => resolve());
  });
};

module.exports = {
  renderDefaultVideo,
};
