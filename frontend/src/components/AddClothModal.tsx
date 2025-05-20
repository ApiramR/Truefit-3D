import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, MagnifyingGlassIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { clothApi } from '../services/api';
import { toast } from 'react-hot-toast';
import ImageUpload from './ImageUpload';

interface AddClothModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddClothModal: React.FC<AddClothModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showExpandedPreview, setShowExpandedPreview] = useState(false);
  const [formData, setFormData] = useState({
    typ: 'tshirt',
    name: '',
    description: '',
    size: '',
    color: '',
    material: '',
    brand: '',
    size_metrics: '',
    neckType: '',
    sleeveType: '',
    fitType: '',
    skirtType: '',
  });

  const handleFileChange = (file: File) => {
    setFile(file);
  };

  const handlePreviewClick = () => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setShowExpandedPreview(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast('Please select an image');
      return;
    }

    // Validate required fields
    if (!formData.typ || !formData.size || !formData.size_metrics || !formData.material) {
      toast('Please fill in all required fields (Type, Size, Size Metrics, and Material)');
      return;
    }

    try {
      await clothApi.uploadCloth(file, formData);
      toast('Clothing item added successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Submit error:', error);
      toast(error instanceof Error ? error.message : 'Failed to add clothing item');
    }
  };

  const handleClose = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl(null);
    setShowExpandedPreview(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-xl w-full bg-white rounded-xl shadow-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              Add New Clothing Item
            </Dialog.Title>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Left Column - Image Upload */}
              <div className="col-span-2">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Upload Image
                    </label>
                    <ImageUpload
                      onImageUpload={handleFileChange}
                      className="mb-2"
                    />
                  </div>
                  {file && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-md">
                        <PhotoIcon className="h-5 w-5 text-gray-500" />
                        <span className="text-sm text-gray-600">{file.name}</span>
                        <button
                          type="button"
                          onClick={handlePreviewClick}
                          className="p-1.5 bg-gray-100 rounded-md hover:bg-gray-200"
                        >
                          <MagnifyingGlassIcon className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  name="typ"
                  value={formData.typ}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="tshirt">T-Shirt</option>
                  <option value="jeans">Jeans</option>
                  <option value="skirt">Skirt</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Size
                </label>
                <input
                  type="text"
                  name="size"
                  value={formData.size}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Size Metrics
                </label>
                <select
                  name="size_metrics"
                  value={formData.size_metrics}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Size Metrics</option>
                  <option value="US">US</option>
                  <option value="UK">UK</option>
                  <option value="EU">EU</option>
                  <option value="IN">IN</option>
                  <option value="CM">CM</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <input
                  type="text"
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Material <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="material"
                  value={formData.material}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter material"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand
                </label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Type-specific fields */}
              {formData.typ === 'tshirt' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Neck Type
                    </label>
                    <select
                      name="neckType"
                      value={formData.neckType}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Select Neck Type</option>
                      <option value="round">Round Neck</option>
                      <option value="v-neck">V-Neck</option>
                      <option value="crew">Crew Neck</option>
                      <option value="turtle">Turtle Neck</option>
                      <option value="scoop">Scoop Neck</option>
                      <option value="collared">Collared</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sleeve Type
                    </label>
                    <select
                      name="sleeveType"
                      value={formData.sleeveType}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Select Sleeve Type</option>
                      <option value="short">Short Sleeve</option>
                      <option value="long">Long Sleeve</option>
                      <option value="sleeveless">Sleeveless</option>
                      <option value="cap">Cap Sleeve</option>
                      <option value="raglan">Raglan Sleeve</option>
                      <option value="batwing">Batwing Sleeve</option>
                    </select>
                  </div>
                </>
              )}

              {formData.typ === 'skirt' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Skirt Type
                  </label>
                  <select
                    name="skirtType"
                    value={formData.skirtType}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select Skirt Type</option>
                    <option value="a-line">A-Line</option>
                    <option value="pencil">Pencil</option>
                    <option value="pleated">Pleated</option>
                    <option value="maxi">Maxi</option>
                    <option value="mini">Mini</option>
                    <option value="midi">Midi</option>
                    <option value="wrap">Wrap</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 mt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                Add Item
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>

      {/* Expanded Preview Modal */}
      {showExpandedPreview && previewUrl && (
        <Dialog open={showExpandedPreview} onClose={() => setShowExpandedPreview(false)} className="relative z-50">
          <div className="fixed inset-0 bg-black/75" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="mx-auto max-w-md w-full">
              <div className="relative bg-white rounded-lg p-2">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-auto rounded-lg"
                />
                <button
                  onClick={() => {
                    setShowExpandedPreview(false);
                    URL.revokeObjectURL(previewUrl);
                    setPreviewUrl(null);
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-md hover:bg-gray-50"
                >
                  <XMarkIcon className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      )}
    </Dialog>
  );
};

export default AddClothModal; 