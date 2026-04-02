// src/pages/Dashboard.jsx
import AdminLayout from "@/components/AdminLayout";
import StatCard from "@/components/StatCard";
import { Users, DollarSign, Clock, TrendingUp, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useState } from 'react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [chartType, setChartType] = useState('pie'); // 'pie' or 'bar'

   const riskData = [
    { name: 'Low Risk', value: 65, color: '#16a34a', bgColor: '#1afd6aff' },
    { name: 'Medium Risk', value: 28, color: '#eab308', bgColor: '#fceb37ff' },
    { name: 'High Risk', value: 7, color: '#dc2626', bgColor: '#f67a7aff' }
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-4 rounded-lg shadow-xl border-2" style={{ borderColor: data.payload.color }}>
          <p className="font-semibold text-gray-900 mb-1">{data.name}</p>
          <p className="text-lg font-bold" style={{ color: data.payload.color }}>
            {data.value}%
          </p>
          <p className="text-xs text-gray-500 mt-1">
            of total applications
          </p>
        </div>
      );
    }
    return null;
  };

  const renderPieChart = () => (
    <ResponsiveContainer width="100%" height={320}>
      <PieChart>
        <Pie
          data={riskData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, value }) => `${value}%`}
          outerRadius={110}
          innerRadius={60}
          fill="#8884d8"
          dataKey="value"
          paddingAngle={2}
        >
          {riskData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          verticalAlign="bottom" 
          height={36}
          iconType="circle"
          formatter={(value, entry) => (
            <span className="text-sm font-medium text-gray-700">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={riskData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="name" 
          tick={{ fill: '#6b7280', fontSize: 12 }}
          axisLine={{ stroke: '#d1d5db' }}
        />
        <YAxis 
          label={{ 
            value: 'Percentage (%)', 
            angle: -90, 
            position: 'insideLeft',
            style: { fill: '#6b7280', fontSize: 12 }
          }}
          tick={{ fill: '#6b7280', fontSize: 12 }}
          axisLine={{ stroke: '#d1d5db' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={100}>
          {riskData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-2">Welcome back! Here's your loan management summary.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Beneficiaries"
            value="1,248"
            icon={Users}
            trend="+12% from last month"
          />
          <StatCard
            title="Loans Approved"
            value="₹45.2L"
            icon={CheckCircle}
            trend="₹12.5L this month"
            variant="success"
          />
          <StatCard
            title="Pending Applications"
            value="38"
            icon={Clock}
            trend="Requires review"
            variant="warning"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-warning" />
                Pending Loan Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                You have 38 loan applications waiting for review and approval.
              </p>
              <Button onClick={() => navigate("/loan-approval")} className="w-full">
                Review Applications
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Beneficiary Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                View and manage beneficiary profiles, credit scores, and loan history.
              </p>
              <Button onClick={() => navigate("/beneficiaries")} variant="outline" className="w-full">
                Manage Beneficiaries
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Risk Band Distribution with Charts */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Risk Band Distribution</CardTitle>
              <div className="flex gap-2">
                <button
                  onClick={() => setChartType('pie')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    chartType === 'pie'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  Pie Chart
                </button>
                <button
                  onClick={() => setChartType('bar')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    chartType === 'bar'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  Bar Chart
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {chartType === 'pie' ? renderPieChart() : renderBarChart()}
            
            {/* Summary Statistics */}
            <div className="mt-8 grid grid-cols-3 gap-6">
              {riskData.map((item) => (
                <div
                  key={item.name}
                  className="relative p-6 rounded-xl border-2 transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer border-black/10"
                  style={{ 
                    
                    backgroundColor: item.bgColor
                  }}
                >
                  <div className="text-sm font-medium text-gray-800 mb-2">{item.name}</div>
                  <div className="text-3xl font-bold mb-1 text-gray" >
                    {item.value}%
                  </div>
                  <div className="text-xs text-gray-800">of applications</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
