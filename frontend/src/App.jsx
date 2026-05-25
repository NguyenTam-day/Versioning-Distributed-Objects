import React, { useState } from 'react';
import { NodeProvider } from './context/NodeContext';

import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import ComparisonPage from './pages/ComparisonPage';
import DemoPage from './pages/DemoPage';

// ======================================================
// Navbar
// ======================================================

const Navbar = ({ currentPage, onNavigate }) => {
    return (
        <nav className="navbar">
            <div className="container">
                <h1
                    onClick={() => onNavigate('home')}
                    style={{ cursor: 'pointer' }}
                >
                    CAD Versioning System
                </h1>
                <div className="navbar-nav">
                    <a onClick={() => onNavigate('home')}>Home</a>
                    <a onClick={() => onNavigate('dashboard-a')}>️ Node A</a>
                    <a onClick={() => onNavigate('dashboard-b')}>️ Node B</a>
                    <a onClick={() => onNavigate('compare')}>Compare</a>
                    <a onClick={() => onNavigate('demo')}>Demo</a>
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
                        <DashboardPage />
                    </NodeProvider>
                );

            case 'dashboard-b':
                // NodeProvider scope = chỉ Node B dashboard
                return (
                    <NodeProvider key="node-b" initialNode="node-b">
                        <DashboardPage />
                    </NodeProvider>
                );

            case 'compare':
                // ComparisonPage tự quản lý 2 api instances
                return <ComparisonPage />;

            case 'demo':
                return <DemoPage />;

            default:
                return <HomePage onNavigate={handleNavigate} />;
        }
    };

    return (
        <div>
            <Navbar currentPage={currentPage} onNavigate={handleNavigate} />
            {renderPage()}
        </div>
    );
}

export default App;
