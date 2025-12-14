import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { useLinera } from '../context/LineraContext';

export const InitializationStatus: React.FC = () => {
    const { logs, status } = useLinera();
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    if (status === 'idle' && logs.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-lg mx-auto mt-8 bg-black/80 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden shadow-2xl text-left"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-accents-2" />
                    <span className="text-sm font-medium text-gray-300">System Initialization</span>
                </div>
                <div className="flex items-center gap-2">
                    {status === 'creating' && <Loader2 className="w-4 h-4 text-accents-1 animate-spin" />}
                    {status === 'ready' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                    {status === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
                    <span className={`text-xs uppercase font-bold tracking-wider ${status === 'ready' ? 'text-green-500' :
                            status === 'error' ? 'text-red-500' : 'text-accents-1'
                        }`}>
                        {status}
                    </span>
                </div>
            </div>

            {/* Logs Window */}
            <div
                ref={scrollRef}
                className="p-4 h-48 overflow-y-auto font-mono text-sm space-y-2 bg-black/50"
            >
                <AnimatePresence mode='popLayout'>
                    {logs.map((log, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-start gap-3"
                        >
                            <span className="text-gray-600 shrink-0 mt-0.5">{'>'}</span>
                            <span className={
                                index === logs.length - 1 && status === 'creating'
                                    ? "text-white animate-pulse"
                                    : "text-gray-300"
                            }>
                                {log}
                            </span>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {status === 'ready' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-4 p-2 bg-green-500/10 border border-green-500/20 rounded text-green-400 text-xs flex items-center justify-center gap-2"
                    >
                        <CheckCircle2 className="w-3 h-3" />
                        Initialization Complete.
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
};
