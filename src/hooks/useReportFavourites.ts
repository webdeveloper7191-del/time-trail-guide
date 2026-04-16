import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'report-favourites';

export function useReportFavourites() {
  const [favourites, setFavourites] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...favourites]));
  }, [favourites]);

  const toggleFavourite = useCallback((id: string) => {
    setFavourites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const isFavourite = useCallback((id: string) => favourites.has(id), [favourites]);

  return { favourites, toggleFavourite, isFavourite };
}
