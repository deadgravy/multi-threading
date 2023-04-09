const { parentPort, workerData } = require('worker_threads');
const Jimp = require('jimp');

// Define function to resize and compress image buffer using Jimp
async function compressImage(imageBuffer) {
    try {
        const image = await Jimp.read(imageBuffer);
        const compressedImageBuffer = await image
            .resize(800, 800)
            .quality(80)
            .getBufferAsync(Jimp.MIME_JPEG);
        return compressedImageBuffer;
    } catch (error) {
        console.error('Error in compressImage:', error);
        throw error;
    }
}

// Compress image and send result to parent thread
compressImage(workerData)
    .then((compressedImageBuffer) => {
        parentPort.postMessage(compressedImageBuffer);
    })
    .catch((error) => {
        console.error('Error in imageCompressionWorker:', error);
        parentPort.postMessage(null);
    });
