
import { GoogleGenAI } from "@google/genai";
import { getChatSessionsByAgentId, bulkPutGraphNodes, bulkPutGraphEdges, getGraphNodesByAgent } from "./db";
import { GraphNode, GraphEdge, ChatSession } from "../types";

export const LoreGraphService = {
    /**
     * Scans chat logs for recurring entities and creates visual connections.
     */
    async generateFromChatHistory(agentId: string, agentHandle: string): Promise<{ nodes: number, edges: number }> {
        const apiKey = localStorage.getItem('gemini_api_key') || process.env.API_KEY;
        if (!apiKey) throw new Error("Gemini API Key missing for Lore Graph generation.");

        const sessions = await getChatSessionsByAgentId(agentId);
        if (sessions.length === 0) return { nodes: 0, edges: 0 };

        // Concatenate recent logs for analysis (cap at 10 sessions to avoid token limits)
        const recentSessions = sessions.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
        const combinedLogs = recentSessions.map(s => {
            return `SESSION: ${s.title}\n` + s.logs.map(l => `${l.sender || 'UNKNOWN'}: ${l.text}`).join('\n');
        }).join('\n\n---\n\n');

        const genAI = new GoogleGenAI({ apiKey });

        const prompt = `
            You are a Knowledge Architect for the MYTHOS PROTOCOL.
            Analyze the following chat logs and extract key entities and their relationships.
            Entities should be categorized as PERSON, LOCATION, CONCEPT, or EVENT.
            
            OUTPUT FORMAT (JSON ONLY):
            {
              "nodes": [
                { "id": "unique_id", "name": "Entity Name", "label": "PERSON|LOCATION|CONCEPT|EVENT", "description": "Brief context" }
              ],
              "edges": [
                { "source": "source_id", "target": "target_id", "label": "Relationship type (e.g., 'works for', 'located in', 'ally of')" }
              ]
            }

            CHAT LOGS:
            ${combinedLogs}
        `;

        try {
            const result = await genAI.models.generateContent({
                model: "gemini-1.5-flash",
                contents: [{ role: 'user', parts: [{ text: prompt }] }]
            });
            const responseText = result.text || "";
            const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            const data = JSON.parse(cleanJson);

            const newNodes: GraphNode[] = (data.nodes || []).map((n: any) => ({
                ...n,
                agentId
            }));

            const newEdges: GraphEdge[] = (data.edges || []).map((e: any) => ({
                ...e,
                agentId
            }));

            if (newNodes.length > 0) {
                await bulkPutGraphNodes(newNodes);
            }
            if (newEdges.length > 0) {
                await bulkPutGraphEdges(newEdges);
            }

            return { nodes: newNodes.length, edges: newEdges.length };
        } catch (e) {
            console.error("Lore Graph Generation Failed", e);
            throw e;
        }
    }
};
