import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PrefillPanel } from './PrefillPanel'; // Adjust path as needed
import type { AppNode, AppEdge, FormField } from '../../types/graph';
import type { PrefillConfig } from '../../types/prefill';

// Mock for PrefillSourceModal as it's complex and not the focus of these tests
vi.mock('../PrefillSourceModal/PrefillSourceModal', () => ({
  PrefillSourceModal: vi.fn(({ onClose }) => <div data-testid="mock-prefill-modal"><button onClick={onClose}>Close Mock Modal</button></div>),
}));

const mockSimpleNode: AppNode = {
  id: 'node1',
  type: 'default',
  position: { x: 0, y: 0 },
  data: {
    label: 'Test Form 1',
    componentId: 'form1',
    fields: [
      { id: 'fieldA', name: 'Field A', type: 'text' },
      { id: 'fieldB', name: 'Field B', type: 'text' },
    ],
  },
};

const mockEmptyNode: AppNode = {
    id: 'node2',
    type: 'default',
    position: { x: 0, y: 0 },
    data: {
      label: 'Empty Form',
      componentId: 'form2',
      fields: [],
    },
  };

describe('PrefillPanel Component', () => {
  const mockOnClose = vi.fn();
  const mockOnUpdatePrefill = vi.fn();
  const mockAllNodes: AppNode[] = [mockSimpleNode, mockEmptyNode];
  const mockAllEdges: AppEdge[] = []; // Explicitly typed

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnUpdatePrefill.mockClear();
    // Clear any spies if they are set up outside of tests, e.g., consoleSpy
    vi.restoreAllMocks(); 
  });

  it('renders the panel header and toggle', () => {
    render(
      <PrefillPanel 
        node={mockSimpleNode} 
        prefillConfig={{}} 
        onClose={mockOnClose} 
        onUpdatePrefill={mockOnUpdatePrefill} 
        allNodes={mockAllNodes} 
        allEdges={mockAllEdges} 
      />
    );
    expect(screen.getByText('Prefill')).toBeInTheDocument();
    expect(screen.getByText(`Prefill fields for this form (${mockSimpleNode.data.label})`)).toBeInTheDocument();
    expect(screen.getByText('Enable Prefill for this form')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument(); // The toggle input
  });

  it('renders a message if the form has no fields', () => {
    render(
        <PrefillPanel 
          node={mockEmptyNode} 
          prefillConfig={{}} 
          onClose={mockOnClose} 
          onUpdatePrefill={mockOnUpdatePrefill} 
          allNodes={mockAllNodes} 
          allEdges={mockAllEdges} 
        />
      );
      expect(screen.getByText('This form has no fields.')).toBeInTheDocument();
  });

  it('renders field items for a form with fields', () => {
    render(
      <PrefillPanel 
        node={mockSimpleNode} 
        prefillConfig={{}} 
        onClose={mockOnClose} 
        onUpdatePrefill={mockOnUpdatePrefill} 
        allNodes={mockAllNodes} 
        allEdges={mockAllEdges} 
      />
    );
    mockSimpleNode.data.fields.forEach(field => {
      expect(screen.getByText(field.name)).toBeInTheDocument();
    });
    // Check for the plus icon for unconfigured fields
    expect(screen.getAllByText('+').length).toBe(mockSimpleNode.data.fields.length);
  });

  it('displays configured prefill information correctly', () => {
    const prefill: PrefillConfig = {
      sourceNodeId: 'sourceNode', sourceFieldId: 'sourceField', sourceType: 'form',
      sourceNodeLabel: 'Source Form', sourceFieldLabel: 'Source Field Name'
    };
    render(
      <PrefillPanel 
        node={mockSimpleNode} 
        prefillConfig={{ 'fieldA': prefill }} 
        onClose={mockOnClose} 
        onUpdatePrefill={mockOnUpdatePrefill} 
        allNodes={mockAllNodes} 
        allEdges={mockAllEdges} 
      />
    );
    expect(screen.getByText('Source Form.Source Field Name')).toBeInTheDocument();
    // Also check that the other field is still unconfigured
    expect(screen.getByText('Field B').closest('.field-item-container')?.querySelector('.prefill-mapping-text')).toBeNull();
  });

  it('calls onUpdatePrefill with null when clearing a prefill', () => {
    const prefill: PrefillConfig = {
        sourceNodeId: 'sourceNode', sourceFieldId: 'sourceField', sourceType: 'form',
        sourceNodeLabel: 'Source Form', sourceFieldLabel: 'Source Field Name'
      };
    render(
      <PrefillPanel 
        node={mockSimpleNode} 
        prefillConfig={{ 'fieldA': prefill }} 
        onClose={mockOnClose} 
        onUpdatePrefill={mockOnUpdatePrefill} 
        allNodes={mockAllNodes} 
        allEdges={mockAllEdges} 
      />
    );
    const clearButton = screen.getByTitle('Clear Prefill');
    fireEvent.click(clearButton);
    expect(mockOnUpdatePrefill).toHaveBeenCalledWith(mockSimpleNode.id, 'fieldA', null);
  });

  it('opens the modal when an unconfigured field item is clicked', () => {
    render(
      <PrefillPanel 
        node={mockSimpleNode} 
        prefillConfig={{}} 
        onClose={mockOnClose} 
        onUpdatePrefill={mockOnUpdatePrefill} 
        allNodes={mockAllNodes} 
        allEdges={mockAllEdges} 
      />
    );
    const fieldAItem = screen.getByText('Field A').closest('.field-item-container');
    if (fieldAItem) {
        fireEvent.click(fieldAItem);
        // Check if the mock modal is rendered (since actual modal opening involves state change)
        expect(screen.getByTestId('mock-prefill-modal')).toBeInTheDocument();
    } else {
        throw new Error("Field A item not found for modal test");
    }
  });

  it('disables field configuration if master toggle is off', async () => {
    const { container } = render(
      <PrefillPanel 
        node={mockSimpleNode} 
        prefillConfig={{}} 
        onClose={mockOnClose} 
        onUpdatePrefill={mockOnUpdatePrefill} 
        allNodes={mockAllNodes} 
        allEdges={mockAllEdges} 
      />
    );
    
    const panelDiv = container.firstChild as HTMLElement;
    expect(panelDiv).toHaveAttribute('data-prefill-enabled', 'true');

    const toggle = screen.getByRole('checkbox');
    fireEvent.click(toggle); // Click to disable

    await waitFor(() => {
      expect(panelDiv).toHaveAttribute('data-prefill-enabled', 'false');
    });

    // Now that we've confirmed the state update via data-attribute, check the class
    const fieldAItem = screen.getByText('Field A').closest('.field-item-container');
    expect(fieldAItem).toHaveClass('disabled');
    expect(fieldAItem).not.toHaveAttribute('title', `Configure prefill for Field A`);
    
    const fieldAIconContainer = fieldAItem?.lastChild;
    const plusIcon = Array.from(fieldAIconContainer?.childNodes || []).find(node => node.textContent === '+');
    expect(plusIcon).toBeUndefined();

    if (fieldAItem) fireEvent.click(fieldAItem);
    expect(screen.queryByTestId('mock-prefill-modal')).toBeNull();
  });

}); 