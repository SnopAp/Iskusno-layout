import React, { useEffect, useRef } from 'react';
import { Editor, rootCtx, defaultValueCtx } from '@milkdown/core';
import { commonmark } from '@milkdown/kit/preset/commonmark';
import { gfm } from '@milkdown/kit/preset/gfm';
import { listener, listenerCtx } from '@milkdown/kit/plugin/listener';

interface MilkdownWysiwygProps {
  initialMarkdown: string;
  onChange: (markdown: string) => void;
  className?: string;
}

export const MilkdownWysiwyg: React.FC<MilkdownWysiwygProps> = ({
  initialMarkdown,
  onChange,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Editor | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!containerRef.current) return;

    let destroyed = false;

    const editor = Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, containerRef.current);
        ctx.set(defaultValueCtx, initialMarkdown);
        ctx.get(listenerCtx).markdownUpdated((_, markdown) => {
          if (!destroyed) {
            onChangeRef.current(markdown);
          }
        });
      })
      .use(commonmark)
      .use(gfm)
      .use(listener);

    editor
      .create()
      .then((createdEditor) => {
        if (destroyed) {
          createdEditor.destroy();
        } else {
          editorRef.current = createdEditor;
        }
      })
      .catch((err) => {
        console.error('Failed to create Milkdown editor:', err);
      });

    return () => {
      destroyed = true;
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, []); // Only mount on initial load

  return (
    <div
      ref={containerRef}
      className={`milkdown-wysiwyg-container w-full h-full overflow-y-auto ${className}`}
    />
  );
};
