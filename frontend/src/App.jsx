import React, { useState } from 'react';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import ComparisonPage from './pages/ComparisonPage';
import DemoPage from './pages/DemoPage';

const Navbar = ({ currentPage, onNavigate }) => {
    return (
        <nav className="navbar">
            <div className="container">
                <h1 onClick={() => onNavigate('home')} style={{ cursor: 'pointer' }}>
                     CAD Versioning System
                </h1>
                <div className="navbar-nav">
                    <a onClick={() => onNavigate('home')}> Home</a>
                    <a onClick={() => onNavigate('dashboard-a')}>️ Node A</a>
                    <a onClick={() => onNavigate('dashboard-b')}>️ Node B</a>
                    <a onClick={() => onNavigate('compare')}> Compare</a>
                    <a onClick={() => onNavigate('demo')}> Demo</a>
                </div>
            </div>
        </nav>
    );
};

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
                return <DashboardPage node="A" />;
            case 'dashboard-b':
                return <DashboardPage node="B" />;
            case 'compare':
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
