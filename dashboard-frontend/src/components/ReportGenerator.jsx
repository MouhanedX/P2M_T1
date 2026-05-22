import { useEffect, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  Clock3,
  FileText,
  Printer,
  RefreshCw,
  Router,
  ShieldCheck,
  Sparkles,
  Activity,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from 'recharts';
import { format, parseISO, startOfDay, endOfDay, subDays } from 'date-fns';
import { reportsAPI } from '../services/api';

const ROUTE_STATUS_COLORS = ['#16a34a', '#eab308', '#dc2626', '#64748b'];
const SEVERITY_COLORS = ['#dc2626', '#f97316', '#eab308', '#2563eb'];
const ALARM_ACTIVITY_COLORS = ['#0ea5e9', '#6366f1'];
const TEST_COLORS = ['#16a34a', '#dc2626'];

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

  const date = value instanceof Date ? value : parseISO(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateTime = (value) => {
  const date = parseDateValue(value);
  return date ? format(date, 'dd MMM yyyy, HH:mm') : 'Open';
};

const formatDateLabel = (value) => {
  const date = parseDateValue(value);
  return date ? format(date, 'dd MMM yyyy') : '-';
};

const formatDuration = (value) => {
  if (value === null || value === undefined) {
    return 'Open';
  }

  return `${Number(value).toFixed(1)} h`;
};

const toReportInstant = (dateValue, boundary) => {
  if (!dateValue) {
    return null;
  }

  const parsed = parseISO(dateValue);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const normalized = boundary === 'end' ? endOfDay(parsed) : startOfDay(parsed);
  return normalized.toISOString();
};

const ScoreRing = ({ value = 0 }) => {
  const score = Math.max(0, Math.min(100, Number(value) || 0));
  const circumference = 2 * Math.PI * 44;
  const offset = circumference - ((score / 100) * circumference);
  const colorClass = score >= 85
    ? 'text-emerald-600'
    : score >= 65
      ? 'text-amber-600'
      : 'text-rose-600';

  return (
    <div className="flex items-center justify-center">
      <div className="relative h-36 w-36">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle cx="60" cy="60" r="44" stroke="#e2e8f0" strokeWidth="12" fill="none" />
          <circle
            cx="60"
            cy="60"
            r="44"
            stroke="url(#healthScoreGradient)"
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="none"
          />
          <defs>
            <linearGradient id="healthScoreGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#16a34a" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className={`text-4xl font-black tracking-tight ${colorClass}`}>{Math.round(score)}</span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">Health</span>
        </div>
      </div>
    </div>
  );
};

const ChartCard = ({ title, subtitle, icon: Icon, children, className = '' }) => (
  <div className={`rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-lg shadow-slate-200/60 ${className}`}>
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

const PieTooltip = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const entry = payload[0];

  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-xl backdrop-blur-sm">
      <p className="text-sm font-semibold text-slate-800">{entry.name}</p>
      <p className="text-xs font-medium text-slate-600">{Number(entry.value || 0)} items</p>
    </div>
  );
};

function ReportGenerator({ rtus = [] }) {
  const defaultRange = createDefaultDateRange();
  const [scope, setScope] = useState('NETWORK');
  const [selectedRtuId, setSelectedRtuId] = useState('');
  const [startDate, setStartDate] = useState(defaultRange.startDate);
  const [endDate, setEndDate] = useState(defaultRange.endDate);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (selectedRtuId || rtus.length === 0) {
      return;
    }

    setSelectedRtuId(rtus[0]?.rtuId || '');
  }, [rtus, selectedRtuId]);

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
    if (!reportData) {
      return;
    }

    window.print();
  };

  const formatScopeLabel = () => {
    if (scope === 'RTU') {
      return selectedRtuId ? `RTU ${selectedRtuId}` : 'RTU';
    }

    return 'Entire network';
  };

  const routeStatusPieData = reportData?.routeStatusSeries || [];
  const severityPieData = reportData?.alarmSeveritySeries || [];
  const availabilityTrendData = reportData?.availabilitySeries || [];
  const alarmTrendData = reportData?.alarmTrendSeries || [];
  const testTrendData = reportData?.testTrendSeries || [];
  const alarmHistory = reportData?.alarmHistory || [];
  const summary = reportData?.summary;

  return (
    <section className="report-print-root mx-auto w-full max-w-[1480px] space-y-6 px-1 sm:px-2 lg:px-4">
      <div className="report-toolbar rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.55)] backdrop-blur-sm">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-sky-700">
              <Sparkles className="h-3.5 w-3.5" />
              Report Studio
            </div>
            <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Health and KPI PDF report
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Build a print-ready report for the full network or a single RTU, with a selectable time window, alarm history,
              test pass and fail ratios, and a set of visual charts ready for browser PDF export.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:w-[760px]">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Scope</p>
              <p className="mt-1 text-base font-bold text-slate-900">{formatScopeLabel()}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Period</p>
              <p className="mt-1 text-base font-bold text-slate-900">{startDate} to {endDate}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Format</p>
              <p className="mt-1 text-base font-bold text-slate-900">PDF / Print</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Status</p>
              <p className="mt-1 text-base font-bold text-slate-900">{loading ? 'Generating...' : reportData ? 'Ready' : 'Idle'}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-slate-200/70 bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 p-5 text-white shadow-2xl shadow-slate-400/35">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-200/80">Executive view</p>
                <h3 className="mt-2 text-2xl font-black tracking-tight">PDF-ready operational snapshot</h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-200">
                  The report blends availability, reliability, alarms, and OTDR test outcomes into a narrative that is suitable
                  for management review or field escalation.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-white/10 p-3 text-sky-200">
                    <GaugeIcon />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-200/70">Health score</p>
                    <p className="text-3xl font-black tracking-tight text-white">{summary ? Math.round(summary.healthScore) : '--'}</p>
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-slate-100">
              {reportData?.executiveSummary || 'Generate the report to see a concise executive summary of the selected period.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-2">
            <SummaryMetric title="Availability" value={summary ? `${summary.availabilityPercent.toFixed(1)}%` : '—'} icon={ShieldCheck} tone="emerald" subtitle={summary?.availabilityLabel} />
            <SummaryMetric title="MTTR" value={summary ? `${summary.mttrHours.toFixed(1)} h` : '—'} icon={Clock3} tone="rose" subtitle="Mean time to repair" />
            <SummaryMetric title="MTBF" value={summary ? `${summary.mtbfHours.toFixed(1)} h` : '—'} icon={Router} tone="sky" subtitle="Mean time between failures" />
            <SummaryMetric title="Tests pass" value={summary ? `${summary.passRatePercent.toFixed(1)}%` : '—'} icon={Activity} tone="amber" subtitle="OTDR success rate" />
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <CompactStat label="Routes" value={summary ? summary.totalRoutes : '—'} />
              <CompactStat label="Active alarms" value={summary ? summary.activeAlarms : '—'} />
              <CompactStat label="Resolved alarms" value={summary ? summary.resolvedAlarms : '—'} />
              <CompactStat label="Tests" value={summary ? summary.totalTests : '—'} />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Alarm severity mix</p>
            <div className="mt-4 space-y-3">
              {(severityPieData.length > 0 ? severityPieData : [
                { label: 'Critical', value: 0 },
                { label: 'High', value: 0 },
                { label: 'Medium', value: 0 },
                { label: 'Low', value: 0 },
              ]).map((item, index) => {
                const total = severityPieData.reduce((sum, entry) => sum + Number(entry.value || 0), 0);
                const percent = total > 0 ? (Number(item.value || 0) / total) * 100 : 0;
                return (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-sm font-medium text-slate-700">
                      <span>{item.label}</span>
                      <span>{item.value}</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full"
                        style={{ width: `${Math.max(percent, item.value > 0 ? 6 : 0)}%`, backgroundColor: SEVERITY_COLORS[index % SEVERITY_COLORS.length] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-sky-50 to-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-sky-100 p-2.5 text-sky-700">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Generated at</p>
                <p className="text-sm font-bold text-slate-900">{reportData ? formatDateTime(reportData.generatedAt) : 'Pending'}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleGenerateReport}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
                Generate report
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
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <label className="block rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Scope</span>
            <select
              value={scope}
              onChange={(event) => setScope(event.target.value)}
              className="mt-3 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-sky-400 focus:bg-white"
            >
              <option value="NETWORK">Entire network</option>
              <option value="RTU">Single RTU</option>
            </select>
          </label>

          <label className="block rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Start date</span>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="mt-3 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-sky-400 focus:bg-white"
            />
          </label>

          <label className="block rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">End date</span>
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="mt-3 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-sky-400 focus:bg-white"
            />
          </label>
        </div>

        {scope === 'RTU' && (
          <label className="block rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">RTU</span>
            <select
              value={selectedRtuId}
              onChange={(event) => setSelectedRtuId(event.target.value)}
              className="mt-3 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-sky-400 focus:bg-white"
            >
              {rtus.length === 0 ? (
                <option value="">No RTUs available</option>
              ) : (
                rtus.map((rtu) => (
                  <option key={rtu.rtuId} value={rtu.rtuId}>{rtu.rtuId}</option>
                ))
              )}
            </select>
          </label>
        )}

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {error}
          </div>
        ) : null}
      </div>

      {reportData ? (
        <div className="space-y-6 rounded-[2rem] border border-slate-200/80 bg-slate-50/80 p-4 shadow-inner shadow-slate-200/50 sm:p-6">
          <div className="rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 p-6 text-white shadow-2xl shadow-slate-400/40">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-4xl">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-200/80">{reportData.title}</p>
                <h3 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{reportData.scope.label}</h3>
                <p className="mt-2 text-sm text-slate-200">{reportData.period.label}</p>
              </div>
              <div className="flex items-center gap-4 rounded-[2rem] border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-sm">
                <ScoreRing value={summary?.healthScore || 0} />
                <div className="max-w-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-200/70">Executive note</p>
                  <p className="mt-2 text-sm leading-6 text-slate-100">
                    {reportData.executiveSummary}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="Availability" value={summary?.availabilityPercent?.toFixed(1) || '0.0'} suffix="%" note={summary?.availabilityLabel || 'Availability'} icon={ShieldCheck} tone="emerald" />
            <MetricCard title="MTTR" value={summary?.mttrHours?.toFixed(1) || '0.0'} suffix="h" note="Repair average" icon={Clock3} tone="rose" />
            <MetricCard title="MTBF" value={summary?.mtbfHours?.toFixed(1) || '0.0'} suffix="h" note="Failure interval" icon={Router} tone="sky" />
            <MetricCard title="Test pass" value={summary?.passRatePercent?.toFixed(1) || '0.0'} suffix="%" note={`${summary?.passTests || 0} passes / ${summary?.failTests || 0} fails`} icon={Activity} tone="amber" />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <MetricCard title="Routes" value={summary?.totalRoutes ?? '—'} note={`${summary?.normalRoutes || 0} normal • ${summary?.degradedRoutes || 0} degraded • ${summary?.brokenRoutes || 0} broken`} icon={Router} tone="slate" />
            <MetricCard title="Alarms" value={summary?.totalAlarms ?? '—'} note={`${summary?.activeAlarms || 0} active • ${summary?.resolvedAlarms || 0} resolved`} icon={AlertCircle} tone="violet" />
            <MetricCard title="Health score" value={summary ? Math.round(summary.healthScore) : '—'} suffix="/100" note="Weighted composite" icon={Sparkles} tone="teal" />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <ChartCard
              title="Availability trend"
              subtitle={`Daily availability for ${reportData.scope.label.toLowerCase()}`}
              icon={BarChart3}
            >
              {availabilityTrendData.length === 0 ? (
                <EmptyChart message="No availability samples found for the chosen period." />
              ) : (
                <div className="h-80 rounded-2xl bg-white p-3 shadow-inner shadow-slate-100">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={availabilityTrendData} margin={{ top: 8, right: 18, bottom: 8, left: 0 }}>
                      <defs>
                        <linearGradient id="availabilityLineGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#0ea5e9" />
                          <stop offset="100%" stopColor="#16a34a" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 6" stroke="#d1dae5" vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} tickLine={false} axisLine={false} minTickGap={22} />
                      <YAxis domain={[0, 100]} tick={{ fill: '#475569', fontSize: 12 }} tickFormatter={(value) => `${value}%`} tickLine={false} axisLine={false} width={50} />
                      <Tooltip content={<ChartTooltip valueFormatter={(value) => `${Number(value).toFixed(1)}%`} />} />
                      <Line type="monotone" dataKey="value" name="Availability" stroke="url(#availabilityLineGradient)" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>

            <ChartCard
              title="Route status mix"
              subtitle="Current operational state of the selected scope"
              icon={Router}
            >
              {routeStatusPieData.length === 0 ? (
                <EmptyChart message="No route inventory found for this report." />
              ) : (
                <div className="h-80 rounded-2xl bg-white p-3 shadow-inner shadow-slate-100">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={routeStatusPieData}
                        dataKey="value"
                        nameKey="label"
                        innerRadius={52}
                        outerRadius={102}
                        paddingAngle={3}
                        cornerRadius={8}
                        stroke="#fff"
                        strokeWidth={2}
                        label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                      >
                        {routeStatusPieData.map((entry, index) => (
                          <Cell key={entry.label} fill={ROUTE_STATUS_COLORS[index % ROUTE_STATUS_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                      <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: '13px', fontWeight: 600, paddingTop: '8px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>

            <ChartCard
              title="Alarm activity"
              subtitle="Opened vs resolved alarms during the selected period"
              icon={AlertCircle}
            >
              {alarmTrendData.length === 0 ? (
                <EmptyChart message="No alarm activity was recorded in the selected period." />
              ) : (
                <div className="h-80 rounded-2xl bg-white p-3 shadow-inner shadow-slate-100">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={alarmTrendData} margin={{ top: 8, right: 18, bottom: 8, left: 0 }} barCategoryGap="24%">
                      <CartesianGrid strokeDasharray="4 6" stroke="#d1dae5" vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} tickLine={false} axisLine={false} minTickGap={20} />
                      <YAxis tick={{ fill: '#475569', fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} width={42} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend verticalAlign="top" wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingBottom: '8px' }} />
                      <Bar dataKey="opened" name="Opened" fill={ALARM_ACTIVITY_COLORS[0]} radius={[10, 10, 0, 0]} />
                      <Bar dataKey="resolved" name="Resolved" fill={ALARM_ACTIVITY_COLORS[1]} radius={[10, 10, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>

            <ChartCard
              title="Test outcome pattern"
              subtitle="Pass and fail mix for OTDR tests in the selected period"
              icon={Activity}
            >
              {testTrendData.length === 0 ? (
                <EmptyChart message="No OTDR tests were found for the chosen period." />
              ) : (
                <div className="h-80 rounded-2xl bg-white p-3 shadow-inner shadow-slate-100">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={testTrendData} margin={{ top: 8, right: 18, bottom: 8, left: 0 }}>
                      <defs>
                        <linearGradient id="testPassGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#16a34a" stopOpacity={0.38} />
                          <stop offset="100%" stopColor="#16a34a" stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="testFailGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#dc2626" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#dc2626" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 6" stroke="#d1dae5" vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} tickLine={false} axisLine={false} minTickGap={20} />
                      <YAxis tick={{ fill: '#475569', fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} width={42} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend verticalAlign="top" wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingBottom: '8px' }} />
                      <Area type="monotone" dataKey="passCount" name="Pass" stroke={TEST_COLORS[0]} fill="url(#testPassGradient)" strokeWidth={2.5} />
                      <Area type="monotone" dataKey="failCount" name="Fail" stroke={TEST_COLORS[1]} fill="url(#testFailGradient)" strokeWidth={2.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>
          </div>

          <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-sky-50 p-2.5 text-sky-700 shadow-sm">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-slate-900">Alarm severity spread</h3>
                  <p className="text-sm text-slate-500">A quick view of how serious the selected period was.</p>
                </div>
              </div>

              <div className="mt-4 space-y-4">
                {severityPieData.map((item, index) => {
                  const total = severityPieData.reduce((sum, entry) => sum + Number(entry.value || 0), 0);
                  const percent = total > 0 ? (Number(item.value || 0) / total) * 100 : 0;
                  return (
                    <div key={item.label}>
                      <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                        <span>{item.label}</span>
                        <span>{item.value}</span>
                      </div>
                      <div className="mt-2 h-2.5 rounded-full bg-slate-100">
                        <div
                          className="h-2.5 rounded-full"
                          style={{ width: `${Math.max(percent, item.value > 0 ? 6 : 0)}%`, backgroundColor: SEVERITY_COLORS[index % SEVERITY_COLORS.length] }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-sky-50 p-2.5 text-sky-700 shadow-sm">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-slate-900">Alarm history</h3>
                  <p className="text-sm text-slate-500">Start and end timestamps for each alarm in the selected period.</p>
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                <div className="max-h-[420px] overflow-auto">
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
                      ) : alarmHistory.map((alarm) => (
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
                          <td className="px-4 py-4 text-slate-700">{formatDuration(alarm.durationHours)}</td>
                          <td className="px-4 py-4">
                            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                              {alarm.severity}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/70 px-6 py-14 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 shadow-sm">
            <FileText className="h-8 w-8" />
          </div>
          <h3 className="mt-5 text-2xl font-black tracking-tight text-slate-900">No report generated yet</h3>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Choose a scope, pick your dates, and generate a report to see the PDF-ready preview with charts, alarms,
            and test performance metrics.
          </p>
        </div>
      )}
    </section>
  );
}

const GaugeIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 21a9 9 0 1 0-9-9" />
    <path d="M12 12l4-4" />
    <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const SummaryMetric = ({ title, value, subtitle, icon: Icon, tone }) => {
  const toneClasses = {
    emerald: 'from-emerald-50 to-white text-emerald-600',
    rose: 'from-rose-50 to-white text-rose-600',
    sky: 'from-sky-50 to-white text-sky-600',
    amber: 'from-amber-50 to-white text-amber-600',
  };

  return (
    <div className={`rounded-3xl border border-slate-200 bg-gradient-to-br p-5 shadow-sm ${toneClasses[tone] || 'from-slate-50 to-white text-slate-600'}`}>
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

const CompactStat = ({ label, value }) => (
  <div className="rounded-2xl bg-slate-50 px-4 py-3">
    <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">{label}</p>
    <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">{value}</p>
  </div>
);

const MetricCard = ({ title, value, suffix, note, icon: Icon, tone }) => {
  const palette = {
    emerald: 'from-emerald-50 via-white to-emerald-100/40 text-emerald-600',
    rose: 'from-rose-50 via-white to-rose-100/40 text-rose-600',
    sky: 'from-sky-50 via-white to-sky-100/40 text-sky-600',
    amber: 'from-amber-50 via-white to-amber-100/40 text-amber-600',
    slate: 'from-slate-50 via-white to-slate-100/40 text-slate-600',
    violet: 'from-violet-50 via-white to-violet-100/40 text-violet-600',
    teal: 'from-teal-50 via-white to-teal-100/40 text-teal-600',
  };

  return (
    <div className={`rounded-3xl border border-slate-200 bg-gradient-to-br p-5 shadow-sm ${palette[tone] || palette.slate}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">{title}</p>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-4xl font-black tracking-tight text-slate-900">{value}</span>
            {suffix ? <span className="pb-1 text-base font-semibold text-slate-500">{suffix}</span> : null}
          </div>
          {note ? <p className="mt-3 text-sm text-slate-600">{note}</p> : null}
        </div>
        <div className="rounded-2xl bg-white/85 p-2.5 shadow-sm">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};

const EmptyChart = ({ message }) => (
  <div className="flex h-80 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-6 text-center text-sm text-slate-500">
    {message}
  </div>
);

export default ReportGenerator;
