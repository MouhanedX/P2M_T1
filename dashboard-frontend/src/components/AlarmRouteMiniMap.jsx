import topologyData from '../data/topology-data.json';

const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));

const toFiniteNumber = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
};

const getRouteKey = (value) => String(value || '').trim().toUpperCase();

const getAlarmFaultDistanceKm = (alarm) => toFiniteNumber(
  alarm?.details?.eventLocationKm
  ?? alarm?.details?.event_location_km
  ?? alarm?.faultDistanceKm
  ?? alarm?.fault_distance_km
);

const getProjectionBounds = () => {
  const points = [
    ...(Array.isArray(topologyData?.rtus) ? topologyData.rtus : []).map((rtu) => ({
      lat: toFiniteNumber(rtu?.lat),
      lng: toFiniteNumber(rtu?.lng),
    })),
    ...(Array.isArray(topologyData?.routes) ? topologyData.routes : []).map((route) => ({
      lat: toFiniteNumber(route?.lat),
      lng: toFiniteNumber(route?.lng),
    })),
  ].filter((point) => point.lat !== null && point.lng !== null);

  if (points.length === 0) {
    return {
      latMin: 0,
      latMax: 1,
      lngMin: 0,
      lngMax: 1,
    };
  }

  return {
    latMin: Math.min(...points.map((point) => point.lat)),
    latMax: Math.max(...points.map((point) => point.lat)),
    lngMin: Math.min(...points.map((point) => point.lng)),
    lngMax: Math.max(...points.map((point) => point.lng)),
  };
};

const projectPoint = (latValue, lngValue, bounds) => {
  const lat = toFiniteNumber(latValue);
  const lng = toFiniteNumber(lngValue);

  if (lat === null || lng === null) {
    return null;
  }

  const latRange = (bounds.latMax - bounds.latMin) || 1;
  const lngRange = (bounds.lngMax - bounds.lngMin) || 1;
  const horizontalPadding = 7;
  const verticalPadding = 8;

  const normalizedX = (lng - bounds.lngMin) / lngRange;
  const normalizedY = (bounds.latMax - lat) / latRange;

  return {
    x: horizontalPadding + (normalizedX * (100 - (horizontalPadding * 2))),
    y: verticalPadding + (normalizedY * (100 - (verticalPadding * 2))),
  };
};

const getControlPoint = (start, end, curveOffset = 7.5) => {
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy) || 1;

  return {
    x: midX - ((dy / length) * curveOffset),
    y: midY + ((dx / length) * curveOffset),
  };
};

const getQuadraticPoint = (start, control, end, t) => {
  const oneMinusT = 1 - t;
  return {
    x: (oneMinusT * oneMinusT * start.x) + (2 * oneMinusT * t * control.x) + (t * t * end.x),
    y: (oneMinusT * oneMinusT * start.y) + (2 * oneMinusT * t * control.y) + (t * t * end.y),
  };
};

function AlarmRouteMiniMap({ route, alarm, compact = false }) {
  const routeId = route?.routeId || route?.id || alarm?.routeId || alarm?.route_id;
  const routeKey = getRouteKey(routeId);

  const topologyRoutes = Array.isArray(topologyData?.routes) ? topologyData.routes : [];
  const topologyRtus = Array.isArray(topologyData?.rtus) ? topologyData.rtus : [];

  const topologyRoute = topologyRoutes.find((item) => getRouteKey(item?.id) === routeKey) || null;
  const resolvedRtuId = route?.rtuId || route?.rtu_id || alarm?.rtuId || alarm?.rtu_id || topologyRoute?.rtuId;
  const sourceRtu = topologyRtus.find((item) => item?.id === resolvedRtuId)
    || topologyRtus.find((item) => item?.id === topologyRoute?.rtuId)
    || null;

  const resolvedRouteLengthKm = toFiniteNumber(
    route?.fiberSpec?.lengthKm
    ?? route?.distanceKm
    ?? topologyRoute?.distanceKm
  );
  const faultDistanceKm = getAlarmFaultDistanceKm(alarm);
  const hasFaultPosition = Number.isFinite(faultDistanceKm)
    && Number.isFinite(resolvedRouteLengthKm)
    && resolvedRouteLengthKm > 0;

  const faultRatio = hasFaultPosition
    ? clamp(faultDistanceKm / resolvedRouteLengthKm, 0, 1)
    : null;

  const bounds = getProjectionBounds();

  const selectedStart = sourceRtu
    ? projectPoint(sourceRtu.lat, sourceRtu.lng, bounds)
    : null;
  const selectedEnd = topologyRoute
    ? projectPoint(topologyRoute.lat, topologyRoute.lng, bounds)
    : null;

  if (!selectedStart || !selectedEnd || !topologyRoute || !sourceRtu) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-500">
        No topology coordinates available for this route.
      </div>
    );
  }

  const selectedControl = getControlPoint(selectedStart, selectedEnd, compact ? 5.8 : 7.5);
  const selectedPath = `M ${selectedStart.x} ${selectedStart.y} Q ${selectedControl.x} ${selectedControl.y} ${selectedEnd.x} ${selectedEnd.y}`;
  const selectedColor = sourceRtu.color || '#0ea5e9';
  const faultPoint = hasFaultPosition
    ? getQuadraticPoint(selectedStart, selectedControl, selectedEnd, faultRatio)
    : null;

  const contextSegments = topologyRoutes
    .map((item) => {
      const contextRtu = topologyRtus.find((candidate) => candidate.id === item.rtuId);
      if (!contextRtu) {
        return null;
      }

      const start = projectPoint(contextRtu.lat, contextRtu.lng, bounds);
      const end = projectPoint(item.lat, item.lng, bounds);
      if (!start || !end) {
        return null;
      }

      const control = getControlPoint(start, end, compact ? 4.5 : 5.5);
      return {
        key: item.id,
        path: `M ${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`,
      };
    })
    .filter(Boolean);

  const routeStatus = String(alarm?.status || route?.status || '').toUpperCase();
  const alarmIsActive = routeStatus === 'ACTIVE' || routeStatus === 'ACKNOWLEDGED';

  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-100/70 via-white to-cyan-50/70 p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-800">{routeId}</p>
          <p className="text-xs text-slate-500">{route?.routeName || topologyRoute?.to || sourceRtu?.name || 'Route view'}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-slate-700">{Number.isFinite(resolvedRouteLengthKm) ? `${resolvedRouteLengthKm.toFixed(1)} km` : '-'}</p>
          <p className="text-[11px] text-slate-500">RTU: {sourceRtu.id}</p>
        </div>
      </div>

      <div className={`relative overflow-hidden rounded-xl border border-slate-200 bg-slate-900/95 ${compact ? 'h-44' : 'h-56'}`}>
        <svg viewBox="0 0 100 100" className="h-full w-full">
          {[15, 35, 55, 75, 95].map((value) => (
            <line key={`grid-h-${value}`} x1="0" y1={value} x2="100" y2={value} stroke="rgba(148,163,184,0.14)" strokeWidth="0.4" />
          ))}
          {[10, 30, 50, 70, 90].map((value) => (
            <line key={`grid-v-${value}`} x1={value} y1="0" x2={value} y2="100" stroke="rgba(148,163,184,0.12)" strokeWidth="0.4" />
          ))}

          {contextSegments.map((segment) => (
            <path
              key={segment.key}
              d={segment.path}
              fill="none"
              stroke="rgba(148,163,184,0.26)"
              strokeWidth="1.25"
              strokeLinecap="round"
            />
          ))}

          <path
            d={selectedPath}
            fill="none"
            stroke={selectedColor}
            strokeOpacity="0.24"
            strokeWidth="6.5"
            strokeLinecap="round"
          />
          <path
            d={selectedPath}
            fill="none"
            stroke={selectedColor}
            strokeWidth="2.6"
            strokeLinecap="round"
          />

          <circle cx={selectedStart.x} cy={selectedStart.y} r="2.5" fill="#f8fafc" stroke={selectedColor} strokeWidth="1.3" />
          <circle cx={selectedEnd.x} cy={selectedEnd.y} r="2.5" fill="#f8fafc" stroke={selectedColor} strokeWidth="1.3" />

          {faultPoint && (
            <>
              <circle cx={faultPoint.x} cy={faultPoint.y} r="5.8" fill="rgba(248,113,113,0.18)" />
              <circle cx={faultPoint.x} cy={faultPoint.y} r="3.2" fill="rgba(239,68,68,0.24)" />
              <circle cx={faultPoint.x} cy={faultPoint.y} r="1.7" fill="#ef4444" stroke="#ffffff" strokeWidth="0.9" />
            </>
          )}
        </svg>

        <div className="absolute left-2 top-2 rounded-md bg-slate-900/70 px-2 py-1 text-[10px] font-semibold tracking-wide text-slate-100">
          Optical topology view
        </div>
        {faultPoint ? (
          <div className="absolute right-2 top-2 rounded-md bg-red-600/95 px-2 py-1 text-[10px] font-semibold tracking-wide text-white">
            Alarm marker
          </div>
        ) : (
          <div className="absolute right-2 top-2 rounded-md bg-emerald-600/90 px-2 py-1 text-[10px] font-semibold tracking-wide text-white">
            No active fault point
          </div>
        )}
      </div>

      <div className={`mt-2 grid ${compact ? 'grid-cols-2 gap-2' : 'grid-cols-3 gap-2'} text-[11px]`}>
        <div className="rounded-lg bg-white/85 px-2 py-1.5 text-slate-700">
          <p className="font-semibold text-slate-800">Route length</p>
          <p>{Number.isFinite(resolvedRouteLengthKm) ? `${resolvedRouteLengthKm.toFixed(2)} km` : '-'}</p>
        </div>
        <div className="rounded-lg bg-white/85 px-2 py-1.5 text-slate-700">
          <p className="font-semibold text-slate-800">Alarm location</p>
          <p>{Number.isFinite(faultDistanceKm) ? `${faultDistanceKm.toFixed(2)} km` : 'Not available'}</p>
        </div>
        {!compact && (
          <div className="rounded-lg bg-white/85 px-2 py-1.5 text-slate-700">
            <p className="font-semibold text-slate-800">Status</p>
            <p>{alarmIsActive ? 'Active' : (routeStatus || 'Unknown')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AlarmRouteMiniMap;
