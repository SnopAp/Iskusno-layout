import React, { useRef } from 'react';
import {
  DocumentModel,
  CanvasModel,
  ViewerProgress,
  CANVAS_PORTRAIT_WIDTH,
  ImageCanvasObject,
} from '../types';
import { CanvasText } from './CanvasText';
import { CanvasImage } from './CanvasImage';
import { PreviewCanvas } from './PreviewCanvas';
import { AppMode } from '../types';

interface CanvasWorkspaceProps {
  documentModel: DocumentModel;
  currentCanvas: CanvasModel | null;
  selectedCanvasNumber: number;
  selectedIds: string[];
  mode: AppMode;
  viewerProgress: ViewerProgress;
  onSelectObject: (id: string, e: React.MouseEvent) => void;
  onDeselect: () => void;
  onUpdateObject: (updated: any) => void;
  onDeleteObject: (id: string) => void;
  onDuplicateObject: (obj: any) => void;
  onContextMenu: (e: React.MouseEvent, obj: any) => void;
  onMoveObjectUp: (index: number) => void;
  onMoveObjectDown: (index: number) => void;
  onToggleEditorTask: (blockId: string, taskIndex: number) => void;
  onToggleViewerCheckbox: (canvasId: string, textBlockId: string, taskIndex: number) => void;
  onToggleViewerPageCompletion: (canvasId: string) => void;
  onToggleViewerPageCollapse: (canvasId: string) => void;
  onOpenImageFullscreen: (img: ImageCanvasObject) => void;
}

export const CanvasWorkspace: React.FC<CanvasWorkspaceProps> = ({
  documentModel,
  currentCanvas,
  selectedCanvasNumber,
  selectedIds,
  mode,
  viewerProgress,
  onSelectObject,
  onDeselect,
  onUpdateObject,
  onDeleteObject,
  onDuplicateObject,
  onContextMenu,
  onMoveObjectUp,
  onMoveObjectDown,
  onToggleEditorTask,
  onToggleViewerCheckbox,
  onToggleViewerPageCompletion,
  onToggleViewerPageCollapse,
  onOpenImageFullscreen,
}) => {
  const workspaceRef = useRef<HTMLDivElement>(null);

  const objects = currentCanvas?.objects || [];

  const handleWorkspaceClick = (e: React.MouseEvent) => {
    if (e.target === workspaceRef.current) {
      onDeselect();
    }
  };

  // -------------------------------------------------------------
  // PREVIEW MODE: Vertical stack of A4 Portrait pages with viewer progress
  // -------------------------------------------------------------
  if (mode === 'preview') {
    return (
      <div
        ref={workspaceRef}
        className="flex-1 h-full overflow-y-auto bg-neutral-200/80"
      >
        <PreviewCanvas
          documentModel={documentModel}
          viewerProgress={viewerProgress}
          onToggleViewerCheckbox={onToggleViewerCheckbox}
          onToggleViewerPageCompletion={onToggleViewerPageCompletion}
          onToggleViewerPageCollapse={onToggleViewerPageCollapse}
          onOpenImageFullscreen={onOpenImageFullscreen}
        />
      </div>
    );
  }

  // -------------------------------------------------------------
  // EDIT MODE: Single chosen page in A4 Portrait vertical column
  // -------------------------------------------------------------
  return (
    <div
      ref={workspaceRef}
      onClick={handleWorkspaceClick}
      className="flex-1 h-full overflow-y-auto p-4 sm:p-8 flex flex-col items-center bg-neutral-200/70"
    >
      {currentCanvas ? (
        <div className="w-full flex flex-col items-center gap-3">
          {/* Header Bar in Editor: Notice: Page checkbox is not interactive in Editor as per Section 5.1 */}
          <div
            className="w-full max-w-[800px] px-4 py-2.5 bg-white rounded-t-xl border border-neutral-200/90 shadow-2xs flex items-center justify-between gap-3 select-none"
          >
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <span className="font-mono font-bold text-sm text-neutral-800 tabular-nums shrink-0">
                {selectedCanvasNumber}.
              </span>
              <span className="font-semibold text-sm text-neutral-900 truncate">
                {currentCanvas.title.trim() || 'Без названия'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 shrink-0 tabular-nums">
              <span>A4 Portrait</span>
              <span>·</span>
              <span>{objects.length} элементов</span>
            </div>
          </div>

          {/* Canvas Sheet (A4 Portrait, strict single vertical column as per Section 3) */}
          <div
            className="w-full max-w-[800px] min-h-[1050px] bg-white rounded-b-xl shadow-xl border border-neutral-300/80 p-6 sm:p-10 flex flex-col gap-6"
          >
            {objects.length === 0 ? (
              <div className="py-24 flex flex-col items-center justify-center text-center text-neutral-400 border border-dashed border-neutral-200 rounded-xl">
                <p className="font-medium text-neutral-700 text-sm mb-1">
                  Страница пока пуста
                </p>
                <p className="text-xs text-neutral-400 max-w-sm">
                  Добавьте текстовый блок или изображение кнопками в верхней панели. Все элементы будут аккуратно выстраиваться сверху вниз.
                </p>
              </div>
            ) : (
              objects.map((obj, idx) => {
                const isSelected = selectedIds.includes(obj.id);

                if (obj.type === 'text') {
                  return (
                    <CanvasText
                      key={obj.id}
                      object={obj as any}
                      isSelected={isSelected}
                      mode={mode}
                      itemIndex={idx}
                      totalItems={objects.length}
                      onSelect={onSelectObject}
                      onContextMenu={onContextMenu}
                      onChange={onUpdateObject}
                      onDelete={onDeleteObject}
                      onDuplicate={onDuplicateObject}
                      onMoveUp={() => onMoveObjectUp(idx)}
                      onMoveDown={() => onMoveObjectDown(idx)}
                      onToggleEditorTask={onToggleEditorTask}
                    />
                  );
                }

                if (obj.type === 'image') {
                  return (
                    <CanvasImage
                      key={obj.id}
                      object={obj as any}
                      isSelected={isSelected}
                      mode={mode}
                      itemIndex={idx}
                      totalItems={objects.length}
                      onSelect={onSelectObject}
                      onContextMenu={onContextMenu}
                      onChange={onUpdateObject}
                      onDelete={onDeleteObject}
                      onDuplicate={onDuplicateObject}
                      onMoveUp={() => onMoveObjectUp(idx)}
                      onMoveDown={() => onMoveObjectDown(idx)}
                      onOpenFullscreen={onOpenImageFullscreen}
                    />
                  );
                }

                return null;
              })
            )}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-neutral-500 bg-white rounded-xl border border-neutral-200 mt-20">
          <p className="text-sm font-semibold text-neutral-800 mb-1">
            Страница не выбрана
          </p>
          <p className="text-xs text-neutral-400">
            Выберите существующий холст в левой панели или нажмите «Добавить холст».
          </p>
        </div>
      )}
    </div>
  );
};
