import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
// Found via reading node_modules: The library exports 'initialize' as a named export.
import { initialize as init, Client, Faucet, PrivateKeySigner } from '@linera/client';
import { toast } from 'sonner';

// Configuration
const FAUCET_URL = 'https://faucet.testnet-conway.linera.net';
export const PEERHOST_APP_ID = '51014c1f9bf2f633ab3d8ae8354449ae46f195b61e47e878b3e6f0e80bf32fe9';

type InitStatus = 'idle' | 'creating' | 'restoring' | 'ready' | 'error';

interface LineraContextType {
    client: Client | null;
    chainId: string | null;
    status: InitStatus;
    logs: string[];
    error: string | null;
    createChain: () => Promise<void>;
    performQuery: (query: string) => Promise<any>;
    performMutation: (mutation: string) => Promise<any>;
}

const LineraContext = createContext<LineraContextType>({
    client: null,
    chainId: null,
    status: 'idle',
    logs: [],
    error: null,
    createChain: async () => { },
    performQuery: async () => null,
    performMutation: async () => null,
});

export const useLinera = () => useContext(LineraContext);

export const LineraProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [client, setClient] = useState<Client | null>(null);
    const [chainId, setChainId] = useState<string | null>(null);
    const [status, setStatus] = useState<InitStatus>('idle');
    const [logs, setLogs] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Prevent double-init
    const initialized = useRef(false);

    const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

    // Restore session on mount
    useEffect(() => {
        const restoreSession = async () => {
            if (initialized.current) return;
            initialized.current = true;

            const storedKey = localStorage.getItem('linera_private_key');
            const storedChainId = localStorage.getItem('linera_chain_id');

            if (storedKey && storedChainId) {
                console.log("Restoring Linera session...");
                setStatus('restoring');
                try {
                    await initLineraClient(storedKey, storedChainId, true);
                } catch (e) {
                    console.error("Restoration failed, clearing storage", e);
                    localStorage.removeItem('linera_private_key');
                    localStorage.removeItem('linera_chain_id');
                    setStatus('idle');
                }
            } else {
                console.log("No session found. Waiting for user to create chain.");
            }
        };
        restoreSession();
    }, []);

    const initLineraClient = async (privateKeyHex: string, knownChainId: string | null, isRestoring: boolean) => {
        try {
            // 1. WASM Init
            if (!isRestoring) addLog("Initializing WASM...");
            await init('/linera_bg.wasm');
            if (!isRestoring) addLog("WASM Initialized.");

            // 2. Signer
            if (!isRestoring) addLog("Setting up signer...");
            const signer = new PrivateKeySigner(privateKeyHex);
            // @ts-ignore
            const ownerAddress = signer.wallet?.address;
            if (!ownerAddress) throw new Error("Could not derive owner address");

            // 3. Chain/Wallet Setup
            // If we are restoring, we assume the chain exists.
            // If creating, we claim a chain.
            let activeChainId = knownChainId;
            let walletObj: any = null; // We might not have the full Wallet object on restore, but Client needs meaningful args?

            const faucet = new Faucet(FAUCET_URL);

            if (!isRestoring) {
                addLog("Creating new wallet via Faucet...");
                const wallet = await faucet.createWallet();
                walletObj = wallet;

                addLog(`Claiming chain for Owner: ${ownerAddress.slice(0, 10)}...`);
                // Claim Chain (Must be before Client creation)
                activeChainId = await faucet.claimChain(wallet, ownerAddress);
                addLog(`Chain Claimed: ${activeChainId}`);

                // Save to storage
                localStorage.setItem('linera_private_key', privateKeyHex);
                localStorage.setItem('linera_chain_id', activeChainId);
                setChainId(activeChainId);
            } else {
                // RESTORING: Use faucet to create a generic wallet instance to satisfy the Client constructor type
                const wallet = await faucet.createWallet();
                walletObj = wallet;
                setChainId(knownChainId);
            }

            // 4. Client
            if (!isRestoring) addLog("Starting Client...");
            const newClient = new Client(walletObj, signer, false);
            setClient(newClient);

            console.log("Linera Client Ready");
            setStatus('ready');
            if (!isRestoring) addLog("Client Ready! Start Building.");

        } catch (err: any) {
            console.error(err);
            setError(err.message);
            setStatus('error');
            addLog(`Error: ${err.message}`);
            toast.error(err.message);
        }
    };

    const createChain = async () => {
        if (status === 'creating' || status === 'ready') return;
        setStatus('creating');
        setLogs([]);
        setError(null);

        try {
            // Generate Key
            addLog("Generating generic session keys...");
            const randomBytes = new Uint8Array(32);
            window.crypto.getRandomValues(randomBytes);
            const privateKeyHex = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');

            await initLineraClient(privateKeyHex, null, false);

        } catch (e: any) {
            // handled in initLineraClient
        }
    };

    const performQuery = async (query: string) => {
        if (!client) throw new Error("Linera client not initialized");
        if (!PEERHOST_APP_ID) throw new Error("PeerHost App ID not set.");
        try {
            const app = await client.application(PEERHOST_APP_ID);
            return await app.query(query);
        } catch (e: any) {
            console.error("Query Failed:", e);
            throw e;
        }
    };

    const performMutation = async (mutation: string) => {
        if (!client) throw new Error("Linera client not initialized");
        if (!PEERHOST_APP_ID) throw new Error("PeerHost App ID not set.");
        try {
            const app = await client.application(PEERHOST_APP_ID);
            return await app.mutate(mutation);
        } catch (e: any) {
            console.error("Mutation Failed:", e);
            throw e;
        }
    };

    return (
        <LineraContext.Provider value={{
            client,
            chainId,
            status,
            logs,
            error,
            createChain,
            performQuery,
            performMutation
        }}>
            {children}
        </LineraContext.Provider>
    );
};
