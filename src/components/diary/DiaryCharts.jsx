import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';

export default function DiaryCharts({ entries }) {
  const chartData = entries
    .map(e => ({
      date: e.date,
      Stimmung: e.mood,
      Energie: e.energy_level,
      Schlaf: e.sleep_quality,
      Verdauung: e.digestion,
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border rounded-lg shadow-lg">
          <p className="font-bold">{format(new Date(label), 'dd.MM.yyyy')}</p>
          {payload.map(pld => (
            <p key={pld.dataKey} style={{ color: pld.color }}>
              {`${pld.dataKey}: ${pld.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  return (
    <Card className="border-rose-100">
      <CardHeader>
        <CardTitle>Deine Trends im Überblick</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length < 2 ? (
          <p className="text-center text-gray-500">
            Nicht genügend Daten für eine Trendanzeige. Fülle dein Tagebuch für mindestens 2 Tage.
          </p>
        ) : (
          <div style={{ width: '100%', height: 400 }}>
             <ResponsiveContainer>
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(dateStr) => format(new Date(dateStr), 'dd.MM')}
                />
                <YAxis domain={[0, 10]} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="Stimmung" stroke="#F59E0B" />
                <Line type="monotone" dataKey="Energie" stroke="#10B981" />
                <Line type="monotone" dataKey="Schlaf" stroke="#6366F1" />
                <Line type="monotone" dataKey="Verdauung" stroke="#EF4444" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}