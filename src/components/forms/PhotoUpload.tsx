import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Camera, X } from 'lucide-react';

interface PhotoUploadProps {
  fieldId: string;
  maxPhotos?: number;
  onPhotosChange: (photos: File[]) => void;
  value?: File[];
}

export function PhotoUpload({ fieldId, maxPhotos = 5, onPhotosChange, value = [] }: PhotoUploadProps) {
  const [photos, setPhotos] = useState<File[]>(value);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newPhotos = [...photos];
    acceptedFiles.forEach(file => {
      if (newPhotos.length < maxPhotos) {
        newPhotos.push(file);
      }
    });
    setPhotos(newPhotos);
    onPhotosChange(newPhotos);
  }, [photos, maxPhotos, onPhotosChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    maxFiles: maxPhotos - photos.length,
    disabled: photos.length >= maxPhotos
  });

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    onPhotosChange(newPhotos);
  };

  return (
    <div className="space-y-4">
      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {photos.map((photo, index) => (
            <div key={index} className="relative">
              <img
                src={URL.createObjectURL(photo)}
                alt={`Upload ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg"
              />
              <button
                onClick={() => removePhoto(index)}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {photos.length < maxPhotos && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer
            ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
            ${photos.length >= maxPhotos ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          <Camera className="mx-auto h-8 w-8 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">
            {isDragActive
              ? 'Drop the photos here'
              : `Drag 'n' drop photos here, or click to select`}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {photos.length} of {maxPhotos} photos uploaded
          </p>
        </div>
      )}
    </div>
  );
}