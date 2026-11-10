import React, { useRef } from 'react';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Type,
  FileText,
  Trash2,
  Copy,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Table,
  CheckSquare,
  Info,
  Lock,
  Unlock,
  RotateCw,
  Image as ImageIcon,
  Upload,
  Paintbrush,
  Sliders,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Download,
  FlipHorizontal,
  FlipVertical,
} from 'lucide-react';
import {
  CanvasObject,
  TextCanvasObject,
  ImageCanvasObject,
  FONT_OPTIONS,
  TextStyle,
  CanvasModel,
} from '../types';

interface PropertyPanelProps {
  currentCanvas: CanvasModel | null;
  selectedObject: CanvasObject | null;
  selectedIds: string[];
  globalTextStyle: TextStyle;
  onUpdateGlobalTextStyle: (style: TextStyle) => void;
  onApplyGlobalStyleToObject: (id: string) => void;
  onChange: (updated: CanvasObject) => void;
  onDelete: (id: string) => void;
  onDuplicate: (obj: CanvasObject) => void;
  onReplaceImageFile: (file: File) => void;
  onSelectObjectById: (id: string) => void;
  onReorderObjects: (newObjects: CanvasObject[]) => void;
}

const COLOR_SWATCHES = [
  '#0f172a', // Slate 900
  '#334155', // Slate 700
  '#64748b', // Slate 500
  '#1d4ed8', // Blue 700
  '#4338ca', // Indigo 700
  '#047857', // Emerald 700
  '#b45309', // Amber 700
  '#b91c1c', // Red 700
  '#6d28d9', // Purple 700
  '#000000', // Black
];

export const PropertyPanel: React.FC<PropertyPanelProps> = ({
  currentCanvas,
  selectedObject,
  selectedIds,
  globalTextStyle,
  onUpdateGlobalTextStyle,
  onApplyGlobalStyleToObject,
  onChange,
  onDelete,
  onDuplicate,
  onReplaceImageFile,
  onSelectObjectById,
  onReorderObjects,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const markdownTextareaRef = useRef<HTMLTextAreaElement>(null);
  const lastSelectionRef = useRef<{ start: number; end: number } | null>(null);

  const objects = currentCanvas?.objects || [];

  const updateTextareaSelection = () => {
    if (markdownTextareaRef.current) {
      lastSelectionRef.current = {
        start: markdownTextareaRef.current.selectionStart,
        end: markdownTextareaRef.current.selectionEnd,
      };
    }
  };

  // Reorder objects within page (Section 9.1)
  const moveObject = (fromIndex: number, toIndex: number) => {
    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= objects.length ||
      toIndex >= objects.length
    ) {
      return;
    }

    const updated = [...objects];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    onReorderObjects(updated);
  };

  // -------------------------------------------------------------
  // If NO OBJECT is selected: Show Page Elements List & Global Typography
  // -------------------------------------------------------------
  if (!selectedObject) {
    return (
      <aside className="w-80 bg-white border-l border-neutral-200 flex flex-col shrink-0 overflow-y-auto select-none">
        {/* Panel Header */}
        <div className="p-3.5 border-b border-neutral-200 bg-neutral-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-neutral-800" />
            <h2 className="text-xs font-semibold text-neutral-800 uppercase tracking-wider">
              Свойства страницы
            </h2>
          </div>
          <span className="text-xs font-mono text-neutral-400">
            {objects.length} элементов
          </span>
        </div>

        <div className="p-4 flex flex-col gap-5 text-neutral-700 text-xs">
          {/* SECTION 9: Список элементов страницы */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-neutral-900 text-xs uppercase tracking-wider">
                Элементы страницы
              </span>
              <span className="text-[10px] text-neutral-400">
                Перетащите или перемещайте стрелками
              </span>
            </div>

            {objects.length === 0 ? (
              <div className="p-4 bg-neutral-50 rounded-lg border border-dashed border-neutral-300 text-center text-neutral-400 text-xs">
                На странице нет элементов. Добавьте текст или изображение через верхнюю панель.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {objects.map((obj, idx) => {
                  const isText = obj.type === 'text';
                  const label = isText
                    ? (obj as TextCanvasObject).markdown
                        .slice(0, 32)
                        .replace(/[#*`_]/g, '') || `Текстовый блок ${idx + 1}`
                    : (obj as ImageCanvasObject).alt || `Изображение ${idx + 1}`;

                  return (
                    <div
                      key={obj.id}
                      onClick={() => onSelectObjectById(obj.id)}
                      className="flex items-center gap-2 p-2 rounded-lg bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/80 transition-colors cursor-pointer group"
                    >
                      <div className="text-neutral-400 shrink-0">
                        <GripVertical className="w-3.5 h-3.5" />
                      </div>

                      <span className="w-5 font-mono text-[11px] font-bold text-neutral-500 tabular-nums shrink-0">
                        {idx + 1}.
                      </span>

                      <div className="p-1 rounded bg-white border border-neutral-200 shrink-0">
                        {isText ? (
                          <Type className="w-3 h-3 text-blue-600" />
                        ) : (
                          <ImageIcon className="w-3 h-3 text-emerald-600" />
                        )}
                      </div>

                      <span className="flex-1 truncate font-medium text-neutral-800 text-xs">
                        {label}
                      </span>

                      {/* Quick Move Buttons */}
                      <div
                        className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveObject(idx, idx - 1)}
                          className="p-1 rounded hover:bg-white text-neutral-500 hover:text-neutral-900 disabled:opacity-20 cursor-pointer"
                          title="Переместить выше"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === objects.length - 1}
                          onClick={() => moveObject(idx, idx + 1)}
                          className="p-1 rounded hover:bg-white text-neutral-500 hover:text-neutral-900 disabled:opacity-20 cursor-pointer"
                          title="Переместить ниже"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(obj.id)}
                          className="p-1 rounded hover:bg-rose-100 text-neutral-400 hover:text-rose-600 cursor-pointer ml-0.5"
                          title="Удалить элемент"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION 10: Глобальные настройки текста */}
          <div className="pt-4 border-t border-neutral-200">
            <div className="flex items-center gap-2 mb-2">
              <Type className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-neutral-900 text-xs uppercase tracking-wider">
                Глобальная типографика
              </h3>
            </div>

            <p className="text-[11px] text-neutral-500 mb-3">
              Стандарт для всех новых текстовых блоков документа.
            </p>

            {/* Шрифт */}
            <div className="mb-2.5">
              <label className="text-[11px] font-medium text-neutral-700 block mb-1">
                Семейство шрифта
              </label>
              <select
                value={globalTextStyle.fontFamily}
                onChange={(e) =>
                  onUpdateGlobalTextStyle({
                    ...globalTextStyle,
                    fontFamily: e.target.value,
                  })
                }
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 cursor-pointer focus:bg-white focus:outline-hidden"
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Размер шрифта */}
            <div className="mb-2.5">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-neutral-700">Размер шрифта</label>
                <span className="font-mono text-neutral-800 text-[11px] tabular-nums">
                  {globalTextStyle.fontSize} px
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="11"
                  max="32"
                  value={globalTextStyle.fontSize}
                  onChange={(e) =>
                    onUpdateGlobalTextStyle({
                      ...globalTextStyle,
                      fontSize: Number(e.target.value),
                    })
                  }
                  className="flex-1 accent-neutral-900 cursor-pointer"
                />
                <input
                  type="number"
                  min="9"
                  max="48"
                  value={globalTextStyle.fontSize}
                  onChange={(e) =>
                    onUpdateGlobalTextStyle({
                      ...globalTextStyle,
                      fontSize: Math.max(9, Number(e.target.value) || 14),
                    })
                  }
                  className="w-14 bg-neutral-50 border border-neutral-200 rounded-lg px-1 py-1 font-mono text-xs text-center text-neutral-900"
                />
              </div>
            </div>

            {/* Начертание и выравнивание */}
            <div className="grid grid-cols-2 gap-2 mb-2.5">
              <div>
                <label className="text-[11px] font-medium text-neutral-700 block mb-1">
                  Начертание
                </label>
                <div className="flex items-center p-0.5 bg-neutral-100 rounded-lg border border-neutral-200">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateGlobalTextStyle({
                        ...globalTextStyle,
                        fontWeight: globalTextStyle.fontWeight >= 700 ? 400 : 700,
                      })
                    }
                    className={`flex-1 flex items-center justify-center py-1 rounded text-xs transition-colors cursor-pointer ${
                      globalTextStyle.fontWeight >= 700
                        ? 'bg-white text-neutral-900 font-bold shadow-xs'
                        : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                    title="Жирный шрифт"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateGlobalTextStyle({
                        ...globalTextStyle,
                        fontStyle:
                          globalTextStyle.fontStyle === 'italic'
                            ? 'normal'
                            : 'italic',
                      })
                    }
                    className={`flex-1 flex items-center justify-center py-1 rounded text-xs transition-colors cursor-pointer ${
                      globalTextStyle.fontStyle === 'italic'
                        ? 'bg-white text-neutral-900 italic shadow-xs'
                        : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                    title="Курсив"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-neutral-700 block mb-1">
                  Выравнивание
                </label>
                <div className="flex items-center p-0.5 bg-neutral-100 rounded-lg border border-neutral-200">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateGlobalTextStyle({
                        ...globalTextStyle,
                        textAlign: 'left',
                      })
                    }
                    className={`flex-1 flex items-center justify-center py-1 rounded text-xs transition-colors cursor-pointer ${
                      globalTextStyle.textAlign === 'left'
                        ? 'bg-white text-neutral-900 shadow-xs'
                        : 'text-neutral-500'
                    }`}
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateGlobalTextStyle({
                        ...globalTextStyle,
                        textAlign: 'center',
                      })
                    }
                    className={`flex-1 flex items-center justify-center py-1 rounded text-xs transition-colors cursor-pointer ${
                      globalTextStyle.textAlign === 'center'
                        ? 'bg-white text-neutral-900 shadow-xs'
                        : 'text-neutral-500'
                    }`}
                  >
                    <AlignCenter className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateGlobalTextStyle({
                        ...globalTextStyle,
                        textAlign: 'right',
                      })
                    }
                    className={`flex-1 flex items-center justify-center py-1 rounded text-xs transition-colors cursor-pointer ${
                      globalTextStyle.textAlign === 'right'
                        ? 'bg-white text-neutral-900 shadow-xs'
                        : 'text-neutral-500'
                    }`}
                  >
                    <AlignRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Цвет текста */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-medium text-neutral-700">Цвет текста</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={globalTextStyle.color}
                    onChange={(e) =>
                      onUpdateGlobalTextStyle({
                        ...globalTextStyle,
                        color: e.target.value,
                      })
                    }
                    className="w-5 h-5 rounded cursor-pointer border border-neutral-300 p-0"
                  />
                  <span className="font-mono text-[11px] text-neutral-600 uppercase">
                    {globalTextStyle.color}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {COLOR_SWATCHES.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() =>
                      onUpdateGlobalTextStyle({
                        ...globalTextStyle,
                        color: hex,
                      })
                    }
                    style={{ backgroundColor: hex }}
                    className={`w-5 h-5 rounded-full border transition-transform cursor-pointer ${
                      globalTextStyle.color.toLowerCase() === hex.toLowerCase()
                        ? 'ring-2 ring-blue-500 scale-110 border-white'
                        : 'border-black/10'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // -------------------------------------------------------------
  // If an OBJECT IS SELECTED: Show Object Inspector
  // -------------------------------------------------------------
  const isText = selectedObject.type === 'text';
  const isImage = selectedObject.type === 'image';
  const textObj = isText ? (selectedObject as TextCanvasObject) : null;
  const imageObj = isImage ? (selectedObject as ImageCanvasObject) : null;

  const currentIndex = objects.findIndex((o) => o.id === selectedObject.id);

  // Insert markdown tag into text object with caret awareness:
  // - If caret is on an empty line: insert snippet directly into the caret position on that empty line.
  // - If caret is on a non-empty line: insert snippet under that line, shifting all subsequent lines down by 1.
  const insertMarkdownTag = (snippet: string) => {
    if (!textObj) return;

    const textarea = markdownTextareaRef.current;
    const content = textObj.markdown;

    // Determine caret position
    let cursorPos = content.length;
    if (textarea && typeof textarea.selectionStart === 'number') {
      cursorPos = textarea.selectionStart;
    } else if (lastSelectionRef.current) {
      cursorPos = lastSelectionRef.current.start;
    }

    cursorPos = Math.max(0, Math.min(cursorPos, content.length));

    // Find current line bounds around the caret
    const lineStart = cursorPos > 0 ? content.lastIndexOf('\n', cursorPos - 1) + 1 : 0;
    const nextNewline = content.indexOf('\n', cursorPos);
    const lineEnd = nextNewline !== -1 ? nextNewline : content.length;

    const currentLine = content.slice(lineStart, lineEnd);
    const isEmptyLine = currentLine.trim().length === 0;

    let newContent: string;
    let newCursorPos: number;

    if (isEmptyLine) {
      // Empty line: insert into the caret position, replacing the whitespace of this line
      newContent = content.slice(0, lineStart) + snippet + content.slice(lineEnd);
      newCursorPos = lineStart + snippet.length;
    } else {
      // Non-empty line: insert snippet directly below the current line, shifting all subsequent lines down by 1
      const before = content.slice(0, lineEnd);
      const after = content.slice(lineEnd);
      newContent = `${before}\n${snippet}${after}`;
      newCursorPos = lineEnd + 1 + snippet.length;
    }

    onChange({
      ...textObj,
      markdown: newContent,
    });

    lastSelectionRef.current = {
      start: newCursorPos,
      end: newCursorPos,
    };

    // Restore focus and cursor position in the textarea
    requestAnimationFrame(() => {
      if (markdownTextareaRef.current) {
        markdownTextareaRef.current.focus();
        markdownTextareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    });
  };

  return (
    <aside className="w-80 bg-white border-l border-neutral-200 flex flex-col shrink-0 h-full overflow-y-auto select-none">
      {/* Panel Header */}
      <div className="h-12 border-b border-neutral-200 px-4 flex items-center justify-between bg-neutral-50/50 shrink-0">
        <div className="flex items-center gap-2">
          {isText ? (
            <Type className="w-4 h-4 text-blue-600" />
          ) : (
            <ImageIcon className="w-4 h-4 text-emerald-600" />
          )}
          <span className="text-xs font-semibold text-neutral-800 uppercase tracking-wider">
            {isText ? 'Текстовый блок' : 'Изображение'} #{currentIndex + 1}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() =>
              onChange({ ...selectedObject, locked: !selectedObject.locked })
            }
            className="p-1 hover:bg-neutral-200 rounded text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer"
            title={selectedObject.locked ? 'Разблокировать' : 'Заблокировать'}
          >
            {selectedObject.locked ? (
              <Lock className="w-3.5 h-3.5 text-amber-600" />
            ) : (
              <Unlock className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={() => onDuplicate(selectedObject)}
            className="p-1 hover:bg-neutral-200 rounded text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer"
            title="Дублировать объект"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(selectedObject.id)}
            className="p-1 hover:bg-rose-100 rounded text-neutral-600 hover:text-rose-700 transition-colors cursor-pointer"
            title="Удалить объект"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-5 text-xs text-neutral-700">
        {/* Позиция в списке элементов */}
        <div className="flex items-center justify-between p-2.5 bg-neutral-50 rounded-lg border border-neutral-200">
          <span className="text-[11px] text-neutral-600">Порядок на странице:</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentIndex <= 0}
              onClick={() => moveObject(currentIndex, currentIndex - 1)}
              className="p-1 rounded bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-700 disabled:opacity-30 cursor-pointer"
              title="Переместить выше"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono font-bold text-xs px-2 tabular-nums">
              {currentIndex + 1} / {objects.length}
            </span>
            <button
              type="button"
              disabled={currentIndex >= objects.length - 1}
              onClick={() => moveObject(currentIndex, currentIndex + 1)}
              className="p-1 rounded bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-700 disabled:opacity-30 cursor-pointer"
              title="Переместить ниже"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* SECTION 8: НАСТРОЙКИ ИЗОБРАЖЕНИЯ */}
        {isImage && imageObj && (
          <div className="space-y-4">
            <div className="flex items-center justify-between font-semibold text-neutral-900">
              <span className="uppercase tracking-wider text-xs">
                Параметры изображения
              </span>
            </div>

            {/* 8.1: Масштабирование (Ширина в % от страницы) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] text-neutral-600">Ширина страницы</label>
                <span className="font-mono text-neutral-900 text-xs font-semibold tabular-nums">
                  {imageObj.widthPercent || 100}%
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                step="5"
                value={imageObj.widthPercent || 100}
                onChange={(e) =>
                  onChange({
                    ...imageObj,
                    widthPercent: Number(e.target.value),
                  })
                }
                className="w-full accent-neutral-900 cursor-pointer"
              />
            </div>

            {/* 8.2: Повороты (+90°, -90°, Сброс) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] text-neutral-600">Поворот</label>
                <span className="font-mono text-neutral-900 text-xs tabular-nums">
                  {imageObj.rotation || 0}°
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      ...imageObj,
                      rotation: ((imageObj.rotation || 0) + 90) % 360,
                    })
                  }
                  className="py-1 px-2 rounded border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-center font-medium cursor-pointer"
                  title="Повернуть на 90° по часовой стрелке"
                >
                  +90°
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      ...imageObj,
                      rotation: ((imageObj.rotation || 0) - 90 + 360) % 360,
                    })
                  }
                  className="py-1 px-2 rounded border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-center font-medium cursor-pointer"
                  title="Повернуть на 90° против часовой стрелки"
                >
                  -90°
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ ...imageObj, rotation: 0 })}
                  className="py-1 px-2 rounded border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-center text-neutral-600 cursor-pointer"
                  title="Сбросить поворот"
                >
                  0° Сброс
                </button>
              </div>
            </div>

            {/* 8.3: Отзеркаливание */}
            <div>
              <label className="text-[11px] text-neutral-600 block mb-1.5">
                Отражение (Mirroring)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      ...imageObj,
                      flipHorizontal: !imageObj.flipHorizontal,
                    })
                  }
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                    imageObj.flipHorizontal
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  <FlipHorizontal className="w-3.5 h-3.5" />
                  <span>По горизонтали</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      ...imageObj,
                      flipVertical: !imageObj.flipVertical,
                    })
                  }
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                    imageObj.flipVertical
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  <FlipVertical className="w-3.5 h-3.5" />
                  <span>По вертикали</span>
                </button>
              </div>
            </div>

            {/* 8.4: Разрешение скачивания */}
            <div className="pt-2 border-t border-neutral-100">
              <label className="flex items-center justify-between p-2 rounded-lg bg-neutral-50 border border-neutral-200 cursor-pointer hover:bg-neutral-100/70 transition-colors">
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-neutral-700" />
                  <div>
                    <span className="font-semibold text-neutral-900 block text-xs">
                      Разрешено скачивание
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      Открытие в полном размере и кнопка скачивания
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={imageObj.allowDownload}
                  onChange={(e) =>
                    onChange({
                      ...imageObj,
                      allowDownload: e.target.checked,
                    })
                  }
                  className="w-4 h-4 accent-neutral-900 rounded cursor-pointer"
                />
              </label>
            </div>

            {/* Замена файла */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    onReplaceImageFile(file);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg border border-neutral-200 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Заменить изображение с диска</span>
              </button>
            </div>
          </div>
        )}

        {/* НАСТРОЙКИ ТЕКСТОВОГО БЛОКА */}
        {isText && textObj && (
          <div className="space-y-4">
            <div className="flex items-center justify-between font-semibold text-neutral-900">
              <span className="uppercase tracking-wider text-xs">
                Типографика блока
              </span>
              <button
                type="button"
                disabled={textObj.locked}
                onClick={() => onApplyGlobalStyleToObject(textObj.id)}
                title="Применить значения из глобальных настроек к этому блоку"
                className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-800 disabled:opacity-40 cursor-pointer"
              >
                <Paintbrush className="w-3 h-3" />
                <span>Глобальный стиль</span>
              </button>
            </div>

            {/* Шрифт */}
            <div>
              <label className="text-[11px] text-neutral-500 block mb-1">
                Семейство шрифта
              </label>
              <select
                disabled={textObj.locked}
                value={textObj.fontFamily}
                onChange={(e) =>
                  onChange({ ...textObj, fontFamily: e.target.value })
                }
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 cursor-pointer disabled:opacity-50"
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Размер */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] text-neutral-500">Размер шрифта</label>
                <span className="font-mono text-neutral-800 text-[11px] tabular-nums">
                  {textObj.fontSize} px
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="11"
                  max="40"
                  disabled={textObj.locked}
                  value={textObj.fontSize}
                  onChange={(e) =>
                    onChange({ ...textObj, fontSize: Number(e.target.value) })
                  }
                  className="flex-1 accent-neutral-900 cursor-pointer"
                />
                <input
                  type="number"
                  min="9"
                  max="60"
                  disabled={textObj.locked}
                  value={textObj.fontSize}
                  onChange={(e) =>
                    onChange({
                      ...textObj,
                      fontSize: Math.max(9, Number(e.target.value) || 14),
                    })
                  }
                  className="w-14 bg-neutral-50 border border-neutral-200 rounded-lg px-1 py-1 font-mono text-xs text-center text-neutral-900"
                />
              </div>
            </div>

            {/* Начертание и выравнивание */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-neutral-500 block mb-1">
                  Начертание
                </label>
                <div className="flex items-center p-0.5 bg-neutral-100 rounded-lg border border-neutral-200">
                  <button
                    type="button"
                    disabled={textObj.locked}
                    onClick={() =>
                      onChange({
                        ...textObj,
                        fontWeight: textObj.fontWeight >= 700 ? 400 : 700,
                      })
                    }
                    className={`flex-1 flex items-center justify-center py-1 rounded text-xs transition-colors cursor-pointer ${
                      textObj.fontWeight >= 700
                        ? 'bg-white text-neutral-900 font-bold shadow-xs'
                        : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={textObj.locked}
                    onClick={() =>
                      onChange({
                        ...textObj,
                        fontStyle:
                          textObj.fontStyle === 'italic' ? 'normal' : 'italic',
                      })
                    }
                    className={`flex-1 flex items-center justify-center py-1 rounded text-xs transition-colors cursor-pointer ${
                      textObj.fontStyle === 'italic'
                        ? 'bg-white text-neutral-900 italic shadow-xs'
                        : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-neutral-500 block mb-1">
                  Выравнивание
                </label>
                <div className="flex items-center p-0.5 bg-neutral-100 rounded-lg border border-neutral-200">
                  <button
                    type="button"
                    disabled={textObj.locked}
                    onClick={() => onChange({ ...textObj, textAlign: 'left' })}
                    className={`flex-1 flex items-center justify-center py-1 rounded text-xs transition-colors cursor-pointer ${
                      textObj.textAlign === 'left'
                        ? 'bg-white text-neutral-900 shadow-xs'
                        : 'text-neutral-500'
                    }`}
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={textObj.locked}
                    onClick={() => onChange({ ...textObj, textAlign: 'center' })}
                    className={`flex-1 flex items-center justify-center py-1 rounded text-xs transition-colors cursor-pointer ${
                      textObj.textAlign === 'center'
                        ? 'bg-white text-neutral-900 shadow-xs'
                        : 'text-neutral-500'
                    }`}
                  >
                    <AlignCenter className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={textObj.locked}
                    onClick={() => onChange({ ...textObj, textAlign: 'right' })}
                    className={`flex-1 flex items-center justify-center py-1 rounded text-xs transition-colors cursor-pointer ${
                      textObj.textAlign === 'right'
                        ? 'bg-white text-neutral-900 shadow-xs'
                        : 'text-neutral-500'
                    }`}
                  >
                    <AlignRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Цвет текста */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] text-neutral-500">Цвет текста</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    disabled={textObj.locked}
                    value={textObj.color}
                    onChange={(e) =>
                      onChange({ ...textObj, color: e.target.value })
                    }
                    className="w-5 h-5 rounded cursor-pointer border border-neutral-300 p-0"
                  />
                  <span className="font-mono text-[11px] text-neutral-600 uppercase">
                    {textObj.color}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {COLOR_SWATCHES.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    disabled={textObj.locked}
                    onClick={() => onChange({ ...textObj, color: hex })}
                    style={{ backgroundColor: hex }}
                    className={`w-5 h-5 rounded-full border transition-transform cursor-pointer ${
                      textObj.color.toLowerCase() === hex.toLowerCase()
                        ? 'ring-2 ring-blue-500 scale-110 border-white'
                        : 'border-black/10'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Исходный Markdown без поддержки кода (Section 4.2) */}
            <div className="pt-2 border-t border-neutral-100 flex flex-col flex-1">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 font-semibold text-neutral-900">
                  <FileText className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Исходный Markdown</span>
                </div>
                <span className="text-[10px] text-neutral-400 font-mono tabular-nums">
                  {textObj.markdown.length} симв.
                </span>
              </div>

              {/* Quick Markdown Toolbar: Note: code block and inline code REMOVED as per Section 4.2 */}
              <div className="flex flex-wrap items-center gap-1 mb-2 p-1 bg-neutral-50 rounded-lg border border-neutral-200">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => insertMarkdownTag('# ')}
                  className="p-1 hover:bg-neutral-200 rounded text-neutral-700 cursor-pointer"
                  title="Заголовок H1"
                >
                  <Heading1 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => insertMarkdownTag('## ')}
                  className="p-1 hover:bg-neutral-200 rounded text-neutral-700 cursor-pointer"
                  title="Заголовок H2"
                >
                  <Heading2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => insertMarkdownTag('**важный текст**')}
                  className="p-1 hover:bg-neutral-200 rounded text-neutral-700 cursor-pointer"
                  title="Жирный"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => insertMarkdownTag('*курсив*')}
                  className="p-1 hover:bg-neutral-200 rounded text-neutral-700 cursor-pointer"
                  title="Курсив"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => insertMarkdownTag('- [ ] Новая задача')}
                  className="p-1 hover:bg-neutral-200 rounded text-neutral-700 cursor-pointer"
                  title="Вставить задачу (Task List Checkbox)"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => insertMarkdownTag('- ')}
                  className="p-1 hover:bg-neutral-200 rounded text-neutral-700 cursor-pointer"
                  title="Маркированный список"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => insertMarkdownTag('1. ')}
                  className="p-1 hover:bg-neutral-200 rounded text-neutral-700 cursor-pointer"
                  title="Нумерованный список"
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() =>
                    insertMarkdownTag(
                      '| Колонка 1 | Колонка 2 |\n| :--- | :--- |\n| Текст | Значение |'
                    )
                  }
                  className="p-1 hover:bg-neutral-200 rounded text-neutral-700 cursor-pointer"
                  title="Вставить таблицу GFM"
                >
                  <Table className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => insertMarkdownTag('> Важная цитата')}
                  className="p-1 hover:bg-neutral-200 rounded text-neutral-700 cursor-pointer"
                  title="Цитата"
                >
                  <Quote className="w-3.5 h-3.5" />
                </button>
              </div>

              <textarea
                ref={markdownTextareaRef}
                value={textObj.markdown}
                onChange={(e) => {
                  onChange({ ...textObj, markdown: e.target.value });
                  updateTextareaSelection();
                }}
                onSelect={updateTextareaSelection}
                onKeyUp={updateTextareaSelection}
                onClick={updateTextareaSelection}
                onFocus={updateTextareaSelection}
                onBlur={updateTextareaSelection}
                rows={6}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 font-mono text-xs text-neutral-900 leading-relaxed focus:bg-white focus:border-blue-500 focus:outline-hidden"
                placeholder="Введите текст в формате Markdown..."
              />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
