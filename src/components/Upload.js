import React, { useState } from 'react';
import axios from 'axios';
import imageCompression from 'browser-image-compression';
import LazyImage from './LazyImage';

function ImageUploader() {
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);

  const axiosInstance = axios.create({
    baseURL: 'http://localhost:3000',
  });

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    setImages(files);
  };

  const compressImages = async (images) => {
    console.log("Input images:", images); // Add this line
    const compressedImages = await Promise.all(
      images.map((image) =>
        imageCompression(image, {
          maxSizeMB: 1,
          maxWidthOrHeight: 800,
          useWebWorker: true,
        })
      )
    );
    console.log("Compressed images:", compressedImages); // Add this line
    return compressedImages;
  };

  const handleUpload = async (endpoint) => {
    setUploading(true);
    try {
      const compressedImages = await compressImages(images);
      const formData = new FormData();
      compressedImages.forEach((image) => {
        formData.append('images', image);
      });

      console.log("Form Data:", formData); // Add this line

      const response = await axiosInstance.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setImages([]);
      setUploading(false);
      const imageLocations = response.data.data.map((data) => data.Location);
      setUploadedImages(imageLocations);
    } catch (error) {
      console.error(error);
      setUploading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <input type="file" onChange={handleFileChange} multiple />
        <button
          onClick={() => handleUpload('/blocking-compress')}
          disabled={uploading || images.length === 0}
        >
          {uploading ? 'Uploading (Blocking)...' : 'Upload (Blocking)'}
        </button>
        <button
          style={{ marginLeft: '10px' }}
          onClick={() => handleUpload('/non-blocking-compress')}
          disabled={uploading || images.length === 0}
        >
          {uploading ? 'Uploading (Non-blocking)...' : 'Upload (Non-blocking)'}
        </button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {uploadedImages.map((imageUrl, index) => (
          <div key={index} style={{ marginRight: '10px', marginBottom: '10px' }}>
             <LazyImage src={imageUrl} alt={`Uploaded image ${index}`} width="200" height="200" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default ImageUploader;