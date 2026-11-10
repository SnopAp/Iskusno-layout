import React, { useRef } from 'react';
import { ImageCanvasObject, AppMode } from '../types';
import {
  RotateCw,
  Copy,
  Trash2,
  Lock,
  Unlock,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
  Download,
  FlipHorizontal,
  FlipVertical,
} from 'lucide-react';

interface CanvasImageProps {
  object: ImageCanvasObject;
  isSelected: boolean;
  mode: AppMode;
  itemIndex: number;
  totalItems: number;
  onSelect: (id: string, e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent, obj: ImageCanvasObject) => void;
  onChange: (updated: ImageCanvasObject) => void;
  onDelete: (id: string) => void;
  onDuplicate: (obj: ImageCanvasObject) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onOpenFullscreen?: (img: ImageCanvasObject) => void;
}

export const CanvasImage: React.FC<CanvasImageProps> = ({
  object,
  isSelected,
  mode,
  itemIndex,
  totalItems,
  onSelect,
  onContextMenu,
  onChange,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onOpenFullscreen,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Compute CSS transform for rotation and flips
  const transformParts: string[] = [];
  if (object.rotation) {
    transformParts.push(`rotate(${object.rotation}deg)`);
  }
  const scaleX = object.flipHorizontal ? -1 : 1;
  const scaleY = object.flipVertical ? -1 : 1;
  if (scaleX !== 1 || scaleY !== 1) {
    transformParts.push(`scale(${scaleX}, ${scaleY})`);
  }
  const transformStyle = transformParts.length > 0 ? transformParts.join(' ') : undefined;

  const widthPercent = object.widthPercent || 100;

  return (
    <div
      ref={containerRef}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(object.id, e);
      }}
      onContextMenu={(e) => onContextMenu(e, object)}
      className={`w-full group relative rounded-lg transition-all flex flex-col items-center ${
        isSelected
          ? 'ring-2 ring-blue-600 bg-blue-50/20 shadow-xs'
          : 'hover:ring-1 hover:ring-neutral-300 ring-transparent'
      }`}
    >
      {/* Element Header Bar when selected in Editor */}
      {isSelected && (
        <div className="w-full flex items-center justify-between px-3 py-1.5 bg-blue-600 text-white rounded-t-lg text-[11px] font-medium select-none shadow-xs">
          <div className="flex items-center gap-2 truncate">
            <span className="font-mono text-[10px] bg-blue-700 px-1.5 py-0.5 rounded text-white">
              #{itemIndex + 1} ФОТО
            </span>
            <span className="truncate opacity-90">
              {object.alt || 'Изображение'} · {widthPercent}%
              {object.rotation ? ` · ${object.rotation}°` : ''}
              {object.allowDownload ? ' · Скачивание: ВКЛ' : ''}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            {/* Move Up / Down Buttons */}
            {onMoveUp && (
              <button
                type="button"
                disabled={itemIndex === 0}
                onClick={onMoveUp}
                className="p-1 hover:bg-blue-700 rounded transition-colors text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Переместить выше"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
            )}
            {onMoveDown && (
              <button
                type="button"
                disabled={itemIndex === totalItems - 1}
                onClick={onMoveDown}
                className="p-1 hover:bg-blue-700 rounded transition-colors text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Переместить ниже"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Quick Rotate 90 deg */}
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...object,
                  rotation: ((object.rotation || 0) + 90) % 360,
                })
              }
              className="p-1 hover:bg-blue-700 rounded transition-colors text-white cursor-pointer ml-1"
              title="Повернуть на 90° по часовой стрелке"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            {/* Quick Flip H */}
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...object,
                  flipHorizontal: !object.flipHorizontal,
                })
              }
              className={`p-1 rounded transition-colors text-white cursor-pointer ${
                object.flipHorizontal ? 'bg-blue-800' : 'hover:bg-blue-700'
              }`}
              title="Отразить по горизонтали"
            >
              <FlipHorizontal className="w-3.5 h-3.5" />
            </button>

            {/* Lock / Unlock */}
            <button
              type="button"
              onClick={() => onChange({ ...object, locked: !object.locked })}
              className="p-1 hover:bg-blue-700 rounded transition-colors text-white cursor-pointer"
              title={object.locked ? 'Разблокировать' : 'Заблокировать'}
            >
              {object.locked ? (
                <Lock className="w-3.5 h-3.5 text-amber-300" />
              ) : (
                <Unlock className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Duplicate */}
            <button
              type="button"
              onClick={() => onDuplicate(object)}
              className="p-1 hover:bg-blue-700 rounded transition-colors text-white cursor-pointer"
              title="Дублировать изображение"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>

            {/* Delete */}
            <button
              type="button"
              onClick={() => onDelete(object.id)}
              className="p-1 hover:bg-rose-700 rounded transition-colors text-white cursor-pointer"
              title="Удалить изображение"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Image Content Container */}
      <div
        className="p-3 w-full flex flex-col items-center justify-center overflow-hidden"
        style={{
          width: `${widthPercent}%`,
        }}
      >
        <div
          className="relative w-full rounded-lg overflow-hidden bg-neutral-100 flex items-center justify-center border border-neutral-200/80 shadow-2xs"
          style={{
            maxHeight: object.customHeight ? `${object.customHeight}px` : '420px',
          }}
        >
          {object.dataUrl ? (
            <img
              src={object.dataUrl}
              alt={object.alt || 'Изображение'}
              className="w-full h-auto max-h-[420px] select-none transition-transform duration-200"
              style={{
                objectFit: object.objectFit || 'contain',
                transform: transformStyle,
              }}
              draggable={false}
            />
          ) : (
            <div className="py-12 flex flex-col items-center gap-1.5 text-neutral-400">
              <ImageIcon className="w-8 h-8" />
              <span className="text-xs">Загрузка изображения...</span>
            </div>
          )}

          {/* Download badge if allowed */}
          {object.allowDownload && (
            <div
              className="absolute top-2 right-2 bg-neutral-900/80 text-white px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 shadow-xs pointer-events-none"
              title="Разрешено скачивание в режиме просмотра"
            >
              <Download className="w-3 h-3" />
              <span>Скачивание разрешено</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
