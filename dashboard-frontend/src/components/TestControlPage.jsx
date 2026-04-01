import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, AlertTriangle, ArrowLeftRight, RefreshCw, Wrench } from 'lucide-react';
import { alarmsAPI, routesAPI, testControlAPI } from '../services/api';

function TestControlPage() {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState([]);
  const [activeRouteAlarms, setActiveRouteAlarms] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState(null);
  const [faultType, setFaultType] = useState('break');
  const [feedback, setFeedback] = useState(null);

  const groupedRoutes = useMemo(() => {
    const groups = new Map();
    for (const route of routes) {
      const rtuId = route.rtuId || 'UNKNOWN_RTU';
      if (!groups.has(rtuId)) {
        groups.set(rtuId, []);
      }
      groups.get(rtuId).push(route);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [routes]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [routesResponse, alarmsResponse] = await Promise.all([
        routesAPI.getAll(),
        alarmsAPI.getActive()
      ]);

      const allRoutes = Array.isArray(routesResponse.data)
        ? routesResponse.data
        : routesResponse.data.value || [];

      const alarms = Array.isArray(alarmsResponse.data) ? alarmsResponse.data : [];
      const activeSet = new Set(
        alarms
          .map((alarm) => alarm.routeId)
          .filter((routeId) => typeof routeId === 'string' && routeId.length > 0)
      );

      setRoutes(allRoutes);
      setActiveRouteAlarms(activeSet);
    } catch (error) {
      console.error('Failed to load test control data:', error);
      setFeedback({
        type: 'error',
        text: 'Impossible de charger les routes ou les alarmes actives.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const triggerFault = async (route) => {
    const key = `${route.rtuId}:${route.routeId}:fault`;
    setBusyKey(key);
    setFeedback(null);
    try {
      await testControlAPI.injectFault(route.rtuId, route.routeId, faultType);
      await loadData();
      setFeedback({
        type: 'success',
        text: `Panne ${faultType === 'break' ? 'BREAK' : 'DEGRADATION'} declenchee pour ${route.routeId}.`
      });
    } catch (error) {
      console.error('Failed to inject fault:', error);
      setFeedback({
        type: 'error',
        text: `Echec du declenchement pour ${route.routeId}.`
      });
    } finally {
      setBusyKey(null);
    }
  };

  const resolveFault = async (route) => {
    const key = `${route.rtuId}:${route.routeId}:resolve`;
    setBusyKey(key);
    setFeedback(null);
    try {
      await testControlAPI.resolveFault(route.rtuId, route.routeId);
      await loadData();
      setFeedback({
        type: 'success',
        text: `Panne resolue pour ${route.routeId}.`
      });
    } catch (error) {
      console.error('Failed to resolve fault:', error);
      setFeedback({
        type: 'error',
        text: `Echec de resolution pour ${route.routeId}.`
      });
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-900 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Wrench className="w-6 h-6" />
              Interface Test Pannes
            </h2>
            <p className="mt-2 text-sm text-blue-100">
              Declenchement et resolution manuels des pannes par route.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 rounded-lg bg-white/15 hover:bg-white/25 transition-colors"
            >
              Retour Dashboard
            </button>
            <button
              onClick={loadData}
              className="px-4 py-2 rounded-lg bg-white text-slate-900 font-semibold hover:bg-slate-100 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Rafraichir
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-700">Type de panne a injecter</span>
            <select
              value={faultType}
              onChange={(e) => setFaultType(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="break">BREAK</option>
              <option value="degradation">DEGRADATION</option>
            </select>
          </div>
          <div className="text-sm text-slate-600">
            Routes chargees: <span className="font-bold text-slate-900">{routes.length}</span>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`card border ${feedback.type === 'success' ? 'border-emerald-300 bg-emerald-50' : 'border-red-300 bg-red-50'}`}
        >
          <p className={`text-sm font-medium ${feedback.type === 'success' ? 'text-emerald-700' : 'text-red-700'}`}>
            {feedback.text}
          </p>
        </div>
      )}

      {loading ? (
        <div className="card">
          <p className="text-sm text-slate-600 flex items-center gap-2">
            <Activity className="w-4 h-4 animate-spin" /> Chargement des routes...
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedRoutes.map(([rtuId, rtuRoutes]) => (
            <div key={rtuId} className="card">
              <h3 className="text-lg font-bold text-slate-800 mb-4">{rtuId}</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-slate-200">
                      <th className="pb-2 pr-4">Route</th>
                      <th className="pb-2 pr-4">Etat Route</th>
                      <th className="pb-2 pr-4">Alarme Active</th>
                      <th className="pb-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rtuRoutes.map((route) => {
                      const hasActiveAlarm = activeRouteAlarms.has(route.routeId);
                      const faultKey = `${route.rtuId}:${route.routeId}:fault`;
                      const resolveKey = `${route.rtuId}:${route.routeId}:resolve`;
                      return (
                        <tr key={route.routeId} className="border-b border-slate-100">
                          <td className="py-3 pr-4 font-semibold text-slate-800">{route.routeId}</td>
                          <td className="py-3 pr-4 text-slate-600">{route.status || 'UNKNOWN'}</td>
                          <td className="py-3 pr-4">
                            {hasActiveAlarm ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                                <AlertTriangle className="w-3 h-3" /> ACTIVE
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                                NONE
                              </span>
                            )}
                          </td>
                          <td className="py-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                onClick={() => triggerFault(route)}
                                disabled={busyKey !== null}
                                className="px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                              >
                                {busyKey === faultKey ? 'En cours...' : 'Declencher panne'}
                              </button>
                              <button
                                onClick={() => resolveFault(route)}
                                disabled={busyKey !== null}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1"
                              >
                                <ArrowLeftRight className="w-3.5 h-3.5" />
                                {busyKey === resolveKey ? 'En cours...' : 'Resoudre panne'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TestControlPage;
