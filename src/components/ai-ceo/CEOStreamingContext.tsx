import { createContext, useContext, useState, type ReactNode } from 'react';

const CEOStreamingContext = createContext({ streamingOn: true, toggleStreaming: () => undefined });

export function CEOStreamingProvider({ children }: { children: ReactNode }) {
  const [streamingOn, setStreamingOn] = useState(true);
  return (
    <CEOStreamingContext.Provider value={{ streamingOn, toggleStreaming: () => setStreamingOn((value) => !value) }}>
      {children}
    </CEOStreamingContext.Provider>
  );
}

export function useCEOStreaming() {
  return useContext(CEOStreamingContext);
}