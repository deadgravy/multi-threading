const express = require('express');
const multer = require('multer');
const Jimp = require('jimp');
const {Worker} = require('worker_threads');
const cors = require('cors');
const app = express();
const {S3Lib, S3ObjectBuilder, Metadata} = require('../Packages/s3-simplified/dist');

// Set up CORS middleware
app.use(
    cors({
        origin: 'http://localhost:3001',
        methods: ['GET', 'POST'],
        optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
    })
);

const getBucket = (() => {
    let bucket;
    /**
     * @returns {Promise<S3Bucket>}
     */
    return async () => {
        if (!bucket) {
            bucket = await S3Lib.Default.getOrCreateBucket('pet.project.bucket');
            // bucket = await S3Lib.Default.getOrCreateBucket('imagebuckettesting');
        }
        return bucket;
    }
})()
// Configure multer middleware to handle multiple image uploads
const upload = multer({
    storage: multer.memoryStorage(),
});

// Define endpoint to handle blocking image compression for multiple images
app.post(
    '/blocking-compress',
    upload.array('images', 200),
    async (req, res) => {
        try {
            // Start the timer
            console.time('blocking-compress');
            // Get the array of file buffers from the request
            const imageBuffers = req.files.map((file) => file.buffer);

            // Compress each image in parallel using Promise.all()
            const compressedImageBuffers = await Promise.all(
                imageBuffers.map((buffer) => {
                    return Jimp.read(buffer).then((image) => {
                        return image
                            .resize(800, 800)
                            .quality(80)
                            .getBufferAsync(Jimp.MIME_JPEG);
                    });
                })
            );

            const uploadedData = await UploadToS3(compressedImageBuffers);
            // Send response to the client
            res.send({
                message: 'Images compressed and uploaded successfully',
                data: uploadedData,
            });

            // End the timer
            console.timeEnd('blocking-compress');
        } catch (error) {
            console.error(error);
            res.status(500).send({
                message: 'Error compressing images',
                error,
            });
        }
    }
);
// Define endpoint to handle non-blocking image compression for multiple images
app.post(
    '/non-blocking-compress',
    upload.array('images', 200),
    async (req, res) => {
        try {
            // Start the timer
            console.time('non-blocking-compress');

            // Get the array of file buffers from the request
            const imageBuffers = req.files.map((file) => file.buffer);

            // console.log('Received image buffers:', imageBuffers.length);

            // Generate unique file names for each image
            const fileNames = req.files.map(
                (file) => `${Date.now()}_${file.originalname}`
            );

            // Compress each image using worker threads and Promise.all()
            const compressedImageBuffers = await Promise.all(
                imageBuffers.map((buffer) => {
                    return new Promise((resolve, reject) => {
                        const worker = new Worker(
                            './src/image-compression-worker.js',
                            {
                                workerData: buffer,
                            }
                        );
                        worker.on('message', (result) => {
                            console.log('Compressed buffer:', result);
                            resolve(result);
                        });
                        worker.on('error', (error) => {
                            console.error('Worker error:', error);
                            reject(error);
                        });
                        worker.on('exit', (code) => {
                            if (code !== 0) {
                                const errMsg = `Worker stopped with exit code ${code}`;
                                console.error(errMsg);
                                reject(new Error(errMsg));
                            }
                        });
                    }).catch((error) => {
                        console.error('Error during image compression:', error);
                        throw error;
                    });
                })
            );

            // console.log(
            //     'Compressed image buffers:',
            //     compressedImageBuffers.length
            // );

            // Upload each compressed image to S3 bucket in parallel using Promise.all()

            const uploadedData = await UploadToS3(compressedImageBuffers);

            // Send response to the client
            res.send({
                message: 'Images compressed and uploaded successfully',
                data: uploadedData,
            });

            // End the timer
            console.timeEnd('non-blocking-compress');
        } catch (error) {
            console.error('Error in /non-blocking-compress endpoint:', error);
            res.status(500).send({
                message: 'Error compressing images',
                error: error.message,
            });
        }
    }
);

async function UploadToS3(compressedImageBuffers) {
    const parseData = compressedImageBuffers.map(buffer => {
        const metadata = new Metadata({
            'Content-Type': 'image/jpeg',
            'Content-Length': buffer.length.toString(),
        });
        return new S3ObjectBuilder(buffer, metadata);
    })

    const bucket = await getBucket();
    const uploadedData = await Promise.all(
        parseData.map(builder => bucket.createObject(builder))
    );
    return Promise.all(uploadedData.map(data => data.generateLink()));
}

// Start the server
app.listen(3000, () => {
    console.log('Server running on port 3000');
});
