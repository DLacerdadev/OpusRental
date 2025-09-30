import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface RevenueChartProps {
  data: Array<{ month: string; revenue: number; payouts: number; margin: number }>;
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="revenue" fill="hsl(var(--chart-2))" name="Receita Total" />
        <Bar dataKey="payouts" fill="hsl(var(--chart-1))" name="Repasses" />
        <Bar dataKey="margin" fill="hsl(var(--chart-4))" name="Margem" />
      </BarChart>
    </ResponsiveContainer>
  );
}
