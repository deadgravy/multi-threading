import React, { useState } from 'react';
import axios from 'axios';
import RegularImage from './RegularImage';

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

  const handleBlockingCompress = async () => {
    setUploading(true);
    const formData = new FormData();
    images.forEach((image) => {
      formData.append('images', image);
    });
    try {
      const response = await axiosInstance.post('/blocking-compress', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setImages([]);
      setUploading(false);
      console.log(response.data);
      const imageLocations = response.data.data;
      // console.log(imageLocations);
      setUploadedImages(imageLocations);
    } catch (error) {
      console.error(error);
      setUploading(false);
    }
  };

  const handleNonBlockingCompress = async () => {
    setUploading(true);
    const formData = new FormData();
    images.forEach((image) => {
      formData.append('images', image);
    });
    try {
      const response = await axiosInstance.post('/non-blocking-compress', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setImages([]);
      setUploading(false);
      console.log(response.data);
      const imageLocations = response.data.data;
      // console.log(imageLocations);
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
        <button onClick={handleBlockingCompress} disabled={uploading || images.length === 0}>
          {uploading ? 'Uploading (Blocking)...' : 'Upload (Blocking)'}
        </button>
        <button
          style={{ marginLeft: '10px' }}
          onClick={handleNonBlockingCompress}
          disabled={uploading || images.length === 0}
        >
          {uploading ? 'Uploading (Non-blocking)...' : 'Upload (Non-blocking)'}
        </button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {uploadedImages.map((imageUrl, index) => (
          <div key={index} style={{ marginRight: '10px', marginBottom: '10px' }}>
            <RegularImage src={imageUrl} alt={`Uploaded image ${index}`} width="200" height="200" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default ImageUploader;
