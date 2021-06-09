'use strict';

/**
 * Extracts the bytes from the buffer and converts them to a number.
 *
 * @param {Buffer} buffer
 * @param {number} start start byte
 * @param {number} numberOfBytes bytes to read
 * @returns Result as number
 */
const _extractHex = (buffer, start, numberOfBytes) => {
  let response = '';
  const split = buffer
    .slice(start, start + numberOfBytes)
    .toString('hex')
    .match(/.{2}/g);

  for (let i = split.length - 1; i >= 0; i--) {
    response += split[i];
  }

  return Number(`0x${response}`);
};

/**
 * Extracts the bytes from the buffer and converts them to a string.
 *
 * @param {*} buffer
 * @param {number} start start byte
 * @param {number} numberOfBytes bytes to read
 * @param {boolean} breakOnZero stop when 0 is read
 * @returns Result as string
 */
const _extractString = (buffer, start, numberOfBytes, breakOnZero = true) => {
  let response = '';
  for (let i = start; i < start + numberOfBytes; i++) {
    if (buffer[i] === 0 && breakOnZero) {
      break;
    }
    response += String.fromCharCode(buffer[i]);
  }
  return response;
};

/**
 * Extracts the WAV file information.
 *
 * @param {Buffer} buffer
 * @returns {object} {
 *                     chunkSize,
 *                     formatDataLength,
 *                     formatType,
 *                     numberOfChannels,
 *                     sampleRate,
 *                     byteRate,
 *                     blockAlign,
 *                     bitsPerSample,
 *                     dataHeader,
 *                     subchunk2Size,
 *                     trackLength,
 *                   }
 */
const extractWavInfo = (buffer) => {
  // SUPER HELPFUL FOR HEADER INFO:
  // https://hybridego.net/entry/WAV-File-Format-Header

  const chunkSize = _extractHex(buffer, 4, 4);
  const formatDataLength = _extractHex(buffer, 16, 4);
  const formatType = _extractHex(buffer, 20, 2);
  const numberOfChannels = _extractHex(buffer, 22, 2);
  const sampleRate = _extractHex(buffer, 24, 4);
  const byteRate = _extractHex(buffer, 28, 4, false);
  const blockAlign = _extractHex(buffer, 32, 2);
  const bitsPerSample = _extractHex(buffer, 34, 2);
  const dataHeader = _extractString(buffer, 36, 4);
  const subchunk2Size = _extractHex(buffer, 40, 4);
  const trackLength = subchunk2Size / byteRate;

  return {
    chunkSize,
    formatDataLength,
    formatType,
    numberOfChannels,
    sampleRate,
    byteRate,
    blockAlign,
    bitsPerSample,
    dataHeader,
    subchunk2Size,
    trackLength,
  };
};

module.exports = {
  extractWavInfo,
};
