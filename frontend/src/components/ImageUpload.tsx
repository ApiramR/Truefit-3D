import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Upload } from 'lucide-react';
import { useToastContext } from '../contexts/ToastContext';

const CLOUDINARY_UPLOAD_URL = 'https://api.cloudinary.com/v1_1/dfxhwpopk/upload';
const CLOUDINARY_UPLOAD_PRESET = 'ml_default';

interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
}

const uploadToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('cloud_name', 'dfxhwpopk');

  try {
    const response = await axios.post<CloudinaryResponse>(CLOUDINARY_UPLOAD_URL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
};

interface ImageUploadProps {
  onImageUpload: (url: string) => void;
  className?: string;
}

const ImageUpload = ({ onImageUpload, className = '' }: ImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const { toast } = useToastContext();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      toast({
        title: 'Error',
        description: 'File size must be less than 2MB',
        variant: 'destructive',
      });
      return;
    }

    setFileName(file.name);
    setIsUploading(true);
    try {
      const imageUrl = await uploadToCloudinary(file);
      onImageUpload(imageUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-center w-full">
        <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-8 h-8 mb-4 text-gray-500" />
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">PNG, JPG or JPEG (MAX. 2MB)</p>
          </div>
          <input 
            type="file" 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileChange} 
            disabled={isUploading} 
          />
        </label>
      </div>
      
      {isUploading && (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Uploading...</span>
        </div>
      )}

      {fileName && !isUploading && (
        <div className="mt-4 text-center text-gray-700">
          Selected file: <span className="font-semibold">{fileName}</span>
        </div>
      )}
    </div>
  );
};

export default ImageUpload; 