import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLinera } from './LineraContext';

interface WalletContextType {
  address: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  isConnected: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { chainId, client } = useLinera();
  const [address, setAddress] = useState<string | null>(null);

  // Sync address with underlying Linera Chain ID
  useEffect(() => {
    if (chainId) {
      setAddress(chainId);
      localStorage.setItem('walletAddress', chainId);
    } else {
      setAddress(null);
    }
  }, [chainId]);

  const connect = async () => {
    // "Web Client" / "Embedded Wallet" Strategy
    // We check for a stored key. If none, we GENERATE one silently (frictionless).
    // LineraContext handles auto-connection.
    console.log("Wallet connection managed by LineraContext (Auto-connect).");
  };

  const disconnect = () => {
    setAddress(null);
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('linera_private_key');
    // Force reload to clear in-memory state of LineraContext/Wasm
    window.location.reload();
  };

  return (
    <WalletContext.Provider value={{ address, connect, disconnect, isConnected: !!address }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
