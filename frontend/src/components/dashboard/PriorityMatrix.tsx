import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { PriorityMatrixItem } from '@/types';

interface PriorityMatrixProps {
  items: PriorityMatrixItem[];
}

const QUADRANT_COLORS = {
  'Quick Wins': '#22c55e',
  'Strategic Investments': '#3b82f6',
  'Fill-ins': '#f59e0b',
  'Reconsider': '#94a3b8',
};

const effortToNumber = (effort: string): number => {
  switch (effort) {
    case 'Quick Win': return 2;
    case 'Medium': return 5;
    case 'Large': return 8;
    default: return 5;
  }
};

interface TooltipPayload {
  payload?: {
    title?: string;
    category?: string;
    impactScore?: number;
    effort?: number;
    quadrant?: string;
    frequency?: number;
  };
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-semibold">{data?.title}</p>
        <p className="text-muted-foreground">{data?.category}</p>
        <div className="mt-2 space-y-1">
          <p>Impact: <span className="font-medium">{data?.impactScore}/10</span></p>
          <p>Effort: <span className="font-medium">{data?.effort}/10</span></p>
          <p>Quadrant: <span className="font-medium">{data?.quadrant}</span></p>
          <p>Mentions: <span className="font-medium">{data?.frequency}</span></p>
        </div>
      </div>
    );
  }
  return null;
};

export function PriorityMatrix({ items }: PriorityMatrixProps) {
  const chartData = items.map(item => ({
    ...item,
    effort: effortToNumber(item.effortEstimate),
    size: Math.max(100, item.frequency * 30),
  }));

  const quadrantCounts = items.reduce((acc, item) => {
    acc[item.quadrant] = (acc[item.quadrant] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Priority Matrix</CardTitle>
        <CardDescription>Impact vs Effort - sized by frequency</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                type="number"
                dataKey="effort"
                name="Effort"
                domain={[0, 10]}
                label={{ value: 'Effort', position: 'bottom', offset: 0 }}
                className="text-xs"
              />
              <YAxis
                type="number"
                dataKey="impactScore"
                name="Impact"
                domain={[0, 10]}
                label={{ value: 'Impact', angle: -90, position: 'left' }}
                className="text-xs"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />

              {/* Quadrant background labels */}
              <text x="15%" y="20%" className="fill-success/30 text-xs font-medium">Quick Wins</text>
              <text x="65%" y="20%" className="fill-primary/30 text-xs font-medium">Strategic</text>
              <text x="15%" y="80%" className="fill-warning/30 text-xs font-medium">Fill-ins</text>
              <text x="65%" y="80%" className="fill-muted-foreground/30 text-xs font-medium">Reconsider</text>

              <Scatter name="Items" data={chartData}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={QUADRANT_COLORS[entry.quadrant as keyof typeof QUADRANT_COLORS]}
                    fillOpacity={0.7}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Quadrant Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          {Object.entries(QUADRANT_COLORS).map(([quadrant, color]) => (
            <div
              key={quadrant}
              className="flex items-center gap-2 p-2 rounded-lg border"
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <div>
                <p className="text-sm font-medium">{quadrant}</p>
                <p className="text-xs text-muted-foreground">
                  {quadrantCounts[quadrant] || 0} items
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
