import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { alarmsAPI } from '../services/api';
import { useState } from 'react';
import clsx from 'clsx';

function AlarmList({ alarms, onRefresh }) {
  const [processing, setProcessing] = useState(null);

  const getSeverityBadge = (severity) => {
    const badges = {
      CRITICAL: 'badge-critical',
      HIGH: 'badge-danger',
      MEDIUM: 'badge-warning',
      LOW: 'badge bg-blue-100 text-blue-800'
    };
    return badges[severity] || 'badge';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'RESOLVED':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'ACKNOWLEDGED':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const handleAcknowledge = async (alarmId) => {
    setProcessing(alarmId);
    try {
      await alarmsAPI.acknowledge(alarmId, {
        acknowledgedBy: 'operator',
        notes: 'Acknowledged from dashboard'
      });
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error acknowledging alarm:', error);
    } finally {
      setProcessing(null);
    }
  };

  const handleResolve = async (alarmId) => {
    setProcessing(alarmId);
    try {
      await alarmsAPI.resolve(alarmId, {
        resolvedBy: 'operator',
        resolutionNotes: 'Resolved from dashboard'
      });
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error resolving alarm:', error);
    } finally {
      setProcessing(null);
    }
  };

  if (alarms.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-lg font-medium">No active alarms</p>
        <p className="text-sm">All systems operating normally</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Severity
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Route
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Description
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Time
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {alarms.map((alarm) => (
            <tr key={alarm.alarmId || alarm.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                {getStatusIcon(alarm.status)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={clsx('badge', getSeverityBadge(alarm.severity))}>
                  {alarm.severity}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {alarm.routeId}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {alarm.alarmType}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate">
                {alarm.description}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {alarm.lifecycle?.createdAt && 
                  formatDistanceToNow(new Date(alarm.lifecycle.createdAt), { addSuffix: true })}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                {alarm.status === 'ACTIVE' && !alarm.lifecycle?.acknowledged && (
                  <button
                    onClick={() => handleAcknowledge(alarm.alarmId)}
                    disabled={processing === alarm.alarmId}
                    className="text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                  >
                    {processing === alarm.alarmId ? 'Processing...' : 'Acknowledge'}
                  </button>
                )}
                {(alarm.status === 'ACTIVE' || alarm.status === 'ACKNOWLEDGED') && (
                  <button
                    onClick={() => handleResolve(alarm.alarmId)}
                    disabled={processing === alarm.alarmId}
                    className="text-green-600 hover:text-green-800 font-medium disabled:opacity-50"
                  >
                    {processing === alarm.alarmId ? 'Processing...' : 'Resolve'}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AlarmList;
