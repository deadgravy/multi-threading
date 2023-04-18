const { parentPort, workerData } = require('worker_threads');
const Jimp = require('jimp');

async function compressImage(buffer) {
    try {
      // console.log('Received buffer in worker:', buffer);
      const imageBuffer = Buffer.from(buffer); // Convert Uint8Array to Buffer
      const image = await Jimp.read(imageBuffer); // Pass the Buffer to Jimp
      const compressedBuffer = await image
        .resize(800, 800)
        .quality(80)
        .getBufferAsync(Jimp.MIME_JPEG);
      parentPort.postMessage(compressedBuffer);
    } catch (error) {
      console.error('Error compressing image:', error);
      parentPort.postMessage(null);
    }
  }

compressImage(workerData);