import { useState, useEffect, useCallback } from 'react';
import type { TrackerItem } from '../types';
import { getTracker, saveTracker } from '../services/storage';

export function useTracker() {
  const [items, setItems] = useState<TrackerItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    const data = getTracker();
    setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addItem = useCallback(
    (item: TrackerItem): boolean => {
      const exists = items.some(
        (t) => t.tmdbId === item.tmdbId && t.type === item.type
      );
      if (exists) return false;
      const updated = [...items, item];
      saveTracker(updated);
      setItems(updated);
      return true;
    },
    [items]
  );

  const removeItem = useCallback(
    (tmdbId: number, type: 'movie' | 'tv'): boolean => {
      const index = items.findIndex(
        (t) => t.tmdbId === tmdbId && t.type === type
      );
      if (index === -1) return false;
      const updated = items.filter(
        (_, i) => !(i === index)
      );
      saveTracker(updated);
      setItems(updated);
      return true;
    },
    [items]
  );

  const updateItem = useCallback(
    (tmdbId: number, type: 'movie' | 'tv', updates: Partial<TrackerItem>): TrackerItem | null => {
      const index = items.findIndex(
        (t) => t.tmdbId === tmdbId && t.type === type
      );
      if (index === -1) return null;
      const updated = items.map((item, i) =>
        i === index ? { ...item, ...updates } as TrackerItem : item
      );
      saveTracker(updated);
      setItems(updated);
      return updated[index];
    },
    [items]
  );

  const isTracked = useCallback(
    (tmdbId: number, type: 'movie' | 'tv'): boolean => {
      return items.some((t) => t.tmdbId === tmdbId && t.type === type);
    },
    [items]
  );

  const getItem = useCallback(
    (tmdbId: number, type: 'movie' | 'tv'): TrackerItem | undefined => {
      return items.find((t) => t.tmdbId === tmdbId && t.type === type);
    },
    [items]
  );

  return {
    items,
    loading,
    refresh,
    addItem,
    removeItem,
    updateItem,
    isTracked,
    getItem,
  };
}
