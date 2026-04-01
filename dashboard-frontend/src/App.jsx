import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Header from './components/Header';
import TestControlPage from './components/TestControlPage';
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
    <div className="min-h-screen bg-white">
      <Header wsConnected={wsConnected} />
      <Routes>
        <Route
          path="/"
          element={
            <main className="w-full px-3 sm:px-5 lg:px-8 py-5">
              <Dashboard />
            </main>
          }
        />
        <Route
          path="/test"
          element={
            <main className="w-full px-3 sm:px-5 lg:px-8 py-5">
              <TestControlPage />
            </main>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
