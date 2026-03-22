import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

function NetworkStatusChart({ kpi }) {
  if (!kpi || !kpi.metrics) {
    return <div className="text-center text-gray-500">No data available</div>;
  }

  const data = [
    { name: 'Normal', value: kpi.metrics.routesNormal, color: '#10b981' },
    { name: 'Degraded', value: kpi.metrics.routesDegraded, color: '#f59e0b' },
    { name: 'Broken', value: kpi.metrics.routesBroken, color: '#ef4444' }
  ].filter(item => item.value > 0);

  if (data.length === 0) {
    return <div className="text-center text-gray-500">No routes configured</div>;
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      
      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-green-600">{kpi.metrics.routesNormal}</p>
          <p className="text-sm text-gray-600">Normal</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-yellow-600">{kpi.metrics.routesDegraded}</p>
          <p className="text-sm text-gray-600">Degraded</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-red-600">{kpi.metrics.routesBroken}</p>
          <p className="text-sm text-gray-600">Broken</p>
        </div>
      </div>
    </div>
  );
}

export default NetworkStatusChart;
