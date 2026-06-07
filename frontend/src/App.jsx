import React, { useState } from 'react';
import { NodeProvider } from './context/NodeContext';

import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import ComparisonPage from './pages/ComparisonPage';
import DemoPage from './pages/DemoPage';

// ======================================================
// Octicon-style SVG Logo
// ======================================================

const LogoIcon = () => (
    <svg viewBox="0 0 32 32" width="32" height="32" fill="currentColor">
        <path d="M16 2C8.27 2 2 8.27 2 16c0 6.07 3.87 11.23 9.26 13.07.04-.89.17-2.26.42-3.27l1.8-7.58s-.45-.9-.45-2.23c0-2.09 1.21-3.65 2.72-3.65 1.28 0 1.9.96 1.9 2.12 0 1.29-.82 3.22-1.25 5.01-.36 1.5.75 2.72 2.22 2.72 2.67 0 4.46-3.43 4.46-7.5 0-3.09-2.08-5.4-5.87-5.4-4.28 0-6.94 3.19-6.94 6.75 0 1.23.36 2.1.92 2.77.26.3.29.43.2.77-.07.25-.22.87-.29 1.11-.09.35-.37.48-.68.35-1.86-.76-2.72-2.79-2.72-5.08 0-3.78 3.19-8.32 9.52-8.32 5.09 0 8.44 3.68 8.44 7.64 0 5.23-2.91 9.14-7.2 9.14-1.44 0-2.8-.78-3.26-1.67l-.94 3.58c-.28 1.01-.82 2.02-1.32 2.83A14.01 14.01 0 0 0 16 30c7.73 0 14-6.27 14-14S23.73 2 16 2Z" />
    </svg>
);

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
                        className={isActive('compare') ? 'active' : ''}
                        onClick={() => onNavigate('compare')}
                    >
                        Compare
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
// Mỗi DashboardPage có NodeProvider riêng với initialNode
// được set đúng từ đầu — không có global node state conflict.
//
// ComparisonPage không cần NodeProvider vì nó tự tạo
// 2 api instances riêng biệt cho node-a và node-b.
// ======================================================

function App() {
    const [currentPage, setCurrentPage] = useState('home');
    const [compareParams, setCompareParams] = useState(null);

    const handleNavigate = (page, params = null) => {
        if (page === 'compare' && params) {
            setCompareParams(params);
        } else if (page !== 'compare') {
            setCompareParams(null);
        }
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

            case 'compare':
                // ComparisonPage tự quản lý 2 api instances
                return <ComparisonPage initialParams={compareParams} clearParams={() => setCompareParams(null)} />;

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
