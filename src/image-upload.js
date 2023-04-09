const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const Jimp = require('jimp');
const {Worker} = require('worker_threads');
const cors = require('cors');
const app = express();

// Set up CORS middleware
app.use(
    cors({
        origin: 'http://localhost:3001',
        methods: ['GET', 'POST'],
        optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
    })
);

// Configure AWS S3 SDK
const s3 = new AWS.S3({
    accessKeyId: 'AKIA4REW4G64T6ZHBDOA',
    secretAccessKey: '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',
});

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

            // Upload each compressed image to S3 bucket in parallel using Promise.all()
            const uploadedData = await Promise.all(
                compressedImageBuffers.map((buffer, index) => {
                    const params = {
                        Bucket: 'pet.project.bucket',
                        Key: `${Date.now()}_${req.files[index].originalname}`,
                        Body: buffer,
                    };
                    return s3.upload(params).promise();
                })
            );

            // Send response to the client
            res.send({
                message: 'Images compressed and uploaded successfully',
                data: uploadedData,
            });
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
            // Get the array of file buffers from the request
            const imageBuffers = req.files.map((file) => file.buffer);

            // Start a new worker thread to compress each image
            const workers = imageBuffers.map((imageBuffer) => {
                return new Promise((resolve, reject) => {
                    const worker = new Worker('./image-compression-worker.js', {
                        workerData: imageBuffer,
                    });
                    worker.on('message', resolve);
                    worker.on('error', reject);
                });
            });

            // Wait for all worker threads to finish using Promise.all()
            const compressedImageBuffers = await Promise.all(workers);

            // Upload each compressed image to S3 bucket in parallel using Promise.all()
            const uploadedData = await Promise.all(
                compressedImageBuffers.map((buffer, index) => {
                    const params = {
                        Bucket: 'pet.project.bucket',
                        Key: `${Date.now()}_${req.files[index].originalname}`,
                        Body: buffer,
                    };
                    return s3.upload(params).promise();
                })
            );

            // Send response to the
            // client
            res.send({
                message: 'Images compressed and uploaded successfully',
                data: uploadedData,
            });
        } catch (error) {
            console.error(error);
            res.status(500).send({
                message: 'Error compressing images',
                error,
            });
        }
    }
);

// Start the server
app.listen(3000, () => {
    console.log('Server running on port 3000');
});