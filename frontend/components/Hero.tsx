import React from 'react';
import { ExternalLink, Loader2, ArrowRight, PlayCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import { useLinera } from '../context/LineraContext';
import { InitializationStatus } from './InitializationStatus';
import { toast } from 'sonner';

const Hero = () => {
  const navigate = useNavigate();
  // Using LineraContext for manual chain creation flow
  const { status, createChain } = useLinera();

  const handleAction = async () => {
    if (status === 'ready') {
      navigate('/deploy');
    } else {
      await createChain();
    }
  };

  const getButtonText = () => {
    if (status === 'creating') return 'Initializing Chain...';
    if (status === 'ready') return 'Start Building';
    return 'Create Chain';
  };

  return (
    <section className="relative pt-32 pb-20 overflow-hidden min-h-[90vh] flex flex-col items-center justify-center border-b border-white/10">
      {/* Background Grids */}
      <div className="absolute inset-0 bg-grid-large-white opacity-20 pointer-events-none [mask-image:linear-gradient(to_bottom,transparent,black)]"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">

        {/* Polygon Network Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-8 fill-[#8247E5]"
        >
          <a
            href="https://amoy.polygonscan.com/address/0x087a2d886fc8eadf5d03f6ea5acd0b1430c13fb8"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:border-[#8247E5]/50 hover:bg-[#8247E5]/10 transition-all cursor-pointer backdrop-blur-sm group"
          >
            <span className="text-xs font-medium text-accents-5 group-hover:text-white transition-colors">
              Native x402 Execution on <span className="text-white">Polygon</span>
            </span>
            <ExternalLink className="w-3 h-3 text-gray-600 group-hover:text-[#8247E5] ml-1" />
          </a>
        </motion.div>

        {/* Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-accents-4 leading-[1.1] max-w-5xl mx-auto"
        >
          The Decentralized & Monetizable Serverless Network.
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-accents-5 max-w-3xl mx-auto mb-10 leading-relaxed"
        >
          Run your code on a global, censorship-resistant worker grid. Monetize natively with the x402 Protocol. PeerHost is the execution layer for the Agentic Economy, where AI Agents and Humans pay for compute.
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleAction}
              disabled={status === 'creating'}
              className={`h-12 px-8 rounded-full font-medium text-base transition-all flex items-center gap-2 ${status === 'ready'
                  ? "bg-white text-black hover:bg-gray-200"
                  : "bg-accents-1 border border-accents-2 text-white hover:bg-accents-2"
                } ${status === 'creating' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {status === 'creating' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : status === 'ready' ? (
                <ArrowRight className="w-5 h-5" />
              ) : (
                <PlayCircle className="w-5 h-5" />
              )}
              {getButtonText()}
            </button>

            <button
              onClick={() => navigate('/workers')}
              className="h-12 px-8 rounded-full bg-transparent border border-white/10 text-accents-5 font-medium text-base hover:text-white hover:border-white/30 transition-all"
            >
              Register as Worker
            </button>
          </div>

          {/* Initialization Logs Component */}
          <div className="w-full">
            <InitializationStatus />
          </div>

        </motion.div>
      </div>

      {/* Triangular Light Effect at Bottom */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[400px] pointer-events-none"
      >
        <div className="absolute bottom-[-100px] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-hero-glow blur-[100px] opacity-40 rounded-full mix-blend-screen animate-pulse"></div>
        <div className="absolute inset-0 bg-grid-large-white opacity-30 [mask-image:linear-gradient(to_top,black,transparent)]"></div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[300px] border-r-[300px] border-b-[400px] border-l-transparent border-r-transparent border-b-black opacity-90 scale-150 origin-bottom"></div>
        <svg className="absolute bottom-0 left-1/2 -translate-x-1/2 overflow-visible" width="600" height="300" viewBox="0 0 600 300">
          <defs>
            <linearGradient id="line-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="white" stopOpacity="0" />
              <stop offset="50%" stopColor="white" stopOpacity="0.5" />
              <stop offset="100%" stopColor="white" stopOpacity="1" />
            </linearGradient>
          </defs>
          <path d="M300 0 L0 300" stroke="url(#line-gradient)" strokeWidth="1" opacity="0.5" />
          <path d="M300 0 L600 300" stroke="url(#line-gradient)" strokeWidth="1" opacity="0.5" />
          <path d="M300 0 L300 300" stroke="url(#line-gradient)" strokeWidth="1" opacity="0.2" />
          <path d="M300 0 L150 300" stroke="url(#line-gradient)" strokeWidth="1" opacity="0.3" />
          <path d="M300 0 L450 300" stroke="url(#line-gradient)" strokeWidth="1" opacity="0.3" />
          {Array.from({ length: 15 }).map((_, i) => (
            <line
              key={i}
              x1={300 - i * 20}
              y1={i * 20}
              x2={300 + i * 20}
              y2={i * 20}
              stroke="white"
              strokeOpacity="0.1"
              strokeWidth="1"
            />
          ))}
        </svg>
      </motion.div>
    </section>
  );
};

export default Hero;