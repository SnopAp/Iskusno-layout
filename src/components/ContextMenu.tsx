import React, { useEffect, useRef } from 'react';
import {
  Copy,
  ArrowUpToLine,
  ArrowDownToLine,
  ChevronUp,
  ChevronDown,
  Lock,
  Unlock,
  Trash2,
  Paintbrush,
} from 'lucide-react';
import { CanvasObject } from '../types';

interface ContextMenuProps {
  x: number;
  y: number;
  targetObject: CanvasObject;
  onClose: () => void;
  onApplyGlobalStyle: (id: string) => void;
  onDuplicate: (obj: CanvasObject) => void;
  onBringToFront: (id: string) => void;
  onSendToBack: (id: string) => void;
  onBringForward: (id: string) => void;
  onSendBackward: (id: string) => void;
  onToggleLock: (id: string) => void;
  onDelete: (id: string) => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  targetObject,
  onClose,
  onApplyGlobalStyle,
  onDuplicate,
  onBringToFront,
  onSendToBack,
  onBringForward,
  onSendBackward,
  onToggleLock,
  onDelete,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const adjustedX = Math.min(x, window.innerWidth - 245);
  const adjustedY = Math.min(y, window.innerHeight - 310);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-56 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-neutral-200/80 p-1 text-xs text-neutral-700 select-none animate-in fade-in zoom-in-95 duration-100"
      style={{ left: `${adjustedX}px`, top: `${adjustedY}px` }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-2.5 py-1.5 text-[10px] font-mono text-neutral-400 border-b border-neutral-100 mb-1 flex items-center justify-between tabular-nums">
        <span>
          {targetObject.type === 'text' ? 'ТЕКСТ' : 'ФОТО'} #{targetObject.id.slice(-6)}
        </span>
        <span>Порядок</span>
      </div>

      {/* Section 8.3 & 10: Apply Global Style for Text Blocks */}
      {targetObject.type === 'text' && (
        <>
          <button
            type="button"
            disabled={targetObject.locked}
            onClick={() => {
              onApplyGlobalStyle(targetObject.id);
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-blue-50 text-blue-700 transition-colors text-left cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed font-medium"
          >
            <Paintbrush className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Применить глобальный стиль</span>
          </button>
          <div className="my-1 border-t border-neutral-100" />
        </>
      )}

      <button
        type="button"
        onClick={() => {
          onDuplicate(targetObject);
          onClose();
        }}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 transition-colors text-left cursor-pointer"
      >
        <Copy className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
        <span>Дублировать</span>
      </button>

      <div className="my-1 border-t border-neutral-100" />

      <button
        type="button"
        onClick={() => {
          onBringToFront(targetObject.id);
          onClose();
        }}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 transition-colors text-left cursor-pointer"
      >
        <ArrowUpToLine className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
        <span>В самый верх</span>
      </button>

      <button
        type="button"
        onClick={() => {
          onBringForward(targetObject.id);
          onClose();
        }}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 transition-colors text-left cursor-pointer"
      >
        <ChevronUp className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
        <span>Переместить выше</span>
      </button>

      <button
        type="button"
        onClick={() => {
          onSendBackward(targetObject.id);
          onClose();
        }}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 transition-colors text-left cursor-pointer"
      >
        <ChevronDown className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
        <span>Переместить ниже</span>
      </button>

      <button
        type="button"
        onClick={() => {
          onSendToBack(targetObject.id);
          onClose();
        }}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 transition-colors text-left cursor-pointer"
      >
        <ArrowDownToLine className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
        <span>В самый низ</span>
      </button>

      <div className="my-1 border-t border-neutral-100" />

      <button
        type="button"
        onClick={() => {
          onToggleLock(targetObject.id);
          onClose();
        }}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 transition-colors text-left cursor-pointer"
      >
        {targetObject.locked ? (
          <>
            <Unlock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="text-amber-700 font-medium">Разблокировать</span>
          </>
        ) : (
          <>
            <Lock className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
            <span>Заблокировать</span>
          </>
        )}
      </button>

      <button
        type="button"
        disabled={targetObject.locked}
        onClick={() => {
          onDelete(targetObject.id);
          onClose();
        }}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors text-left cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Trash2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
        <span>Удалить</span>
      </button>
    </div>
  );
};
