import { Activity, Wifi, WifiOff } from 'lucide-react';

function Header({ wsConnected }) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-3">
            <Activity className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                NQMS Fiber Monitoring
              </h1>
              <p className="text-sm text-gray-500">
                Network Quality Monitoring System
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {wsConnected ? (
                <>
                  <Wifi className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-green-600 font-medium">
                    Connected
                  </span>
                </>
              ) : (
                <>
                  <WifiOff className="w-5 h-5 text-red-500" />
                  <span className="text-sm text-red-600 font-medium">
                    Disconnected
                  </span>
                </>
              )}
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span className="font-medium">
                {new Date().toLocaleString('en-US', {
                  dateStyle: 'medium',
                  timeStyle: 'short'
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
