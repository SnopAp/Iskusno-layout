import React, { useRef } from 'react';
import {
  Plus,
  Image as ImageIcon,
  Trash2,
  Eye,
  Edit3,
  RotateCcw,
} from 'lucide-react';
import { AppMode } from '../types';

interface TopToolbarProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  onAddText: () => void;
  onAddImageFile: (file: File) => void;
  onDeleteSelected: () => void;
  hasSelection: boolean;
  selectedCount: number;
  onResetToDemo: () => void;
  progressInfo: {
    completedCount: number;
    totalCount: number;
    percentage: number;
    label: string;
  };
}

export const TopToolbar: React.FC<TopToolbarProps> = ({
  mode,
  onModeChange,
  onAddText,
  onAddImageFile,
  onDeleteSelected,
  hasSelection,
  selectedCount,
  onResetToDemo,
  progressInfo,
}) => {
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAddImageFile(file);
      e.target.value = ''; // Reset input
    }
  };

  return (
    <header className="h-14 bg-white border-b border-neutral-200 px-4 flex items-center justify-between gap-4 shrink-0 shadow-xs z-30 select-none">
      {/* Brand & Document Specs */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold text-sm shadow-xs">
          M↓
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-900 text-sm tracking-tight">
              Multi-Canvas Document
            </span>
            <span className="text-xs text-neutral-400 font-normal">·</span>
            <span className="text-xs font-mono text-neutral-500 tabular-nums">
              A4 Portrait (210×297 мм)
            </span>
          </div>
        </div>
      </div>

      {/* Center Zone: Overall Document Progress Indicator (Section 9) */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-center sm:items-start min-w-[190px]">
          <div className="flex items-center justify-between w-full text-xs font-medium text-neutral-700 tabular-nums mb-1">
            <span className="font-semibold text-neutral-900">
              {progressInfo.label}
            </span>
          </div>
          {/* Progress Bar */}
          <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden border border-neutral-200">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${progressInfo.percentage}%` }}
            />
          </div>
        </div>

        {mode === 'edit' && (
          <div className="flex items-center gap-2 ml-2">
            <button
              type="button"
              onClick={onAddText}
              title="Создать новый текстовый блок в конце страницы"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 text-white text-xs font-medium hover:bg-neutral-800 transition-colors shadow-xs active:scale-98 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Добавить текст</span>
            </button>

            {/* Hidden image file input */}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageFileChange}
            />

            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              title="Добавить изображение с компьютера в конец страницы"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-medium transition-colors border border-neutral-200 cursor-pointer whitespace-nowrap shrink-0"
            >
              <ImageIcon className="w-3.5 h-3.5 text-neutral-600" />
              <span>Добавить фото</span>
            </button>

            <button
              type="button"
              onClick={onDeleteSelected}
              disabled={!hasSelection}
              title={
                hasSelection
                  ? 'Удалить выбранный элемент (Delete)'
                  : 'Выберите элемент для удаления'
              }
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                hasSelection
                  ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 cursor-pointer'
                  : 'bg-neutral-100 text-neutral-400 border border-transparent cursor-not-allowed opacity-60'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Удалить {selectedCount > 1 ? `(${selectedCount})` : ''}</span>
            </button>
          </div>
        )}
      </div>

      {/* Mode Switch & Reset Controls */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Mode Switcher */}
        <div className="flex items-center p-0.5 bg-neutral-100 rounded-lg border border-neutral-200">
          <button
            type="button"
            onClick={() => onModeChange('edit')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
              mode === 'edit'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
            title="Режим редактора (наполнение страниц, порядок элементов, Markdown)"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Редактор</span>
          </button>
          <button
            type="button"
            onClick={() => onModeChange('preview')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
              mode === 'preview'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
            title="Режим просмотра (интерактивные задачи, авто-сворачивание, чтение)"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Просмотр</span>
          </button>
        </div>

        <div className="h-5 w-px bg-neutral-200" />

        {/* Reset Demo Button */}
        <button
          type="button"
          onClick={onResetToDemo}
          title="Восстановить демонстрационный документ из 4 страниц A4 Portrait"
          className="p-1.5 rounded-lg border border-neutral-200 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
