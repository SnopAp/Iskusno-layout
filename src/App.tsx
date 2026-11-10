/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DocumentModel,
  CanvasObject,
  TextCanvasObject,
  ImageCanvasObject,
  AppMode,
  createInitialDemoDocument,
  TextStyle,
  ViewerProgress,
} from './types';
import {
  loadDocumentModel,
  saveDocumentModel,
  loadViewerProgress,
  saveViewerProgress,
  resetToDemoDocument,
} from './utils/storage';
import { saveImageToDB, deleteImageFromDB } from './utils/db';
import {
  reorderCanvases,
  reorderCanvasObjects,
  calculateDocumentProgress,
  addCanvasToDocument,
  deleteCanvasFromDocument,
  createDefaultViewerProgress,
  toggleViewerCheckbox,
  toggleViewerPageCompletion,
} from './utils/documentLogic';
import { toggleMarkdownTaskSequential } from './utils/markdown';
import { TopToolbar } from './components/TopToolbar';
import { CanvasSidebar } from './components/CanvasSidebar';
import { CanvasWorkspace } from './components/CanvasWorkspace';
import { PropertyPanel } from './components/PropertyPanel';
import { ContextMenu } from './components/ContextMenu';
import { CanvasOrderModal } from './components/CanvasOrderModal';
import { ImageModal } from './components/ImageModal';

export default function App() {
  const [documentModel, setDocumentModel] = useState<DocumentModel>(createInitialDemoDocument);
  const [selectedCanvasId, setSelectedCanvasId] = useState<string>('canvas-demo-1');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [mode, setMode] = useState<AppMode>('edit');
  const [isOrderModalOpen, setIsOrderModalOpen] = useState<boolean>(false);

  // Viewer Progress state (independent of editor state, Section 5 & 13)
  const [viewerProgress, setViewerProgress] = useState<ViewerProgress>(() =>
    createDefaultViewerProgress('doc-multi-canvas-demo')
  );

  // Fullscreen Image modal state (Section 8.4)
  const [fullscreenImage, setFullscreenImage] = useState<ImageCanvasObject | null>(null);

  // Context Menu state
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    targetObject: CanvasObject | null;
  }>({
    visible: false,
    x: 0,
    y: 0,
    targetObject: null,
  });

  // Load document model and viewer progress from storage on mount
  useEffect(() => {
    loadDocumentModel().then((loadedDoc) => {
      setDocumentModel(loadedDoc);
      if (loadedDoc.canvasOrder.length > 0) {
        setSelectedCanvasId(loadedDoc.canvasOrder[0]);
      }
      const loadedViewerProgress = loadViewerProgress(loadedDoc.id);
      setViewerProgress(loadedViewerProgress);
    });
  }, []);

  // Sync document model to storage on modification
  useEffect(() => {
    saveDocumentModel(documentModel);
  }, [documentModel]);

  // Sync viewer progress to storage on modification
  useEffect(() => {
    saveViewerProgress(viewerProgress);
  }, [viewerProgress]);

  // Selected canvas reference
  const currentCanvas = useMemo(() => {
    return documentModel.canvases[selectedCanvasId] || null;
  }, [documentModel, selectedCanvasId]);

  // Automatic ordinal number of selected canvas (1-based index in canvasOrder)
  const selectedCanvasNumber = useMemo(() => {
    const idx = documentModel.canvasOrder.indexOf(selectedCanvasId);
    return idx >= 0 ? idx + 1 : 1;
  }, [documentModel.canvasOrder, selectedCanvasId]);

  // Selected object reference
  const selectedObject = useMemo(() => {
    if (selectedIds.length === 0 || !currentCanvas) return null;
    return currentCanvas.objects.find((o) => o.id === selectedIds[0]) || null;
  }, [selectedIds, currentCanvas]);

  // Overall Document Progress (Section 9)
  const progressInfo = useMemo(() => {
    return calculateDocumentProgress(documentModel, mode === 'preview' ? viewerProgress : undefined);
  }, [documentModel, viewerProgress, mode]);

  // -------------------------------------------------------------
  // CANVAS LIST & SEQUENTIAL COMPLETION MANAGEMENT
  // -------------------------------------------------------------

  // Add new canvas (Section 2.1, 3.2)
  const handleAddCanvas = useCallback(() => {
    const { updatedDoc, newCanvasId } = addCanvasToDocument(documentModel);
    setDocumentModel(updatedDoc);
    setSelectedCanvasId(newCanvasId);
    setSelectedIds([]);
  }, [documentModel]);

  // Delete canvas
  const handleDeleteCanvas = useCallback(
    (canvasIdToDelete: string) => {
      const { updatedDoc, nextSelectedId, removedImageStorageIds } =
        deleteCanvasFromDocument(documentModel, canvasIdToDelete, selectedCanvasId);

      setDocumentModel(updatedDoc);
      setSelectedCanvasId(nextSelectedId);
      setSelectedIds([]);

      // Clean up viewer progress for deleted canvas
      setViewerProgress((prev) => {
        const nextComp = { ...prev.canvasCompletion };
        const nextColl = { ...prev.collapsedCanvases };
        delete nextComp[canvasIdToDelete];
        delete nextColl[canvasIdToDelete];

        const nextBox = { ...prev.checkboxStates };
        Object.keys(nextBox).forEach((key) => {
          if (key.startsWith(`${canvasIdToDelete}:`)) {
            delete nextBox[key];
          }
        });

        return {
          ...prev,
          canvasCompletion: nextComp,
          collapsedCanvases: nextColl,
          checkboxStates: nextBox,
        };
      });

      // Clean up IndexedDB images
      for (const storageId of removedImageStorageIds) {
        deleteImageFromDB(storageId).catch(() => {});
      }
    },
    [documentModel, selectedCanvasId]
  );

  // Reorder canvases via Order Modal
  const handleReorderCanvases = useCallback(
    (newOrder: string[]) => {
      const updatedDoc = reorderCanvases(documentModel, newOrder);
      setDocumentModel(updatedDoc);
    },
    [documentModel]
  );

  // -------------------------------------------------------------
  // OBJECTS MANAGEMENT ON CURRENT CANVAS (Vertical order)
  // -------------------------------------------------------------

  // Reorder objects within page (Section 9.1)
  const handleReorderObjects = useCallback(
    (newObjects: CanvasObject[]) => {
      if (!selectedCanvasId) return;
      setDocumentModel((prev) =>
        reorderCanvasObjects(prev, selectedCanvasId, newObjects)
      );
    },
    [selectedCanvasId]
  );

  const handleMoveObjectUp = useCallback(
    (index: number) => {
      if (!currentCanvas || index <= 0) return;
      const updated = [...currentCanvas.objects];
      const [item] = updated.splice(index, 1);
      updated.splice(index - 1, 0, item);
      handleReorderObjects(updated);
    },
    [currentCanvas, handleReorderObjects]
  );

  const handleMoveObjectDown = useCallback(
    (index: number) => {
      if (!currentCanvas || index >= currentCanvas.objects.length - 1) return;
      const updated = [...currentCanvas.objects];
      const [item] = updated.splice(index, 1);
      updated.splice(index + 1, 0, item);
      handleReorderObjects(updated);
    },
    [currentCanvas, handleReorderObjects]
  );

  const handleMoveObjectToTop = useCallback(
    (index: number) => {
      if (!currentCanvas || index <= 0) return;
      const updated = [...currentCanvas.objects];
      const [item] = updated.splice(index, 1);
      updated.unshift(item);
      handleReorderObjects(updated);
    },
    [currentCanvas, handleReorderObjects]
  );

  const handleMoveObjectToBottom = useCallback(
    (index: number) => {
      if (!currentCanvas || index >= currentCanvas.objects.length - 1) return;
      const updated = [...currentCanvas.objects];
      const [item] = updated.splice(index, 1);
      updated.push(item);
      handleReorderObjects(updated);
    },
    [currentCanvas, handleReorderObjects]
  );

  // Add text block at end of page (Section 3.2, 8.2)
  const handleAddText = useCallback(() => {
    if (!selectedCanvasId) return;
    const id = `text-${Date.now()}`;

    const newText: TextCanvasObject = {
      id,
      type: 'text',
      markdown: '### Новый заголовок\n\nВведите здесь ваш текст в формате **Markdown**...',
      fontFamily: documentModel.globalTextStyle.fontFamily,
      fontSize: documentModel.globalTextStyle.fontSize,
      fontWeight: documentModel.globalTextStyle.fontWeight,
      fontStyle: documentModel.globalTextStyle.fontStyle,
      color: documentModel.globalTextStyle.color,
      lineHeight: documentModel.globalTextStyle.lineHeight,
      textAlign: documentModel.globalTextStyle.textAlign,
    };

    setDocumentModel((prev) => {
      const c = prev.canvases[selectedCanvasId];
      if (!c) return prev;
      return {
        ...prev,
        canvases: {
          ...prev.canvases,
          [selectedCanvasId]: {
            ...c,
            objects: [...c.objects, newText],
          },
        },
      };
    });

    setSelectedIds([id]);
    if (mode === 'preview') setMode('edit');
  }, [selectedCanvasId, documentModel.globalTextStyle, mode]);

  // Add image file from computer (Section 7.2)
  const handleAddImageFile = useCallback(
    (file: File) => {
      if (!selectedCanvasId) return;
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        const storageId = `img-storage-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

        await saveImageToDB(storageId, dataUrl, {
          name: file.name,
          type: file.type,
          size: file.size,
        });

        const id = `img-obj-${Date.now()}`;
        const newImg: ImageCanvasObject = {
          id,
          type: 'image',
          storageId,
          dataUrl,
          alt: file.name,
          widthPercent: 100,
          rotation: 0,
          flipHorizontal: false,
          flipVertical: false,
          objectFit: 'cover',
          allowDownload: false,
        };

        setDocumentModel((prev) => {
          const c = prev.canvases[selectedCanvasId];
          if (!c) return prev;
          return {
            ...prev,
            canvases: {
              ...prev.canvases,
              [selectedCanvasId]: {
                ...c,
                objects: [...c.objects, newImg],
              },
            },
          };
        });

        setSelectedIds([id]);
        if (mode === 'preview') setMode('edit');
      };
      reader.readAsDataURL(file);
    },
    [selectedCanvasId, mode]
  );

  // Replace image file for existing image object
  const handleReplaceImageFile = useCallback(
    (file: File) => {
      if (!selectedObject || selectedObject.type !== 'image' || !selectedCanvasId) return;
      const targetObj = selectedObject as ImageCanvasObject;

      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        const storageId = `img-storage-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

        await saveImageToDB(storageId, dataUrl, {
          name: file.name,
          type: file.type,
          size: file.size,
        });

        if (targetObj.storageId && !targetObj.storageId.startsWith('demo-')) {
          deleteImageFromDB(targetObj.storageId).catch(() => {});
        }

        setDocumentModel((prev) => {
          const c = prev.canvases[selectedCanvasId];
          if (!c) return prev;
          return {
            ...prev,
            canvases: {
              ...prev.canvases,
              [selectedCanvasId]: {
                ...c,
                objects: c.objects.map((o) =>
                  o.id === targetObj.id
                    ? ({ ...o, storageId, dataUrl, alt: file.name } as CanvasObject)
                    : o
                ),
              },
            },
          };
        });
      };
      reader.readAsDataURL(file);
    },
    [selectedObject, selectedCanvasId]
  );

  // Update object properties
  const handleUpdateObject = useCallback(
    (updated: CanvasObject) => {
      if (!selectedCanvasId) return;
      setDocumentModel((prev) => {
        const c = prev.canvases[selectedCanvasId];
        if (!c) return prev;
        return {
          ...prev,
          canvases: {
            ...prev.canvases,
            [selectedCanvasId]: {
              ...c,
              objects: c.objects.map((o) => (o.id === updated.id ? updated : o)),
            },
          },
        };
      });
    },
    [selectedCanvasId]
  );

  // Delete object
  const handleDeleteObject = useCallback(
    (id: string) => {
      if (!selectedCanvasId) return;
      const target = currentCanvas?.objects.find((o) => o.id === id);
      if (target?.type === 'image') {
        const img = target as ImageCanvasObject;
        if (img.storageId && !img.storageId.startsWith('demo-')) {
          deleteImageFromDB(img.storageId).catch(() => {});
        }
      }

      setDocumentModel((prev) => {
        const c = prev.canvases[selectedCanvasId];
        if (!c) return prev;
        return {
          ...prev,
          canvases: {
            ...prev.canvases,
            [selectedCanvasId]: {
              ...c,
              objects: c.objects.filter((o) => o.id !== id),
            },
          },
        };
      });

      setSelectedIds((prev) => prev.filter((i) => i !== id));
    },
    [selectedCanvasId, currentCanvas]
  );

  // Delete selected objects
  const handleDeleteSelected = useCallback(() => {
    selectedIds.forEach((id) => {
      const obj = currentCanvas?.objects.find((o) => o.id === id);
      if (obj && !obj.locked) {
        handleDeleteObject(id);
      }
    });
  }, [selectedIds, currentCanvas, handleDeleteObject]);

  // Duplicate object
  const handleDuplicateObject = useCallback(
    (source: CanvasObject) => {
      if (!selectedCanvasId || !currentCanvas) return;
      const newId = `${source.type}-${Date.now()}`;
      const duplicated: CanvasObject = {
        ...source,
        id: newId,
        locked: false,
      };

      const sourceIndex = currentCanvas.objects.findIndex((o) => o.id === source.id);
      const updatedObjects = [...currentCanvas.objects];
      updatedObjects.splice(sourceIndex + 1, 0, duplicated);

      setDocumentModel((prev) => ({
        ...prev,
        canvases: {
          ...prev.canvases,
          [selectedCanvasId]: {
            ...currentCanvas,
            objects: updatedObjects,
          },
        },
      }));

      setSelectedIds([newId]);
    },
    [selectedCanvasId, currentCanvas]
  );

  // Toggle Lock
  const handleToggleLock = useCallback(
    (id: string) => {
      if (!selectedCanvasId) return;
      setDocumentModel((prev) => {
        const c = prev.canvases[selectedCanvasId];
        if (!c) return prev;
        return {
          ...prev,
          canvases: {
            ...prev.canvases,
            [selectedCanvasId]: {
              ...c,
              objects: c.objects.map((o) =>
                o.id === id ? { ...o, locked: !o.locked } : o
              ),
            },
          },
        };
      });
    },
    [selectedCanvasId]
  );

  // -------------------------------------------------------------
  // CHECKBOX INTERACTIONS (Sections 4.4, 5.1, 5.2, 5.3)
  // -------------------------------------------------------------

  // Editor mode: sequential toggle within a single block (Section 4.4, 5.1)
  const handleToggleEditorTask = useCallback(
    (blockId: string, taskIndex: number) => {
      if (!selectedCanvasId || !currentCanvas) return;
      const block = currentCanvas.objects.find((o) => o.id === blockId) as
        | TextCanvasObject
        | undefined;
      if (!block || block.type !== 'text') return;

      const { updatedMarkdown, updatedState } = toggleMarkdownTaskSequential(
        block.markdown,
        taskIndex
      );

      handleUpdateObject({
        ...block,
        markdown: updatedMarkdown,
        editorCheckboxState: {
          ...(block.editorCheckboxState || {}),
          ...updatedState,
        },
      });
    },
    [selectedCanvasId, currentCanvas, handleUpdateObject]
  );

  // Viewer mode: toggle a task checkbox within a page (Section 5.2, 5.3)
  const handleToggleViewerCheckbox = useCallback(
    (canvasId: string, textBlockId: string, taskIndex: number) => {
      setViewerProgress((prev) =>
        toggleViewerCheckbox(documentModel, prev, canvasId, textBlockId, taskIndex)
      );
    },
    [documentModel]
  );

  // Viewer mode: toggle whole page completion (Section 5.3)
  const handleToggleViewerPageCompletion = useCallback(
    (canvasId: string) => {
      setViewerProgress((prev) =>
        toggleViewerPageCompletion(documentModel, prev, canvasId)
      );
    },
    [documentModel]
  );

  // Viewer mode: toggle page collapse/expand manually (Section 7.1, 7.2)
  const handleToggleViewerPageCollapse = useCallback(
    (canvasId: string) => {
      setViewerProgress((prev) => ({
        ...prev,
        collapsedCanvases: {
          ...prev.collapsedCanvases,
          [canvasId]: !prev.collapsedCanvases[canvasId],
        },
      }));
    },
    []
  );

  // -------------------------------------------------------------
  // GLOBAL TEXT STYLE (Section 10)
  // -------------------------------------------------------------

  const handleUpdateGlobalTextStyle = useCallback((newStyle: TextStyle) => {
    setDocumentModel((prev) => ({
      ...prev,
      globalTextStyle: newStyle,
    }));
  }, []);

  // Section 10: Apply Global Style to Existing Block
  const handleApplyGlobalStyleToObject = useCallback(
    (objectId: string) => {
      if (!selectedCanvasId) return;
      setDocumentModel((prev) => {
        const c = prev.canvases[selectedCanvasId];
        if (!c) return prev;
        const g = prev.globalTextStyle;

        return {
          ...prev,
          canvases: {
            ...prev.canvases,
            [selectedCanvasId]: {
              ...c,
              objects: c.objects.map((obj) => {
                if (obj.id === objectId && obj.type === 'text') {
                  const t = obj as TextCanvasObject;
                  return {
                    ...t,
                    fontFamily: g.fontFamily,
                    fontSize: g.fontSize,
                    fontWeight: g.fontWeight,
                    fontStyle: g.fontStyle,
                    color: g.color,
                    lineHeight: g.lineHeight,
                    textAlign: g.textAlign,
                  };
                }
                return obj;
              }),
            },
          },
        };
      });
    },
    [selectedCanvasId]
  );

  // Selection handler
  const handleSelectObject = useCallback(
    (id: string, e: React.MouseEvent) => {
      setSelectedIds([id]);
    },
    []
  );

  // Context Menu trigger
  const handleContextMenu = useCallback(
    (e: React.MouseEvent, obj: CanvasObject) => {
      e.preventDefault();
      e.stopPropagation();
      setSelectedIds([obj.id]);
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        targetObject: obj,
      });
    },
    []
  );

  // Reset to Demo Document (Section 15)
  const handleResetToDemo = useCallback(async () => {
    const { doc, viewerProgress: newProgress } = await resetToDemoDocument();
    setDocumentModel(doc);
    setViewerProgress(newProgress);
    if (doc.canvasOrder.length > 0) {
      setSelectedCanvasId(doc.canvasOrder[0]);
    }
    setSelectedIds([]);
  }, []);

  // Mode Change (Section 5)
  const handleModeChange = useCallback((newMode: AppMode) => {
    setMode(newMode);
    setSelectedIds([]);
    setContextMenu({ visible: false, x: 0, y: 0, targetObject: null });
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      if (e.key === 'Escape') {
        setSelectedIds([]);
        setContextMenu({ visible: false, x: 0, y: 0, targetObject: null });
        setIsOrderModalOpen(false);
        setFullscreenImage(null);
        return;
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && !isInput) {
        if (selectedIds.length > 0 && mode === 'edit') {
          e.preventDefault();
          handleDeleteSelected();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, mode, handleDeleteSelected]);

  return (
    <div className="w-screen h-screen flex flex-col bg-neutral-100 overflow-hidden font-sans">
      {/* 1. TOP TOOLBAR: Brand, Progress Bar, Add Elements, View/Edit Mode */}
      <TopToolbar
        mode={mode}
        onModeChange={handleModeChange}
        onAddText={handleAddText}
        onAddImageFile={handleAddImageFile}
        onDeleteSelected={handleDeleteSelected}
        hasSelection={selectedIds.length > 0}
        selectedCount={selectedIds.length}
        onResetToDemo={handleResetToDemo}
        progressInfo={progressInfo}
      />

      {/* 2. MAIN WORKSPACE */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Navigation Sidebar (Edit Mode): Page list */}
        {mode === 'edit' && (
          <CanvasSidebar
            documentModel={documentModel}
            selectedCanvasId={selectedCanvasId}
            onSelectCanvas={(id) => {
              setSelectedCanvasId(id);
              setSelectedIds([]);
            }}
            onAddCanvas={handleAddCanvas}
            onDeleteCanvas={handleDeleteCanvas}
            onOpenOrderModal={() => setIsOrderModalOpen(true)}
          />
        )}

        {/* Central Workspace: Vertical A4 Portrait sheet in Edit Mode / All Pages in Preview Mode */}
        <CanvasWorkspace
          documentModel={documentModel}
          currentCanvas={currentCanvas}
          selectedCanvasNumber={selectedCanvasNumber}
          selectedIds={selectedIds}
          mode={mode}
          viewerProgress={viewerProgress}
          onSelectObject={handleSelectObject}
          onDeselect={() => setSelectedIds([])}
          onUpdateObject={handleUpdateObject}
          onDeleteObject={handleDeleteObject}
          onDuplicateObject={handleDuplicateObject}
          onContextMenu={handleContextMenu}
          onMoveObjectUp={handleMoveObjectUp}
          onMoveObjectDown={handleMoveObjectDown}
          onToggleEditorTask={handleToggleEditorTask}
          onToggleViewerCheckbox={handleToggleViewerCheckbox}
          onToggleViewerPageCompletion={handleToggleViewerPageCompletion}
          onToggleViewerPageCollapse={handleToggleViewerPageCollapse}
          onOpenImageFullscreen={(img) => setFullscreenImage(img)}
        />

        {/* Right Property Panel (Edit Mode): Page Elements list, Image controls, or Typography */}
        {mode === 'edit' && (
          <PropertyPanel
            currentCanvas={currentCanvas}
            selectedObject={selectedObject}
            selectedIds={selectedIds}
            globalTextStyle={documentModel.globalTextStyle}
            onUpdateGlobalTextStyle={handleUpdateGlobalTextStyle}
            onApplyGlobalStyleToObject={handleApplyGlobalStyleToObject}
            onChange={handleUpdateObject}
            onDelete={handleDeleteObject}
            onDuplicate={handleDuplicateObject}
            onReplaceImageFile={handleReplaceImageFile}
            onSelectObjectById={(id) => setSelectedIds([id])}
            onReorderObjects={handleReorderObjects}
          />
        )}
      </div>

      {/* 3. REORDER CANVASES MODAL */}
      <CanvasOrderModal
        isOpen={isOrderModalOpen}
        documentModel={documentModel}
        onClose={() => setIsOrderModalOpen(false)}
        onUpdateOrder={handleReorderCanvases}
      />

      {/* 4. FULLSCREEN IMAGE MODAL (Section 8.4) */}
      <ImageModal
        image={fullscreenImage}
        onClose={() => setFullscreenImage(null)}
      />

      {/* 5. CONTEXT MENU */}
      {contextMenu.visible && contextMenu.targetObject && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          targetObject={contextMenu.targetObject}
          onClose={() =>
            setContextMenu({ visible: false, x: 0, y: 0, targetObject: null })
          }
          onApplyGlobalStyle={handleApplyGlobalStyleToObject}
          onDuplicate={handleDuplicateObject}
          onBringToFront={() => {
            if (!currentCanvas) return;
            const idx = currentCanvas.objects.findIndex((o) => o.id === contextMenu.targetObject!.id);
            if (idx >= 0) handleMoveObjectToTop(idx);
          }}
          onSendToBack={() => {
            if (!currentCanvas) return;
            const idx = currentCanvas.objects.findIndex((o) => o.id === contextMenu.targetObject!.id);
            if (idx >= 0) handleMoveObjectToBottom(idx);
          }}
          onBringForward={() => {
            if (!currentCanvas) return;
            const idx = currentCanvas.objects.findIndex((o) => o.id === contextMenu.targetObject!.id);
            if (idx >= 0) handleMoveObjectUp(idx);
          }}
          onSendBackward={() => {
            if (!currentCanvas) return;
            const idx = currentCanvas.objects.findIndex((o) => o.id === contextMenu.targetObject!.id);
            if (idx >= 0) handleMoveObjectDown(idx);
          }}
          onToggleLock={handleToggleLock}
          onDelete={handleDeleteObject}
        />
      )}
    </div>
  );
}
