import { ReactNode } from 'react';
import { TrackerContext } from '../hooks/useTrackerContext';
import { useTracker } from '../hooks/useTracker';

export function TrackerProvider({ children }: { children: ReactNode }) {
  const tracker = useTracker();

  return (
    <TrackerContext.Provider value={tracker}>
      {children}
    </TrackerContext.Provider>
  );
}
