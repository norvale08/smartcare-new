'use client';

import React from 'react';
import { Alert } from '../../types/doctors';
import { AlertTriangle, Clock, User, Zap, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AlertsPanelProps {
    alerts: Alert[];
}
const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts }) => {
    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'Critical': return 'bg-red-50 border-red-200 text-red-800';
            case 'High': return 'bg-orange-50 border-orange-200 text-orange-800';
            case 'Medium': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
            case 'Low': return 'bg-blue-50 border-blue-200 text-blue-800';
            default: return 'bg-gray-50 border-gray-200 text-gray-800';
        }
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'Critical': return <Zap className="h-4 w-4 text-red-600" />;
            case 'High': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
            case 'Medium': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
            case 'Low': return <AlertTriangle className="h-4 w-4 text-blue-600" />;
            default: return <AlertTriangle className="h-4 w-4 text-gray-600" />;
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'vitals': return <Activity className="h-4 w-4" />;
            case 'medication': return <Clock className="h-4 w-4" />;
            case 'appointment': return <User className="h-4 w-4" />;
            case 'emergency': return <Zap className="h-4 w-4" />;
            default: return <AlertTriangle className="h-4 w-4" />;
        }
    };

    const sortedAlerts = alerts.sort((a, b) => {
        const severityOrder = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
        return severityOrder[a.severity as keyof typeof severityOrder] - severityOrder[b.severity as keyof typeof severityOrder];
    });

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">AI Alerts</h2>
                <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-500">Real-time monitoring</span>
                </div>
            </div>

            {sortedAlerts.length === 0 ? (
                <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No active alerts</p>
                    <p className="text-sm text-gray-400">All patients are stable</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {sortedAlerts.map((alert) => (
                        <div
                            key={alert.id}
                            className={`rounded-lg border p-4 transition-all duration-200 hover:shadow-md ${getSeverityColor(alert.severity)}`}
                        >
                            <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 mt-0.5">
                                    {getSeverityIcon(alert.severity)}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2 mb-1">
                                        <span className="text-xs font-semibold uppercase tracking-wide">
                                            {alert.severity}
                                        </span>
                                        <span className="text-xs text-gray-500">•</span>
                                        <span className="text-xs text-gray-500 capitalize">{alert.type}</span>
                                    </div>

                                    <p className="text-sm font-medium mb-2">{alert.message}</p>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-1 text-xs text-gray-600">
                                            <User className="h-3 w-3" />
                                            <span>Patient ID: {alert.patientId}</span>
                                        </div>
                                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                                            <Clock className="h-3 w-3" />
                                            <span>{formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
export default AlertsPanel;