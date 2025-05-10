import React, { useState, useMemo, useEffect } from 'react';
import type { AppNode, FormField } from '../../types/graph';
import type { PrefillOption } from '../../types/prefill';

interface GroupedOptions {
  sourceNodeId: string;
  sourceNodeLabel: string;
  sourceType: 'form' | 'global';
  fields: PrefillOption[];
}

interface PrefillSourceModalProps {
  availableOptions: PrefillOption[];
  allNodes: AppNode[];
  onClose: () => void;
  onSelectOption: (option: PrefillOption) => void;
}

export const PrefillSourceModal: React.FC<PrefillSourceModalProps> = ({
  availableOptions,
  allNodes,
  onClose,
  onSelectOption,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [selectedOption, setSelectedOption] = useState<PrefillOption | null>(null);

  const groupedAndFilteredOptions = useMemo(() => {
    const groups: Record<string, GroupedOptions> = {};

    availableOptions.forEach(opt => {
      if (!groups[opt.sourceNodeId]) {
        const nodeLabel = opt.sourceNodeLabel || 
                          (opt.sourceType === 'global' ? 'Global Data' : 
                           (allNodes.find(n => n.id === opt.sourceNodeId)?.data.label || opt.sourceNodeId));
        groups[opt.sourceNodeId] = {
          sourceNodeId: opt.sourceNodeId,
          sourceNodeLabel: nodeLabel,
          sourceType: opt.sourceType,
          fields: [],
        };
      }
      if (opt.label.toLowerCase().includes(searchTerm.toLowerCase())) {
        groups[opt.sourceNodeId].fields.push(opt);
      }
    });
    
    return Object.values(groups).filter(group => {
      if (searchTerm === '') return true; 
      return group.sourceNodeLabel.toLowerCase().includes(searchTerm.toLowerCase()) || group.fields.length > 0;
    });
  }, [availableOptions, searchTerm, allNodes]);

  useEffect(() => {
    if (selectedOption) {
      setExpandedNodes(prev => ({ ...prev, [selectedOption.sourceNodeId]: true }));
    }
  }, [selectedOption]);

  const toggleNodeExpansion = (nodeId: string) => {
    setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const handleSelect = () => {
    if (selectedOption) {
      onSelectOption(selectedOption);
    }
  };

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h4>Select data element to map</h4>
        </div>
        <input 
          type="text" 
          placeholder="Search..." 
          className="modal-search-bar"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="data-tree-container">
          {groupedAndFilteredOptions.length === 0 && <p>No matching data sources found.</p>}
          <ul className="tree-node">
            {groupedAndFilteredOptions.map(group => (
              <li key={group.sourceNodeId} className="tree-node-item">
                <div 
                  className={`tree-node-label ${expandedNodes[group.sourceNodeId] ? 'expanded' : ''}`}
                  onClick={() => toggleNodeExpansion(group.sourceNodeId)}
                >
                  <span className={`tree-toggler ${expandedNodes[group.sourceNodeId] ? 'expanded' : ''}`}></span>
                  {group.sourceNodeLabel}
                </div>
                {expandedNodes[group.sourceNodeId] && group.fields.length > 0 && (
                  <ul className="tree-node-children">
                    {group.fields.map(fieldOption => {
                      const fieldName = fieldOption.label.split(' - ').pop() || fieldOption.sourceFieldId;
                      return (
                        <li key={fieldOption.id} 
                            className={`tree-node-label ${selectedOption?.id === fieldOption.id ? 'selected' : ''}`}
                            onClick={() => setSelectedOption(fieldOption)}
                        >
                          {fieldName}
                        </li>
                      );
                    })}
                  </ul>
                )}
                {expandedNodes[group.sourceNodeId] && group.fields.length === 0 && searchTerm !== '' && (
                    <ul className="tree-node-children"><li><em style={{paddingLeft: '10px'}}>No matching fields in this group.</em></li></ul>
                )}
              </li>
            ))}
          </ul>
        </div>
        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>CANCEL</button>
          <button className="select-btn" onClick={handleSelect} disabled={!selectedOption}>SELECT</button>
        </div>
      </div>
    </div>
  );
}; 