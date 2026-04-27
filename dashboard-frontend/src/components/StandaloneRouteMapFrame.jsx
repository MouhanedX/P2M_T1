import { useMemo } from 'react';

const toFiniteNumber = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
};

function StandaloneRouteMapFrame({
  routeId,
  routeName,
  rtuId,
  faultDistanceKm,
  mapMode = 'route',
  className = 'h-[320px]'
}) {
  const mapUrl = useMemo(() => {
    const params = new URLSearchParams();

    if (routeId) {
      params.set('routeId', String(routeId));
    }

    if (routeName) {
      params.set('routeName', String(routeName));
    }

    if (rtuId) {
      params.set('rtuId', String(rtuId));
    }

    const faultDistance = toFiniteNumber(faultDistanceKm);
    if (faultDistance !== null) {
      params.set('faultDistanceKm', String(faultDistance));
    }

    if (mapMode) {
      params.set('mapMode', String(mapMode));
    }

    params.set('focus', '1');
    params.set('embed', '1');

    return `http://localhost:8090/?${params.toString()}`;
  }, [routeId, routeName, rtuId, faultDistanceKm, mapMode]);

  return (
    <div className={`overflow-hidden rounded-xl border border-slate-200 bg-slate-100 ${className}`}>
      <iframe
        key={mapUrl}
        src={mapUrl}
        className="h-full w-full"
        title="Standalone RTU topology map"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

export default StandaloneRouteMapFrame;
