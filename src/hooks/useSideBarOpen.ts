import { useSyncExternalStore } from "react";

/**
 * Sidebar-Offen-Zustand als modul-globaler Store.
 *
 * Wichtig: Der Wert lebt NICHT im Komponenten-State, sondern auf Modulebene.
 * Dadurch geht er beim Wechsel zwischen Sidebar (v1) und SidebarProjekt (v2)
 * nicht verloren — die neu gemountete Sidebar übernimmt den Zustand des Vorgängers.
 * Zusätzlich in localStorage persistiert (überlebt auch ein Reload).
 */
const STORAGE_KEY = "sidebarOpen";

const read = (): boolean => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? Boolean(JSON.parse(stored)) : false;
  } catch {
    return false;
  }
};

let isOpen = read();
const listeners = new Set<() => void>();

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

const getSnapshot = () => isOpen;

const setOpen = (next: boolean) => {
  if (next === isOpen) return;
  isOpen = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* localStorage nicht verfügbar — In-Memory genügt */
  }
  listeners.forEach((l) => l());
};

const useSideBarOpen = () => {
  const open = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return {
    isOpen: open,
    toggleSidebar: () => setOpen(!isOpen),
  };
};

export default useSideBarOpen;
