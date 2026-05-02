'use client';

import React, { useState, useEffect } from 'react';
import { azureService } from '../services/azureService';

export default function Dashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        try {
            console.log('Fetching latest data from Firestore...');
            setLoading(true);
            const latest = await azureService.getLatestHealthMetrics();
            console.log('Data received from Firestore:', latest);
            setData(latest);
        } catch (err) {
            console.error('Error fetching from Firestore:', err);
            setError('Failed to fetch data from Firestore');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        
        // Set up real-time listener
        const unsubscribe = azureService.subscribeToHealthMetrics((newData) => {
            console.log('New data received from Firestore:', newData);
            setData(newData);
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return <div>Loading data from Firestore...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (!data) {
        return <div>No data available in Firestore</div>;
    }

    return (
        <div style={{ padding: '20px' }}>
            <h2>Latest Data from Firestore</h2>
            <pre style={{ 
                backgroundColor: '#f5f5f5', 
                padding: '20px', 
                borderRadius: '5px',
                overflow: 'auto'
            }}>
                {JSON.stringify(data, null, 2)}
            </pre>
        </div>
    );
} 