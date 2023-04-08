import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ImageUploader() {
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [imageUrls, setImageUrls] = useState([]);

  const axiosInstance = axios.create({
    baseURL: 'http://localhost:3000',
  });

  useEffect(() => {
    async function fetchImages() {
      try {
        const response = await axiosInstance.get('/list-images');
        console.log(response.data); // add this line to check the response data
        setImageUrls(response.data);
      } catch (error) {
        console.error(error);
      }
    }
    fetchImages();
  }, []);

  console.log(typeof imageUrls);
  console.log(imageUrls);
  
  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    setImages(files);
  };

  const handleUploadClick = async () => {
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
      // Update the state to display the uploaded images
      // from their S3 URLs
      // Example: setUploadedImages(response.data.data);
    } catch (error) {
      console.error(error);
      setUploading(false);
    }
  };

  console.log(imageUrls); // add this line to check the value of imageUrls

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <input type="file" onChange={handleFileChange} multiple />
        <button onClick={handleUploadClick} disabled={uploading || images.length === 0}>
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {imageUrls.map((imageUrl, index) => (
          <div key={index} style={{ marginRight: '10px', marginBottom: '10px' }}>
            <img src={imageUrl} alt={`Uploaded image ${index}`} width="200" height="200" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default ImageUploader;
