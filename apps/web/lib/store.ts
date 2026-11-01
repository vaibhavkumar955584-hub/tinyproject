'use client';

import {
  DEMO_READINESS_DOCS,
  type ReadinessDocument,
} from './data';

const WATCHLIST_KEY = 'tg_saved_tenders';
const DOCS_KEY = 'tg_readiness_docs';
const DEMO_USER_KEY = 'tg_demo_active';

export function getSavedTenderIds(): string[] {
  if (typeof window === 'undefined') return ['demo-cppp-001', 'demo-cppp-002'];
  try {
    const raw = localStorage.getItem(WATCHLIST_KEY);
    return raw ? JSON.parse(raw) : ['demo-cppp-001', 'demo-cppp-002'];
  } catch {
    return ['demo-cppp-001', 'demo-cppp-002'];
  }
}

export function saveTenderId(id: string): string[] {
  const current = getSavedTenderIds();
  const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
  try {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(next));
  } catch { }
  return next;
}

export function isTenderSaved(id: string): boolean {
  return getSavedTenderIds().includes(id);
}

export function isDemoSessionActive(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(DEMO_USER_KEY) !== 'false';
}

export function setDemoSessionActive(active: boolean) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DEMO_USER_KEY, active ? 'true' : 'false');
}

export function getStoredDocuments(): ReadinessDocument[] {
  if (typeof window === 'undefined') return DEMO_READINESS_DOCS;
  try {
    const raw = localStorage.getItem(DOCS_KEY);
    return raw ? JSON.parse(raw) : DEMO_READINESS_DOCS;
  } catch {
    return DEMO_READINESS_DOCS;
  }
}

export function saveStoredDocument(docId: string, updates: Partial<ReadinessDocument>): ReadinessDocument[] {
  const current = getStoredDocuments();
  const updated = current.map((doc) => (doc.id === docId ? { ...doc, ...updates } : doc));
  try {
    localStorage.setItem(DOCS_KEY, JSON.stringify(updated));
  } catch { }
  return updated;
}

