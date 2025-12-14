import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { WalletProvider } from './context/WalletContext';
import { LineraProvider, useLinera } from './context/LineraContext';
import Navbar from './components/Navbar';
// TopBar and Sidebar removed as they are part of DashboardLayout
import DashboardHome from './components/DashboardHome';
import NewDeployment from './components/NewDeployment';
import Projects from './components/Projects';
import { Earnings } from './components/Earnings';
import ApiTester from './components/ApiTester';
import Docs from './components/Docs';
import WorkerRegistration from './components/WorkerRegistration';
import LearnMore from './components/LearnMore';
import Hero from './components/Hero';
import Features from './components/Features';
import Architecture from './components/Architecture';
import AuthCallback from './components/AuthCallback';
import ExecutionFlow from './components/ExecutionFlow';
import DashboardLayout from './components/DashboardLayout';
import { Toaster } from 'sonner';

function AppContent() {
    const { chainId } = useLinera();
    const isConnected = !!chainId;

    return (
        <div className="flex h-screen bg-[#0A0B0E] text-white overflow-hidden">
            <Routes>
                {/* Landing Page */}
                <Route path="/" element={
                    <div className="min-h-screen bg-black text-white selection:bg-[#0070f3] selection:text-white pb-20 w-full overflow-y-auto">
                        <Navbar />
                        <main>
                            <Hero />
                            <Architecture />
                            <ExecutionFlow />
                            <Features />
                        </main>
                    </div>
                } />

                {/* Worker Registration */}
                <Route path="/workers" element={
                    <div className="min-h-screen bg-black text-white selection:bg-[#0070f3] selection:text-white pb-20 w-full overflow-y-auto">
                        <Navbar />
                        <WorkerRegistration />
                    </div>
                } />

                <Route path="/learn-more" element={<LearnMore />} />
                <Route path="/docs" element={<Docs />} />
                <Route path="/auth/callback" element={<AuthCallback />} />

                {/* Protected Dashboard Routes */}
                <Route path="/deploy" element={
                    isConnected ? <DashboardLayout /> : <Navigate to="/" replace />
                }>
                    <Route index element={<DashboardHome />} />
                    <Route path="projects" element={<Projects />} />
                    <Route path="earnings" element={<Earnings />} />
                    <Route path="test-api" element={<ApiTester />} />
                    <Route path="new" element={<NewDeployment />} />
                    <Route path="*" element={<Navigate to="/deploy" replace />} />
                </Route>
            </Routes>
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
            <LineraProvider>
                <WalletProvider>
                    <AppContent />
                    <Toaster position="bottom-right" theme="dark" />
                </WalletProvider>
            </LineraProvider>
        </BrowserRouter>
    );
}

export default App;