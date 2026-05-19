#!/bin/bash

# Setup and run the entire Distributed CAD Versioning System
# This script assumes you have Node.js, Java, and Maven installed

echo "================================================"
echo "Distributed CAD Versioning System Setup"
echo "================================================"
echo ""

# Check prerequisites
echo "Checking prerequisites..."
if ! command -v java &> /dev/null; then
    echo "[ERROR] Java is not installed or not in PATH"
    exit 1
fi

if ! command -v mvn &> /dev/null; then
    echo "[ERROR] Maven is not installed or not in PATH"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed or not in PATH"
    exit 1
fi

echo "✓ Java is installed"
echo "✓ Maven is installed"
echo "✓ Node.js is installed"
echo ""

# Build backend projects
echo "================================================"
echo "Building Node A Backend..."
echo "================================================"
cd node_a
mvn clean install -q
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to build Node A"
    exit 1
fi
echo "✓ Node A built successfully"
cd ..
echo ""

echo "================================================"
echo "Building Node B Backend..."
echo "================================================"
cd node_b
mvn clean install -q
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to build Node B"
    exit 1
fi
echo "✓ Node B built successfully"
cd ..
echo ""

echo "================================================"
echo "Installing Frontend Dependencies..."
echo "================================================"
cd frontend
npm install --silent
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to install frontend dependencies"
    exit 1
fi
echo "✓ Frontend dependencies installed"
cd ..
echo ""

echo "================================================"
echo "Setup Complete!"
echo "================================================"
echo ""
echo "To start the system, run the following commands in separate terminals:"
echo ""
echo "Terminal 1 (Node A - Port 5000):"
echo "  cd node_a"
echo "  mvn spring-boot:run"
echo ""
echo "Terminal 2 (Node B - Port 5001):"
echo "  cd node_b"
echo "  mvn spring-boot:run"
echo ""
echo "Terminal 3 (Frontend - Port 3000):"
echo "  cd frontend"
echo "  npm start"
echo ""
echo "Then open http://localhost:3000 in your browser."
echo ""
