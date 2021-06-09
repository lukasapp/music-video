'use strict';

const fs = require('fs');
const wav = require('node-wav');
const inquirer = require('inquirer');
const { extractWavInfo } = require('./util');
const { renderDefaultVideo } = require('./render');
const path = './song.wav';

const _main = async () => {
  console.log('🎧 Welcome to the generator of music video generator 🎬');
  console.log('  Generate you MP4 video for your music');
  console.log('⚠️ Only supports WAV files at the moment ⚠️');

  const { path, startColor, endColor, fps, resolutionName, outputPath, hasLogo } = await inquirer.prompt([
    { type: 'input', name: 'path', default: `${process.cwd()}/song.wav`, message: 'Path to song file:' },
    { type: 'input', name: 'startColor', default: '#834DDF', message: 'First color as HEX:' },
    { type: 'input', name: 'endColor', default: '#56B2E4', message: 'Second color as HEX:' },
    { type: 'input', name: 'fps', default: '30', message: 'FPS:' },
    {
      type: 'list',
      name: 'resolutionName',
      choices: ['4K (3840 × 2160)', '2K (2560 x 1440)', 'Full HD (1920 × 1080)'],
      message: 'Video resolution:',
    },
    { type: 'input', name: 'outputPath', default: `${process.cwd()}/output.mp4`, message: 'Path to output file:' },
    { type: 'confirm', name: 'hasLogo', default: false, message: 'Display logo in the center?' },
  ]);

  let logoPath = null;

  if (hasLogo) {
    const response = await inquirer.prompt([
      { type: 'input', name: 'logoPath', default: `${process.cwd()}/logo.png`, message: 'Path to logo:' },
    ]);
    logoPath = response.logoPath;
  }

  const buffer = fs.readFileSync(path);

  const result = wav.decode(buffer);
  const { trackLength } = extractWavInfo(buffer);

  let resolution;
  switch (resolutionName) {
    case '4K (3840 × 2160)':
      resolution = { width: 3840, height: 2160 };
      break;
    case '2K (2560 x 1440)':
      resolution = { width: 2560, height: 1440 };
      break;
    case 'Full HD (1920 × 1080)':
      resolution = { width: 1920, height: 1080 };
      break;
  }

  renderDefaultVideo(
    result.channelData[0],
    path,
    outputPath,
    logoPath,
    trackLength,
    startColor,
    endColor,
    fps,
    resolution,
  )
    .then(() => {
      console.log('✅ Video generation done');
      console.log(`✅ File can be found at: ${outputPath}`);
    })
    .catch((err) => console.error(err));
};

_main();
