"use client"
import { Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

type VitalsPoint = {
  systolic: number;
  diastolic: number;
  heartRate: number;
  date: string;
  createdAt?: Date;
};

export default function Charts({ vitals }: { vitals: VitalsPoint[] }){
return(
    <div>
        <div className="flex items-center gap-2 mb-6">
            <Activity className="text-emerald-600" size={20} />
            <h3 className="text-lg font-semibold text-gray-800">Health Trends</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
              <h4 className="font-semibold text-red-800 mb-4 flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                Blood Pressure Trends
              </h4>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={vitals && vitals.length > 0 ? vitals : []}>
                  <defs>
                    <linearGradient id="systolicGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="diastolicGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => value}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    fontSize={12}
                    stroke="#6b7280"
                  />
                  <YAxis domain={[60, 180]} fontSize={12} stroke="#6b7280" />
                  <Tooltip 
                    labelFormatter={(value) => `Date: ${value}`}
                    formatter={(value, name) => [value as string, name as string]}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="systolic" 
                    stroke="#dc2626" 
                    strokeWidth={3}
                    fill="url(#systolicGradient)"
                    name="Systolic" 
                    dot={{ fill: '#dc2626', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7, fill: '#dc2626' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="diastolic" 
                    stroke="#2563eb" 
                    strokeWidth={3}
                    fill="url(#diastolicGradient)"
                    name="Diastolic" 
                    dot={{ fill: '#2563eb', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7, fill: '#2563eb' }}
                  />
                </LineChart>
              </ResponsiveContainer>
              {(!vitals || vitals.length === 0) && (
                <div className="text-center py-8">
                  <p className="text-red-600 text-sm font-medium">No data available</p>
                  <p className="text-red-500 text-xs mt-1">Save some vitals to see trends</p>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
              <h4 className="font-semibold text-orange-800 mb-4 flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                Heart Rate Trends
              </h4>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={vitals && vitals.length > 0 ? vitals : []}>
                  <defs>
                    <linearGradient id="heartRateGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ea580c" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ea580c" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => value}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    fontSize={12}
                    stroke="#6b7280"
                  />
                  <YAxis domain={[50, 120]} fontSize={12} stroke="#6b7280" />
                  <Tooltip 
                    labelFormatter={(value) => `Date: ${value}`}
                    formatter={(value, name) => [`${value as number} BPM`, name as string]}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="heartRate" 
                    stroke="#ea580c" 
                    strokeWidth={3}
                    fill="url(#heartRateGradient)"
                    name="Heart Rate" 
                    dot={{ fill: '#ea580c', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7, fill: '#ea580c' }}
                  />
                </LineChart>
              </ResponsiveContainer>
              {(!vitals || vitals.length === 0) && (
                <div className="text-center py-8">
                  <p className="text-orange-600 text-sm font-medium">No data available</p>
                  <p className="text-orange-500 text-xs mt-1">Save some vitals to see trends</p>
                </div>
              )}
            </div>
          </div>
    </div>
)
    

}