import React from 'react';
import { X, Download } from 'lucide-react';
import { ImageCanvasObject } from '../types';

interface ImageModalProps {
  image: ImageCanvasObject | null;
  onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({ image, onClose }) => {
  if (!image) return null;

  const handleDownload = () => {
    if (!image.dataUrl) return;
    const a = document.createElement('a');
    a.href = image.dataUrl;
    a.download = image.alt ? `${image.alt.replace(/\s+/g, '_')}.png` : 'image.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 select-none"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] bg-white rounded-xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-neutral-900 text-white">
          <div className="flex items-center gap-2 truncate">
            <span className="font-semibold text-sm truncate">
              {image.alt || 'Просмотр изображения'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {image.allowDownload && (
              <button
                type="button"
                onClick={handleDownload}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Скачать оригинальный файл"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Скачать оригинал</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Закрыть"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Image Display */}
        <div className="p-4 flex items-center justify-center overflow-auto max-h-[80vh] bg-neutral-100">
          {image.dataUrl && (
            <img
              src={image.dataUrl}
              alt={image.alt || 'Изображение'}
              className="max-w-full max-h-[72vh] object-contain rounded shadow-xs"
            />
          )}
        </div>
      </div>
    </div>
  );
};
