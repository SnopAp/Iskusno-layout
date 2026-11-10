import { marked } from 'marked';

// Configure marked with full GFM support (tables, breaks, strikethrough, task lists)
marked.setOptions({
  gfm: true,
  breaks: true,
});

export interface TaskItemInfo {
  index: number;
  text: string;
  checked: boolean;
}

/**
 * Extracts task list items from a markdown text.
 * Finds lines matching `- [ ]` or `- [x]` / `* [ ]` / `* [x]`.
 */
export function extractTaskItems(markdown: string): TaskItemInfo[] {
  if (!markdown) return [];
  const lines = markdown.split('\n');
  const items: TaskItemInfo[] = [];

  const taskRegex = /^\s*[-*+]\s+\[([ xX])\]\s*(.*)$/;

  let taskIndex = 0;
  for (const line of lines) {
    const match = line.match(taskRegex);
    if (match) {
      items.push({
        index: taskIndex,
        checked: match[1].toLowerCase() === 'x',
        text: match[2].trim(),
      });
      taskIndex++;
    }
  }

  return items;
}

/**
 * Helper to update sequential checkbox status in editor markdown.
 * Enforces sequential rule:
 * Checking at clickedIndex checks all 0..clickedIndex.
 * Unchecking at clickedIndex unchecks all clickedIndex..end.
 */
export function toggleMarkdownTaskSequential(
  markdown: string,
  clickedIndex: number
): { updatedMarkdown: string; updatedState: Record<string, boolean> } {
  const lines = markdown.split('\n');
  const taskRegex = /^(\s*[-*+]\s+)\[([ xX])\](\s*.*)$/;

  // First identify current state
  const currentTasks = extractTaskItems(markdown);
  const targetTask = currentTasks.find((t) => t.index === clickedIndex);
  if (!targetTask) {
    return { updatedMarkdown: markdown, updatedState: {} };
  }

  const nextState = !targetTask.checked;
  const updatedState: Record<string, boolean> = {};

  let taskCounter = 0;
  const newLines = lines.map((line) => {
    const match = line.match(taskRegex);
    if (match) {
      const idx = taskCounter;
      taskCounter++;

      let isChecked = false;
      if (nextState) {
        // Checking: 0..clickedIndex are checked
        if (idx <= clickedIndex) {
          isChecked = true;
        } else {
          isChecked = match[2].toLowerCase() === 'x';
        }
      } else {
        // Unchecking: clickedIndex..end are unchecked
        if (idx >= clickedIndex) {
          isChecked = false;
        } else {
          isChecked = match[2].toLowerCase() === 'x';
        }
      }

      updatedState[`box_${idx}`] = isChecked;
      return `${match[1]}[${isChecked ? 'x' : ' '}]${match[3]}`;
    }
    return line;
  });

  return {
    updatedMarkdown: newLines.join('\n'),
    updatedState,
  };
}

/**
 * Parses markdown to safe HTML string with inline interactive task items.
 * If getTaskState is provided (e.g. in viewer mode), it overrides the markdown task checked state.
 */
export function renderMarkdownToHtml(
  markdown: string,
  getTaskState?: (index: number) => boolean
): string {
  if (!markdown || !markdown.trim()) {
    return '<p class="text-neutral-400 italic">Пустой текстовый блок...</p>';
  }

  try {
    const lines = markdown.split('\n');
    const taskRegex = /^(\s*[-*+]\s+)\[([ xX])\]\s*(.*)$/;

    let taskIndex = 0;
    const transformedLines = lines.map((line) => {
      const match = line.match(taskRegex);
      if (match) {
        const currentIdx = taskIndex;
        taskIndex++;

        const isChecked = getTaskState
          ? getTaskState(currentIdx)
          : match[2].toLowerCase() === 'x';

        const rawText = match[3] || '';
        const formattedText = marked.parseInline(rawText) as string;

        const checkIcon = `<svg class="w-4 h-4 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>`;
        const squareIcon = `<svg class="w-4 h-4 text-neutral-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"></rect></svg>`;

        return `<div class="interactive-task-row my-1.5 flex items-start gap-2.5 p-2 rounded-lg transition-colors cursor-pointer select-none ${
          isChecked ? 'bg-neutral-50/90 text-neutral-400' : 'hover:bg-neutral-100/70 text-neutral-800'
        }" data-task-index="${currentIdx}">
  <span class="mt-0.5 shrink-0 pointer-events-none">${isChecked ? checkIcon : squareIcon}</span>
  <span class="text-sm sm:text-base leading-normal pointer-events-none ${
    isChecked ? 'line-through text-neutral-400 decoration-neutral-400' : ''
  }">${formattedText || 'Задача'}</span>
</div>`;
      }
      return line;
    });

    return marked.parse(transformedLines.join('\n')) as string;
  } catch (err) {
    console.error('Failed to parse markdown', err);
    return `<p class="text-red-500">Ошибка разметки: ${String(err)}</p>`;
  }
}

