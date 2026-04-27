import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

function StatusTooltip({ active, payload }) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const entry = payload[0];
  const value = Number(entry.value ?? 0);

  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm">
      <p className="text-sm font-semibold text-slate-800">{entry.name}</p>
      <p className="text-xs font-medium text-slate-600">
        {value} route{value === 1 ? '' : 's'}
      </p>
    </div>
  );
}

function NetworkStatusChart({ kpi }) {
  if (!kpi || !kpi.metrics) {
    return <div className="text-center text-gray-500">No data available</div>;
  }

  const statusData = [
    { name: 'Normal', value: Number(kpi.metrics.routesNormal ?? 0), color: '#16a34a' },
    { name: 'Degraded', value: Number(kpi.metrics.routesDegraded ?? 0), color: '#d97706' },
    { name: 'Broken', value: Number(kpi.metrics.routesBroken ?? 0), color: '#dc2626' }
  ];

  const totalRoutes = statusData.reduce((sum, item) => sum + item.value, 0);
  const data = statusData.filter(item => item.value > 0);

  if (data.length === 0) {
    return <div className="text-center text-gray-500">No routes configured</div>;
  }

  return (
    <div className="space-y-5">
      <div className="h-72 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50/85 via-white to-sky-50/50 p-3">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="48%"
              labelLine={false}
              label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
              innerRadius={54}
              outerRadius={102}
              cornerRadius={8}
              paddingAngle={2}
              stroke="#ffffff"
              strokeWidth={2}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<StatusTooltip />} />
            <Legend
              iconType="circle"
              verticalAlign="bottom"
              wrapperStyle={{
                color: '#334155',
                fontSize: '13px',
                fontWeight: 600,
                paddingTop: '8px',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {statusData.map((item) => {
          const percent = totalRoutes > 0 ? (item.value / totalRoutes) * 100 : 0;
          const barWidth = item.value > 0 ? Math.max(percent, 6) : 0;

          return (
            <div key={item.name} className="rounded-2xl border border-slate-200/80 bg-white/85 p-3 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <p className="text-sm font-semibold text-slate-700">{item.name}</p>
                </div>
                <p className="text-xl font-bold text-slate-900">{item.value}</p>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${barWidth}%`, backgroundColor: item.color }}
                />
              </div>
              <p className="mt-1 text-xs font-medium text-slate-500">{percent.toFixed(1)}% of routes</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default NetworkStatusChart;
