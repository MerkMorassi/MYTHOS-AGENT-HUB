
/**
 * Simple Sentiment Analyzer for Voice Pitch Modulation
 */
export const SentimentAnalyzer = {
    /**
     * Analyzes text and returns a pitch adjustment value (-5 to 5)
     * Positive = Enthusiastic/High Energy
     * Negative = Serious/Somber/Low Energy
     */
    analyze(text: string): number {
        const lower = text.toLowerCase();
        
        // Positive/Enthusiastic Keywords
        const positive = ['happy', 'great', 'awesome', 'excellent', 'excited', 'yay', 'wonderful', 'perfect', 'love', 'fantastic', 'amazing', 'brilliant', 'wow', 'good news', 'success'];
        // Negative/Serious Keywords
        const serious = ['sad', 'bad', 'sorry', 'unfortunate', 'critical', 'error', 'danger', 'warning', 'serious', 'somber', 'grave', 'concerning', 'failure', 'death', 'pain', 'loss', 'alarm'];
        
        let score = 0;
        positive.forEach(word => {
            if (lower.includes(word)) score += 1.5;
        });
        serious.forEach(word => {
            if (lower.includes(word)) score -= 1.5;
        });
        
        // Extreme Enthusiasm (Exclamation marks)
        const exclamations = (text.match(/!/g) || []).length;
        score += exclamations * 0.5;
        
        // Cap the results
        return Math.max(-5, Math.min(5, score));
    }
};
