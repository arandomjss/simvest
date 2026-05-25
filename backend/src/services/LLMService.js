import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class LLMService {
    constructor() {
        this.apiKey = process.env.OPENROUTER_API_KEY;
        this.baseUrl = 'https://openrouter.ai/api/v1';
        this.defaultModel = 'google/gemini-2.0-flash-001';
    }

    /**
     * Generate text/analysis using OpenRouter
     */
    async generateAnalysis(prompt, systemPrompt = 'You are a professional institutional stock market analyst for the Indian market.') {
        if (!this.apiKey) {
            console.error('❌ OpenRouter API Key is missing in .env');
            return this.getFallbackAnalysis();
        }

        try {
            const response = await axios.post(
                `${this.baseUrl}/chat/completions`,
                {
                    model: this.defaultModel,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.3, // Keep it precise for financial analysis
                    max_tokens: 450
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'https://simvest.app', // Production domain
                        'X-Title': 'SimVest Professional Terminal'
                    }
                }
            );

            return response.data.choices[0].message.content;
        } catch (error) {
            console.error('❌ LLM Analysis failed:', error.response?.data || error.message);
            return this.getFallbackAnalysis();
        }
    }

    /**
     * Fallback for when API fails or key is missing
     */
    getFallbackAnalysis() {
        return "Market data suggests a period of consolidation. Technical indicators are currently showing mixed signals with a slight bias toward neutral-bullish sentiment. Professional caution is advised until a clear trend breakout is confirmed.";
    }
}

export default new LLMService();
