'use client';

import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';

interface ImageCropperProps {
  image: string;
  onCropComplete: (croppedImage: string) => void;
  onCancel: () => void;
  aspectRatio?: number;
  cropShape?: 'rect' | 'round';
}

// Create image element from URL
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });

// Get cropped image as base64
async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  // Set canvas size to the cropped area
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Draw cropped image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // Return as base64
  return canvas.toDataURL('image/jpeg', 0.9);
}

export default function ImageCropper({ 
  image, 
  onCropComplete, 
  onCancel,
  aspectRatio = 3/4, // Portrait by default (good for cards)
  cropShape = 'rect'
}: ImageCropperProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropChange = useCallback((location: Point) => {
    setCrop(location);
  }, []);

  const onZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, []);

  const onCropCompleteCallback = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleSave = async () => {
    if (croppedAreaPixels) {
      try {
        const croppedImage = await getCroppedImg(image, croppedAreaPixels);
        onCropComplete(croppedImage);
      } catch (e) {
        console.error('Error cropping image:', e);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-border">
          <h3 className="text-base sm:text-lg font-medium">Prilagodi sliku</h3>
          <p className="text-xs sm:text-sm text-muted">Pomeri i zumiraj da odabereš deo slike</p>
        </div>

        {/* Crop area */}
        <div className="relative h-[250px] sm:h-[350px] md:h-[400px] bg-gray-900">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteCallback}
            cropShape={cropShape}
            showGrid={cropShape === 'rect'}
          />
        </div>

        {/* Zoom slider */}
        <div className="p-3 sm:p-4 border-t border-border">
          <div className="flex items-center gap-3 sm:gap-4">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
            </svg>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
            </svg>
          </div>
        </div>

        {/* Recommendation section - hidden on very small screens */}
        <div className="hidden sm:block p-3 sm:p-4 bg-secondary/30 border-t border-border">
          <div className="flex items-start gap-3 sm:gap-4">
            {/* Example photo */}
            <div className="flex-shrink-0">
              {cropShape === 'round' ? (
                <>
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-primary/30 shadow-md bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <span className="text-2xl sm:text-3xl font-light text-primary">M</span>
                  </div>
                  <span className="text-xs text-primary mt-1 block text-center">Primer ✓</span>
                </>
              ) : (
                <>
                  <div className="w-16 h-22 sm:w-20 sm:h-28 rounded-lg overflow-hidden border-2 border-primary/30 shadow-md">
                    <img 
                      src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=280&fit=crop&crop=face"
                      alt="Primer fotografije"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-xs text-primary mt-1 block text-center">Primer ✓</span>
                </>
              )}
            </div>
            
            {/* Recommendations */}
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-medium mb-2">Preporučeni izgled:</p>
              <ul className="text-xs text-muted space-y-0.5 sm:space-y-1">
                {cropShape === 'round' ? (
                  <>
                    <li className="flex items-center gap-1.5">
                      <span className="text-success">✓</span>
                      Kvadratna slika (1:1)
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="text-success">✓</span>
                      Logo centriran
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="text-success">✓</span>
                      Čista pozadina
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-center gap-1.5">
                      <span className="text-success">✓</span>
                      Portrait orijentacija
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="text-success">✓</span>
                      Lice u gornjoj polovini
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="text-success">✓</span>
                      Dobro osvetljenje
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-3 sm:p-4 border-t border-border flex gap-2 sm:gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 sm:py-3 text-sm sm:text-base border border-border rounded-xl hover:bg-secondary transition-colors"
          >
            Otkaži
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 sm:py-3 text-sm sm:text-base bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
          >
            Sačuvaj
          </button>
        </div>
      </div>
    </div>
  );
}

