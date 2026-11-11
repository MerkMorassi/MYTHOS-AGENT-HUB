
/**
 * TRANSCRIPT_CHIP (v1.0.0)
 * 
 * Logic to format chat logs into readable text transcripts.
 * Portable snippet.
 */

const TRANSCRIPT_CHIP = {
    name: "Transcript Formatter",
    type: "FORMATTER",
    execute: (logs, title, agentId) => {
        const header = `TRANSCRIPT: ${title}\nAGENT: ${agentId}\nDATE: ${new Date().toLocaleString()}\n----------------------------------------\n\n`;
        const body = logs.map(l => {
            const time = new Date(l.timestamp).toLocaleTimeString();
            const sender = l.type === 'user' ? 'USER' : (l.type === 'model' ? 'AGENT' : 'SYSTEM');
            return `[${time}] ${sender}: ${l.text}`;
        }).join('\n\n');
        return header + body;
    }
};

if (typeof module !== 'undefined') {
    module.exports = TRANSCRIPT_CHIP;
} else if (typeof window !== 'undefined') {
    window.TRANSCRIPT_CHIP = TRANSCRIPT_CHIP;
}
