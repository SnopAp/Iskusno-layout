/**
 * IndexedDB storage for Visual Markdown Canvas image assets.
 * Stores binary/base64 image blobs locally without localStorage size limitations.
 */

const DB_NAME = 'VisualMarkdownCanvasDB';
const DB_VERSION = 1;
const STORE_NAME = 'images';

export interface StoredImage {
  id: string;
  dataUrl: string;
  name?: string;
  type?: string;
  size?: number;
  updatedAt: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });

  return dbPromise;
}

/**
 * Save an image to IndexedDB.
 */
export async function saveImageToDB(
  id: string,
  dataUrl: string,
  meta?: { name?: string; type?: string; size?: number }
): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const item: StoredImage = {
      id,
      dataUrl,
      name: meta?.name,
      type: meta?.type,
      size: meta?.size,
      updatedAt: Date.now(),
    };
    const req = store.put(item);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Get an image dataUrl from IndexedDB by id.
 */
export async function getImageFromDB(id: string): Promise<string | null> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => {
        const result = req.result as StoredImage | undefined;
        resolve(result ? result.dataUrl : null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error(`Failed to get image ${id} from IndexedDB:`, err);
    return null;
  }
}

/**
 * Delete an image from IndexedDB.
 */
export async function deleteImageFromDB(id: string): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`Failed to delete image ${id} from IndexedDB:`, err);
  }
}

/**
 * Clean up orphaned images that are not referenced in the canvas objects.
 */
export async function cleanOrphanImages(usedStorageIds: string[]): Promise<void> {
  try {
    const db = await getDB();
    const usedSet = new Set(usedStorageIds);
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAllKeys();

    req.onsuccess = () => {
      const allKeys = req.result as string[];
      for (const key of allKeys) {
        if (!usedSet.has(key)) {
          store.delete(key);
        }
      }
    };
  } catch (err) {
    console.warn('Failed to clean orphaned images:', err);
  }
}
