const {parentPort, workerData} = require('worker_threads');
const sharp = require('sharp');

// Define function to resize and compress image buffer using Sharp
async function compressImage(imageBuffer) {
    const compressedImageBuffer = await sharp(imageBuffer)
        .resize(800, 800, {fit: 'inside', withoutEnlargement: true})
        .toBuffer();
    return compressedImageBuffer;
}

// Compress image and send result to parent thread
compressImage(workerData)
    .then((compressedImageBuffer) => {
        parentPort.postMessage(compressedImageBuffer);
    })
    .catch((error) => {
        console.error(error);
        parentPort.postMessage(null);
    });
