"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface ActivityVitalRecord {
  timestamp: Date
  systolic: number
  diastolic: number
  heartRate: number
  activityType?: string
  activityIntensity?: string
}

interface ActivityVitalsCorrelationProps {
  vitals: ActivityVitalRecord[]
}

export default function ActivityVitalsCorrelation({ vitals }: ActivityVitalsCorrelationProps) {
  const chartData = useMemo(() => {
    return vitals
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .map((v) => ({
        time: v.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        systolic: v.systolic,
        diastolic: v.diastolic,
        heartRate: v.heartRate,
        activity: v.activityType || "None",
        intensity: v.activityIntensity || "N/A",
      }))
  }, [vitals])

  const activityStats = useMemo(() => {
    const stats: Record<string, { readings: number; avgSystolic: number; avgDiastolic: number; avgHeartRate: number }> =
      {}

    vitals.forEach((v) => {
      const activity = v.activityType || "None"
      if (!stats[activity]) {
        stats[activity] = { readings: 0, avgSystolic: 0, avgDiastolic: 0, avgHeartRate: 0 }
      }
      stats[activity].readings += 1
      stats[activity].avgSystolic += v.systolic
      stats[activity].avgDiastolic += v.diastolic
      stats[activity].avgHeartRate += v.heartRate
    })

    return Object.entries(stats).map(([activity, data]) => ({
      activity,
      readings: data.readings,
      avgSystolic: Math.round(data.avgSystolic / data.readings),
      avgDiastolic: Math.round(data.avgDiastolic / data.readings),
      avgHeartRate: Math.round(data.avgHeartRate / data.readings),
    }))
  }, [vitals])

  if (vitals.length === 0) {
    return (
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle>Activity & Vitals Correlation</CardTitle>
          <CardDescription>
            No activity data available yet. Start logging activities with your vitals to see patterns.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="w-full max-w-4xl space-y-6">
      {/* Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Vitals Trend Over Time</CardTitle>
          <CardDescription>How your blood pressure and heart rate change throughout the day</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="systolic" stroke="#ef4444" name="Systolic (mmHg)" />
              <Line yAxisId="left" type="monotone" dataKey="diastolic" stroke="#3b82f6" name="Diastolic (mmHg)" />
              <Line yAxisId="right" type="monotone" dataKey="heartRate" stroke="#8b5cf6" name="Heart Rate (bpm)" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Activity Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Average Vitals by Activity</CardTitle>
          <CardDescription>How different activities affect your vital signs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Activity</th>
                  <th className="text-center py-2 px-2">Readings</th>
                  <th className="text-center py-2 px-2">Avg Systolic</th>
                  <th className="text-center py-2 px-2">Avg Diastolic</th>
                  <th className="text-center py-2 px-2">Avg Heart Rate</th>
                </tr>
              </thead>
              <tbody>
                {activityStats.map((stat) => (
                  <tr key={stat.activity} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-2 font-medium">{stat.activity}</td>
                    <td className="text-center py-2 px-2">{stat.readings}</td>
                    <td className="text-center py-2 px-2 text-red-600 font-semibold">{stat.avgSystolic}</td>
                    <td className="text-center py-2 px-2 text-blue-600 font-semibold">{stat.avgDiastolic}</td>
                    <td className="text-center py-2 px-2 text-purple-600 font-semibold">{stat.avgHeartRate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
