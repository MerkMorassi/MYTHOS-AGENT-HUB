import React, { useState, useEffect, useRef } from 'react';
import { Agent } from '../types';

export interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: string;
  icon: string;
  keywords?: string;
  badge?: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  agents: Agent[];
  currentAgentId: string;
  onSwitchAgent: (agentId: string) => void;
  onTriggerTool: (toolName: string) => void;
  onToggleSidePanel: (panelId: string) => void;
  onToggleTerminal: () => void;
  onToggleHolodeck: () => void;
  onToggleGraphVisualizer: () => void;
  onSelectView: (view: 'HOME' | 'ORCHESTRATOR' | 'COUNCIL' | 'LORE_HARNESS' | 'COMMUNICATOR') => void;
  onTogglePerformanceTab: () => void;
  onToggleScrollLock: () => void;
  isScrollLocked: boolean;
  onToggleConnection: () => void;
  isConnected: boolean;
  onToggleMute: () => void;
  isMuted: boolean;
  onToggleMic: () => void;
  isMicOn: boolean;
  onToggleCamera: () => void;
  isCameraOn: boolean;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  agents,
  currentAgentId,
  onSwitchAgent,
  onTriggerTool,
  onToggleSidePanel,
  onToggleTerminal,
  onToggleHolodeck,
  onToggleGraphVisualizer,
  onSelectView,
  onTogglePerformanceTab,
  onToggleScrollLock,
  isScrollLocked,
  onToggleConnection,
  isConnected,
  onToggleMute,
  isMuted,
  onToggleMic,
  isMicOn,
  onToggleCamera,
  isCameraOn,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Build command list dynamically
  const commands: CommandItem[] = [
    // --- TOP QUICK ACTIONS ---
    {
      id: 'tool_analyze',
      title: 'Analyze File',
      subtitle: 'Deep Vision & Video Multimodal Analysis via Gemini 3 Pro',
      category: 'Tools & Intelligence',
      icon: '👁',
      badge: 'TOOL',
      keywords: 'analyze file image video document ocr frame inspect vision',
      action: () => { onTriggerTool('analyze_file'); onClose(); }
    },
    {
      id: 'toggle_perf_dashboard',
      title: 'Performance Dashboard',
      subtitle: 'Real-time 24h agent latency, message frequency, and token usage trends',
      category: 'Analytics & Observability',
      icon: '📊',
      badge: 'RECHARTS',
      keywords: 'performance dashboard analytics metrics latency tokens frequency charts 24h stats',
      action: () => { onTogglePerformanceTab(); onClose(); }
    },
    {
      id: 'toggle_scroll_lock',
      title: isScrollLocked ? 'Disable Scroll Lock (Enable Auto-Scroll)' : 'Lock Scroll (Freeze Auto-Scroll)',
      subtitle: isScrollLocked ? 'Auto-scroll currently paused' : 'Keep viewport position while agent generates text',
      category: 'Chat & Viewport',
      icon: isScrollLocked ? '🔒' : '🔓',
      badge: isScrollLocked ? 'LOCKED' : 'ACTIVE',
      keywords: 'lock scroll auto scroll freeze reading past messages stream pause',
      action: () => { onToggleScrollLock(); onClose(); }
    },
    {
      id: 'toggle_focus',
      title: 'Toggle Room Focus',
      subtitle: 'Configure sensory immersion and focused agent domain constraints',
      category: 'Tools & Intelligence',
      icon: '🎯',
      badge: 'ROOM',
      keywords: 'focus room attention context scope sensory immersion',
      action: () => { onToggleSidePanel('FOCUS'); onClose(); }
    },
    {
      id: 'toggle_tools',
      title: 'Tool Manager',
      subtitle: 'Enable or disable agent autonomous tool definitions and capabilities',
      category: 'Tools & Intelligence',
      icon: '⚙',
      badge: 'TOOLS',
      keywords: 'tools manager function calling declarations capabilities plugins',
      action: () => { onToggleSidePanel('TOOLS'); onClose(); }
    },
    {
      id: 'toggle_knowledge',
      title: 'Knowledge Base (LorePack)',
      subtitle: 'Manage local vector vault, search, import/export LorePacks',
      category: 'Tools & Intelligence',
      icon: '📚',
      badge: 'RAG',
      keywords: 'knowledge lorepack rag vectors vault import export search lattice',
      action: () => { onToggleSidePanel('KNOWLEDGE'); onClose(); }
    },
    {
      id: 'toggle_voice_commands',
      title: 'Voice Commands Directory',
      subtitle: 'View spoken trigger vocabulary and active voice shortcuts',
      category: 'Tools & Intelligence',
      icon: '🎙',
      badge: 'VOICE',
      keywords: 'voice spoken speech commands vad audio vocabulary',
      action: () => { onToggleSidePanel('VOICE'); onClose(); }
    },
    {
      id: 'toggle_media_gallery',
      title: 'Media Gallery',
      subtitle: 'Access generated images, video sequences, and uploaded media assets',
      category: 'Media & Storage',
      icon: '🖼',
      badge: 'VAULT',
      keywords: 'media gallery assets pictures images videos renderings files',
      action: () => { onToggleSidePanel('MEDIA'); onClose(); }
    },
    {
      id: 'toggle_mcp',
      title: 'MCP Manager',
      subtitle: 'Model Context Protocol external servers, tool pipelines, and bridges',
      category: 'Tools & Intelligence',
      icon: '🔌',
      badge: 'MCP',
      keywords: 'mcp model context protocol servers filesystem maps integrations',
      action: () => { onToggleSidePanel('MCP'); onClose(); }
    },
    {
      id: 'toggle_prompts',
      title: 'Prompt Library',
      subtitle: 'Inspect, save, and reload custom system personas and task prompts',
      category: 'Tools & Intelligence',
      icon: '📝',
      badge: 'PROMPTS',
      keywords: 'prompt library templates presets directives instructions',
      action: () => { onToggleSidePanel('PROMPTS'); onClose(); }
    },
    {
      id: 'toggle_chat_history',
      title: 'Chat History & Sessions',
      subtitle: 'Load historical session archives and export transcript logs',
      category: 'Chat & Viewport',
      icon: '📜',
      badge: 'HISTORY',
      keywords: 'chat history sessions past logs transcripts conversations archive',
      action: () => { onToggleSidePanel('HISTORY'); onClose(); }
    },
    {
      id: 'toggle_settings',
      title: 'System & Voice Settings',
      subtitle: 'Real-time voice rate/pitch, temperature, API keys, and model parameters',
      category: 'System & Config',
      icon: '🎛',
      badge: 'CONFIG',
      keywords: 'settings preferences model rate pitch speed voice audio keys',
      action: () => { onToggleSidePanel('SETTINGS'); onClose(); }
    },
    {
      id: 'toggle_roster',
      title: 'Agent Roster Cards',
      subtitle: 'Inspect full fleet specifications, bios, studio palettes, and directives',
      category: 'Fleet & Agents',
      icon: '👥',
      badge: 'ROSTER',
      keywords: 'roster fleet agents bios dossiers specifications cards',
      action: () => { onToggleSidePanel('ROSTER'); onClose(); }
    },
    {
      id: 'toggle_holodeck',
      title: 'Toggle Holodeck',
      subtitle: 'Multi-agent shared collaborative visual canvas',
      category: 'Interface & Views',
      icon: '☷',
      badge: 'CANVAS',
      keywords: 'holodeck canvas board visual collaboration shared space',
      action: () => { onToggleHolodeck(); onClose(); }
    },
    {
      id: 'toggle_graph_visualizer',
      title: 'Toggle Neural Lattice Visualizer',
      subtitle: 'Interactive 3D/2D knowledge graph lattice of connected memories',
      category: 'Interface & Views',
      icon: '🕸',
      badge: 'GRAPH',
      keywords: 'neural lattice graph visualizer 3d nodes memory connections',
      action: () => { onToggleGraphVisualizer(); onClose(); }
    },
    {
      id: 'toggle_terminal',
      title: 'Toggle Terminal Console',
      subtitle: 'Low-level interactive CLI interface (~ or ` key)',
      category: 'System & Config',
      icon: '💻',
      badge: 'CLI',
      keywords: 'terminal console shell cli logs low-level command line',
      action: () => { onToggleTerminal(); onClose(); }
    },
    // --- VIEWS ---
    {
      id: 'view_orchestrator',
      title: 'View: Orchestrator Mode',
      subtitle: 'Primary human-in-the-loop control center and live visual uplink',
      category: 'Interface & Views',
      icon: '◉',
      badge: 'VIEW',
      keywords: 'view orchestrator control center live stream uplink hitl',
      action: () => { onSelectView('ORCHESTRATOR'); onClose(); }
    },
    {
      id: 'view_communicator',
      title: 'View: Communicator Mode',
      subtitle: 'Focused, distraction-free 1:1 chat uplink with agent',
      category: 'Interface & Views',
      icon: '⚡',
      badge: 'VIEW',
      keywords: 'view communicator chat 1:1 direct private text',
      action: () => { onSelectView('COMMUNICATOR'); onClose(); }
    },
    {
      id: 'view_council',
      title: 'View: Multi-Agent Council',
      subtitle: 'Autonomous collaborative round-table and multi-persona deliberation',
      category: 'Interface & Views',
      icon: '❖',
      badge: 'VIEW',
      keywords: 'view council multi agent strategy consensus deliberation',
      action: () => { onSelectView('COUNCIL'); onClose(); }
    },
    {
      id: 'view_factory',
      title: 'View: Lorepack Factory & Benchmark',
      subtitle: 'Knowledge ingestion bench and RAG performance harness',
      category: 'Interface & Views',
      icon: '☷',
      badge: 'VIEW',
      keywords: 'view factory lore harness benchmark rag evaluation',
      action: () => { onSelectView('LORE_HARNESS'); onClose(); }
    },
    {
      id: 'view_home',
      title: 'View: Sovereign Kernel Home',
      subtitle: 'Main Mythos launchpad and navigational dashboard',
      category: 'Interface & Views',
      icon: '✦',
      badge: 'HOME',
      keywords: 'view home return main menu start sovereign kernel launchpad',
      action: () => { onSelectView('HOME'); onClose(); }
    },
    // --- HARDWARE & LIVE AUDIO ---
    {
      id: 'session_connection',
      title: isConnected ? 'Disconnect Live Session' : 'Connect Live Session',
      subtitle: isConnected ? 'Terminate active bi-directional WebSocket audio session' : 'Establish live bi-directional audio uplink',
      category: 'Session & Uplink',
      icon: isConnected ? '⏹' : '▶',
      badge: isConnected ? 'ONLINE' : 'OFFLINE',
      keywords: 'connect disconnect live uplink stream start stop websocket call',
      action: () => { onToggleConnection(); onClose(); }
    },
    {
      id: 'toggle_mute',
      title: isMuted ? 'Unmute Agent Speech' : 'Mute Agent Speech (Silent Text Mode)',
      subtitle: isMuted ? 'Agent audio is currently silent' : 'Agent speech playback is currently audible',
      category: 'Session & Uplink',
      icon: isMuted ? '🔇' : '🔊',
      badge: isMuted ? 'MUTED' : 'AUDIBLE',
      keywords: 'mute unmute audio voice speaker sound silent text speech',
      action: () => { onToggleMute(); onClose(); }
    },
    {
      id: 'toggle_mic',
      title: isMicOn ? 'Mute Microphone' : 'Enable Live Microphone',
      subtitle: isMicOn ? 'Live mic input active' : 'Live mic input paused',
      category: 'Session & Uplink',
      icon: isMicOn ? '🎤' : '🚫',
      badge: isMicOn ? 'MIC ON' : 'MIC OFF',
      keywords: 'microphone mic audio input vad speech talk',
      action: () => { onToggleMic(); onClose(); }
    },
    {
      id: 'toggle_camera',
      title: isCameraOn ? 'Stop Camera Feed' : 'Start Camera Feed',
      subtitle: isCameraOn ? 'Webcam vision input active' : 'Webcam vision input off',
      category: 'Session & Uplink',
      icon: isCameraOn ? '📹' : '📷',
      badge: isCameraOn ? 'CAM ON' : 'CAM OFF',
      keywords: 'camera webcam video visual stream vision eye',
      action: () => { onToggleCamera(); onClose(); }
    },
    // --- AGENT FLEET SWITCHING ---
    ...agents.map(agent => ({
      id: `switch_agent_${agent.id}`,
      title: `Switch Agent: ${agent.handle.toUpperCase()}`,
      subtitle: `${agent.name} — ${agent.title || agent.bio.substring(0, 70)}...`,
      category: 'Switch Agent Persona',
      icon: agent.id === currentAgentId ? '★' : '👤',
      badge: agent.id === currentAgentId ? 'ACTIVE' : agent.accessLevel.toUpperCase(),
      keywords: `switch agent persona ${agent.handle} ${agent.name} ${agent.title || ''} ${agent.bio}`,
      action: () => { onSwitchAgent(agent.id); onClose(); }
    }))
  ];

  // Filtering based on query
  const filteredCommands = commands.filter(cmd => {
    if (!query.trim()) return true;
    const q = query.toLowerCase().trim();
    return (
      cmd.title.toLowerCase().includes(q) ||
      (cmd.subtitle && cmd.subtitle.toLowerCase().includes(q)) ||
      cmd.category.toLowerCase().includes(q) ||
      (cmd.keywords && cmd.keywords.toLowerCase().includes(q))
    );
  });

  // Focus input and reset selection when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Keep selected index within bounds
  useEffect(() => {
    if (selectedIndex >= filteredCommands.length) {
      setSelectedIndex(Math.max(0, filteredCommands.length - 1));
    }
  }, [filteredCommands.length, selectedIndex]);

  // Keyboard navigation inside palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + Math.max(1, filteredCommands.length)) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Ensure selected item is scrolled into view
  useEffect(() => {
    if (listRef.current) {
      const selectedEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay" 
      style={{ 
        justifyContent: 'center', 
        alignItems: 'flex-start', 
        paddingTop: '10vh',
        background: 'rgba(5, 5, 5, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999
      }}
      onClick={onClose}
    >
      <div 
        className="section-panel"
        style={{ 
          width: '100%', 
          maxWidth: '680px', 
          background: '#0d0d11', 
          borderColor: '#2e2e38',
          boxShadow: '0 25px 60px -15px rgba(0,0,0,0.9), 0 0 35px rgba(56, 189, 248, 0.15)',
          padding: 0,
          borderRadius: '10px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '75vh',
          animation: 'slideInDown 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP SEARCH BAR */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem', 
          padding: '1rem 1.25rem', 
          borderBottom: '1px solid #23232c',
          background: '#121218'
        }}>
          <span style={{ fontSize: '1.25rem', color: '#38bdf8' }}>⌘</span>
          <input
            ref={inputRef}
            type="text"
            className="w-full"
            placeholder="Type a command, tool name, or persona (e.g. 'Analyze File', 'Switch Agent')..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#f3f4f6',
              fontSize: '1rem',
              fontFamily: 'inherit',
              width: '100%'
            }}
          />
          {query && (
            <button
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '0.8rem' }}
            >
              CLEAR
            </button>
          )}
          <span style={{ 
            fontSize: '0.65rem', 
            color: '#9ca3af', 
            background: '#1f2937', 
            padding: '3px 7px', 
            borderRadius: '4px', 
            fontFamily: 'monospace',
            letterSpacing: '0.05em'
          }}>
            ESC TO EXIT
          </span>
        </div>

        {/* COMMAND LIST */}
        <div 
          ref={listRef}
          style={{ 
            overflowY: 'auto', 
            flex: 1, 
            padding: '0.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px'
          }}
        >
          {filteredCommands.length === 0 ? (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#6b7280' }}>
              <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem', opacity: 0.5 }}>⌕</div>
              <div style={{ fontSize: '0.9rem', color: '#e5e7eb' }}>No matching tools or actions found</div>
              <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Try searching for "Analyze", "Agent", "Focus", or "Dashboard"</div>
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={() => cmd.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.7rem 0.9rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                    border: isSelected ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid transparent',
                    transition: 'all 0.1s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isSelected ? 'rgba(56, 189, 248, 0.25)' : '#1a1a24',
                      color: isSelected ? '#38bdf8' : '#9ca3af',
                      fontSize: '1rem',
                      flexShrink: 0
                    }}>
                      {cmd.icon}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: 600, 
                        color: isSelected ? '#ffffff' : '#e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <span>{cmd.title}</span>
                        <span style={{ 
                          fontSize: '0.625rem', 
                          color: '#6b7280', 
                          fontWeight: 'normal',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>
                          [{cmd.category}]
                        </span>
                      </div>
                      {cmd.subtitle && (
                        <div style={{ 
                          fontSize: '0.72rem', 
                          color: isSelected ? '#cbd5e1' : '#6b7280', 
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          marginTop: '2px'
                        }}>
                          {cmd.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0, marginLeft: '0.75rem' }}>
                    {cmd.badge && (
                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: 'bold',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        background: isSelected ? 'rgba(56, 189, 248, 0.2)' : '#1e1e28',
                        color: isSelected ? '#38bdf8' : '#9ca3af',
                        border: '1px solid #333'
                      }}>
                        {cmd.badge}
                      </span>
                    )}
                    {isSelected && (
                      <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>↵</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* PALETTE FOOTER HINTS */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.6rem 1.25rem',
          borderTop: '1px solid #1f1f28',
          background: '#0a0a0f',
          fontSize: '0.7rem',
          color: '#6b7280'
        }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <span><kbd style={{ background: '#1c1c24', padding: '1px 5px', borderRadius: '3px', color: '#d1d5db' }}>↑</kbd> <kbd style={{ background: '#1c1c24', padding: '1px 5px', borderRadius: '3px', color: '#d1d5db' }}>↓</kbd> Navigate</span>
            <span><kbd style={{ background: '#1c1c24', padding: '1px 5px', borderRadius: '3px', color: '#d1d5db' }}>↵</kbd> Select</span>
            <span><kbd style={{ background: '#1c1c24', padding: '1px 5px', borderRadius: '3px', color: '#d1d5db' }}>esc</kbd> Dismiss</span>
          </div>
          <div>
            <span style={{ color: '#4ade80' }}>● GLOBAL HUD SHORTCUT: Cmd+K / Ctrl+K</span>
          </div>
        </div>
      </div>
    </div>
  );
};
