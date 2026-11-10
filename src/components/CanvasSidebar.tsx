import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  ArrowUpDown,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { DocumentModel, CanvasModel } from '../types';
import { canvasHasUserData } from '../utils/documentLogic';

interface CanvasSidebarProps {
  documentModel: DocumentModel;
  selectedCanvasId: string;
  onSelectCanvas: (canvasId: string) => void;
  onAddCanvas: () => void;
  onDeleteCanvas: (canvasId: string) => void;
  onOpenOrderModal: () => void;
}

export const CanvasSidebar: React.FC<CanvasSidebarProps> = ({
  documentModel,
  selectedCanvasId,
  onSelectCanvas,
  onAddCanvas,
  onDeleteCanvas,
  onOpenOrderModal,
}) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDeleteClick = (e: React.MouseEvent, canvas: CanvasModel) => {
    e.stopPropagation();
    if (canvasHasUserData(canvas)) {
      setConfirmDeleteId(canvas.id);
    } else {
      onDeleteCanvas(canvas.id);
    }
  };

  const confirmDeletion = (e: React.MouseEvent, canvasId: string) => {
    e.stopPropagation();
    setConfirmDeleteId(null);
    onDeleteCanvas(canvasId);
  };

  return (
    <aside className="w-72 bg-white border-r border-neutral-200 flex flex-col shrink-0 h-full select-none">
      {/* Header & Reorder Button */}
      <div className="p-3.5 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/60">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-neutral-700" />
          <span className="text-xs font-semibold text-neutral-900">
            Страницы ({documentModel.canvasOrder.length})
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenOrderModal}
          disabled={documentModel.canvasOrder.length < 2}
          title="Открыть окно настройки порядка холстов"
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <ArrowUpDown className="w-3.5 h-3.5 text-neutral-500" />
          <span>Порядок холстов</span>
        </button>
      </div>

      {/* Add Canvas Button */}
      <div className="p-3 border-b border-neutral-100">
        <button
          type="button"
          onClick={onAddCanvas}
          className="w-full py-2 px-3 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Добавить холст A4 Portrait</span>
        </button>
      </div>

      {/* Canvas List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
        {documentModel.canvasOrder.length === 0 ? (
          <div className="p-6 text-center text-xs text-neutral-500">
            <p className="font-medium text-neutral-700 mb-1">В документе нет страниц</p>
            <p className="text-neutral-400">
              Нажмите «Добавить холст», чтобы создать страницу A4.
            </p>
          </div>
        ) : (
          documentModel.canvasOrder.map((canvasId, idx) => {
            const canvas = documentModel.canvases[canvasId];
            if (!canvas) return null;

            const pageNumber = idx + 1;
            const isSelected = canvasId === selectedCanvasId;
            const isConfirming = confirmDeleteId === canvasId;
            const objectCount = canvas.objects.length;
            const displayTitle = canvas.title.trim() || 'Без названия';

            return (
              <div
                key={canvasId}
                onClick={() => onSelectCanvas(canvasId)}
                className={`group relative rounded-lg border p-2.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-neutral-900/4 border-neutral-900 shadow-2xs'
                    : 'bg-white border-neutral-200/80 hover:border-neutral-300 hover:bg-neutral-50/70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {/* Page Ordinal Badge */}
                  <div
                    className={`w-6 h-6 rounded font-mono text-xs font-bold flex items-center justify-center tabular-nums shrink-0 ${
                      isSelected
                        ? 'bg-neutral-900 text-white'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {pageNumber}
                  </div>

                  {/* Page Title & Item Count */}
                  <div className="flex-1 min-w-0">
                    <span
                      className={`text-xs font-semibold block truncate ${
                        canvas.title.trim()
                          ? 'text-neutral-900'
                          : 'text-neutral-400 italic font-normal'
                      }`}
                    >
                      {displayTitle}
                    </span>

                    <div className="text-[11px] text-neutral-400 font-mono tabular-nums">
                      {objectCount}{' '}
                      {objectCount === 1
                        ? 'элемент'
                        : objectCount >= 2 && objectCount <= 4
                        ? 'элемента'
                        : 'элементов'}
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={(e) => handleDeleteClick(e, canvas)}
                    title="Удалить холст"
                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Inline Confirmation if Canvas Has User Data */}
                {isConfirming && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="mt-2.5 pt-2 border-t border-rose-200 bg-rose-50/70 -mx-2.5 -mb-2.5 p-2.5 rounded-b-lg"
                  >
                    <div className="flex items-start gap-1.5 text-[11px] text-rose-900 mb-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                      <span>
                        Страница содержит данные. Удалить страницу №{pageNumber} и все её элементы?
                      </span>
                    </div>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteId(null);
                        }}
                        className="px-2 py-1 rounded text-[11px] font-medium bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                      >
                        Отмена
                      </button>
                      <button
                        type="button"
                        onClick={(e) => confirmDeletion(e, canvasId)}
                        className="px-2 py-1 rounded text-[11px] font-medium bg-rose-600 text-white hover:bg-rose-700 cursor-pointer"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
