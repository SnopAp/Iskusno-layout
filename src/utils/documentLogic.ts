import {
  DocumentModel,
  CanvasModel,
  ViewerProgress,
  ImageCanvasObject,
  TextCanvasObject,
  CanvasObject,
} from '../types';
import { extractTaskItems } from './markdown';

/**
 * Creates empty default ViewerProgress for a document.
 * In viewer mode, all tasks start unchecked independently of editor.
 */
export function createDefaultViewerProgress(documentId: string): ViewerProgress {
  return {
    documentId,
    canvasCompletion: {},
    checkboxStates: {},
    collapsedCanvases: {},
  };
}

/**
 * Calculates page completion based on its inner text block checkboxes in viewer mode (Section 5.3).
 * If the page contains checkboxes:
 * - Completed if and only if ALL checkboxes in ALL text blocks are checked.
 * - Otherwise not completed.
 * If the page has 0 checkboxes:
 * - Uses manual completion state from viewerProgress.canvasCompletion[canvasId].
 */
export function isCanvasCompletedInViewer(
  canvas: CanvasModel,
  viewerProgress: ViewerProgress
): boolean {
  let hasAnyCheckboxes = false;
  let allChecked = true;

  for (const obj of canvas.objects) {
    if (obj.type === 'text') {
      const textObj = obj as TextCanvasObject;
      const tasks = extractTaskItems(textObj.markdown);
      if (tasks.length > 0) {
        hasAnyCheckboxes = true;
        for (const task of tasks) {
          const key = `${canvas.id}:${textObj.id}:${task.index}`;
          const isChecked = Boolean(viewerProgress.checkboxStates[key]);
          if (!isChecked) {
            allChecked = false;
          }
        }
      }
    }
  }

  if (hasAnyCheckboxes) {
    return allChecked;
  }

  // If no internal checkboxes exist, rely on manual page completion
  return Boolean(viewerProgress.canvasCompletion[canvas.id]);
}

/**
 * Toggles a checkbox inside a text block in viewer mode with sequential logic (Section 4.4, 5.2, 5.3):
 * 1. Sequential within the block:
 *    - Checking index K checks 0..K.
 *    - Unchecking index K unchecks K..end.
 * 2. Checks if all checkboxes on the page become checked:
 *    - If yes, marks page as completed and automatically collapses it (Section 7.2).
 *    - If any checkbox becomes unchecked, marks page as uncompleted and automatically expands it (Section 7.2).
 */
export function toggleViewerCheckbox(
  doc: DocumentModel,
  viewerProgress: ViewerProgress,
  canvasId: string,
  textBlockId: string,
  clickedIndex: number
): ViewerProgress {
  const canvas = doc.canvases[canvasId];
  if (!canvas) return viewerProgress;

  const targetBlock = canvas.objects.find((o) => o.id === textBlockId) as
    | TextCanvasObject
    | undefined;
  if (!targetBlock || targetBlock.type !== 'text') return viewerProgress;

  const tasks = extractTaskItems(targetBlock.markdown);
  const targetTask = tasks.find((t) => t.index === clickedIndex);
  if (!targetTask) return viewerProgress;

  const targetKey = `${canvasId}:${textBlockId}:${clickedIndex}`;
  const currentlyChecked = Boolean(viewerProgress.checkboxStates[targetKey]);
  const nextChecked = !currentlyChecked;

  const newCheckboxStates = { ...viewerProgress.checkboxStates };

  // Sequential within this block
  tasks.forEach((t) => {
    const key = `${canvasId}:${textBlockId}:${t.index}`;
    if (nextChecked) {
      if (t.index <= clickedIndex) {
        newCheckboxStates[key] = true;
      }
    } else {
      if (t.index >= clickedIndex) {
        newCheckboxStates[key] = false;
      }
    }
  });

  const nextProgressTemp: ViewerProgress = {
    ...viewerProgress,
    checkboxStates: newCheckboxStates,
  };

  // Re-evaluate page completion
  const isNowCompleted = isCanvasCompletedInViewer(canvas, nextProgressTemp);
  const wasCompleted = Boolean(viewerProgress.canvasCompletion[canvasId]);

  const newCanvasCompletion = {
    ...viewerProgress.canvasCompletion,
    [canvasId]: isNowCompleted,
  };

  const newCollapsedCanvases = { ...viewerProgress.collapsedCanvases };

  // Section 7.2: Auto-collapse on completion, auto-expand when uncompleted
  if (isNowCompleted && !wasCompleted) {
    newCollapsedCanvases[canvasId] = true;
  } else if (!isNowCompleted && wasCompleted) {
    newCollapsedCanvases[canvasId] = false;
  }

  return {
    ...viewerProgress,
    checkboxStates: newCheckboxStates,
    canvasCompletion: newCanvasCompletion,
    collapsedCanvases: newCollapsedCanvases,
  };
}

/**
 * Toggles a whole page's completion in viewer mode (Section 5.3):
 * - If manual check is set to true: marks all inner checkboxes on that page as checked, collapses page.
 * - If manual check is set to false: unchecks all inner checkboxes on that page, expands page.
 */
export function toggleViewerPageCompletion(
  doc: DocumentModel,
  viewerProgress: ViewerProgress,
  canvasId: string,
  explicitState?: boolean
): ViewerProgress {
  const canvas = doc.canvases[canvasId];
  if (!canvas) return viewerProgress;

  const currentState = isCanvasCompletedInViewer(canvas, viewerProgress);
  const nextState = explicitState !== undefined ? explicitState : !currentState;

  const newCheckboxStates = { ...viewerProgress.checkboxStates };

  for (const obj of canvas.objects) {
    if (obj.type === 'text') {
      const textObj = obj as TextCanvasObject;
      const tasks = extractTaskItems(textObj.markdown);
      for (const t of tasks) {
        const key = `${canvasId}:${textObj.id}:${t.index}`;
        newCheckboxStates[key] = nextState;
      }
    }
  }

  const newCanvasCompletion = {
    ...viewerProgress.canvasCompletion,
    [canvasId]: nextState,
  };

  const newCollapsedCanvases = {
    ...viewerProgress.collapsedCanvases,
    [canvasId]: nextState, // auto-collapse if true, auto-expand if false
  };

  return {
    ...viewerProgress,
    checkboxStates: newCheckboxStates,
    canvasCompletion: newCanvasCompletion,
    collapsedCanvases: newCollapsedCanvases,
  };
}

/**
 * Centralized function to update canvasOrder.
 */
export function reorderCanvases(
  doc: DocumentModel,
  newOrder: string[]
): DocumentModel {
  const validOrder = newOrder.filter((id) => Boolean(doc.canvases[id]));
  return {
    ...doc,
    canvasOrder: validOrder,
  };
}

/**
 * Reorders elements within a canvas (Section 9.1).
 */
export function reorderCanvasObjects(
  doc: DocumentModel,
  canvasId: string,
  newObjects: CanvasObject[]
): DocumentModel {
  const target = doc.canvases[canvasId];
  if (!target) return doc;

  return {
    ...doc,
    canvases: {
      ...doc.canvases,
      [canvasId]: {
        ...target,
        objects: newObjects,
      },
    },
  };
}

/**
 * Calculates overall document progress in viewer mode (Section 9).
 */
export function calculateDocumentProgress(
  doc: DocumentModel,
  viewerProgress?: ViewerProgress
): {
  completedCount: number;
  totalCount: number;
  percentage: number;
  label: string;
} {
  const totalCount = doc.canvasOrder.length;
  if (totalCount === 0) {
    return {
      completedCount: 0,
      totalCount: 0,
      percentage: 0,
      label: 'Прогресс: 0 / 0 (0%)',
    };
  }

  let completedCount = 0;
  for (const id of doc.canvasOrder) {
    const canvas = doc.canvases[id];
    if (canvas) {
      const isCompleted = viewerProgress
        ? isCanvasCompletedInViewer(canvas, viewerProgress)
        : Boolean(canvas.completed);
      if (isCompleted) {
        completedCount++;
      }
    }
  }

  const percentage = Math.round((completedCount / totalCount) * 100);
  return {
    completedCount,
    totalCount,
    percentage,
    label: `Прогресс: ${completedCount} / ${totalCount} (${percentage}%)`,
  };
}

/**
 * Adds a new empty canvas in portrait orientation at the end of the document.
 */
export function addCanvasToDocument(doc: DocumentModel): {
  updatedDoc: DocumentModel;
  newCanvasId: string;
} {
  const newCanvasId = `canvas-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const newCanvas: CanvasModel = {
    id: newCanvasId,
    title: '',
    completed: false,
    objects: [],
  };

  const updatedDoc: DocumentModel = {
    ...doc,
    canvasOrder: [...doc.canvasOrder, newCanvasId],
    canvases: {
      ...doc.canvases,
      [newCanvasId]: newCanvas,
    },
  };

  return { updatedDoc, newCanvasId };
}

/**
 * Checks whether a canvas has user data to confirm before deletion.
 */
export function canvasHasUserData(canvas: CanvasModel | undefined): boolean {
  if (!canvas) return false;
  return canvas.title.trim().length > 0 || canvas.objects.length > 0;
}

/**
 * Deletes a canvas and its objects, recalculating order and selection.
 */
export function deleteCanvasFromDocument(
  doc: DocumentModel,
  canvasIdToDelete: string,
  currentSelectedId: string
): {
  updatedDoc: DocumentModel;
  nextSelectedId: string;
  removedImageStorageIds: string[];
} {
  const index = doc.canvasOrder.indexOf(canvasIdToDelete);
  if (index === -1) {
    return {
      updatedDoc: doc,
      nextSelectedId: currentSelectedId,
      removedImageStorageIds: [],
    };
  }

  const targetCanvas = doc.canvases[canvasIdToDelete];
  const removedImageStorageIds: string[] = [];

  if (targetCanvas) {
    for (const obj of targetCanvas.objects) {
      if (obj.type === 'image') {
        const img = obj as ImageCanvasObject;
        if (img.storageId && !img.storageId.startsWith('demo-')) {
          removedImageStorageIds.push(img.storageId);
        }
      }
    }
  }

  const newOrder = doc.canvasOrder.filter((id) => id !== canvasIdToDelete);
  const newCanvases = { ...doc.canvases };
  delete newCanvases[canvasIdToDelete];

  let nextSelectedId = currentSelectedId;
  if (currentSelectedId === canvasIdToDelete) {
    if (newOrder.length === 0) {
      nextSelectedId = '';
    } else if (index < newOrder.length) {
      nextSelectedId = newOrder[index];
    } else {
      nextSelectedId = newOrder[newOrder.length - 1];
    }
  }

  const updatedDoc: DocumentModel = {
    ...doc,
    canvasOrder: newOrder,
    canvases: newCanvases,
  };

  return {
    updatedDoc,
    nextSelectedId,
    removedImageStorageIds,
  };
}
