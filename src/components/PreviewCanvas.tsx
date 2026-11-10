import React from 'react';
import {
  DocumentModel,
  CanvasModel,
  ViewerProgress,
  TextCanvasObject,
  ImageCanvasObject,
} from '../types';
import { renderMarkdownToHtml } from '../utils/markdown';
import { isCanvasCompletedInViewer } from '../utils/documentLogic';
import {
  CheckSquare,
  Square,
  ChevronDown,
  ChevronRight,
  Maximize2,
} from 'lucide-react';

interface SinglePageViewerProps {
  canvas: CanvasModel;
  pageNumber: number;
  viewerProgress: ViewerProgress;
  onToggleViewerCheckbox: (canvasId: string, textBlockId: string, taskIndex: number) => void;
  onToggleViewerPageCompletion: (canvasId: string) => void;
  onToggleViewerPageCollapse: (canvasId: string) => void;
  onOpenImageFullscreen: (img: ImageCanvasObject) => void;
}

const SinglePageViewer: React.FC<SinglePageViewerProps> = ({
  canvas,
  pageNumber,
  viewerProgress,
  onToggleViewerCheckbox,
  onToggleViewerPageCompletion,
  onToggleViewerPageCollapse,
  onOpenImageFullscreen,
}) => {
  const isCompleted = isCanvasCompletedInViewer(canvas, viewerProgress);
  const isCollapsed = Boolean(viewerProgress.collapsedCanvases[canvas.id]);

  return (
    <div className="w-full max-w-[800px] flex flex-col items-center">
      {/* 1. Page Header (Section 6, 7, 11): Ordinal number, title, page checkbox, collapse control */}
      <div
        className={`w-full px-4 py-3 bg-white rounded-t-xl border border-neutral-300 shadow-sm flex items-center justify-between gap-3 select-none transition-colors ${
          isCollapsed ? 'rounded-b-xl border-b' : 'border-b-0'
        } ${isCompleted ? 'bg-neutral-50/90' : 'bg-white'}`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Interactive Page Completion Checkbox */}
          <button
            type="button"
            onClick={() => onToggleViewerPageCompletion(canvas.id)}
            title={
              isCompleted
                ? 'Снять отметку со страницы (также снимет отметки со всех задач страницы)'
                : 'Отметить страницу выполненной (также отметит все задачи страницы)'
            }
            className={`p-1 rounded cursor-pointer transition-transform hover:scale-110 active:scale-95 shrink-0 ${
              isCompleted
                ? 'text-emerald-600 hover:text-emerald-700'
                : 'text-neutral-400 hover:text-neutral-700'
            }`}
          >
            {isCompleted ? (
              <CheckSquare className="w-5 h-5" />
            ) : (
              <Square className="w-5 h-5" />
            )}
          </button>

          {/* Formatted Title: "1. Название страницы" (Section 6: gray & line-through when completed) */}
          <div className="flex items-baseline gap-2 truncate flex-1 min-w-0">
            <span
              className={`font-mono font-bold text-base tabular-nums shrink-0 transition-colors ${
                isCompleted ? 'text-neutral-400' : 'text-neutral-900'
              }`}
            >
              {pageNumber}.
            </span>
            <span
              className={`font-semibold text-sm sm:text-base truncate transition-all ${
                isCompleted
                  ? 'text-neutral-400 line-through decoration-neutral-400'
                  : 'text-neutral-900'
              }`}
            >
              {canvas.title.trim() || 'Без названия'}
            </span>
          </div>
        </div>

        {/* Section 7: Collapse / Expand Control */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onToggleViewerPageCollapse(canvas.id)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
            title={isCollapsed ? 'Развернуть страницу' : 'Свернуть страницу'}
          >
            {isCollapsed ? (
              <>
                <ChevronRight className="w-4 h-4 text-neutral-500" />
                <span className="hidden sm:inline">Развернуть</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 text-neutral-500" />
                <span className="hidden sm:inline">Свернуть</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Page Content in Vertical Layout (when expanded) */}
      {!isCollapsed && (
        <div className="w-full bg-white rounded-b-xl border border-neutral-300 border-t-0 shadow-lg p-5 sm:p-10 flex flex-col gap-6 prevent-select">
          {canvas.objects.length === 0 ? (
            <p className="py-8 text-center text-xs text-neutral-400 italic">
              Страница пуста
            </p>
          ) : (
            canvas.objects.map((obj) => {
              if (obj.type === 'text') {
                const textObj = obj as TextCanvasObject;

                const typographyStyle: React.CSSProperties = {
                  fontFamily: textObj.fontFamily,
                  fontSize: `${textObj.fontSize}px`,
                  fontWeight: textObj.fontWeight,
                  fontStyle: textObj.fontStyle,
                  color: textObj.color,
                  lineHeight: textObj.lineHeight,
                  textAlign: textObj.textAlign,
                };

                return (
                  <div
                    key={textObj.id}
                    className="w-full overflow-hidden"
                    style={typographyStyle}
                  >
                    <div
                      className="markdown-body w-full"
                      onClick={(e) => {
                        const taskEl = (e.target as HTMLElement).closest('[data-task-index]');
                        if (taskEl) {
                          e.stopPropagation();
                          const idxAttr = taskEl.getAttribute('data-task-index');
                          if (idxAttr !== null) {
                            const taskIdx = parseInt(idxAttr, 10);
                            if (!isNaN(taskIdx)) {
                              onToggleViewerCheckbox(canvas.id, textObj.id, taskIdx);
                            }
                          }
                        }
                      }}
                      dangerouslySetInnerHTML={{
                        __html: renderMarkdownToHtml(textObj.markdown, (taskIdx) =>
                          Boolean(viewerProgress.checkboxStates[`${canvas.id}:${textObj.id}:${taskIdx}`])
                        ),
                      }}
                    />
                  </div>
                );
              }

              if (obj.type === 'image') {
                const imgObj = obj as ImageCanvasObject;

                const transformParts: string[] = [];
                if (imgObj.rotation) {
                  transformParts.push(`rotate(${imgObj.rotation}deg)`);
                }
                const scaleX = imgObj.flipHorizontal ? -1 : 1;
                const scaleY = imgObj.flipVertical ? -1 : 1;
                if (scaleX !== 1 || scaleY !== 1) {
                  transformParts.push(`scale(${scaleX}, ${scaleY})`);
                }
                const transformStyle =
                  transformParts.length > 0 ? transformParts.join(' ') : undefined;

                const widthPercent = imgObj.widthPercent || 100;

                return (
                  <div
                    key={imgObj.id}
                    className="w-full flex flex-col items-center justify-center my-1"
                  >
                    <div
                      className="relative rounded-lg overflow-hidden border border-neutral-200/90 shadow-2xs group"
                      style={{
                        width: `${widthPercent}%`,
                        maxHeight: imgObj.customHeight
                          ? `${imgObj.customHeight}px`
                          : '480px',
                      }}
                    >
                      {imgObj.dataUrl && (
                        <img
                          src={imgObj.dataUrl}
                          alt={imgObj.alt || 'Изображение'}
                          onClick={() => {
                            if (imgObj.allowDownload) {
                              onOpenImageFullscreen(imgObj);
                            }
                          }}
                          className={`w-full h-auto max-h-[480px] select-none ${
                            imgObj.allowDownload ? 'cursor-zoom-in' : ''
                          }`}
                          style={{
                            objectFit: imgObj.objectFit || 'contain',
                            transform: transformStyle,
                          }}
                          draggable={false}
                        />
                      )}

                      {/* Section 8.4: Download overlay button if allowed */}
                      {imgObj.allowDownload && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenImageFullscreen(imgObj);
                          }}
                          className="absolute bottom-2 right-2 px-2.5 py-1.5 rounded-md bg-neutral-900/85 hover:bg-neutral-900 text-white text-xs font-medium flex items-center gap-1.5 shadow-md transition-all cursor-pointer opacity-90 hover:opacity-100"
                          title="Открыть и скачать оригинальное изображение"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span>Просмотр и скачивание</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              }

              return null;
            })
          )}
        </div>
      )}
    </div>
  );
};

interface PreviewCanvasProps {
  documentModel: DocumentModel;
  viewerProgress: ViewerProgress;
  onToggleViewerCheckbox: (canvasId: string, textBlockId: string, taskIndex: number) => void;
  onToggleViewerPageCompletion: (canvasId: string) => void;
  onToggleViewerPageCollapse: (canvasId: string) => void;
  onOpenImageFullscreen: (img: ImageCanvasObject) => void;
}

export const PreviewCanvas: React.FC<PreviewCanvasProps> = ({
  documentModel,
  viewerProgress,
  onToggleViewerCheckbox,
  onToggleViewerPageCompletion,
  onToggleViewerPageCollapse,
  onOpenImageFullscreen,
}) => {
  return (
    <div className="w-full min-h-full py-8 px-3 sm:px-6 flex flex-col items-center gap-8 select-none">
      {documentModel.canvasOrder.length === 0 ? (
        <div className="p-12 text-center text-neutral-500 bg-white rounded-xl border border-neutral-200">
          <p className="text-sm font-semibold text-neutral-800 mb-1">Документ пуст</p>
          <p className="text-xs text-neutral-500">
            В документе нет ни одного холста. Перейдите в режим редактора и создайте страницу.
          </p>
        </div>
      ) : (
        documentModel.canvasOrder.map((canvasId, index) => {
          const canvas = documentModel.canvases[canvasId];
          if (!canvas) return null;

          return (
            <SinglePageViewer
              key={canvasId}
              canvas={canvas}
              pageNumber={index + 1}
              viewerProgress={viewerProgress}
              onToggleViewerCheckbox={onToggleViewerCheckbox}
              onToggleViewerPageCompletion={onToggleViewerPageCompletion}
              onToggleViewerPageCollapse={onToggleViewerPageCollapse}
              onOpenImageFullscreen={onOpenImageFullscreen}
            />
          );
        })
      )}
    </div>
  );
};
