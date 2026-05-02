import axios from 'axios';

class AzureApi {
    constructor() {
        this.baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
        this.apiKey = process.env.EXPO_PUBLIC_API_KEY;
    }

    // Configure axios with default headers
    get axiosInstance() {
        return axios.create({
            baseURL: this.baseUrl,
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey
            }
        });
    }

    // Send health metrics to the API
    async sendHealthMetrics(metrics) {
        try {
            const response = await this.axiosInstance.post('/api/health-metrics', metrics);
            return response.data;
        } catch (error) {
            console.error('Error sending health metrics:', error);
            throw error;
        }
    }

    // Get health metrics from the API
    async getHealthMetrics(userId) {
        try {
            const response = await this.axiosInstance.get(`/api/health-metrics/${userId}`);
            return response.data;
        } catch (error) {
            console.error('Error getting health metrics:', error);
            throw error;
        }
    }

    // Get latest health metrics from the API
    async getLatestHealthMetrics(userId) {
        try {
            const response = await this.axiosInstance.get(`/api/health-metrics/${userId}/latest`);
            return response.data;
        } catch (error) {
            console.error('Error getting latest health metrics:', error);
            throw error;
        }
    }
}

export const azureApi = new AzureApi(); 