import React, { useState } from 'react';
import { NodeProvider } from './context/NodeContext';

import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import DemoPage from './pages/DemoPage';



// ======================================================
// Navbar — Simple dark header
// ======================================================

const Navbar = ({ currentPage, onNavigate }) => {
    const isActive = (page) => currentPage === page;
    const isDashboard = currentPage === 'dashboard-a' || currentPage === 'dashboard-b';

    return (
        <nav className="navbar">
            <div className="container">
                <div
                    className="navbar-brand"
                    onClick={() => onNavigate('home')}
                >
                    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-accent-fg)", marginRight: "4px" }}>
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                        <line x1="12" y1="22.08" x2="12" y2="12"></line>
                    </svg>
                    <span>Distributed CAD</span>
                </div>

                <div className="navbar-nav">
                    <a
                        className={isDashboard && currentPage === 'dashboard-a' ? 'active' : ''}
                        onClick={() => onNavigate('dashboard-a')}
                    >
                        <span className="nav-node-indicator" style={{ backgroundColor: '#00e676' }}></span>
                        Node A
                    </a>
                    <a
                        className={isDashboard && currentPage === 'dashboard-b' ? 'active' : ''}
                        onClick={() => onNavigate('dashboard-b')}
                    >
                        <span className="nav-node-indicator" style={{ backgroundColor: '#7c4dff' }}></span>
                        Node B
                    </a>
                    <a
                        className={isActive('demo') ? 'active' : ''}
                        onClick={() => onNavigate('demo')}
                    >
                        Demo
                    </a>
                </div>
            </div>
        </nav>
    );
};

// ======================================================
// App
//
// Mỗi DashboardPage có NodeProvider riêng with initialNode
// được set đúng từ đầu — không có global node state conflict.
//
// ComparisonPage không cần NodeProvider vì nó tự tạo
// 2 api instances riêng biệt cho node-a và node-b.
// ======================================================

function App() {
    const [currentPage, setCurrentPage] = useState('home');

    const handleNavigate = (page) => {
        setCurrentPage(page);
        window.scrollTo(0, 0);
    };

    const renderPage = () => {
        switch (currentPage) {
            case 'home':
                return <HomePage onNavigate={handleNavigate} />;

            case 'dashboard-a':
                // NodeProvider scope = chỉ Node A dashboard
                return (
                    <NodeProvider key="node-a" initialNode="node-a">
                        <DashboardPage onNavigate={handleNavigate} />
                    </NodeProvider>
                );

            case 'dashboard-b':
                // NodeProvider scope = chỉ Node B dashboard
                return (
                    <NodeProvider key="node-b" initialNode="node-b">
                        <DashboardPage onNavigate={handleNavigate} />
                    </NodeProvider>
                );

            case 'demo':
                return <DemoPage />;

            default:
                return <HomePage onNavigate={handleNavigate} />;
        }
    };

    return (
        <div>
            <Navbar currentPage={currentPage} onNavigate={handleNavigate} />
            <main style={{ flex: 1, paddingBottom: '48px' }}>
                {renderPage()}
            </main>
        </div>
    );
}

export default App;
