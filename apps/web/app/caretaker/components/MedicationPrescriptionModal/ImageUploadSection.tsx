// ============================================
// FILE: apps/web/app/caretaker/components/MedicationPrescriptionModal/ImageUploadSection.tsx
// ============================================

import React from 'react';
import { Upload, Image as ImageIcon, X } from 'lucide-react';

interface ImageUploadSectionProps {
  medicationImage: File | null;
  imagePreview: string | null;
  imageAnalysis: string | null;
  analyzingImage: boolean;
  onImageChange: (file: File | null) => void;
  onPreviewChange: (preview: string | null) => void;
  onAnalysisChange: (analysis: string | null) => void;
  onAnalyzingChange: (analyzing: boolean) => void;
  onMedicationNameUpdate: (name: string) => void;
}

const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({
  medicationImage,
  imagePreview,
  imageAnalysis,
  analyzingImage,
  onImageChange,
  onPreviewChange,
  onAnalysisChange,
  onAnalyzingChange,
  onMedicationNameUpdate
}) => {
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file');
      return;
    }

    onImageChange(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      onPreviewChange(reader.result as string);
    };
    reader.readAsDataURL(file);
    onAnalysisChange(null);
  };

  const analyzeMedicationImage = async () => {
    if (!medicationImage) return;

    onAnalyzingChange(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please log in to analyze medication images.");
        onAnalyzingChange(false);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Image = (reader.result as string).split(',')[1];

          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/medications/analyze-image`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                image: base64Image,
                imageType: medicationImage.type,
              }),
            }
          );

          if (!response.ok) {
            throw new Error('Failed to analyze image');
          }

          const data = await response.json();
          onAnalysisChange(data.analysis || data.message || 'Analysis completed');
          
          // Auto-fill medication name if detected
          if (data.medicationName) {
            onMedicationNameUpdate(data.medicationName);
          }
        } catch (error) {
          console.error('Error analyzing medication image:', error);
          alert('Failed to analyze medication image. Please try again.');
        } finally {
          onAnalyzingChange(false);
        }
      };
      reader.readAsDataURL(medicationImage);
    } catch (error) {
      console.error('Error reading image file:', error);
      alert('Failed to read image file. Please try again.');
      onAnalyzingChange(false);
    }
  };

  const clearImage = () => {
    onImageChange(null);
    onPreviewChange(null);
    onAnalysisChange(null);
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Medication Photo (Optional)
      </label>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 bg-white">
            <Upload className="w-4 h-4" />
            <span className="text-sm">Upload Photo</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
          {medicationImage && (
            <button
              type="button"
              onClick={analyzeMedicationImage}
              disabled={analyzingImage}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <ImageIcon className="w-4 h-4" />
              {analyzingImage ? 'Analyzing...' : 'Analyze with AI'}
            </button>
          )}
        </div>
        {imagePreview && (
          <div className="relative">
            <img
              src={imagePreview}
              alt="Medication preview"
              className="max-w-full h-40 object-contain border border-gray-300 rounded-lg bg-white"
            />
            <button
              type="button"
              onClick={clearImage}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {imageAnalysis && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900 font-semibold mb-1">AI Analysis:</p>
            <p className="text-sm text-blue-800 whitespace-pre-wrap">{imageAnalysis}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploadSection;