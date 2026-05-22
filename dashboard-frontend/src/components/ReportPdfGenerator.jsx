import { useEffect, useRef, useState } from 'react';
import {
  BarChart3,
  Download,
  FileText,
  RefreshCw,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { endOfDay, format, parseISO, startOfDay, subDays } from 'date-fns';
import { reportsAPI } from '../services/api';

const SEVERITY_COLORS = {
  Critical: '#dc2626',
  High: '#f97316',
  Medium: '#f59e0b',
  Low: '#94a3b8',
};

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

  const parsedDate = value instanceof Date ? value : parseISO(String(value));
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const formatDateTime = (value) => {
  const date = parseDateValue(value);
  return date ? format(date, 'dd MMM yyyy, HH:mm') : 'Open';
};

const formatDateRangeLabel = (startDate, endDate) => {
  if (!startDate || !endDate) {
    return 'Selected period';
  }

  const start = parseISO(startDate);
  const end = parseISO(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 'Selected period';
  }

  return `${format(start, 'd MMM yyyy')} to ${format(end, 'd MMM yyyy')}`;
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

const buildPdfFilename = (scopeLabel, startDate, endDate) => {
  const normalizedScope = String(scopeLabel || 'report')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `nqms-health-report-${normalizedScope || 'report'}-${startDate || 'start'}-to-${endDate || 'end'}.pdf`;
};

const formatMetricValue = (value, digits = 1, suffix = '') => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '—';
  }

  return `${value.toFixed(digits)}${suffix}`;
};

const ChartTooltip = ({ active, payload, label, valueFormatter = (value) => value }) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-xl backdrop-blur-sm">
      <p className="text-xs font-semibold tracking-wide text-slate-500">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="mt-1 text-sm font-medium text-slate-700">
          {entry.name || entry.dataKey}: <span className="font-bold text-slate-900">{valueFormatter(entry.value)}</span>
        </p>
      ))}
    </div>
  );
};

const TopStatCard = ({ label, value, helper }) => (
  <div className="rounded-2xl border border-white/10 bg-white/10 px-3.5 py-3 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.65)] backdrop-blur-sm">
    <p className="text-[10px] font-semibold tracking-[0.2em] text-cyan-100/70">{label}</p>
    <p className="mt-1.5 text-[0.95rem] font-semibold leading-5 text-white">{value}</p>
    {helper ? <p className="mt-1 text-[10px] leading-4 text-slate-200/75">{helper}</p> : null}
  </div>
);

const MetricCard = ({ title, value, subtitle, tone = 'slate' }) => {
  const toneStyles = {
    emerald: 'border-emerald-100 bg-emerald-50/70 text-emerald-700',
    rose: 'border-rose-100 bg-rose-50/70 text-rose-700',
    sky: 'border-sky-100 bg-sky-50/70 text-sky-700',
    amber: 'border-amber-100 bg-amber-50/70 text-amber-700',
    slate: 'border-slate-200 bg-slate-50/80 text-slate-700',
  };

  return (
    <div className={`rounded-2xl border px-3.5 py-3.5 shadow-sm ${toneStyles[tone] || toneStyles.slate}`}>
      <p className="text-[10px] font-semibold tracking-[0.2em] text-slate-500">{title}</p>
      <p className="mt-1.5 text-[1.45rem] font-black tracking-tight text-slate-900 sm:text-[1.55rem]">{value}</p>
      {subtitle ? <p className="mt-1 text-[13px] leading-5 text-slate-600">{subtitle}</p> : null}
    </div>
  );
};

const SnapshotCard = ({ title, value, subtitle, tone = 'slate' }) => {
  const toneStyles = {
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    rose: 'border-rose-100 bg-rose-50 text-rose-700',
    amber: 'border-amber-100 bg-amber-50 text-amber-700',
    sky: 'border-sky-100 bg-sky-50 text-sky-700',
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
  };

  return (
    <div className={`rounded-2xl border px-3 py-2.5 shadow-sm ${toneStyles[tone] || toneStyles.slate}`}>
      <p className="text-[10px] font-semibold tracking-[0.2em] text-slate-500">{title}</p>
      <p className="mt-1.5 text-[1.05rem] font-black tracking-tight text-slate-900">{value}</p>
      {subtitle ? <p className="mt-1 text-[11px] leading-4 text-slate-500">{subtitle}</p> : null}
    </div>
  );
};

const SectionCard = ({ title, subtitle, action, children, className = '' }) => (
  <div className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
    <div className="mb-3 flex items-start justify-between gap-3">
      <div>
        <h3 className="text-[0.98rem] font-semibold tracking-tight text-slate-900">{title}</h3>
        {subtitle ? <p className="mt-1 text-[13px] text-slate-500">{subtitle}</p> : null}
      </div>
      {action}
    </div>
    {children}
  </div>
);

const EmptyState = ({ message }) => (
  <div className="flex h-72 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-6 text-center text-sm text-slate-500">
    {message}
  </div>
);

function ReportPdfGenerator({ rtus = [] }) {
  const reportRef = useRef(null);
  const defaultRange = createDefaultDateRange();
  const [scope, setScope] = useState('NETWORK');
  const [selectedRtuId, setSelectedRtuId] = useState('');
  const [startDate, setStartDate] = useState(defaultRange.startDate);
  const [endDate, setEndDate] = useState(defaultRange.endDate);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
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

  const handleDownloadReport = async () => {
    if (!reportData || !reportRef.current) {
      return;
    }

    try {
      setDownloading(true);
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default ?? html2pdfModule;

      const scopeLabelForFile = reportData.scope?.label || (scope === 'RTU' ? `RTU ${selectedRtuId || '-'}` : 'Entire network');
      const filename = buildPdfFilename(scopeLabelForFile, startDate, endDate);

      await html2pdf()
        .set({
          margin: [8, 8, 10, 8],
          filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            scrollX: 0,
            scrollY: 0,
            backgroundColor: '#ffffff',
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['css', 'legacy'], avoid: ['tr', '.avoid-page-break'] },
        })
        .from(reportRef.current)
        .save();
    } catch (downloadError) {
      console.error('Error downloading report:', downloadError);
      setError('The PDF could not be downloaded. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const summary = reportData?.summary;
  const availabilitySeries = reportData?.availabilitySeries || [];
  const alarmSeveritySeries = reportData?.alarmSeveritySeries || [];
  const alarmHistory = reportData?.alarmHistory || [];
  const totalRoutes = summary?.totalRoutes ?? 0;
  const totalAlarms = summary?.totalAlarms ?? 0;
  const totalTests = summary?.totalTests ?? 0;
  const rtuSnapshot = reportData?.rtuSnapshot || null;
  const scopeLabel = reportData?.scope?.label || (scope === 'RTU' ? `RTU ${selectedRtuId || '-'}` : 'Entire network');
  const periodLabel = reportData?.period?.label || formatDateRangeLabel(startDate, endDate);
  const reportTitle = reportData?.title || `${scopeLabel} Health Report`;
  const reportSubtitle = reportData?.executiveSummary || 'Availability, MTTR, MTBF, alarm history, and test quality overview.';
  const generatedAtLabel = reportData?.generatedAt ? formatDateTime(reportData.generatedAt) : '—';
  const reportScopeLabel = scope === 'RTU' ? 'RTU health snapshot' : 'Network health snapshot';
  const snapshotTimestamp = rtuSnapshot?.capturedAt ? formatDateTime(rtuSnapshot.capturedAt) : generatedAtLabel;
  const testPassCount = summary?.passTests ?? 0;
  const testFailCount = summary?.failTests ?? 0;
  const testPassRate = summary?.passRatePercent ?? 0;
  const testFailRate = summary?.failRatePercent ?? 0;
  const availabilityPercent = summary?.availabilityPercent ?? 0;
  const powerStatusRaw = rtuSnapshot?.powerSupplyStatus ?? '';
  const powerStatusLabel = powerStatusRaw
    ? powerStatusRaw.charAt(0).toUpperCase() + powerStatusRaw.slice(1).toLowerCase()
    : '—';
  const powerTone = powerStatusRaw.toUpperCase() === 'NORMAL' ? 'emerald' : powerStatusRaw ? 'rose' : 'slate';
  const orderedAlarmHistory = [...alarmHistory].sort((first, second) => {
    const firstTime = parseDateValue(first?.startedAt)?.getTime() ?? Number.POSITIVE_INFINITY;
    const secondTime = parseDateValue(second?.startedAt)?.getTime() ?? Number.POSITIVE_INFINITY;
    return firstTime - secondTime;
  });
  const alarmCount = orderedAlarmHistory.length;
  const testPieData = [
    { name: 'Pass', value: testPassCount },
    { name: 'Fail', value: testFailCount },
  ];

  const topStats = [
    {
      label: 'Scope',
      value: scopeLabel,
      helper: 'Network or single RTU scope',
    },
    {
      label: 'Period',
      value: periodLabel,
      helper: 'Selected report window',
    },
    {
      label: 'Routes + Alarms',
      value: `${totalRoutes} routes • ${totalAlarms} alarms`,
      helper: 'Inventory and alarm count',
    },
  ];

  const networkSnapshotCards = [
    {
      title: 'Health score',
      value: summary ? `${Math.round(summary.healthScore)}%` : '—',
      subtitle: 'Composite report score',
      tone: 'sky',
    },
    {
      title: 'Normal routes',
      value: summary?.normalRoutes ?? 0,
      subtitle: `${totalRoutes} total routes`,
      tone: 'emerald',
    },
    {
      title: 'Degraded routes',
      value: summary?.degradedRoutes ?? 0,
      subtitle: 'Routes needing attention',
      tone: 'amber',
    },
    {
      title: 'Broken routes',
      value: summary?.brokenRoutes ?? 0,
      subtitle: 'Routes requiring repair',
      tone: 'rose',
    },
  ];

  const rtuSnapshotCards = [
    {
      title: 'Temperature',
      value: formatMetricValue(rtuSnapshot?.temperatureC, 1, ' C'),
      subtitle: 'RTU sensor reading',
      tone: 'sky',
    },
    {
      title: 'CPU',
      value: formatMetricValue(rtuSnapshot?.cpuUsagePercent, 1, '%'),
      subtitle: 'Processor usage',
      tone: 'slate',
    },
    {
      title: 'Memory',
      value: formatMetricValue(rtuSnapshot?.memoryUsagePercent, 1, '%'),
      subtitle: 'Memory usage',
      tone: 'amber',
    },
    {
      title: 'Power',
      value: powerStatusLabel,
      subtitle: 'Supply status',
      tone: powerTone,
    },
  ];

  const qualityCards = [
    {
      title: 'Pass',
      value: testPassCount,
      tone: 'emerald',
    },
    {
      title: 'Fail',
      value: testFailCount,
      tone: 'rose',
    },
    {
      title: 'Total',
      value: totalTests,
      tone: 'slate',
    },
  ];

  const busy = loading || downloading;

  return (
    <section className="report-print-root mx-auto w-full max-w-6xl space-y-6 px-1 sm:px-2 lg:px-4">
      <div className="report-toolbar rounded-[1.75rem] border border-slate-200/80 bg-white/90 p-5 sm:p-6 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.55)] backdrop-blur-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold tracking-[0.22em] text-sky-700">
              <FileText className="h-3.5 w-3.5" />
              NQMS report
            </div>
            <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-[2.6rem]">Health and KPI report</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-[0.98rem]">
              Generate a compact report for the full network or one RTU, with the main KPI values, a short alarm history,
              and the essential trend charts.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleGenerateReport}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
              Generate
            </button>
            <button
              type="button"
              onClick={handleDownloadReport}
              disabled={!reportData || busy}
              className="inline-flex items-center gap-2 rounded-xl border border-sky-300 bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-800 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {downloading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Download PDF
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
          <label className="block rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5">
            <span className="text-[11px] font-semibold tracking-[0.2em] text-slate-500">Scope</span>
            <select
              value={scope}
              onChange={(event) => setScope(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-sky-400"
            >
              <option value="NETWORK">Entire network</option>
              <option value="RTU">Single RTU</option>
            </select>
          </label>

          <label className="block rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5">
            <span className="text-[11px] font-semibold tracking-[0.2em] text-slate-500">Start date</span>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-sky-400"
            />
          </label>

          <label className="block rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5">
            <span className="text-[11px] font-semibold tracking-[0.2em] text-slate-500">End date</span>
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-sky-400"
            />
          </label>

          <label className="block rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5">
            <span className="text-[11px] font-semibold tracking-[0.2em] text-slate-500">RTU</span>
            <select
              value={selectedRtuId}
              onChange={(event) => setSelectedRtuId(event.target.value)}
              disabled={scope !== 'RTU'}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-sky-400 disabled:cursor-not-allowed disabled:bg-slate-100"
            >
              {rtus.length === 0 ? (
                <option value="">No RTUs available</option>
              ) : (
                <>
                  <option value="">Select RTU</option>
                  {rtus.map((rtu) => (
                    <option key={rtu.rtuId} value={rtu.rtuId}>
                      {rtu.rtuId}
                    </option>
                  ))}
                </>
              )}
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
          <span className="rounded-full bg-slate-100 px-3 py-1 font-medium">Scope: {scopeLabel}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 font-medium">Period: {periodLabel}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 font-medium">
            Status: {loading ? 'Generating...' : reportData ? 'Ready' : 'Idle'}
          </span>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {error}
          </div>
        ) : null}
      </div>

      {reportData ? (
        <div ref={reportRef} className="report-document overflow-hidden rounded-[2rem] border border-slate-200 bg-[#f6f7fb] shadow-[0_24px_60px_-34px_rgba(15,23,42,0.45)]">
          <div className="relative overflow-hidden bg-gradient-to-br from-[#1b1e48] via-[#2a2f6e] to-[#1f6477] px-6 py-7 text-white sm:px-8 sm:py-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.14),transparent_30%)]" />
            <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-4xl">
                <p className="text-[11px] font-semibold tracking-[0.3em] text-cyan-100/75">NQMS</p>
                <h3 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-[2.55rem]">{reportTitle}</h3>
                <p className="mt-2 text-sm text-slate-200">{reportSubtitle}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3.5 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.65)] backdrop-blur-sm">
                <p className="text-[11px] font-semibold tracking-[0.22em] text-cyan-100/70">Generated</p>
                <p className="mt-2 text-sm font-semibold text-white">{generatedAtLabel}</p>
              </div>
            </div>

            <div className="relative z-10 mt-5 grid gap-3 md:grid-cols-3">
              {topStats.map((item) => (
                <TopStatCard key={item.label} label={item.label} value={item.value} helper={item.helper} />
              ))}
            </div>
          </div>

          <div className="space-y-4 px-5 py-5 sm:px-6 sm:py-6">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                title="Availability"
                value={`${availabilityPercent.toFixed(1)}%`}
                subtitle="Test pass rate"
                tone="emerald"
              />
              <MetricCard
                title="MTTR"
                value={`${(summary?.mttrHours ?? 0).toFixed(2)} h`}
                subtitle="Mean time to repair"
                tone="rose"
              />
              <MetricCard
                title="MTBF"
                value={`${(summary?.mtbfHours ?? 0).toFixed(2)} h`}
                subtitle="Mean time between failures"
                tone="sky"
              />
              <MetricCard
                title="Tests"
                value={totalTests}
                subtitle={`${testPassRate.toFixed(1)}% pass • ${testFailRate.toFixed(1)}% fail`}
                tone="amber"
              />
            </div>

            <SectionCard
              title={reportScopeLabel}
              subtitle={`Latest operational snapshot for ${scopeLabel}`}
              action={<p className="text-[11px] font-semibold tracking-[0.18em] text-slate-400">Updated ${snapshotTimestamp}</p>}
            >
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {(scope === 'RTU' && rtuSnapshot ? rtuSnapshotCards : networkSnapshotCards).map((card) => (
                  <SnapshotCard
                    key={card.title}
                    title={card.title}
                    value={card.value}
                    subtitle={card.subtitle}
                    tone={card.tone}
                  />
                ))}
              </div>
            </SectionCard>

            <div className="grid gap-4 xl:grid-cols-2">
              <SectionCard title="Availability trend" subtitle={periodLabel} action={<p className="text-[11px] font-semibold tracking-[0.18em] text-slate-400">{availabilitySeries.length} points</p>}>
                {availabilitySeries.length === 0 ? (
                  <EmptyState message="No availability samples were found for this period." />
                ) : (
                  <div className="h-52 rounded-2xl bg-white p-3 shadow-inner shadow-slate-100">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={availabilitySeries} margin={{ top: 8, right: 18, bottom: 8, left: 0 }}>
                        <CartesianGrid strokeDasharray="4 6" stroke="#d1dae5" vertical={false} />
                        <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} tickLine={false} axisLine={false} minTickGap={24} />
                        <YAxis domain={[0, 100]} tick={{ fill: '#475569', fontSize: 12 }} tickFormatter={(value) => `${value}%`} tickLine={false} axisLine={false} width={48} />
                        <Tooltip content={<ChartTooltip valueFormatter={(value) => `${Number(value).toFixed(1)}%`} />} />
                        <Line type="monotone" dataKey="value" name="Availability" stroke="#2563eb" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </SectionCard>

              <SectionCard title="Alarm severity" subtitle={`${totalAlarms} total`}>
                {alarmSeveritySeries.length === 0 ? (
                  <EmptyState message="No alarm severity data was found for this period." />
                ) : (
                  <div className="h-52 rounded-2xl bg-white p-3 shadow-inner shadow-slate-100">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={alarmSeveritySeries} margin={{ top: 8, right: 18, bottom: 8, left: 0 }} barCategoryGap="28%">
                        <CartesianGrid strokeDasharray="4 6" stroke="#d1dae5" vertical={false} />
                        <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fill: '#475569', fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} width={42} />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="value" name="Alarms" radius={[8, 8, 0, 0]}>
                          {alarmSeveritySeries.map((entry) => (
                            <Cell key={entry.label} fill={SEVERITY_COLORS[entry.label] || '#64748b'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </SectionCard>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
              <SectionCard title="Test pass vs fail" subtitle={`${totalTests} tests`}>
                {totalTests === 0 ? (
                  <EmptyState message="No test results were found for this period." />
                ) : (
                  <div className="grid gap-4 md:grid-cols-[160px_1fr] md:items-center">
                    <div className="relative h-[160px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={testPieData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={46}
                            outerRadius={68}
                            paddingAngle={2}
                            stroke="#ffffff"
                            strokeWidth={2}
                          >
                            {testPieData.map((entry, index) => (
                              <Cell key={entry.name} fill={TEST_COLORS[index]} />
                            ))}
                          </Pie>
                          <Tooltip content={<ChartTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-center">
                        <div>
                          <p className="text-[11px] font-semibold tracking-[0.25em] text-slate-400">Pass rate</p>
                          <p className="mt-1 text-xl font-black tracking-tight text-slate-900">{testPassRate.toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-900">Pass</p>
                          <p className="text-xs text-slate-500">{testPassCount} tests • {testPassRate.toFixed(1)}%</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50/70 px-4 py-3">
                        <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-900">Fail</p>
                          <p className="text-xs text-slate-500">{testFailCount} tests • {testFailRate.toFixed(1)}%</p>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2.5">
                        <p className="text-[11px] font-semibold tracking-[0.25em] text-slate-500">Summary</p>
                        <p className="mt-1.5 text-[13px] text-slate-600">
                          Pass and fail values are aggregated from the selected period.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </SectionCard>

              <SectionCard title="Test quality summary" subtitle="Pass / fail overview">
                {totalTests === 0 ? (
                  <EmptyState message="No test quality summary is available for this period." />
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                      {qualityCards.map((card) => (
                        <div
                          key={card.title}
                          className={`rounded-2xl border px-3.5 py-3 shadow-sm ${
                            card.tone === 'emerald'
                              ? 'border-emerald-100 bg-emerald-50'
                              : card.tone === 'rose'
                                ? 'border-rose-100 bg-rose-50'
                                : 'border-slate-200 bg-slate-50'
                          }`}
                        >
                          <p className="text-[11px] font-semibold tracking-[0.22em] text-slate-500">{card.title}</p>
                          <p className="mt-1.5 text-[1.15rem] font-black tracking-tight text-slate-900">{card.value}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-slate-500">
                      Availability for this report is computed from the test pass rates in the selected period.
                    </p>
                  </div>
                )}
              </SectionCard>
            </div>

            <SectionCard title="Alarm history" subtitle={alarmCount ? 'Start, end, and duration for each alarm' : 'No alarm data available'} action={<p className="text-[11px] font-semibold tracking-[0.18em] text-slate-400">Showing {alarmCount} of {alarmCount}</p>}>
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50 text-xs tracking-[0.18em] text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Alarm</th>
                      <th className="px-4 py-3 font-semibold">Route</th>
                      <th className="px-4 py-3 font-semibold">Severity</th>
                      <th className="px-4 py-3 font-semibold">Start</th>
                      <th className="px-4 py-3 font-semibold">End</th>
                      <th className="px-4 py-3 font-semibold">Duration (h)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {alarmCount === 0 ? (
                      <tr>
                        <td className="px-4 py-5 text-sm text-slate-500" colSpan={6}>
                          No alarm history found for the selected scope and period.
                        </td>
                      </tr>
                    ) : (
                      orderedAlarmHistory.map((alarm, index) => (
                        <tr key={`${alarm.alarmId || 'alarm'}-${index}`} className="align-top">
                          <td className="px-4 py-4">
                            <div className="font-semibold text-slate-900">Alarm {index + 1}</div>
                            <div className="mt-1 text-xs text-slate-500">{alarm.alarmType || 'Alarm event'}</div>
                          </td>
                          <td className="px-4 py-4 text-slate-700">
                            <div className="font-medium">{alarm.routeId}</div>
                            <div className="mt-1 text-xs text-slate-500">{alarm.routeName}</div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                              {alarm.severity}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-slate-700">{formatDateTime(alarm.startedAt)}</td>
                          <td className="px-4 py-4 text-slate-700">{alarm.endedAt ? formatDateTime(alarm.endedAt) : 'Open'}</td>
                          <td className="px-4 py-4 text-slate-700">
                            {alarm.durationHours === null || alarm.durationHours === undefined ? 'Open' : `${Number(alarm.durationHours).toFixed(2)}`}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>
        </div>
      ) : (
        <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/70 px-6 py-14 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 shadow-sm">
            <BarChart3 className="h-8 w-8" />
          </div>
          <h3 className="mt-5 text-2xl font-black tracking-tight text-slate-900">No report generated yet</h3>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Select the scope and period, then generate the report to see the KPI summary and alarm history.
          </p>
        </div>
      )}
    </section>
  );
}

export default ReportPdfGenerator;
