import AdvisorService from '../services/AdvisorService.js';

class AdvisorController {
    /**
     * Get deep analysis for a symbol
     */
    async getAnalysis(req, res) {
        try {
            const { symbol } = req.params;
            
            if (!symbol) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Symbol is required' 
                });
            }

            const analysis = await AdvisorService.analyzeSymbol(symbol.toUpperCase());
            
            res.json({
                success: true,
                data: analysis
            });
        } catch (error) {
            console.error(`❌ Controller error for ${req.params.symbol}:`, error.message);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to generate analysis'
            });
        }
    }
}

export default new AdvisorController();
