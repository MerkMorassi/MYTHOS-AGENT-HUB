
/**
 * CHIP FACTORY (v1.0.0)
 * 
 * The CHIP factory is the starting point for "cutting" portable, 
 * task-specific code snippets that do one thing and do it well.
 * 
 * USE: 
 * const myChip = CHIP_FACTORY.cut('MyTask', (input) => { ... });
 */

const CHIP_FACTORY = {
    version: "1.0.0",
    registry: new Map(),

    /**
     * Cuts a new CHIP with a specific task implementation.
     * @param {string} name - Unique identifier for the CHIP
     * @param {Function} task - The logic implementation
     * @returns {Object} The portable CHIP
     */
    cut: function(name, task) {
        const chip = {
            name: name,
            id: `CHIP-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
            timestamp: Date.now(),
            execute: async function(...args) {
                console.log(`[${this.name}] EXECUTING...`);
                try {
                    return await task(...args);
                } catch (e) {
                    console.error(`[${this.name}] FAILED:`, e);
                    throw e;
                }
            },
            export: function() {
                return `// ${this.name} CHIP\nconst ${this.name.replace(/\s+/g, '_')} = ${task.toString()};`;
            }
        };
        this.registry.set(chip.id, chip);
        return chip;
    },

    get: function(id) {
        return this.registry.get(id);
    },

    list: function() {
        return Array.from(this.registry.values());
    }
};

// Export for use in MythOS
if (typeof module !== 'undefined') {
    module.exports = CHIP_FACTORY;
} else if (typeof window !== 'undefined') {
    window.CHIP_FACTORY = CHIP_FACTORY;
}
