import { db } from '../../config/firebase';
import { collection, addDoc, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { generateHealthMetrics, generateMultipleDataPoints } from '../../scripts/generateHealthMetrics';

// Function to store a single health metrics data point
export const storeHealthMetrics = async (userId) => {
    try {
        const metricsData = generateHealthMetrics();
        console.log('Generated new metrics data:', metricsData);
        
        const metricsRef = collection(db, 'healthMetrics');
        const docRef = await addDoc(metricsRef, {
            ...metricsData,
            userId,
            createdAt: new Date().toISOString()
        });
        console.log('Stored metrics in Firestore with ID:', docRef.id);
        return metricsData;
    } catch (error) {
        console.error('Error storing health metrics:', error);
        throw error;
    }
};

// Function to store multiple health metrics data points
export const storeMultipleHealthMetrics = async (userId, count = 10) => {
    try {
        const metricsData = generateMultipleDataPoints(count);
        console.log('Generated multiple metrics data:', metricsData);
        
        const metricsRef = collection(db, 'healthMetrics');
        
        const batch = [];
        metricsData.forEach(data => {
            batch.push(addDoc(metricsRef, {
                ...data,
                userId,
                createdAt: new Date().toISOString()
            }));
        });
        
        const results = await Promise.all(batch);
        console.log('Stored multiple metrics in Firestore:', results.map(r => r.id));
        return metricsData;
    } catch (error) {
        console.error('Error storing multiple health metrics:', error);
        throw error;
    }
};

// Function to get latest health metrics for a user
export const getLatestHealthMetrics = async (userId) => {
    try {
        console.log('Fetching latest metrics for user:', userId);
        const metricsRef = collection(db, 'healthMetrics');
        const q = query(
            metricsRef,
            where('userId', '==', userId),
            orderBy('createdAt', 'desc'),
            limit(1)
        );
        
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const data = querySnapshot.docs[0].data();
            console.log('Retrieved latest metrics:', data);
            return data;
        }
        console.log('No metrics found for user');
        return null;
    } catch (error) {
        console.error('Error fetching latest health metrics:', error);
        throw error;
    }
};

// Function to get health metrics history for a user
export const getHealthMetricsHistory = async (userId, limit = 10) => {
    try {
        console.log('Fetching metrics history for user:', userId);
        const metricsRef = collection(db, 'healthMetrics');
        const q = query(
            metricsRef,
            where('userId', '==', userId),
            orderBy('createdAt', 'desc'),
            limit(limit)
        );
        
        const querySnapshot = await getDocs(q);
        const history = querySnapshot.docs.map(doc => doc.data());
        console.log('Retrieved metrics history:', history);
        return history;
    } catch (error) {
        console.error('Error fetching health metrics history:', error);
        throw error;
    }
}; 