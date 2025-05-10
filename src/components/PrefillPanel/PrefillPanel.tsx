import React, { useMemo } from 'react';
import type { AppNode, AppEdge, FormField } from '../../types/graph';
import type { PrefillConfig, PrefillOption } from '../../types/prefill';
import { PrefillSourceModal } from '../PrefillSourceModal/PrefillSourceModal';
import { getAvailablePrefillOptions } from '../../services/prefillSources';
import '../../styles/global.css'; // Ensure styles are available

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
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedFieldForPrefill, setSelectedFieldForPrefill] = React.useState<FormField | null>(null);

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
    if (!selectedFieldForPrefill) {
      return [];
    }
    return getAvailablePrefillOptions(node, selectedFieldForPrefill, allNodes, allEdges);
  }, [node, selectedFieldForPrefill, allNodes, allEdges]);

  return (
    <div className="prefill-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Prefill Config: {node.data.label}</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5em', cursor: 'pointer' }}>&times;</button>
      </div>
      {node.data.fields.length === 0 && <p>This form has no fields.</p>}
      {node.data.fields.map(field => {
        const currentPrefill = prefillConfig[field.id];
        return (
          <div key={field.id} className="field-config">
            <div className="field-config-header">
              <strong>{field.name}</strong> (ID: {field.id}, Type: {field.type})
              <div>
                {currentPrefill && (
                  <button onClick={() => handleClearPrefill(field.id)} className="clear-button" title="Clear Prefill">
                    &times;
                  </button>
                )}
                <button onClick={() => handleOpenModal(field)} className="add-button" title="Configure Prefill">
                  +&#x2190;
                </button>
              </div>
            </div>
            {currentPrefill ? (
              <p>
                Prefilled from: <strong>{currentPrefill.sourceNodeLabel || currentPrefill.sourceNodeId}</strong>
                {' -> '}<strong>{currentPrefill.sourceFieldLabel || currentPrefill.sourceFieldId}</strong>
                <em> ({currentPrefill.sourceType})</em>
              </p>
            ) : (
              <p><em>No prefill configured.</em></p>
            )}
          </div>
        );
      })}
      {isModalOpen && selectedFieldForPrefill && (
        <PrefillSourceModal
          targetNode={node}
          targetField={selectedFieldForPrefill}
          availableOptions={availableOptions}
          onClose={handleCloseModal}
          onSelectOption={handleSelectPrefillOption}
        />
      )}
    </div>
  );
}; 