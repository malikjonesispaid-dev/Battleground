import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { StudioProject } from "@/lib/types";

interface StudioDB extends DBSchema {
  projects: {
    key: string;
    value: StudioProject;
  };
  blobs: {
    key: string;
    value: Blob;
  };
}

let dbPromise: Promise<IDBPDatabase<StudioDB>> | null = null;

function getDb() {
  if (typeof indexedDB === "undefined") {
    throw new Error("IndexedDB is not available in this environment.");
  }
  if (!dbPromise) {
    dbPromise = openDB<StudioDB>("voice-studio", 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("projects")) {
          db.createObjectStore("projects", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("blobs")) {
          db.createObjectStore("blobs");
        }
      },
    });
  }
  return dbPromise;
}

export async function saveProject(project: StudioProject): Promise<void> {
  const db = await getDb();
  await db.put("projects", project);
}

export async function loadProject(id: string): Promise<StudioProject | undefined> {
  const db = await getDb();
  return db.get("projects", id);
}

export async function listProjects(): Promise<StudioProject[]> {
  const db = await getDb();
  const all = await db.getAll("projects");
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("projects", id);
}

export async function saveBlob(key: string, blob: Blob): Promise<void> {
  const db = await getDb();
  await db.put("blobs", blob, key);
}

export async function loadBlob(key: string): Promise<Blob | undefined> {
  const db = await getDb();
  return db.get("blobs", key);
}

export async function deleteBlob(key: string): Promise<void> {
  const db = await getDb();
  await db.delete("blobs", key);
}
