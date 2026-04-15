import { useMemo, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const parseTimestamp = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number') {
    const millis = value < 100000000000 ? value * 1000 : value;
    const date = new Date(millis);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === 'string') {
    const normalized = /[zZ]|[+-]\d{2}:\d{2}$/.test(value) ? value : `${value}Z`;
    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === 'object' && typeof value.epochSecond === 'number') {
    const nanos = typeof value.nano === 'number' ? value.nano : 0;
    const millis = (value.epochSecond * 1000) + Math.floor(nanos / 1000000);
    const date = new Date(millis);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
};

const formatDayLabel = (dayDate) => (
  dayDate.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
);

const TREND_RANGE_OPTIONS = [
  { key: '24h', label: '24H', hours: 24 },
  { key: '7d', label: '7D', hours: 24 * 7 },
  { key: '30d', label: '30D', hours: 24 * 30 },
  { key: '90d', label: '90D', hours: 24 * 90 },
  { key: '1y', label: '1Y', hours: 24 * 365 },
  { key: 'all', label: 'Since Start', hours: null },
];

const toDailyAvailabilityRange = (history) => {
  const dailyBuckets = new Map();

  history.forEach((entry) => {
    const value = Number(entry?.metrics?.networkAvailabilityPercent);
    const timestamp = parseTimestamp(entry?.timestamp ?? entry?.calculatedAt);

    if (!Number.isFinite(value) || !timestamp) {
      return;
    }

    const dayKey = timestamp.toISOString().slice(0, 10);
    const dayStart = new Date(timestamp);
    dayStart.setHours(0, 0, 0, 0);

    const existingBucket = dailyBuckets.get(dayKey);
    if (!existingBucket) {
      dailyBuckets.set(dayKey, {
        dayKey,
        dayDate: dayStart,
        minAvailability: value,
        maxAvailability: value,
        samples: 1,
      });
      return;
    }

    existingBucket.minAvailability = Math.min(existingBucket.minAvailability, value);
    existingBucket.maxAvailability = Math.max(existingBucket.maxAvailability, value);
    existingBucket.samples += 1;
  });

  return [...dailyBuckets.values()]
    .sort((a, b) => a.dayDate - b.dayDate)
    .slice(-10)
    .map((bucket) => ({
      dayKey: bucket.dayKey,
      label: formatDayLabel(bucket.dayDate),
      minAvailability: Number(bucket.minAvailability.toFixed(2)),
      maxAvailability: Number(bucket.maxAvailability.toFixed(2)),
      samples: bucket.samples,
    }));
};

const toTrendSeries = (history) => history
  .map((entry) => {
    const value = Number(entry?.metrics?.networkAvailabilityPercent);
    const timestamp = parseTimestamp(entry?.timestamp ?? entry?.calculatedAt);

    if (!Number.isFinite(value) || !timestamp) {
      return null;
    }

    return {
      timestampMs: timestamp.getTime(),
      availability: Number(value.toFixed(3)),
    };
  })
  .filter(Boolean)
  .sort((a, b) => a.timestampMs - b.timestampMs);

const filterTrendByRange = (points, rangeKey) => {
  if (!points.length || rangeKey === 'all') {
    return points;
  }

  const rangeOption = TREND_RANGE_OPTIONS.find((option) => option.key === rangeKey);
  if (!rangeOption || rangeOption.hours == null) {
    return points;
  }

  const lastTimestamp = points[points.length - 1].timestampMs;
  const startTimestamp = lastTimestamp - (rangeOption.hours * 60 * 60 * 1000);
  return points.filter((point) => point.timestampMs >= startTimestamp);
};

const downsampleTrendPoints = (points, maxPoints = 420) => {
  if (points.length <= maxPoints) {
    return points;
  }

  const bucketSize = Math.ceil(points.length / maxPoints);
  return points.filter((_, index) => index % bucketSize === 0 || index === points.length - 1);
};

const formatTrendTick = (timestampMs, rangeKey) => {
  const date = new Date(timestampMs);

  if (rangeKey === '24h') {
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }

  if (rangeKey === '7d' || rangeKey === '30d') {
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  return date.toLocaleDateString(undefined, { year: '2-digit', month: 'short' });
};

const TrendTooltip = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const datum = payload[0]?.payload;
  const timestamp = datum?.timestampMs ? new Date(datum.timestampMs) : null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-xl backdrop-blur-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Snapshot</p>
      <p className="mt-1 text-sm font-medium text-slate-700">
        {timestamp
          ? timestamp.toLocaleString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : '-'}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-700">
        Availability: <span className="font-bold text-indigo-600">{datum?.availability?.toFixed(2)}%</span>
      </p>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const datum = payload[0]?.payload;

  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-xl backdrop-blur-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-700">
        Daily Low: <span className="font-bold text-amber-600">{datum?.minAvailability?.toFixed(2)}%</span>
      </p>
      <p className="text-sm font-medium text-slate-700">
        Daily High: <span className="font-bold text-emerald-600">{datum?.maxAvailability?.toFixed(2)}%</span>
      </p>
    </div>
  );
};

function AvailabilityRangeChart({ history = [] }) {
  const [viewMode, setViewMode] = useState('trend');
  const [selectedTrendRange, setSelectedTrendRange] = useState('all');

  const chartData = useMemo(() => toDailyAvailabilityRange(history), [history]);
  const trendSeriesRaw = useMemo(() => toTrendSeries(history), [history]);
  const trendSeriesFiltered = useMemo(
    () => filterTrendByRange(trendSeriesRaw, selectedTrendRange),
    [trendSeriesRaw, selectedTrendRange],
  );
  const trendSeries = useMemo(
    () => downsampleTrendPoints(trendSeriesFiltered),
    [trendSeriesFiltered],
  );

  const allMinValues = chartData.map((item) => item.minAvailability);
  const allMaxValues = chartData.map((item) => item.maxAvailability);
  const trendValues = trendSeries.map((item) => item.availability);

  const lowerBound = chartData.length > 0
    ? Math.max(0, Math.floor((Math.min(...allMinValues) - 1.5) / 2) * 2)
    : 0;
  const upperBound = chartData.length > 0
    ? Math.min(100, Math.ceil((Math.max(...allMaxValues) + 1.5) / 2) * 2)
    : 100;

  const trendLowerBound = trendSeries.length > 0
    ? Math.max(0, Math.floor((Math.min(...trendValues) - 1) / 1) * 1)
    : 0;
  const trendUpperBound = trendSeries.length > 0
    ? Math.min(100, Math.ceil((Math.max(...trendValues) + 1) / 1) * 1)
    : 100;

  return (
    <div className="card shadow-lg hover:shadow-xl transition-shadow">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-2 text-indigo-600">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Availibility</h3>
            <p className="text-sm text-slate-500">Track historical availability as a curve or keep the daily availability view</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setViewMode('trend')}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
              viewMode === 'trend'
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
            }`}
          >
            Trend Curve
          </button>
          <button
            type="button"
            onClick={() => setViewMode('envelope')}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
              viewMode === 'envelope'
                ? 'border-amber-500 bg-amber-50 text-amber-700'
                : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
            }`}
          >
            Daily Availability
          </button>
        </div>
      </div>

      {viewMode === 'trend' && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {TREND_RANGE_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setSelectedTrendRange(option.key)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  selectedTrendRange === option.key
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {viewMode === 'trend' && trendSeries.length === 0 ? (
        <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
          No availability trend data yet.
        </div>
      ) : null}

      {viewMode === 'envelope' && chartData.length === 0 ? (
        <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
          No availability history yet.
        </div>
      ) : null}

      {viewMode === 'trend' && trendSeries.length > 0 ? (
        <>
          <div className="h-80 rounded-xl border border-slate-100 bg-gradient-to-b from-slate-50 to-white p-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trendSeries}
                margin={{ top: 8, right: 18, left: 0, bottom: 8 }}
              >
                <defs>
                  <linearGradient id="trendLineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#0ea5e9" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 6" stroke="#dbe2ea" vertical={false} />
                <XAxis
                  type="number"
                  dataKey="timestampMs"
                  domain={['dataMin', 'dataMax']}
                  tick={{ fill: '#334155', fontSize: 12, fontWeight: 600 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => formatTrendTick(value, selectedTrendRange)}
                />
                <YAxis
                  domain={[trendLowerBound, trendUpperBound]}
                  tick={{ fill: '#475569', fontSize: 12 }}
                  tickFormatter={(value) => `${value}%`}
                  tickLine={false}
                  axisLine={false}
                  width={50}
                />
                <Tooltip content={<TrendTooltip />} cursor={{ stroke: '#0f172a33' }} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ fontSize: '12px', paddingBottom: '12px' }}
                />
                <ReferenceLine y={99} stroke="#0ea5e9" strokeDasharray="5 5" ifOverflow="extendDomain" />
                <Line
                  type="monotone"
                  dataKey="availability"
                  name="Availability"
                  stroke="url(#trendLineGradient)"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 1, stroke: '#1e293b' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : null}

      {viewMode === 'envelope' && chartData.length > 0 ? (
        <>
          <div className="h-80 rounded-xl border border-slate-100 bg-gradient-to-b from-slate-50 to-white p-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 8, right: 18, left: 0, bottom: 8 }}
                barCategoryGap="24%"
              >
                <defs>
                  <linearGradient id="dailyLowGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="dailyHighGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0.8} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="4 6" stroke="#dbe2ea" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#334155', fontSize: 12, fontWeight: 600 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={[lowerBound, upperBound]}
                  tick={{ fill: '#475569', fontSize: 12 }}
                  tickFormatter={(value) => `${value}%`}
                  tickLine={false}
                  axisLine={false}
                  width={50}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#0f172a10' }} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ fontSize: '12px', paddingBottom: '12px' }}
                />
                <ReferenceLine y={99} stroke="#0ea5e9" strokeDasharray="5 5" ifOverflow="extendDomain" />
                <Bar
                  dataKey="minAvailability"
                  name="Daily Low"
                  fill="url(#dailyLowGradient)"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={28}
                />
                <Bar
                  dataKey="maxAvailability"
                  name="Daily High"
                  fill="url(#dailyHighGradient)"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : null}
    </div>
  );
}

export default AvailabilityRangeChart;