// src/components/forms/ImageUpload.tsx
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface ImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
}

export function ImageUpload({ value = [], onChange, maxFiles = 5 }: ImageUploadProps) {
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Limit the number of files
    const filesToProcess = acceptedFiles.slice(0, maxFiles - value.length);

    // Process each file
    const processImage = async (file: File): Promise<string> => {
      // Compress image
      const compressedFile = await compressImage(file);
      
      // Convert to base64 for preview (in production, you'd upload to a server)
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(compressedFile);
      });
    };

    // Process all files
    const newUrls = await Promise.all(filesToProcess.map(processImage));
    onChange([...value, ...newUrls]);
  }, [value, onChange, maxFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    maxFiles: maxFiles - value.length,
  });

  const removeImage = (index: number) => {
    const newValue = [...value];
    newValue.splice(index, 1);
    onChange(newValue);
  };

  return (
    <div className="space-y-4">
      {/* Uploaded Images */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {value.map((url, index) => (
            <div key={index} className="relative group">
              <img
                src={url}
                alt={`Upload ${index + 1}`}
                className="w-full h-32 object-cover rounded"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {value.length < maxFiles && (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
            ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          `}
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>Drop the files here...</p>
          ) : (
            <div className="space-y-2">
              <p>Drag and drop images here, or click to select</p>
              <p className="text-sm text-gray-500">
                {`${maxFiles - value.length} images remaining`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Image compression utility
async function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        // Calculate new dimensions (max 1200px width/height)
        let width = img.width;
        let height = img.height;
        if (width > height && width > 1200) {
          height = Math.round((height * 1200) / width);
          width = 1200;
        } else if (height > 1200) {
          width = Math.round((width * 1200) / height);
          height = 1200;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              }));
            }
          },
          'image/jpeg',
          0.8 // compression quality
        );
      };
    };
  });
}