import React from 'react';
import type { AppNode, FormField } from '../../types/graph';
import type { PrefillOption } from '../../types/prefill';
import '../../styles/global.css'; // Ensure styles are available

interface PrefillSourceModalProps {
  targetNode: AppNode;
  targetField: FormField;
  availableOptions: PrefillOption[];
  onClose: () => void;
  onSelectOption: (option: PrefillOption) => void;
}

export const PrefillSourceModal: React.FC<PrefillSourceModalProps> = ({
  targetNode,
  targetField,
  availableOptions,
  onClose,
  onSelectOption,
}) => {
  const directDepsOptions = availableOptions.filter(opt => opt.sourceType === 'form' && opt.meta?.dependencyType === 'direct');
  const transitiveDepsOptions = availableOptions.filter(opt => opt.sourceType === 'form' && opt.meta?.dependencyType === 'transitive');
  const globalDataOptions = availableOptions.filter(opt => opt.sourceType === 'global');

  console.log('[Modal] Direct Deps Options for UI:', JSON.parse(JSON.stringify(directDepsOptions)));
  console.log('[Modal] Transitive Deps Options for UI:', JSON.parse(JSON.stringify(transitiveDepsOptions)));
  console.log('[Modal] Global Data Options for UI:', JSON.parse(JSON.stringify(globalDataOptions)));

  return (
    <div className="modal" onClick={onClose}> {/* Close on backdrop click */}
      <div className="modal-content" onClick={(e) => e.stopPropagation()}> {/* Prevent close on content click */}
        <h4>Prefill "{targetField.name}" on "{targetNode.data.label}"</h4>
        <p>Select a data source:</p>

        {directDepsOptions.length > 0 && (
          <div className="data-source-section">
            <h5>From Directly Connected Forms (e.g., Form B for Form D)</h5>
            <ul>
              {directDepsOptions.map(option => (
                <li key={option.id} onClick={() => onSelectOption(option)}>
                  {option.label}
                </li>
              ))}
            </ul>
          </div>
        )}

        {transitiveDepsOptions.length > 0 && (
          <div className="data-source-section">
            <h5>From Transitive Dependencies (e.g., Form A for Form D)</h5>
            <ul>
              {transitiveDepsOptions.map(option => (
                <li key={option.id} onClick={() => onSelectOption(option)}>
                  {option.label}
                </li>
              ))}
            </ul>
          </div>
        )}

        {globalDataOptions.length > 0 && (
          <div className="data-source-section">
            <h5>From Global Data</h5>
            <ul>
              {globalDataOptions.map(option => (
                <li key={option.id} onClick={() => onSelectOption(option)}>
                  {option.label}
                </li>
              ))}
            </ul>
          </div>
        )}

        {(directDepsOptions.length === 0 && transitiveDepsOptions.length === 0 && globalDataOptions.length === 0) && (
          <p><em>No available prefill sources found for this field.</em></p>
        )}

        <button onClick={onClose} style={{ marginTop: '15px' }}>Cancel</button>
      </div>
    </div>
  );
}; 