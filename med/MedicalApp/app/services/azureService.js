import { 
    collection, 
    addDoc, 
    query, 
    orderBy, 
    getDocs,
    onSnapshot,
    serverTimestamp,
    limit
} from 'firebase/firestore';
import { db } from '../../config/firebase';

// Add WebTools console logging
const log = {
    info: (message, data) => {
        console.log(`%c[WebTools] ${message}`, 'color: #2196F3; font-weight: bold', data || '');
    },
    error: (message, error) => {
        console.error(`%c[WebTools] ${message}`, 'color: #F44336; font-weight: bold', error || '');
    },
    success: (message, data) => {
        console.log(`%c[WebTools] ${message}`, 'color: #4CAF50; font-weight: bold', data || '');
    }
};

class AzureService {
    constructor() {
        this.healthMetricsCollection = 'healthMetrics';
        console.log('AzureService initialized');
    }

    // Store health metrics from Azure
    async storeHealthMetrics(userId, metrics) {
        try {
            log.info('Storing health metrics for user:', userId);
            const docRef = await addDoc(collection(db, this.healthMetricsCollection), {
                userId,
                ...metrics,
                createdAt: serverTimestamp()
            });
            log.success('Health metrics stored successfully:', { docId: docRef.id });
            return docRef.id;
        } catch (error) {
            log.error('Error storing health metrics:', error);
            throw error;
        }
    }

    // Get latest health metrics (no filtering)
    async getLatestHealthMetrics() {
        try {
            console.log('Fetching latest metrics from Firestore...');
            const metricsRef = collection(db, this.healthMetricsCollection);
            const q = query(
                metricsRef,
                orderBy('timestamp', 'desc'),
                limit(1)
            );
            
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const doc = querySnapshot.docs[0];
                const data = doc.data();
                console.log('Latest metrics from Firestore:', data);
                return data;
            }
            console.log('No metrics found in Firestore');
            return null;
        } catch (error) {
            console.error('Error fetching from Firestore:', error);
            throw error;
        }
    }

    // Get health metrics history (without user filter)
    async getHealthMetrics(limit = 10) {
        try {
            log.info('Getting metrics history');
            const q = query(
                collection(db, this.healthMetricsCollection),
                orderBy('timestamp', 'desc'),
                limit(limit)
            );
            
            const querySnapshot = await getDocs(q);
            const metrics = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            log.success('Retrieved metrics history:', metrics);
            return metrics;
        } catch (error) {
            log.error('Error getting health metrics:', error);
            throw error;
        }
    }

    // Subscribe to real-time updates (no filtering)
    subscribeToHealthMetrics(callback) {
        try {
            console.log('Setting up Firestore real-time listener...');
            const metricsRef = collection(db, this.healthMetricsCollection);
            const q = query(
                metricsRef,
                orderBy('timestamp', 'desc'),
                limit(1)
            );

            return onSnapshot(q, (snapshot) => {
                if (!snapshot.empty) {
                    const data = snapshot.docs[0].data();
                    console.log('New data from Firestore:', data);
                    callback(data);
                }
            }, (error) => {
                console.error('Firestore subscription error:', error);
            });
        } catch (error) {
            console.error('Error setting up Firestore listener:', error);
            throw error;
        }
    }
}

export const azureService = new AzureService(); 