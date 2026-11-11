
import React, { useState } from 'react';
import { Agent } from '../types';
import { saveAgentConfig } from '../services/db';

interface InlinePersonaEditorProps {
    agent: Agent;
    onSave: (id: string) => void;
    onCancel: () => void;
    color: string;
}

export const InlinePersonaEditor: React.FC<InlinePersonaEditorProps> = ({ agent, onSave, onCancel, color }) => {
    const [editForm, setEditForm] = useState({
        bio: agent.bio || '',
        system_instruction: agent.system_instruction || '',
        voice: agent.voice || '',
        accessLevel: agent.accessLevel || '1',
        behaviorTuning: agent.behaviorTuning || '',
        profileImageUrl: agent.profileImageUrl || ''
    });

    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await saveAgentConfig(agent.id, {
                systemInstruction: editForm.system_instruction,
                voiceName: editForm.voice,
                accessLevel: editForm.accessLevel,
                bio: editForm.bio,
                behaviorTuning: editForm.behaviorTuning,
                profileImageUrl: editForm.profileImageUrl
            });
            onSave(agent.id);
        } catch (e) {
            console.error("Failed to save agent config", e);
            alert("Failed to save changes.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex-col" style={{ gap: '0.75rem', height: '100%', padding: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.7rem', color: color, fontWeight: 'bold', letterSpacing: '1px' }}>CORE PROTOCOL EDITOR</span>
                <span style={{ fontSize: '0.6rem', color: '#666', fontFamily: 'monospace' }}>ID: {agent.id}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                    <label className="form-label" style={{ color: color, fontSize: '0.65rem' }}>PROFILE IMG</label>
                    <input 
                        className="form-input" 
                        value={editForm.profileImageUrl} 
                        onChange={e => setEditForm({...editForm, profileImageUrl: e.target.value})}
                        style={{ height: '28px', fontSize: '0.75rem', background: '#111' }}
                        placeholder="https://..."
                    />
                </div>
                <div>
                    <label className="form-label" style={{ color: color, fontSize: '0.65rem' }}>VOICE</label>
                    <select 
                        className="form-select" 
                        value={editForm.voice} 
                        onChange={e => setEditForm({...editForm, voice: e.target.value})}
                        style={{ height: '28px', fontSize: '0.75rem', background: '#111' }}
                    >
                        <option value="Puck">Puck</option>
                        <option value="Charon">Charon</option>
                        <option value="Kore">Kore</option>
                        <option value="Fenrir">Fenrir</option>
                        <option value="Zephyr">Zephyr</option>
                        <option value="Aoede">Aoede</option>
                        <option value="Callirrhoe">Callirrhoe</option>
                        <option value="Leda">Leda</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="form-label" style={{ color: color, fontSize: '0.65rem' }}>BIO OVERRIDE</label>
                <textarea 
                    className="form-input" 
                    value={editForm.bio} 
                    onChange={e => setEditForm({...editForm, bio: e.target.value})}
                    style={{ height: '3rem', fontSize: '0.75rem', resize: 'vertical', background: '#111' }}
                />
            </div>

            <div>
                <label className="form-label" style={{ color: color, fontSize: '0.65rem' }}>SYSTEM DIRECTIVE (ROOT CONTEXT)</label>
                <textarea 
                    className="form-input" 
                    value={editForm.system_instruction} 
                    onChange={e => setEditForm({...editForm, system_instruction: e.target.value})}
                    style={{ height: '6rem', fontSize: '0.75rem', background: '#111', fontFamily: 'monospace' }}
                />
            </div>

            <div>
                <label className="form-label" style={{ color: color, fontSize: '0.65rem' }}>BEHAVIORAL TUNING (HEURISTICS)</label>
                <textarea 
                    className="form-input" 
                    value={editForm.behaviorTuning} 
                    onChange={e => setEditForm({...editForm, behaviorTuning: e.target.value})}
                    style={{ height: '3.5rem', fontSize: '0.75rem', resize: 'vertical', background: '#111', fontStyle: 'italic' }}
                    placeholder="e.g., Never mention being an AI. Use professional tone."
                />
            </div>

            <div className="flex-group" style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                <button 
                    onClick={handleSave} 
                    className="btn btn-primary btn-sm" 
                    style={{ flex: 1, height: '32px' }}
                    disabled={isSaving}
                >
                    {isSaving ? 'SYNCING...' : 'APPLY TO CORE'}
                </button>
                <button 
                    onClick={onCancel} 
                    className="btn btn-secondary btn-sm" 
                    style={{ flex: 1, height: '32px' }}
                    disabled={isSaving}
                >
                    ABORT
                </button>
            </div>
        </div>
    );
};
