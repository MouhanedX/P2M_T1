import { Router, Server, AlertCircle, CheckCircle } from 'lucide-react';
import clsx from 'clsx';

function NetworkTopology({ routes = [], alarms = [] }) {
  const fallbackRoutes = [
    { routeId: 'OR_1', routeName: 'Route A-B', status: 'NORMAL', fiberSpec: { lengthKm: 25 } },
    { routeId: 'OR_2', routeName: 'Route A-C', status: 'DEGRADATION', fiberSpec: { lengthKm: 32 } },
    { routeId: 'OR_3', routeName: 'Route B-D', status: 'NORMAL', fiberSpec: { lengthKm: 18 } },
    { routeId: 'OR_4', routeName: 'Route C-D', status: 'NORMAL', fiberSpec: { lengthKm: 28 } },
    { routeId: 'OR_5', routeName: 'Route D-E', status: 'NORMAL', fiberSpec: { lengthKm: 22 } }
  ];

  const routeData = routes.length ? routes : fallbackRoutes;

  const topology = {
    central: { id: 'RTU_01', name: 'Central RTU', type: 'rtu' },
    routes: routeData.map((route) => ({
      id: route.routeId || route.id,
      name: route.routeName || route.name || route.routeId,
      status: (route.status || 'NORMAL').toLowerCase(),
      distance: `${route?.fiberSpec?.lengthKm ?? route?.distance ?? '-'} km`
    }))
  };

  // Get route status from alarms
  const getRouteStatus = (routeId) => {
    const routeAlarms = alarms.filter(a => a.routeId === routeId && a.status === 'ACTIVE');
    if (routeAlarms.length === 0) return 'normal';
    
    const hasCritical = routeAlarms.some(a => a.severity === 'CRITICAL');
    if (hasCritical) return 'critical';
    
    const hasHigh = routeAlarms.some(a => a.severity === 'HIGH' || a.severity === 'MEDIUM');
    if (hasHigh) return 'degraded';
    
    return 'warning';
  };

  const getStatusColor = (status) => {
    const colors = {
      normal: 'border-green-500 bg-green-50',
      degraded: 'border-yellow-500 bg-yellow-50',
      warning: 'border-orange-500 bg-orange-50',
      critical: 'border-red-500 bg-red-50 animate-pulse'
    };
    return colors[status] || colors.normal;
  };

  const getLineColor = (status) => {
    const colors = {
      normal: 'stroke-green-500',
      degraded: 'stroke-yellow-500',
      warning: 'stroke-orange-500',
      critical: 'stroke-red-500'
    };
    return colors[status] || colors.normal;
  };

  return (
    <div className="relative h-96">
      {/* SVG for connection lines */}
      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" />
          </marker>
        </defs>
        
        {/* Central to all routes */}
        {topology.routes.map((route, idx) => {
          const angle = (idx / topology.routes.length) * 2 * Math.PI;
          const x2 = 50 + 35 * Math.cos(angle);
          const y2 = 50 + 35 * Math.sin(angle);
          const status = getRouteStatus(route.id);
          
          return (
            <line
              key={route.id}
              x1="50%"
              y1="50%"
              x2={`${x2}%`}
              y2={`${y2}%`}
              className={clsx('transition-all duration-300', getLineColor(status))}
              strokeWidth={status === 'critical' ? '3' : '2'}
              strokeDasharray={status === 'normal' ? '0' : '5,5'}
              markerEnd="url(#arrowhead)"
            />
          );
        })}
      </svg>

      {/* Central RTU */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" style={{ zIndex: 10 }}>
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-full p-4 shadow-lg border-4 border-white">
          <Server className="w-8 h-8 text-white" />
        </div>
        <div className="text-center mt-2">
          <p className="text-xs font-bold text-gray-700">{topology.central.name}</p>
        </div>
      </div>

      {/* Route endpoints */}
      {topology.routes.map((route, idx) => {
        const angle = (idx / topology.routes.length) * 2 * Math.PI;
        const x = 50 + 35 * Math.cos(angle);
        const y = 50 + 35 * Math.sin(angle);
        const status = getRouteStatus(route.id);
        const alarmsCount = alarms.filter(a => a.routeId === route.id && a.status === 'ACTIVE').length;

        return (
          <div
            key={route.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${x}%`, top: `${y}%`, zIndex: 10 }}
          >
            <div className={clsx(
              'relative rounded-lg p-3 border-2 shadow-lg transition-all hover:scale-110',
              getStatusColor(status)
            )}>
              <Router className="w-6 h-6 mb-1 mx-auto text-gray-700" />
              <p className="text-xs font-bold text-center text-gray-900">{route.id}</p>
              <p className="text-xs text-center text-gray-600">{route.distance}</p>
              
              {alarmsCount > 0 && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
                  {alarmsCount}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default NetworkTopology;
