import {
  DocumentModel,
  CanvasModel,
  ViewerProgress,
  ImageCanvasObject,
  createInitialDemoDocument,
  DEFAULT_GLOBAL_TEXT_STYLE,
  DEMO_ARCH_SVG_DATA_URL,
  DEMO_CHART_SVG_DATA_URL,
  DEMO_WORKFLOW_SVG_DATA_URL,
} from '../types';
import { saveImageToDB, getImageFromDB } from './db';
import { createDefaultViewerProgress } from './documentLogic';

const STORAGE_KEY = 'visual_markdown_multicanvas_vertical_doc_v4';
const VIEWER_STORAGE_KEY = 'visual_markdown_viewer_progress_v4';

async function seedDemoImages(): Promise<void> {
  try {
    await Promise.all([
      saveImageToDB('demo-arch-img-1', DEMO_ARCH_SVG_DATA_URL, {
        name: 'demo-architecture.svg',
        type: 'image/svg+xml',
      }),
      saveImageToDB('demo-chart-img-1', DEMO_CHART_SVG_DATA_URL, {
        name: 'demo-chart.svg',
        type: 'image/svg+xml',
      }),
      saveImageToDB('demo-workflow-img-1', DEMO_WORKFLOW_SVG_DATA_URL, {
        name: 'demo-workflow.svg',
        type: 'image/svg+xml',
      }),
    ]);
  } catch (err) {
    console.warn('Failed to seed demo images into IndexedDB:', err);
  }
}

/**
 * Loads full multi-page DocumentModel from localStorage and hydrates images from IndexedDB.
 */
export async function loadDocumentModel(): Promise<DocumentModel> {
  try {
    await seedDemoImages();
    const raw = localStorage.getItem(STORAGE_KEY);
    let doc: DocumentModel;

    if (!raw) {
      doc = createInitialDemoDocument();
    } else {
      const parsed = JSON.parse(raw) as DocumentModel;
      if (
        !parsed ||
        typeof parsed !== 'object' ||
        !Array.isArray(parsed.canvasOrder) ||
        !parsed.canvases ||
        typeof parsed.canvases !== 'object'
      ) {
        doc = createInitialDemoDocument();
      } else {
        doc = {
          id: parsed.id || 'doc-multi-canvas-vertical',
          canvasOrder: parsed.canvasOrder.filter((id) => Boolean(parsed.canvases[id])),
          globalTextStyle: {
            ...DEFAULT_GLOBAL_TEXT_STYLE,
            ...(parsed.globalTextStyle || {}),
          },
          canvases: parsed.canvases,
        };
      }
    }

    // Hydrate image objects across all canvases from IndexedDB
    const hydratedCanvases: Record<string, CanvasModel> = {};
    for (const canvasId of Object.keys(doc.canvases)) {
      const canvas = doc.canvases[canvasId];
      const hydratedObjects = await Promise.all(
        (canvas.objects || []).map(async (obj) => {
          if (obj.type === 'image') {
            const imgObj = obj as ImageCanvasObject;
            let dataUrl = imgObj.dataUrl;
            if (!dataUrl && imgObj.storageId) {
              dataUrl = (await getImageFromDB(imgObj.storageId)) || undefined;
            }
            if (!dataUrl) {
              dataUrl =
                imgObj.storageId === 'demo-arch-img-1'
                  ? DEMO_ARCH_SVG_DATA_URL
                  : imgObj.storageId === 'demo-workflow-img-1'
                  ? DEMO_WORKFLOW_SVG_DATA_URL
                  : DEMO_CHART_SVG_DATA_URL;
            }
            return {
              ...imgObj,
              dataUrl,
              widthPercent: imgObj.widthPercent ?? 100,
              rotation: imgObj.rotation ?? 0,
              flipHorizontal: imgObj.flipHorizontal ?? false,
              flipVertical: imgObj.flipVertical ?? false,
              objectFit: imgObj.objectFit ?? 'cover',
              allowDownload: imgObj.allowDownload ?? false,
            };
          }
          return obj;
        })
      );

      hydratedCanvases[canvasId] = {
        ...canvas,
        objects: hydratedObjects,
      };
    }

    return {
      ...doc,
      canvases: hydratedCanvases,
    };
  } catch (err) {
    console.error('Failed to load document model, using initial demo:', err);
    return createInitialDemoDocument();
  }
}

/**
 * Saves DocumentModel metadata to localStorage, stripping dataUrl from image objects.
 */
export function saveDocumentModel(doc: DocumentModel): void {
  try {
    const serializableCanvases: Record<string, CanvasModel> = {};

    for (const [canvasId, canvas] of Object.entries(doc.canvases)) {
      serializableCanvases[canvasId] = {
        ...canvas,
        objects: canvas.objects.map((obj) => {
          if (obj.type === 'image') {
            const { dataUrl, ...rest } = obj as ImageCanvasObject;
            return rest;
          }
          return obj;
        }),
      };
    }

    const serializableDoc: DocumentModel = {
      id: doc.id,
      canvasOrder: doc.canvasOrder,
      globalTextStyle: doc.globalTextStyle,
      canvases: serializableCanvases,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializableDoc));
  } catch (err) {
    console.error('Failed to save document model to localStorage:', err);
  }
}

/**
 * Loads ViewerProgress from localStorage (Section 5, 13).
 */
export function loadViewerProgress(documentId: string): ViewerProgress {
  try {
    const raw = localStorage.getItem(VIEWER_STORAGE_KEY);
    if (!raw) return createDefaultViewerProgress(documentId);
    const parsed = JSON.parse(raw) as ViewerProgress;
    if (parsed.documentId !== documentId) {
      return createDefaultViewerProgress(documentId);
    }
    return {
      documentId,
      canvasCompletion: parsed.canvasCompletion || {},
      checkboxStates: parsed.checkboxStates || {},
      collapsedCanvases: parsed.collapsedCanvases || {},
    };
  } catch (err) {
    console.error('Failed to load viewer progress:', err);
    return createDefaultViewerProgress(documentId);
  }
}

/**
 * Saves ViewerProgress to localStorage (Section 5, 13).
 */
export function saveViewerProgress(progress: ViewerProgress): void {
  try {
    localStorage.setItem(VIEWER_STORAGE_KEY, JSON.stringify(progress));
  } catch (err) {
    console.error('Failed to save viewer progress:', err);
  }
}

/**
 * Resets the entire document and viewer progress to initial demo.
 */
export async function resetToDemoDocument(): Promise<{
  doc: DocumentModel;
  viewerProgress: ViewerProgress;
}> {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(VIEWER_STORAGE_KEY);
    await seedDemoImages();
  } catch (err) {
    console.warn('Error resetting demo document:', err);
  }
  const doc = createInitialDemoDocument();
  const viewerProgress = createDefaultViewerProgress(doc.id);
  return { doc, viewerProgress };
}
