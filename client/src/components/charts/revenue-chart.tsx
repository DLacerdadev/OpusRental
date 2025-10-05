import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useTranslation } from "react-i18next";

interface RevenueChartProps {
  data: Array<{ month: string; revenue: number; payouts: number; margin: number }>;
}

export function RevenueChart({ data }: RevenueChartProps) {
  const { t } = useTranslation();
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="month" 
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
        />
        <YAxis 
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px'
          }}
        />
        <Legend />
        <Bar dataKey="revenue" fill="#10b981" name={t('financial.chartRevenue')} />
        <Bar dataKey="payouts" fill="#3b82f6" name={t('financial.chartPayouts')} />
        <Bar dataKey="margin" fill="#8b5cf6" name={t('financial.chartMargin')} />
      </BarChart>
    </ResponsiveContainer>
  );
}
