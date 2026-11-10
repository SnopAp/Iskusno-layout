import React, { useRef, useState, useEffect } from 'react';
import { TextCanvasObject, AppMode } from '../types';
import { renderMarkdownToHtml } from '../utils/markdown';
import { MilkdownWysiwyg } from './MilkdownWysiwyg';
import {
  Edit2,
  Check,
  Copy,
  Trash2,
  Lock,
  Unlock,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

interface CanvasTextProps {
  object: TextCanvasObject;
  isSelected: boolean;
  mode: AppMode;
  itemIndex: number;
  totalItems: number;
  onSelect: (id: string, e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent, obj: TextCanvasObject) => void;
  onChange: (updated: TextCanvasObject) => void;
  onDelete: (id: string) => void;
  onDuplicate: (obj: TextCanvasObject) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  // Sequential checkbox toggle within editor (Section 4.4, 5.1)
  onToggleEditorTask?: (blockId: string, taskIndex: number) => void;
}

export const CanvasText: React.FC<CanvasTextProps> = ({
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
  onToggleEditorTask,
}) => {
  const [isEditingInline, setIsEditingInline] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Exit inline editing on deselect or if locked
  useEffect(() => {
    if ((!isSelected || object.locked) && isEditingInline) {
      setIsEditingInline(false);
    }
  }, [isSelected, object.locked, isEditingInline]);

  // Typography Styles
  const typographyStyle: React.CSSProperties = {
    fontFamily: object.fontFamily,
    fontSize: `${object.fontSize}px`,
    fontWeight: object.fontWeight,
    fontStyle: object.fontStyle,
    color: object.color,
    lineHeight: object.lineHeight,
    textAlign: object.textAlign,
  };

  return (
    <div
      ref={containerRef}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(object.id, e);
      }}
      onDoubleClick={(e) => {
        if (object.locked) return;
        e.stopPropagation();
        setIsEditingInline(true);
      }}
      onContextMenu={(e) => onContextMenu(e, object)}
      className={`w-full group relative rounded-lg transition-all ${
        isSelected
          ? 'ring-2 ring-blue-600 bg-blue-50/20 shadow-xs'
          : 'hover:ring-1 hover:ring-neutral-300 ring-transparent'
      }`}
    >
      {/* Element Header Bar when selected in Editor */}
      {isSelected && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-blue-600 text-white rounded-t-lg text-[11px] font-medium select-none shadow-xs">
          <div className="flex items-center gap-2 truncate">
            <span className="font-mono text-[10px] bg-blue-700 px-1.5 py-0.5 rounded text-white">
              #{itemIndex + 1} ТЕКСТ
            </span>
            <span className="truncate opacity-90">
              {object.markdown.slice(0, 36).replace(/[#*`_]/g, '') || 'Текстовый блок'}
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

            <button
              type="button"
              onClick={() => setIsEditingInline(!isEditingInline)}
              className="p-1 hover:bg-blue-700 rounded transition-colors text-white cursor-pointer ml-1"
              title={isEditingInline ? 'Завершить редактирование' : 'Редактировать WYSIWYG'}
            >
              {isEditingInline ? <Check className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => onChange({ ...object, locked: !object.locked })}
              className="p-1 hover:bg-blue-700 rounded transition-colors text-white cursor-pointer"
              title={object.locked ? 'Разблокировать' : 'Заблокировать'}
            >
              {object.locked ? <Lock className="w-3.5 h-3.5 text-amber-300" /> : <Unlock className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => onDuplicate(object)}
              className="p-1 hover:bg-blue-700 rounded transition-colors text-white cursor-pointer"
              title="Дублировать блок"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(object.id)}
              className="p-1 hover:bg-rose-700 rounded transition-colors text-white cursor-pointer"
              title="Удалить блок"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Surface Area */}
      <div
        className={`w-full p-3 ${
          isSelected ? 'rounded-b-lg' : 'rounded-lg'
        } overflow-hidden`}
        style={typographyStyle}
      >
        {isEditingInline ? (
          <div className="w-full flex flex-col bg-white rounded border border-neutral-200 p-2">
            <MilkdownWysiwyg
              initialMarkdown={object.markdown}
              onChange={(md) => onChange({ ...object, markdown: md })}
              className="min-h-[120px]"
            />
            <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-400 border-t border-neutral-100 pt-1.5 font-sans">
              <span>Для списка задач используйте: <code>- [ ] Текст задачи</code></span>
              <button
                type="button"
                onClick={() => setIsEditingInline(false)}
                className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
              >
                Готово
              </button>
            </div>
          </div>
        ) : (
          <div
            className="markdown-body w-full select-none"
            onClick={(e) => {
              const taskEl = (e.target as HTMLElement).closest('[data-task-index]');
              if (taskEl) {
                e.stopPropagation();
                const idxAttr = taskEl.getAttribute('data-task-index');
                if (idxAttr !== null) {
                  const taskIdx = parseInt(idxAttr, 10);
                  if (!isNaN(taskIdx)) {
                    onToggleEditorTask?.(object.id, taskIdx);
                  }
                }
              }
            }}
            dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(object.markdown) }}
          />
        )}
      </div>
    </div>
  );
};
