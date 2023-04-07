const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const sharp = require('sharp');
const app = express();

// Configure AWS S3 SDK
const s3 = new AWS.S3({
    accessKeyId: 'your_access_key',
    secretAccessKey: 'your_secret_key',
});

// Configure multer middleware
const storage = multer.memoryStorage();
const upload = multer({storage});

// Define endpoint to handle image upload
app.post('/upload', upload.single('image'), async (req, res) => {
    try {
        // Get the file buffer from the request
        const imageBuffer = req.file.buffer;

        // Use sharp module to compress the image
        const compressedImageBuffer = await sharp(imageBuffer)
            .resize(800, 800, {fit: 'inside', withoutEnlargement: true})
            .toBuffer();

        // Upload the compressed image to S3 bucket
        const params = {
            Bucket: 'your_bucket_name',
            Key: `${Date.now()}_${req.file.originalname}`,
            Body: compressedImageBuffer,
        };
        const uploadedData = await s3.upload(params).promise();

        // Send response to the client
        res.send({
            message: 'Image uploaded successfully',
            data: uploadedData,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: 'Error uploading image',
            error,
        });
    }
});

// Start the server
app.listen(3000, () => {
    console.log('Server running on port 3000');
});
