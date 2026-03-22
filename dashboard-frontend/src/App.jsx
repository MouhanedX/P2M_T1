import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Header from './components/Header';
import MapTopologyPage from './components/MapTopologyPage';
import websocketService from './services/websocket';

function App() {
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    // Connect to WebSocket
    websocketService.connect(
      () => {
        console.log('WebSocket connected successfully');
        setWsConnected(true);
      },
      (error) => {
        console.error('WebSocket connection error:', error);
        setWsConnected(false);
      }
    );

    // Cleanup on unmount
    return () => {
      websocketService.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header wsConnected={wsConnected} />
      <Routes>
        <Route
          path="/"
          element={
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <Dashboard />
            </main>
          }
        />
        <Route path="/topology-map" element={<MapTopologyPage />} />
      </Routes>
    </div>
  );
}

export default App;
