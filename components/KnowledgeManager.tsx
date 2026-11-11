import React, { useState, useEffect, useRef, useMemo } from 'react';
import { VectorRecord, LorePack } from '../types';
import { KnowledgeDashboard } from './KnowledgeDashboard';
import { 
  getVectorsByAgent,
  getAllVectors,
  deleteVectorsByAgent,
  saveLorePack,
  getLorePacksByAgentId,
  deleteLorePack,
  bulkDeleteVectors,
  clearVectorsStore,
  syncVectorsFromVault
} from '../services/db';
import { IngestionService } from '../services/ingestion';
import { AGENTS } from '../agents';
import { NumMarkX_GenerateHeader } from '../patterns/NumMarkX';

import { GeminiProvider } from '../services/llmProviders/geminiProvider';
import { LoreGraphService } from '../services/loreGraphService';
import { MediaAsset } from '../types';
import { saveMediaAsset } from '../services/db';

interface KnowledgeManagerProps {
  onUpdate: () => void;
  currentAgentId: string;
  isOpen: boolean;
  onClose: () => void;
  ragThreshold: number;
  setRagThreshold: (threshold: number) => void;
  initialSourceFilter?: string | null;
}

export const KnowledgeManager: React.FC<KnowledgeManagerProps> = ({ 
    onUpdate, 
    currentAgentId,
    isOpen,
    onClose,
    ragThreshold,
    setRagThreshold,
    initialSourceFilter
}) => {
  const [activeTab, setActiveTab] = useState<'local' | 'library'>('local');
  const [viewMode, setViewMode] = useState<'chunks' | 'files'>('chunks');
  const [allVectors, setAllVectors] = useState<VectorRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showNukeModal, setShowNukeModal] = useState(false);
  const [importProgress, setImportProgress] = useState({ p: 0, t: 0 });
  
  // Organization and Filter States
  const agentHandle = AGENTS.find(a => a.id === currentAgentId)?.handle || currentAgentId;
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>(agentHandle);
  const [dateFilter, setDateFilter] = useState<'ALL_DESC' | 'ALL_ASC' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL_DESC');
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<string>('ALL');

  const [isManifesting, setIsManifesting] = useState(false);
  const [isGraphing, setIsGraphing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  const fetchVectors = async () => {
    setIsLoading(true);
    try {
      const data = await getAllVectors();
      setAllVectors(data);
    } catch (e) {
      console.error("Failed to load vectors from store", e);
    } finally {
      onUpdate();
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedAgentFilter(agentHandle);
      if (initialSourceFilter) {
          setSelectedSourceFilter(initialSourceFilter);
          setViewMode('files'); // Switch to files view if a specific source is targeted
      }
      fetchVectors();
    }
  }, [isOpen, currentAgentId, activeTab, initialSourceFilter]);

  // Available agent handles across database & predefined fleet
  const availableAgentHandles = useMemo(() => {
    const handles = new Set<string>();
    AGENTS.forEach(a => handles.add(a.handle));
    allVectors.forEach(v => {
      if (v.agent) handles.add(v.agent);
    });
    return Array.from(handles).sort();
  }, [allVectors]);

  // Unique ingested source files across database
  const uniqueSources = useMemo(() => {
    const sources = new Set<string>();
    allVectors.forEach(v => {
      if (v.source) sources.add(v.source);
    });
    return Array.from(sources).sort();
  }, [allVectors]);

  // Filter and sort vectors by specific AGENT_ID and Date Added
  const filteredVectors = useMemo(() => {
    let result = [...allVectors];

    // Filter by AGENT_ID
    if (selectedAgentFilter !== 'ALL') {
      result = result.filter(v => v.agent === selectedAgentFilter);
    }

    // Filter by Ingested Source
    if (selectedSourceFilter !== 'ALL') {
      result = result.filter(v => v.source === selectedSourceFilter);
    }

    // Filter by Date Added window
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    if (dateFilter === 'TODAY') {
      result = result.filter(v => (now - v.timestamp) <= oneDayMs);
    } else if (dateFilter === 'WEEK') {
      result = result.filter(v => (now - v.timestamp) <= 7 * oneDayMs);
    } else if (dateFilter === 'MONTH') {
      result = result.filter(v => (now - v.timestamp) <= 30 * oneDayMs);
    }

    // Sort by Date Added
    if (dateFilter === 'ALL_ASC') {
      result.sort((a, b) => a.timestamp - b.timestamp);
    } else {
      result.sort((a, b) => b.timestamp - a.timestamp);
    }

    return result;
  }, [allVectors, selectedAgentFilter, selectedSourceFilter, dateFilter]);

  // Grouped Files View for Organization
  const groupedFiles = useMemo(() => {
    const files: Record<string, { source: string, agent: string, timestamp: number, count: number }> = {};
    filteredVectors.forEach(v => {
      const key = `${v.source}::${v.agent}`;
      if (!files[key]) {
        files[key] = { source: v.source, agent: v.agent, timestamp: v.timestamp, count: 0 };
      }
      files[key].count++;
      if (v.timestamp < files[key].timestamp) files[key].timestamp = v.timestamp;
    });
    return Object.values(files).sort((a, b) => b.timestamp - a.timestamp);
  }, [filteredVectors]);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsLoading(true);
      try {
          await IngestionService.importLorePack(file, agentHandle, (p, t) => {
              setImportProgress({ p, t });
          });
          await fetchVectors();
          alert(`Import Success: Knowledge base synchronized for ${agentHandle}.`);
      } catch (err: any) {
          alert(`Import Failed: ${err.message}`);
      } finally {
          setIsLoading(false);
          setImportProgress({ p: 0, t: 0 });
          if (importInputRef.current) importInputRef.current.value = '';
      }
  };

  // Export current vector LorePack as a JSON dump file for backup
  const handleExportJsonDump = () => {
      try {
          const exportSet = filteredVectors.length > 0 ? filteredVectors : allVectors.filter(v => v.agent === agentHandle);
          if (exportSet.length === 0) {
              alert(`No vector records found to export for ${selectedAgentFilter === 'ALL' ? 'the vault' : selectedAgentFilter}.`);
              return;
          }

          const dateStr = new Date().toISOString().slice(0, 10);
          const fileName = `MYTHOS.LOREPACK.${selectedAgentFilter.toUpperCase()}.BACKUP.${dateStr}.json`;

          const dumpPayload = {
              schema: "MYTHOS.LOREPACK.BACKUP.v1",
              agentFilter: selectedAgentFilter,
              exportedAt: new Date().toISOString(),
              totalRecords: exportSet.length,
              records: exportSet
          };

          const blob = new Blob([JSON.stringify(dumpPayload, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
      } catch (err: any) {
          alert(`JSON Backup Failed: ${err.message}`);
      }
  };

  const handleGenerateManifest = async () => {
    if (filteredVectors.length === 0) {
        alert("No knowledge nodes selected to summarize.");
        return;
    }
    
    const apiKey = localStorage.getItem('gemini_api_key') || process.env.API_KEY;
    if (!apiKey) {
        alert("API Key required for manifest generation.");
        return;
    }

    setIsManifesting(true);
    try {
        const sampleText = filteredVectors.slice(0, 15).map(v => v.text).join('\n---\n');
        const prompt = `
[KNOWLEDGE MANIFEST REQUEST]
You are a high-level conceptual architect. Analyze the following knowledge snippets from an agent's LorePack and generate a high-level conceptual 'Knowledge Manifest'.
The manifest should summarize the core themes, major entities, and key logic patterns present in this dataset.

SNIPPETS:
${sampleText}

Format the output as a clean, structured text manifest.
`;
        const provider = new GeminiProvider(apiKey);
        const res = await provider.generateResponse([{ role: 'user', parts: [{ text: prompt }] }], {});
        const manifest = res.content || "Failed to generate manifest.";

        const asset: MediaAsset = {
            id: `MANIFEST-${Date.now().toString(36).toUpperCase()}`,
            type: 'text',
            data: manifest,
            prompt: `Knowledge Manifest: ${selectedAgentFilter} (${new Date().toLocaleDateString()})`,
            agentId: currentAgentId,
            timestamp: Date.now(),
            tags: ['MANIFEST', 'KNOWLEDGE', selectedAgentFilter]
        };

        await saveMediaAsset(asset);
        alert("Knowledge Manifest generated and saved to Media Gallery.");
    } catch (e: any) {
        console.error("Manifest generation failed", e);
        alert(`Failed to generate manifest: ${e.message}`);
    } finally {
        setIsManifesting(false);
    }
  };

  const handleGenerateGraph = async () => {
    if (selectedAgentFilter === 'ALL') {
        alert("Please select a specific AGENT_ID to generate a Lore Graph.");
        return;
    }

    setIsGraphing(true);
    try {
        const result = await LoreGraphService.generateFromChatHistory(currentAgentId, selectedAgentFilter);
        alert(`Lore Graph Generated: ${result.nodes} entities and ${result.edges} connections created for ${selectedAgentFilter}.`);
        onUpdate();
    } catch (e: any) {
        console.error("Lore Graph generation failed", e);
        alert(`Failed to generate Lore Graph: ${e.message}`);
    } finally {
        setIsGraphing(false);
    }
  };

  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
        // 1. Clear local active cache for this agent (or all if ALL selected)
        if (selectedAgentFilter === 'ALL') {
            await clearVectorsStore();
        } else {
            await deleteVectorsByAgent(selectedAgentFilter);
        }

        // 2. Pull from vault
        const count = await syncVectorsFromVault(selectedAgentFilter);
        
        await fetchVectors();
        alert(`FORCE SYNC COMPLETE: ${count} nodes re-ingested from LorePack vault into active cache.`);
    } catch (e: any) {
        console.error("Force sync failed", e);
        alert(`Force Sync Failed: ${e.message}`);
    } finally {
        setIsSyncing(false);
    }
  };

  const handleNuke = async () => {
      setIsLoading(true);
      try {
          await clearVectorsStore();
          await fetchVectors();
      } catch (err: any) {
          alert(`Nuke failed: ${err?.message || err}`);
      } finally {
          setIsLoading(false);
          setShowNukeModal(false);
      }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-slide-in-right large">
        <div className="modal-header-area">
          <span className="modal-section-title" style={{ color: '#4ade80' }}>LORE ARCHIVE: {agentHandle}</span>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>

        <div className="modal-body-area">
          {/* NUKE MODAL OVERLAY */}
          {showNukeModal && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(255,0,0,0.2)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="section-panel" style={{ maxWidth: '400px', textAlign: 'center', borderColor: '#ff3333', background: '#0a0a0a', padding: '2rem' }}>
                      <div style={{ color: '#ff3333', fontSize: '3rem', marginBottom: '1rem' }}>⚠</div>
                      <h2 style={{ color: '#fff', margin: '0 0 1rem 0' }}>CRITICAL WARNING</h2>
                      <p style={{ color: '#888', fontSize: '0.9rem', lineHeight: '1.5' }}>
                          This action will permanently vaporize the entire local lore database. This cannot be undone. All agents will lose their grounding.
                      </p>
                      <div className="flex-group" style={{ marginTop: '2rem' }}>
                          <button onClick={() => setShowNukeModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>ABORT</button>
                          <button onClick={handleNuke} className="btn btn-danger" style={{ flex: 1 }}>CONFIRM NUKE</button>
                      </div>
                  </div>
              </div>
          )}

          {/* ACTION BUTTONS: IMPORT, EXPORT, JSON BACKUP DUMP, NUKE */}
          <div className="flex-group" style={{ marginBottom: '1rem', flexWrap: 'wrap' }}>
              <button onClick={() => importInputRef.current?.click()} className="btn btn-primary" style={{ flex: '2 1 180px' }}>
                  IMPORT LOREPACK (.jsonl / .gz)
              </button>
              <button onClick={() => IngestionService.exportLorePack(agentHandle)} className="btn btn-secondary" style={{ flex: '1 1 100px' }} title="Export as line-delimited JSONL">
                  EXPORT (.JSONL)
              </button>
              <button onClick={handleExportJsonDump} className="btn btn-cyan" style={{ flex: '1 1 180px', fontWeight: 'bold' }} title="Export the current vector LorePack as a JSON dump file for backup">
                  💾 BACKUP (JSON DUMP)
              </button>
              <button onClick={handleGenerateManifest} className="btn btn-accent" style={{ flex: '1 1 180px', fontWeight: 'bold' }} title="Generate a conceptual manifest of the current lore set" disabled={isManifesting}>
                  {isManifesting ? '⚡ MANIFESTING...' : '✨ GENERATE MANIFEST'}
              </button>
              <button onClick={handleGenerateGraph} className="btn btn-cyan" style={{ flex: '1 1 180px', fontWeight: 'bold' }} title="Scan chat logs for entities and build visual connections" disabled={isGraphing}>
                  {isGraphing ? '🧬 ANALYZING...' : '🧬 BUILD LORE GRAPH'}
              </button>
              <button onClick={handleForceSync} className="btn btn-secondary" style={{ flex: '1 1 180px', fontWeight: 'bold', color: '#facc15', borderColor: '#facc1533' }} title="Clear local cache and re-ingest from vault" disabled={isSyncing}>
                  {isSyncing ? '⚡ SYNCING...' : '🔄 FORCE SYNC'}
              </button>
              <button onClick={() => setShowNukeModal(true)} className="btn btn-danger" style={{ width: 'auto' }}>
                  NUKE VAULT
              </button>
              <input type="file" ref={importInputRef} className="hidden" onChange={handleImport} accept=".jsonl,.jsonl.gz,.gz,.json" />
          </div>

          {/* VAULT ORGANIZATION & FILTER DROPDOWNS */}
          <div className="section-panel" style={{ marginBottom: '1rem', padding: '0.9rem', background: '#0c0c12', borderColor: '#222232' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                  <span className="section-header-title" style={{ margin: 0, color: '#38bdf8' }}>
                      VAULT ORGANIZATION & FILTERS
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#9ca3af', fontFamily: 'monospace' }}>
                      {filteredVectors.length} of {allVectors.length} nodes matching
                  </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                  {/* Filter by AGENT_ID */}
                  <div>
                      <label className="form-label" style={{ fontSize: '0.65rem' }}>FILTER BY AGENT_ID</label>
                      <select
                          value={selectedAgentFilter}
                          onChange={(e) => setSelectedAgentFilter(e.target.value)}
                          className="form-select"
                          style={{ height: '32px', minHeight: '32px', fontSize: '0.75rem', background: '#000', borderColor: '#333' }}
                      >
                          <option value="ALL">ALL AGENTS (VAULT FLEET)</option>
                          {availableAgentHandles.map(handle => (
                              <option key={handle} value={handle}>
                                  {handle} {handle === agentHandle ? '(CURRENT AGENT)' : ''}
                              </option>
                          ))}
                      </select>
                  </div>

                  {/* Filter by Date Added */}
                  <div>
                      <label className="form-label" style={{ fontSize: '0.65rem' }}>FILTER BY DATE ADDED</label>
                      <select
                          value={dateFilter}
                          onChange={(e) => setDateFilter(e.target.value as any)}
                          className="form-select"
                          style={{ height: '32px', minHeight: '32px', fontSize: '0.75rem', background: '#000', borderColor: '#333' }}
                      >
                          <option value="ALL_DESC">Date Added: Newest First</option>
                          <option value="ALL_ASC">Date Added: Oldest First</option>
                          <option value="TODAY">Date Added: Today (Last 24h)</option>
                          <option value="WEEK">Date Added: Past 7 Days</option>
                          <option value="MONTH">Date Added: Past 30 Days</option>
                      </select>
                  </div>

                  {/* Filter by Ingested Source File */}
                  {uniqueSources.length > 1 && (
                      <div>
                          <label className="form-label" style={{ fontSize: '0.65rem' }}>FILTER BY INGESTED FILE</label>
                          <select
                              value={selectedSourceFilter}
                              onChange={(e) => setSelectedSourceFilter(e.target.value)}
                              className="form-select"
                              style={{ height: '32px', minHeight: '32px', fontSize: '0.75rem', background: '#000', borderColor: '#333' }}
                          >
                              <option value="ALL">ALL INGESTED FILES ({uniqueSources.length})</option>
                              {uniqueSources.map(src => (
                                  <option key={src} value={src}>{src}</option>
                              ))}
                          </select>
                      </div>
                  )}
              </div>
          </div>

          <div className="section-panel" style={{ marginBottom: '1rem', padding: '1rem' }}>
              <div className="flex-group justify-content-space-between">
                  <label className="section-header-title">RETRIEVAL DENSITY (THRESHOLD: {ragThreshold.toFixed(2)})</label>
              </div>
              <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.05" 
                  value={ragThreshold} 
                  onChange={(e) => setRagThreshold(parseFloat(e.target.value))}
                  className="w-full"
              />
              <div className="text-dim-small" style={{ marginTop: '0.5rem' }}>
                  Preview: Higher thresholds include only the most relevant nodes.
              </div>
          </div>

          {isLoading && (
              <div className="status-banner status-info">
                  {importProgress.t > 0 ? `Syncing Lattice: ${importProgress.p} / ${importProgress.t}` : 'Accessing Vault...'}
              </div>
          )}

          <KnowledgeDashboard vectors={filteredVectors} />

          {/* VIEW MODE TOGGLE */}
          <div className="flex-group" style={{ margin: '1.5rem 0 1rem 0' }}>
              <button 
                  onClick={() => setViewMode('chunks')} 
                  className={`btn ${viewMode === 'chunks' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, fontSize: '0.7rem' }}
              >
                  VIEW KNOWLEDGE NODES (CHUNKS)
              </button>
              <button 
                  onClick={() => setViewMode('files')} 
                  className={`btn ${viewMode === 'files' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, fontSize: '0.7rem' }}
              >
                  VIEW INGESTED FILES (SOURCE)
              </button>
          </div>

          <div className="flex-col">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span className="section-header-title" style={{ margin: 0 }}>
                      {viewMode === 'chunks' ? 'INGESTED KNOWLEDGE NODES' : 'INGESTED SOURCE FILES'} ({viewMode === 'chunks' ? filteredVectors.length : groupedFiles.length} matching)
                  </span>
                  <span style={{ fontSize: '0.65rem', color: '#888' }}>
                      Scope: {selectedAgentFilter === 'ALL' ? 'Fleet-wide' : selectedAgentFilter}
                  </span>
              </div>
              
              <div className="flex-col" style={{ gap: '0.5rem' }}>
                  {viewMode === 'chunks' ? (
                      filteredVectors.length === 0 ? (
                          <div className="section-panel" style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
                              No vectors found matching the selected filters.
                          </div>
                      ) : (
                          filteredVectors.slice(0, 30).map(v => (
                              <div key={v.id} className="section-panel" style={{ fontSize: '0.75rem', opacity: 0.9, borderColor: '#22222e' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '4px' }}>
                                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                          <span style={{ color: '#4ade80', fontWeight: 'bold' }}>📄 [{v.source}]</span>
                                          <span style={{ background: '#1c1c28', color: '#38bdf8', padding: '1px 5px', borderRadius: '3px', fontSize: '0.65rem' }}>
                                              AGENT: {v.agent || 'SYSTEM'}
                                          </span>
                                      </div>
                                      <span style={{ color: '#6b7280', fontSize: '0.65rem', fontFamily: 'monospace' }}>
                                          Added: {new Date(v.timestamp).toLocaleDateString()} {new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                  </div>
                                  <div style={{ color: '#ccc', lineHeight: 1.4 }}>{v.text.substring(0, 240)}{v.text.length > 240 ? '...' : ''}</div>
                              </div>
                          ))
                      )
                  ) : (
                      groupedFiles.length === 0 ? (
                          <div className="section-panel" style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
                              No files found matching the selected filters.
                          </div>
                      ) : (
                          groupedFiles.map((file, idx) => (
                              <div key={`${file.source}-${idx}`} className="section-panel" style={{ fontSize: '0.85rem', background: '#0c0c12' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <div className="flex-col" style={{ gap: '4px' }}>
                                          <div style={{ color: '#4ade80', fontWeight: 'bold', fontSize: '0.95rem' }}>📄 {file.source}</div>
                                          <div className="flex-group" style={{ gap: '8px' }}>
                                              <span style={{ background: '#1c1c28', color: '#38bdf8', padding: '1px 6px', borderRadius: '4px', fontSize: '0.65rem' }}>
                                                  AGENT: {file.agent}
                                              </span>
                                              <span style={{ color: '#666', fontSize: '0.7rem' }}>
                                                  {file.count} chunks ingested
                                              </span>
                                          </div>
                                      </div>
                                      <div style={{ textAlign: 'right' }}>
                                          <div style={{ color: '#aaa', fontSize: '0.75rem' }}>
                                              {new Date(file.timestamp).toLocaleDateString()}
                                          </div>
                                          <div style={{ color: '#666', fontSize: '0.65rem' }}>
                                              {new Date(file.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          ))
                      )
                  )}

                  {viewMode === 'chunks' && filteredVectors.length > 30 && (
                      <div style={{ textAlign: 'center', color: '#666', fontSize: '0.7rem', padding: '0.5rem 0' }}>
                          + {filteredVectors.length - 30} additional nodes stored in lattice matching criteria
                      </div>
                  )}
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};
