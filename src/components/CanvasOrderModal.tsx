import React, { useState } from 'react';
import {
  GripVertical,
  X,
  CheckCircle2,
  Circle,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from 'lucide-react';
import { DocumentModel } from '../types';

interface CanvasOrderModalProps {
  isOpen: boolean;
  documentModel: DocumentModel;
  onClose: () => void;
  onUpdateOrder: (newOrder: string[]) => void;
}

export const CanvasOrderModal: React.FC<CanvasOrderModalProps> = ({
  isOpen,
  documentModel,
  onClose,
  onUpdateOrder,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const order = documentModel.canvasOrder;

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= order.length ||
      toIndex >= order.length
    ) {
      return;
    }

    const updated = [...order];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    onUpdateOrder(updated);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const fromIndex =
      draggedIndex !== null
        ? draggedIndex
        : Number(e.dataTransfer.getData('text/plain'));

    if (!Number.isNaN(fromIndex) && fromIndex !== targetIndex) {
      moveItem(fromIndex, targetIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-neutral-950/45 backdrop-blur-xs flex items-center justify-center p-4 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-xl border border-neutral-200 shadow-2xl overflow-hidden flex flex-col max-h-[82vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/60">
          <div className="flex items-center gap-2.5">
            <ArrowUpDown className="w-4 h-4 text-neutral-700" />
            <div>
              <h2 className="text-sm font-semibold text-neutral-900">
                Порядок холстов
              </h2>
              <p className="text-xs text-neutral-500">
                Перетащите страницы мышью для изменения их последовательности в документе
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 transition-colors cursor-pointer"
            title="Закрыть окно"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Draggable List */}
        <div className="p-5 overflow-y-auto flex-1 space-y-2">
          {order.map((canvasId, idx) => {
            const canvas = documentModel.canvases[canvasId];
            if (!canvas) return null;

            const isDragging = draggedIndex === idx;
            const isDragOver = dragOverIndex === idx && draggedIndex !== idx;
            const pageNumber = idx + 1;

            return (
              <div
                key={canvasId}
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={(e) => handleDrop(e, idx)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                  isDragging
                    ? 'opacity-45 bg-neutral-100 border-neutral-400'
                    : isDragOver
                    ? 'border-blue-600 bg-blue-50/40 shadow-xs'
                    : 'bg-white border-neutral-200 hover:border-neutral-300'
                }`}
              >
                {/* Drag Handle */}
                <div
                  className="p-1 text-neutral-400 hover:text-neutral-700 cursor-grab active:cursor-grabbing shrink-0"
                  title="Перетащите для изменения позиции"
                >
                  <GripVertical className="w-4 h-4" />
                </div>

                {/* Automatic Ordinal Number */}
                <div className="w-7 h-7 rounded-md bg-neutral-100 text-neutral-800 font-mono text-xs font-bold flex items-center justify-center tabular-nums shrink-0">
                  {pageNumber}
                </div>

                {/* Page Title */}
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-xs font-semibold truncate ${
                      canvas.title.trim()
                        ? 'text-neutral-900'
                        : 'text-neutral-400 italic font-normal'
                    }`}
                  >
                    {canvas.title.trim() || 'Без названия'}
                  </div>
                  <div className="text-[11px] text-neutral-400 font-mono tabular-nums">
                    ID: {canvas.id.slice(-8)} · Объектов: {canvas.objects.length}
                  </div>
                </div>

                {/* Completion Status Indicator */}
                <div className="flex items-center gap-1.5 text-xs shrink-0">
                  {canvas.completed ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Выполнена</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-neutral-500">
                      <Circle className="w-4 h-4 text-neutral-300" />
                      <span>Не выполнена</span>
                    </span>
                  )}
                </div>

                {/* Quick Up / Down Buttons */}
                <div className="flex items-center gap-1 shrink-0 border-l border-neutral-100 pl-2">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveItem(idx, idx - 1)}
                    title="Переместить выше"
                    className="p-1 rounded hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === order.length - 1}
                    onClick={() => moveItem(idx, idx + 1)}
                    title="Переместить ниже"
                    className="p-1 rounded hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Info & Close */}
        <div className="px-5 py-3.5 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between gap-4">
          <span className="text-[11px] text-neutral-500">
            При нарушении непрерывности выполненных страниц состояния чекбоксов автоматически нормализуются от первой страницы.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium transition-colors cursor-pointer shrink-0"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
};
