import React, { createContext, useContext, useState, useEffect } from 'react';

interface GatekeeperState {
  isBlocked: boolean;
  blockedDocument?: string;
  blockedReason?: 'MISSING' | 'EXPIRED' | 'PENDING' | 'REJECTED';
}

interface GatekeeperContextType {
  state: GatekeeperState;
  setBlocked: (blocked: boolean, document?: string, reason?: GatekeeperState['blockedReason']) => void;
  unblock: () => void;
}

const GatekeeperContext = createContext<GatekeeperContextType | undefined>(undefined);

export const GatekeeperProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<GatekeeperState>({
    isBlocked: false,
  });

  // Check for gatekeeper status from API on mount
  useEffect(() => {
    const checkGatekeeperStatus = async () => {
      try {
        const response = await fetch('/api/gatekeeper/status');
        if (response.status === 403) {
          const data = await response.json();
          setState({
            isBlocked: true,
            blockedDocument: data.document,
            blockedReason: data.reason,
          });
        } else if (response.ok) {
          const data = await response.json();
          setState({
            isBlocked: false,
          });
        }
      } catch (error) {
        console.error('Error checking gatekeeper status:', error);
      }
    };

    checkGatekeeperStatus();
  }, []);

  const value: GatekeeperContextType = {
    state,
    setBlocked: (blocked, document, reason) => {
      setState({
        isBlocked: blocked,
        blockedDocument: document,
        blockedReason: reason,
      });
    },
    unblock: () => {
      setState({
        isBlocked: false,
      });
    },
  };

  return (
    <GatekeeperContext.Provider value={value}>
      {children}
    </GatekeeperContext.Provider>
  );
};

export const useGatekeeper = () => {
  const context = useContext(GatekeeperContext);
  if (!context) {
    throw new Error('useGatekeeper must be used within GatekeeperProvider');
  }
  return context;
};
