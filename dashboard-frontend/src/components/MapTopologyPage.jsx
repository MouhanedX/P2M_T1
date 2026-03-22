import { MapPinned, RadioTower, Route, Ruler, Map } from 'lucide-react';

const MAP_BOUNDS = {
  minLat: 30.1,
  maxLat: 37.7,
  minLng: 7.0,
  maxLng: 11.8,
  width: 1000,
  height: 700
};

const rtus = [
  { id: 'RTU_TN_01', name: 'Tunis Core RTU', city: 'Tunis', lat: 36.8065, lng: 10.1815, color: '#0f766e' },
  { id: 'RTU_TN_02', name: 'Sousse Metro RTU', city: 'Sousse', lat: 35.8256, lng: 10.6360, color: '#1d4ed8' },
  { id: 'RTU_TN_03', name: 'Sfax Hub RTU', city: 'Sfax', lat: 34.7406, lng: 10.7603, color: '#be123c' },
  { id: 'RTU_TN_04', name: 'Kairouan Inland RTU', city: 'Kairouan', lat: 35.6781, lng: 10.0963, color: '#7c3aed' },
  { id: 'RTU_TN_05', name: 'Gabes South RTU', city: 'Gabes', lat: 33.8815, lng: 10.0982, color: '#ca8a04' }
];

const routes = [
  { id: 'TN01_R1', rtuId: 'RTU_TN_01', to: 'Bizerte Node', lat: 37.2744, lng: 9.8739, distanceKm: 66 },
  { id: 'TN01_R2', rtuId: 'RTU_TN_01', to: 'Nabeul Node', lat: 36.4510, lng: 10.7350, distanceKm: 72 },
  { id: 'TN01_R3', rtuId: 'RTU_TN_01', to: 'Zaghouan Node', lat: 36.4029, lng: 10.1429, distanceKm: 55 },

  { id: 'TN02_R1', rtuId: 'RTU_TN_02', to: 'Monastir Node', lat: 35.7643, lng: 10.8113, distanceKm: 24 },
  { id: 'TN02_R2', rtuId: 'RTU_TN_02', to: 'Kairouan East Node', lat: 35.6779, lng: 10.1012, distanceKm: 57 },
  { id: 'TN02_R3', rtuId: 'RTU_TN_02', to: 'Mahdia Node', lat: 35.5047, lng: 11.0622, distanceKm: 76 },

  { id: 'TN03_R1', rtuId: 'RTU_TN_03', to: 'Skhira Node', lat: 34.2992, lng: 10.0702, distanceKm: 63 },
  { id: 'TN03_R2', rtuId: 'RTU_TN_03', to: 'Kerkennah Node', lat: 34.7560, lng: 11.2922, distanceKm: 49 },
  { id: 'TN03_R3', rtuId: 'RTU_TN_03', to: 'Sidi Bouzid Node', lat: 35.0382, lng: 9.4858, distanceKm: 121 },

  { id: 'TN04_R1', rtuId: 'RTU_TN_04', to: 'Kasserine Node', lat: 35.1676, lng: 8.8365, distanceKm: 106 },
  { id: 'TN04_R2', rtuId: 'RTU_TN_04', to: 'Sbeitla Node', lat: 35.2425, lng: 9.1250, distanceKm: 71 },
  { id: 'TN04_R3', rtuId: 'RTU_TN_04', to: 'Sousse West Node', lat: 35.8351, lng: 10.5885, distanceKm: 62 },

  { id: 'TN05_R1', rtuId: 'RTU_TN_05', to: 'Medenine Node', lat: 33.3549, lng: 10.5055, distanceKm: 85 },
  { id: 'TN05_R2', rtuId: 'RTU_TN_05', to: 'Matmata Node', lat: 33.5437, lng: 9.9728, distanceKm: 52 },
  { id: 'TN05_R3', rtuId: 'RTU_TN_05', to: 'Djerba Node', lat: 33.8076, lng: 10.8451, distanceKm: 98 }
];

function projectToMap(lat, lng) {
  const { minLat, maxLat, minLng, maxLng, width, height } = MAP_BOUNDS;
  const x = ((lng - minLng) / (maxLng - minLng)) * width;
  const y = height - ((lat - minLat) / (maxLat - minLat)) * height;
  return { x, y };
}

function MapTopologyPage() {
  const totals = {
    rtus: rtus.length,
    routes: routes.length,
    avgDistance: Math.round(routes.reduce((acc, route) => acc + route.distanceKm, 0) / routes.length)
  };

  return (
    <div className="px-4 py-4 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-cyan-100 via-sky-100 to-amber-100 shadow-xl">
        <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-cyan-300/35 blur-3xl" />
        <div className="absolute -right-20 top-12 h-56 w-56 rounded-full bg-amber-300/30 blur-3xl" />

        <div className="relative z-10 border-b border-slate-200/70 bg-white/70 px-6 py-4 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 text-2xl font-black tracking-tight text-slate-900">
                <MapPinned className="h-6 w-6 text-teal-700" />
                Tunisia RTU Topology Map
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-700">
                Full map view with 5 RTUs and 3 fiber routes per RTU
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-700">
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 shadow-sm"><RadioTower className="h-3.5 w-3.5 text-teal-700" /> {totals.rtus} RTUs</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 shadow-sm"><Route className="h-3.5 w-3.5 text-blue-700" /> {totals.routes} Routes</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 shadow-sm"><Ruler className="h-3.5 w-3.5 text-amber-700" /> Avg {totals.avgDistance} km</span>
            </div>
          </div>
        </div>

        <div className="relative h-[calc(100vh-220px)] min-h-[560px] w-full">
          <svg viewBox="0 0 1000 700" className="h-full w-full">
            <defs>
              <linearGradient id="landGradient" x1="0%" x2="100%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="#e0f2fe" />
                <stop offset="100%" stopColor="#d9f99d" />
              </linearGradient>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#cbd5e1" strokeOpacity="0.4" strokeWidth="1" />
              </pattern>
            </defs>

            <rect x="0" y="0" width="1000" height="700" fill="url(#grid)" />

            <path
              d="M760 90 L820 170 L850 280 L838 355 L780 420 L740 500 L670 570 L610 620 L560 630 L500 604 L450 545 L398 486 L350 410 L320 350 L300 292 L260 240 L242 188 L290 150 L360 138 L432 118 L510 104 L590 95 L670 80 Z"
              fill="url(#landGradient)"
              stroke="#0f766e"
              strokeWidth="3"
              opacity="0.95"
            />

            {routes.map((route) => {
              const source = rtus.find((rtu) => rtu.id === route.rtuId);
              const sourcePoint = projectToMap(source.lat, source.lng);
              const destinationPoint = projectToMap(route.lat, route.lng);

              return (
                <g key={route.id}>
                  <line
                    x1={sourcePoint.x}
                    y1={sourcePoint.y}
                    x2={destinationPoint.x}
                    y2={destinationPoint.y}
                    stroke={source.color}
                    strokeOpacity="0.65"
                    strokeWidth="3"
                    strokeDasharray="8 6"
                  />

                  <circle cx={destinationPoint.x} cy={destinationPoint.y} r="5" fill="#334155" />

                  <g transform={`translate(${(sourcePoint.x + destinationPoint.x) / 2}, ${(sourcePoint.y + destinationPoint.y) / 2})`}>
                    <rect x="-26" y="-10" width="52" height="20" rx="6" fill="#ffffff" fillOpacity="0.95" stroke="#94a3b8" />
                    <text textAnchor="middle" y="5" fontSize="11" fontWeight="700" fill="#0f172a">
                      {route.distanceKm} km
                    </text>
                  </g>
                </g>
              );
            })}

            {rtus.map((rtu) => {
              const point = projectToMap(rtu.lat, rtu.lng);
              return (
                <g key={rtu.id}>
                  <circle cx={point.x} cy={point.y} r="14" fill={rtu.color} stroke="#ffffff" strokeWidth="3" />
                  <circle cx={point.x} cy={point.y} r="23" fill={rtu.color} fillOpacity="0.12" />
                  <text x={point.x + 18} y={point.y - 8} fontSize="12" fontWeight="800" fill="#0f172a">
                    {rtu.id}
                  </text>
                  <text x={point.x + 18} y={point.y + 8} fontSize="11" fontWeight="600" fill="#334155">
                    {rtu.city}
                  </text>
                </g>
              );
            })}
          </svg>

          <aside className="absolute bottom-4 left-4 w-80 max-w-[calc(100%-2rem)] rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-xl backdrop-blur">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-slate-700">
              <Map className="h-4 w-4" />
              RTU Inventory
            </h3>
            <ul className="space-y-2 text-sm">
              {rtus.map((rtu) => (
                <li key={rtu.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-2 py-1.5">
                  <span className="inline-flex items-center gap-2 font-semibold text-slate-800">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: rtu.color }} />
                    {rtu.name}
                  </span>
                  <span className="text-xs font-bold text-slate-500">3 routes</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>
    </div>
  );
}

export default MapTopologyPage;
