'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';

interface DashboardProps {
  auditStats: {
    total: number;
    completed: number;
    inProgress: number;
    completionRate: number;
  };
  trendData: {
    date: string;
    completedAudits: number;
    averageScore: number;
  }[];
  riskLevelDistribution: {
    riskLevel: string;
    count: number;
  }[];
  topFindings: {
    category: string;
    count: number;
    severity: number;
  }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

function Dashboard({ 
  auditStats, 
  trendData, 
  riskLevelDistribution,
  topFindings 
}: DashboardProps) {
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900">Total Audits</h3>
            <p className="mt-2 text-3xl font-bold">{auditStats.total}</p>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900">Completed</h3>
            <p className="mt-2 text-3xl font-bold">{auditStats.completed}</p>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900">In Progress</h3>
            <p className="mt-2 text-3xl font-bold">{auditStats.inProgress}</p>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900">Completion Rate</h3>
            <p className="mt-2 text-3xl font-bold">
              {(auditStats.completionRate * 100).toFixed(1)}%
            </p>
          </div>
        </Card>
      </div>

      {/* Trends */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-medium mb-4">Audit Trends</h3>
          <div className="h-[300px] w-full">
            <LineChart
              width={800}
              height={300}
              data={trendData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="completedAudits"
                stroke="#8884d8"
                name="Completed Audits"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="averageScore"
                stroke="#82ca9d"
                name="Average Score"
              />
            </LineChart>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Risk Level Distribution */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium mb-4">Risk Level Distribution</h3>
            <div className="h-[300px] w-full">
              <PieChart width={400} height={300}>
                <Pie
                  data={riskLevelDistribution}
                  cx={200}
                  cy={150}
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {riskLevelDistribution.map((entry, index) => (
                    <Cell key={entry.riskLevel} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </div>
          </div>
        </Card>

        {/* Top Findings */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium mb-4">Top Findings by Category</h3>
          </div>
        </Card>
      </div>
    </div>
  );
}

// Mock data for development
const mockData = {
  auditStats: {
    total: 100,
    completed: 75,
    inProgress: 25,
    completionRate: 0.75,
  },
  trendData: [
    { date: '2024-01', completedAudits: 10, averageScore: 85 },
    { date: '2024-02', completedAudits: 15, averageScore: 88 },
    { date: '2024-03', completedAudits: 20, averageScore: 90 },
  ],
  riskLevelDistribution: [
    { riskLevel: 'High', count: 20 },
    { riskLevel: 'Medium', count: 35 },
    { riskLevel: 'Low', count: 45 },
  ],
  topFindings: [
    { category: 'Safety Equipment', count: 15, severity: 3 },
    { category: 'Training', count: 12, severity: 2 },
    { category: 'Documentation', count: 8, severity: 1 },
  ],
};

export default function ReportsPage() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-6">Safety Audit Reports</h1>
      <Dashboard {...mockData} />
    </main>
  );
}