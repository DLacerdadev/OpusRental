import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LineChart, Line, BarChart, Bar, AreaChart, Area, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { TrendingUp, DollarSign, PieChart, Activity } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

// Analytics data types
interface RevenueTrendData {
  month: string;
  investorPayouts: number;
  rentalRevenue: number;
  totalRevenue: number;
  margin: number;
}

interface TrailerROIData {
  trailerId: string;
  trailerName: string;
  purchaseValue: number;
  rentalRevenue: number;
  investorPayouts: number;
  netProfit: number;
  roi: number;
}

interface PerformanceData {
  type: string;
  count: number;
  totalRevenue: number;
  avgRevenue: number;
  avgROI: number;
}

interface PerformanceComparison {
  byType: PerformanceData[];
  totalTrailers: number;
  activeTrailers: number;
}

interface ForecastData {
  month: string;
  forecastRevenue: number;
  growthRate: number;
  confidence: number;
}

export default function Analytics() {
  const [trendMonths, setTrendMonths] = useState("12");
  const [forecastMonths, setForecastMonths] = useState("6");

  // Fetch analytics data
  const { data: revenueTrend, isLoading: trendLoading } = useQuery<RevenueTrendData[]>({
    queryKey: [`/api/analytics/revenue-trend?months=${trendMonths}`],
  });

  const { data: trailerROI, isLoading: roiLoading } = useQuery<TrailerROIData[]>({
    queryKey: ["/api/analytics/trailer-roi"],
  });

  const { data: performanceComparison, isLoading: perfLoading } = useQuery<PerformanceComparison>({
    queryKey: ["/api/analytics/performance-comparison"],
  });

  const { data: revenueForecast, isLoading: forecastLoading } = useQuery<ForecastData[]>({
    queryKey: [`/api/analytics/revenue-forecast?months=${forecastMonths}`],
  });

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Advanced Analytics
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Revenue trends, ROI analysis, and performance insights
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-total-revenue">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue (Last Month)</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {!trendLoading && revenueTrend && revenueTrend.length > 0 
                ? `$${revenueTrend[revenueTrend.length - 1].totalRevenue.toLocaleString()}`
                : "$0"}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {!trendLoading && revenueTrend && revenueTrend.length > 1
                ? `${(((revenueTrend[revenueTrend.length - 1].totalRevenue - revenueTrend[revenueTrend.length - 2].totalRevenue) / revenueTrend[revenueTrend.length - 2].totalRevenue) * 100).toFixed(1)}% from prev month`
                : "No comparison data"}
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-avg-roi">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average ROI</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {!roiLoading && trailerROI && trailerROI.length > 0
                ? `${(trailerROI.reduce((sum: number, t: any) => sum + t.roi, 0) / trailerROI.length).toFixed(1)}%`
                : "0%"}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Across {trailerROI?.length || 0} trailers
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-top-performer">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
            <Activity className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-gray-900 dark:text-white truncate">
              {!roiLoading && trailerROI && trailerROI.length > 0
                ? trailerROI[0].trailerName
                : "N/A"}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {!roiLoading && trailerROI && trailerROI.length > 0
                ? `${trailerROI[0].roi}% ROI`
                : "No data"}
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-forecast">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Next Month Forecast</CardTitle>
            <PieChart className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {!forecastLoading && revenueForecast && revenueForecast.length > 0
                ? `$${Math.round(revenueForecast[0].forecastRevenue).toLocaleString()}`
                : "$0"}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {!forecastLoading && revenueForecast && revenueForecast.length > 0
                ? `${revenueForecast[0].confidence}% confidence`
                : "No data"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Tabs */}
      <Tabs defaultValue="trend" className="space-y-4">
        <TabsList data-testid="tabs-analytics">
          <TabsTrigger value="trend" data-testid="tab-trend">Revenue Trend</TabsTrigger>
          <TabsTrigger value="roi" data-testid="tab-roi">Trailer ROI</TabsTrigger>
          <TabsTrigger value="comparison" data-testid="tab-comparison">Performance</TabsTrigger>
          <TabsTrigger value="forecast" data-testid="tab-forecast">Forecast</TabsTrigger>
        </TabsList>

        {/* Revenue Trend Tab */}
        <TabsContent value="trend" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Revenue Trend Analysis</CardTitle>
                  <CardDescription>Investor payouts vs rental revenue over time</CardDescription>
                </div>
                <Select value={trendMonths} onValueChange={setTrendMonths}>
                  <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-trend-months">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">Last 3 months</SelectItem>
                    <SelectItem value="6">Last 6 months</SelectItem>
                    <SelectItem value="12">Last 12 months</SelectItem>
                    <SelectItem value="24">Last 24 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {trendLoading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={revenueTrend || []} data-testid="chart-revenue-trend">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="rentalRevenue" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="Rental Revenue"
                      dot={{ r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="investorPayouts" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      name="Investor Payouts"
                      dot={{ r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="margin" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      name="Net Margin"
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trailer ROI Tab */}
        <TabsContent value="roi" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trailer ROI Analysis</CardTitle>
              <CardDescription>Return on investment by individual trailer</CardDescription>
            </CardHeader>
            <CardContent>
              {roiLoading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={trailerROI?.slice(0, 10) || []} data-testid="chart-trailer-roi">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                    <XAxis dataKey="trailerName" className="text-xs" angle={-45} textAnchor="end" height={100} />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="roi" fill="#8b5cf6" name="ROI %" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Comparison Tab */}
        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Comparison by Type</CardTitle>
              <CardDescription>Average revenue and ROI by trailer type</CardDescription>
            </CardHeader>
            <CardContent>
              {perfLoading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={performanceComparison?.byType || []} data-testid="chart-performance-comparison">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                    <XAxis dataKey="type" className="text-xs" />
                    <YAxis yAxisId="left" className="text-xs" />
                    <YAxis yAxisId="right" orientation="right" className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="avgRevenue" fill="#10b981" name="Avg Revenue" />
                    <Bar yAxisId="right" dataKey="avgROI" fill="#3b82f6" name="Avg ROI %" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Forecast Tab */}
        <TabsContent value="forecast" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Revenue Forecast</CardTitle>
                  <CardDescription>Projected revenue based on historical trends</CardDescription>
                </div>
                <Select value={forecastMonths} onValueChange={setForecastMonths}>
                  <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-forecast-months">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">Next 3 months</SelectItem>
                    <SelectItem value="6">Next 6 months</SelectItem>
                    <SelectItem value="12">Next 12 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {forecastLoading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={revenueForecast || []} data-testid="chart-revenue-forecast">
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="forecastRevenue" 
                      stroke="#f59e0b" 
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                      name="Forecast Revenue"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
              {!forecastLoading && revenueForecast && revenueForecast.length > 0 && (
                <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    <strong>Note:</strong> Forecast based on {revenueForecast[0].growthRate.toFixed(1)}% average monthly growth rate. 
                    Confidence decreases over time (from {revenueForecast[0].confidence}% to {revenueForecast[revenueForecast.length - 1].confidence}%).
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
