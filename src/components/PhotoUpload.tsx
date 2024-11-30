import React, { useState, useEffect } from 'react';
import { Trash2, X, Maximize2 } from 'lucide-react';
import type { PhotoData } from '../types';

type PhotoUploadFieldProps = {
  fieldId: string;
  instanceIndex: number;
  value?: PhotoData[];
  onChange: (photos: PhotoData[]) => void;
};

const PhotoUploadField: React.FC<PhotoUploadFieldProps> = ({ fieldId, instanceIndex, value = [], onChange }) => {
  const [previews, setPreviews] = useState<PhotoData[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Initialize previews from existing photos
  useEffect(() => {
    if (Array.isArray(value)) {
      setPreviews(value);
    } else {
      setPreviews([]);
    }
  }, [value]);

  const convertToBase64 = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    try {
      const photoData: PhotoData[] = await Promise.all(
        selectedFiles.map(async (file, index) => {
          const base64 = await convertToBase64(file);
          return {
            id: Date.now().toString() + index,
            fieldId,
            instanceIndex,
            file: base64,
            fileName: file.name
          };
        })
      );

      // Update with new photos while keeping existing ones
      const newPhotos = [...(Array.isArray(value) ? value : []), ...photoData];
      onChange(newPhotos);
      setPreviews(newPhotos);
    } catch (error) {
      console.error('Error processing photos:', error);
    }
  };

  const removePhoto = (index: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering image preview
    const newPhotos = [...previews];
    newPhotos.splice(index, 1);
    onChange(newPhotos);
    setPreviews(newPhotos);
  };

  return (
    <div className="mt-2 space-y-4">
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-md file:border-0
          file:text-sm file:font-semibold
          file:bg-blue-50 file:text-blue-700
          hover:file:bg-blue-100"
      />
      
      {previews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {previews.map((photo, index) => (
            <div key={photo.id} className="relative group">
              <img
                src={photo.file}
                alt={`Upload preview ${index + 1}`}
                className="w-full h-48 object-cover rounded-lg border border-gray-200"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all rounded-lg flex items-center justify-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage(photo.file);
                  }}
                  className="p-2 bg-blue-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity transform hover:scale-110"
                  title="View full size"
                >
                  <Maximize2 size={20} />
                </button>
                <button
                  onClick={(e) => removePhoto(index, e)}
                  className="p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity transform hover:scale-110"
                  title="Remove photo"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for full-size image preview */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999]"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-7xl w-full mx-4">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 p-2 text-white hover:text-gray-300 transition-colors"
            >
              <X size={24} />
            </button>
            <img
              src={selectedImage}
              alt="Full size preview"
              className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoUploadField;