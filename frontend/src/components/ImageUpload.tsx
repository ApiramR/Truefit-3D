import { useState, useRef } from 'react';
import Webcam from 'react-webcam';
import { motion } from 'framer-motion';
import { Camera, Upload, X } from 'lucide-react';
import { useToastContext } from '../contexts/ToastContext';

interface ImageUploadProps {
  onImageUpload: (file: File) => void;
  className?: string;
}

export default function ImageUpload({ onImageUpload, className }: ImageUploadProps) {
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToastContext();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          title: 'Error',
          description: 'File size must be less than 2MB',
          variant: 'destructive',
        });
        return;
      }
      setSelectedFile(file);
      onImageUpload(file);
    }
  };

  const handleWebcamCapture = () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      // Convert base64 to File
      fetch(imageSrc)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], 'webcam-capture.jpg', { type: 'image/jpeg' });
          setSelectedFile(file);
          onImageUpload(file);
          setIsWebcamOpen(false);
        });
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {!isWebcamOpen && (
        <div className="flex gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Upload className="w-5 h-5" />
            {selectedFile ? 'Change Image' : 'Upload Image'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsWebcamOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Camera className="w-5 h-5" />
            Take Photo
          </motion.button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {isWebcamOpen && (
        <div className="relative">
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            className="w-full max-w-md rounded-lg"
          />
          <div className="absolute top-2 right-2">
            <button
              onClick={() => setIsWebcamOpen(false)}
              className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-2 flex justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleWebcamCapture}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Capture
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
} 