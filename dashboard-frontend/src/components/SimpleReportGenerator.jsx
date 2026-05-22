import { useEffect, useState } from 'react';
import {
  Activity,
  AlertCircle,
  BarChart3,
  Clock3,
  FileText,
  Printer,
  RefreshCw,
  Router,
  ShieldCheck,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { format, parseISO, startOfDay, endOfDay, subDays } from 'date-fns';
import { reportsAPI } from '../services/api';

const createDefaultDateRange = () => {
  const today = new Date();
  return {
    startDate: format(subDays(today, 7), 'yyyy-MM-dd'),
    endDate: format(today, 'yyyy-MM-dd'),
  };
};

const parseDateValue = (value) => {
  if (!value) {
    return null;
  }

  const parsedDate = value instanceof Date ? value : parseISO(String(value));
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const formatDateTime = (value) => {
  const date = parseDateValue(value);
  return date ? format(date, 'dd MMM yyyy, HH:mm') : 'Open';
};

const toReportInstant = (dateValue, boundary) => {
  if (!dateValue) {
    return null;
  }

  const parsedDate = parseISO(dateValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  const normalizedDate = boundary === 'end' ? endOfDay(parsedDate) : startOfDay(parsedDate);
  return normalizedDate.toISOString();
};

const ChartTooltip = ({ active, payload, label, valueFormatter = (value) => value }) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-xl backdrop-blur-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="mt-1 text-sm font-medium text-slate-700">
          {entry.name || entry.dataKey}: <span className="font-bold text-slate-900">{valueFormatter(entry.value)}</span>
        </p>
      ))}
    </div>
  );
};

const MetricCard = ({ title, value, subtitle, icon: Icon, tone }) => {
  const toneStyles = {
    emerald: 'from-emerald-50 via-white to-emerald-100/40 text-emerald-600',
    rose: 'from-rose-50 via-white to-rose-100/40 text-rose-600',
    sky: 'from-sky-50 via-white to-sky-100/40 text-sky-600',
    amber: 'from-amber-50 via-white to-amber-100/40 text-amber-600',
    slate: 'from-slate-50 via-white to-slate-100/40 text-slate-600',
  };

  return (
    <div className={`rounded-3xl border border-slate-200 bg-gradient-to-br p-5 shadow-sm ${toneStyles[tone] || toneStyles.slate}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">{value}</p>
          {subtitle ? <p className="mt-2 text-sm text-slate-600">{subtitle}</p> : null}
        </div>
        <div className="rounded-2xl bg-white/80 p-2.5 shadow-sm">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};

const Panel = ({ title, subtitle, icon: Icon, children }) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="mb-4 flex items-start gap-3">
      <div className="rounded-2xl bg-sky-50 p-2.5 text-sky-700 shadow-sm">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h3 className="text-lg font-bold tracking-tight text-slate-900">{title}</h3>
        {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
      </div>
    </div>
    {children}
  </div>
);

const EmptyState = ({ message }) => (
  <div className="flex h-72 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-6 text-center text-sm text-slate-500">
    {message}
  </div>
);

function SimpleReportGenerator({ rtus = [] }) {
  const defaultRange = createDefaultDateRange();
  const [scope, setScope] = useState('NETWORK');
  const [selectedRtuId, setSelectedRtuId] = useState('');
  const [startDate, setStartDate] = useState(defaultRange.startDate);
  const [endDate, setEndDate] = useState(defaultRange.endDate);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (scope !== 'RTU') {
      return;
    }

    if (!selectedRtuId && rtus.length > 0) {
      setSelectedRtuId(rtus[0]?.rtuId || '');
    }
  }, [scope, rtus, selectedRtuId]);

  const handleGenerateReport = async () => {
    const normalizedStart = toReportInstant(startDate, 'start');
    const normalizedEnd = toReportInstant(endDate, 'end');

    if (!normalizedStart || !normalizedEnd) {
      setError('Please choose a valid date range.');
      return;
    }

    if (scope === 'RTU' && !selectedRtuId) {
      setError('Choose an RTU before generating the report.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await reportsAPI.generateHealthReport({
        scope,
        rtuId: scope === 'RTU' ? selectedRtuId : null,
        start: normalizedStart,
        end: normalizedEnd,
      });

      setReportData(response.data);
    } catch (requestError) {
      console.error('Error generating report:', requestError);
      setError('The report could not be generated. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReport = () => {
    if (reportData) {
      window.print();
    }
  };

  const summary = reportData?.summary;
  const availabilitySeries = reportData?.availabilitySeries || [];
  const testTrendSeries = reportData?.testTrendSeries || [];
  const alarmHistory = reportData?.alarmHistory || [];
  const scopeLabel = reportData?.scope?.label || (scope === 'RTU' ? `RTU ${selectedRtuId || '-'}` : 'Entire network');
  const periodLabel = reportData?.period?.label || `${startDate} to ${endDate}`;

  return (
    <section className="report-print-root mx-auto w-full max-w-6xl space-y-6 px-1 sm:px-2 lg:px-4">
      <div className="report-toolbar rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.55)] backdrop-blur-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-sky-700">
              <FileText className="h-3.5 w-3.5" />
              Simple report
            </div>
            <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Health and KPI report
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Generate a compact PDF-ready report for the full network or one RTU, with the main KPI values, a short alarm history,
              and the essential trend charts.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleGenerateReport}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
              Generate
            </button>
            <button
              type="button"
              onClick={handlePrintReport}
              disabled={!reportData}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Printer className="h-4 w-4" />
              Print / Save PDF
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
          <label className="block rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Scope</span>
            <select
              value={scope}
              onChange={(event) => setScope(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-sky-400"
            >
              <option value="NETWORK">Entire network</option>
              <option value="RTU">Single RTU</option>
            </select>
          </label>

          <label className="block rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Start date</span>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-sky-400"
            />
          </label>

          <label className="block rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">End date</span>
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-sky-400"
            />
          </label>

          <label className="block rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">RTU</span>
            <select
              value={selectedRtuId}
              onChange={(event) => setSelectedRtuId(event.target.value)}
              disabled={scope !== 'RTU'}
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-sky-400 disabled:cursor-not-allowed disabled:bg-slate-100"
            >
              {rtus.length === 0 ? (
                <option value="">No RTUs available</option>
              ) : (
                <>
                  <option value="">Select RTU</option>
                  {rtus.map((rtu) => (
                    <option key={rtu.rtuId} value={rtu.rtuId}>{rtu.rtuId}</option>
                  ))}
                </>
              )}
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
          <span className="rounded-full bg-slate-100 px-3 py-1 font-medium">Scope: {scopeLabel}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 font-medium">Period: {periodLabel}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 font-medium">Status: {loading ? 'Generating...' : reportData ? 'Ready' : 'Idle'}</span>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {error}
          </div>
        ) : null}
      </div>

      {reportData ? (
        <div className="space-y-6">
          <div className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 p-6 text-white shadow-2xl shadow-slate-400/40">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-4xl">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-200/80">{reportData.title}</p>
                <h3 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{scopeLabel}</h3>
                <p className="mt-2 text-sm text-slate-200">{periodLabel}</p>
                <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-100">
                  {reportData.executiveSummary}
                </p>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-200/70">Health score</p>
                <p className="mt-2 text-5xl font-black tracking-tight text-white">
                  {summary ? Math.round(summary.healthScore) : '--'}
                </p>
                <p className="mt-2 text-sm text-slate-200">
                  Weighted network summary
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Availability"
              value={summary ? `${summary.availabilityPercent.toFixed(1)}%` : '0.0%'}
              subtitle={summary?.availabilityLabel || 'Availability'}
              icon={ShieldCheck}
              tone="emerald"
            />
            <MetricCard
              title="MTTR"
              value={summary ? `${summary.mttrHours.toFixed(1)} h` : '0.0 h'}
              subtitle="Mean time to repair"
              icon={Clock3}
              tone="rose"
            />
            <MetricCard
              title="MTBF"
              value={summary ? `${summary.mtbfHours.toFixed(1)} h` : '0.0 h'}
              subtitle="Mean time between failures"
              icon={Router}
              tone="sky"
            />
            <MetricCard
              title="Pass rate"
              value={summary ? `${summary.passRatePercent.toFixed(1)}%` : '0.0%'}
              subtitle={`${summary?.passTests || 0} pass / ${summary?.failTests || 0} fail`}
              icon={Activity}
              tone="amber"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="Routes" value={summary?.totalRoutes ?? '—'} subtitle={`${summary?.normalRoutes || 0} normal`} icon={Router} tone="slate" />
            <MetricCard title="Active alarms" value={summary?.activeAlarms ?? '—'} subtitle={`${summary?.resolvedAlarms || 0} resolved`} icon={AlertCircle} tone="rose" />
            <MetricCard title="Tests" value={summary?.totalTests ?? '—'} subtitle="OTDR test records" icon={FileText} tone="sky" />
            <MetricCard title="Generated" value={reportData?.generatedAt ? formatDateTime(reportData.generatedAt) : '—'} subtitle="Report timestamp" icon={ShieldCheck} tone="emerald" />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Panel
              title="Availability trend"
              subtitle="Daily availability for the selected period"
              icon={BarChart3}
            >
              {availabilitySeries.length === 0 ? (
                <EmptyState message="No availability samples were found for this period." />
              ) : (
                <div className="h-72 rounded-2xl bg-white p-3 shadow-inner shadow-slate-100">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={availabilitySeries} margin={{ top: 8, right: 18, bottom: 8, left: 0 }}>
                      <CartesianGrid strokeDasharray="4 6" stroke="#d1dae5" vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} tickLine={false} axisLine={false} minTickGap={24} />
                      <YAxis domain={[0, 100]} tick={{ fill: '#475569', fontSize: 12 }} tickFormatter={(value) => `${value}%`} tickLine={false} axisLine={false} width={48} />
                      <Tooltip content={<ChartTooltip valueFormatter={(value) => `${Number(value).toFixed(1)}%`} />} />
                      <Line type="monotone" dataKey="value" name="Availability" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Panel>

            <Panel
              title="Test outcome"
              subtitle="Pass and fail counts by day"
              icon={Activity}
            >
              {testTrendSeries.length === 0 ? (
                <EmptyState message="No test results were found for this period." />
              ) : (
                <div className="h-72 rounded-2xl bg-white p-3 shadow-inner shadow-slate-100">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={testTrendSeries} margin={{ top: 8, right: 18, bottom: 8, left: 0 }} barCategoryGap="26%">
                      <CartesianGrid strokeDasharray="4 6" stroke="#d1dae5" vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} tickLine={false} axisLine={false} minTickGap={24} />
                      <YAxis tick={{ fill: '#475569', fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} width={42} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="passCount" name="Pass" stackId="tests" fill="#16a34a" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="failCount" name="Fail" stackId="tests" fill="#dc2626" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Panel>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-start gap-3">
              <div className="rounded-2xl bg-sky-50 p-2.5 text-sky-700 shadow-sm">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold tracking-tight text-slate-900">Alarm history</h3>
                <p className="text-sm text-slate-500">Start and end times for each alarm in the selected period.</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="max-h-[380px] overflow-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Alarm</th>
                      <th className="px-4 py-3 font-semibold">Route</th>
                      <th className="px-4 py-3 font-semibold">Start</th>
                      <th className="px-4 py-3 font-semibold">End</th>
                      <th className="px-4 py-3 font-semibold">Duration</th>
                      <th className="px-4 py-3 font-semibold">Severity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {alarmHistory.length === 0 ? (
                      <tr>
                        <td className="px-4 py-5 text-sm text-slate-500" colSpan={6}>
                          No alarm history found for the selected scope and period.
                        </td>
                      </tr>
                    ) : (
                      alarmHistory.map((alarm) => (
                        <tr key={alarm.alarmId} className="align-top">
                          <td className="px-4 py-4">
                            <div className="font-semibold text-slate-900">{alarm.alarmId}</div>
                            <div className="mt-1 text-xs text-slate-500">{alarm.alarmType}</div>
                          </td>
                          <td className="px-4 py-4 text-slate-700">
                            <div className="font-medium">{alarm.routeId}</div>
                            <div className="mt-1 text-xs text-slate-500">{alarm.routeName}</div>
                          </td>
                          <td className="px-4 py-4 text-slate-700">{formatDateTime(alarm.startedAt)}</td>
                          <td className="px-4 py-4 text-slate-700">{alarm.endedAt ? formatDateTime(alarm.endedAt) : 'Open'}</td>
                          <td className="px-4 py-4 text-slate-700">
                            {alarm.durationHours === null || alarm.durationHours === undefined ? 'Open' : `${Number(alarm.durationHours).toFixed(1)} h`}
                          </td>
                          <td className="px-4 py-4">
                            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                              {alarm.severity}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/70 px-6 py-14 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 shadow-sm">
            <BarChart3 className="h-8 w-8" />
          </div>
          <h3 className="mt-5 text-2xl font-black tracking-tight text-slate-900">No report generated yet</h3>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Select the scope and period, then generate a simple report to see the key KPI values and alarm history.
          </p>
        </div>
      )}
    </section>
  );
}

export default SimpleReportGenerator;
