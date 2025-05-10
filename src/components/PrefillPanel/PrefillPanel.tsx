import React, { useState, useMemo } from 'react';
import type { AppNode, AppEdge, FormField } from '../../types/graph';
import type { PrefillConfig, PrefillOption } from '../../types/prefill';
import { PrefillSourceModal } from '../PrefillSourceModal/PrefillSourceModal';
import { getAvailablePrefillOptions } from '../../services/prefillSources';
// Removed direct import of global.css as it's imported in main.tsx

// SVG Icon components (can be moved to a separate file if desired)
const DatabaseIcon = () => (
  <svg className="db-icon" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 1c-2.485 0-4.5 1.343-4.5 3s2.015 3 4.5 3c2.485 0 4.5-1.343 4.5-3S10.485 1 8 1zm0 5c-1.933 0-3.5-1.007-3.5-2S6.067 2 8 2s3.5 1.007 3.5 2S9.933 6 8 6z"/>
    <path d="M8 7c-2.485 0-4.5 1.343-4.5 3s2.015 3 4.5 3c2.485 0 4.5-1.343 4.5-3S10.485 7 8 7zm0 5c-1.933 0-3.5-1.007-3.5-2s1.567-2 3.5-2 3.5 1.007 3.5 2S9.933 12 8 12z"/>
    <path d="M3.5 10.002c0 .085.004.168.01.25C3.504 10.169 3.5 10.086 3.5 10v3c0 1.657 2.015 3 4.5 3s4.5-1.343 4.5-3v-3c0-.085-.004-.168-.01-.25.006.082.01.165.01.25V13c0 1.102-.897 2-2.5 2h-4C4.897 15 4 13.98 4 13v-2.998z"/>
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" d="M8 7.293l3.646-3.647a.5.5 0 01.708.708L8.707 8l3.647 3.646a.5.5 0 01-.708.708L8 8.707l-3.646 3.647a.5.5 0 01-.708-.708L7.293 8 3.646 4.354a.5.5 0 11.708-.708L8 7.293z" clipRule="evenodd"/>
  </svg>
);

interface PrefillPanelProps {
  node: AppNode;
  prefillConfig: Record<string, PrefillConfig>; // { fieldId: PrefillConfig }
  onClose: () => void;
  onUpdatePrefill: (nodeId: string, fieldId: string, config: PrefillConfig | null) => void;
  allNodes: AppNode[];
  allEdges: AppEdge[];
}

export const PrefillPanel: React.FC<PrefillPanelProps> = ({
  node,
  prefillConfig,
  onClose,
  onUpdatePrefill,
  allNodes,
  allEdges,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFieldForPrefill, setSelectedFieldForPrefill] = useState<FormField | null>(null);
  const [prefillEnabled, setPrefillEnabled] = useState(true); // For the toggle

  const handleOpenModal = (field: FormField) => {
    setSelectedFieldForPrefill(field);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedFieldForPrefill(null);
  };

  const handleSelectPrefillOption = (option: PrefillOption) => {
    if (selectedFieldForPrefill) {
      const newConfig: PrefillConfig = {
        sourceNodeId: option.sourceNodeId,
        sourceFieldId: option.sourceFieldId,
        sourceType: option.sourceType,
        sourceNodeLabel: allNodes.find(n => n.id === option.sourceNodeId)?.data.label,
        sourceFieldLabel: allNodes.find(n => n.id === option.sourceNodeId)?.data.fields.find(f => f.id === option.sourceFieldId)?.name,
      };
      onUpdatePrefill(node.id, selectedFieldForPrefill.id, newConfig);
    }
    handleCloseModal();
  };

  const handleClearPrefill = (fieldId: string) => {
    onUpdatePrefill(node.id, fieldId, null);
  };

  const availableOptions = useMemo(() => {
    if (!selectedFieldForPrefill) return [];
    return getAvailablePrefillOptions(node, selectedFieldForPrefill, allNodes, allEdges);
  }, [node, selectedFieldForPrefill, allNodes, allEdges]);

  return (
    <div className="prefill-panel">
      <button onClick={onClose} className="close-panel-btn" title="Close Panel" 
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '1.5em', cursor: 'pointer', color: '#888' }}>
        &times;
      </button>
      
      <div className="prefill-panel-header">
        <h2>Prefill</h2>
        <p>Prefill fields for this form ({node.data.label})</p>
      </div>

      <div className="prefill-toggle-container">
        <span>Enable Prefill for this form</span>
        <label className="toggle-switch">
          <input type="checkbox" checked={prefillEnabled} onChange={() => setPrefillEnabled(!prefillEnabled)} />
          <span className="slider"></span>
        </label>
      </div>

      {node.data.fields.length === 0 && <p>This form has no fields.</p>}
      {node.data.fields.map(field => {
        const currentPrefill = prefillConfig[field.id];
        return (
          <div 
            key={field.id} 
            className={`field-item-container ${currentPrefill ? 'field-item-configured' : 'field-item-unconfigured'}`}
            onClick={!currentPrefill ? () => handleOpenModal(field) : undefined}
            title={!currentPrefill ? `Configure prefill for ${field.name}` : ''}
          >
            <div className="field-info">
              <DatabaseIcon />
              <span className="field-name">{field.name}</span>
            </div>
            {currentPrefill ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="prefill-mapping-text">
                  {currentPrefill.sourceNodeLabel || currentPrefill.sourceNodeId}.{currentPrefill.sourceFieldLabel || currentPrefill.sourceFieldId}
                </span>
                <button onClick={(e) => { e.stopPropagation(); handleClearPrefill(field.id); }} className="clear-prefill-btn" title="Clear Prefill">
                  <CloseIcon />
                </button>
              </div>
            ) : (
              <span style={{color: '#007bff', fontSize: '1.5em'}}>+</span> // Simple plus icon for unconfigured
            )}
          </div>
        );
      })}

      {isModalOpen && selectedFieldForPrefill && (
        <PrefillSourceModal
          availableOptions={availableOptions}
          allNodes={allNodes}
          onClose={handleCloseModal}
          onSelectOption={handleSelectPrefillOption}
        />
      )}
    </div>
  );
}; 