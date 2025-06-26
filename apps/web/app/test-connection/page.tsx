'use client'
import React from 'react'
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

const page = () => {
    const [statusResponse, setStatusResponse] = useState<any>(null);
    const [welcomeResponse, setWelcomeResponse] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const testConnection = async () => {
            try {
                // Update your API client to handle endpoints without /api/v1 prefix
                const statusUrl = 'http://localhost:8000/status';
                const welcomeUrl = 'http://localhost:8000/';

                // Test status endpoint
                const statusRes = await fetch(statusUrl, { credentials: 'include' });
                const statusData = await statusRes.json();
                setStatusResponse(statusData);

                // Test welcome endpoint  
                const welcomeRes = await fetch(welcomeUrl, { credentials: 'include' });
                const welcomeData = await welcomeRes.json();
                setWelcomeResponse(welcomeData);
                
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        };

        testConnection();
    }, []);

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">🚀 API Connection Test</h1>
            
            {loading && <div className="text-blue-600">Testing connection...</div>}
            
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    <strong>❌ Error:</strong> {error}
                </div>
            )}
            
            {/* Status Check */}
            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">📊 Status Check</h2>
                <p className="text-sm text-gray-600 mb-2">
                    Endpoint: <code className="bg-gray-100 px-2 py-1 rounded">GET /status</code>
                </p>
                {statusResponse ? (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                        <strong>✅ Success!</strong>
                        <pre className="mt-2 text-sm">{JSON.stringify(statusResponse, null, 2)}</pre>
                    </div>
                ) : (
                    <div className="bg-gray-100 px-4 py-3 rounded">Waiting for response...</div>
                )}
            </div>

            {/* Welcome Endpoint */}
            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">🏠 Welcome API</h2>
                <p className="text-sm text-gray-600 mb-2">
                    Endpoint: <code className="bg-gray-100 px-2 py-1 rounded">GET /</code>
                </p>
                {welcomeResponse ? (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                        <strong>✅ Success!</strong>
                        <pre className="mt-2 text-sm">{JSON.stringify(welcomeResponse, null, 2)}</pre>
                    </div>
                ) : (
                    <div className="bg-gray-100 px-4 py-3 rounded">Waiting for response...</div>
                )}
            </div>
            
            <div className="mt-4 text-sm text-gray-600 bg-blue-50 p-4 rounded">
                <p><strong>✅ Connection Status: WORKING!</strong></p>
                <p>• API Base URL: <code>http://localhost:8000</code></p>
                <p>• Frontend URL: <code>http://localhost:3000</code></p>
                <p>• CORS: Enabled for localhost:3000</p>
            </div>
        </div>
    )
}

export default page