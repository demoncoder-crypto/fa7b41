import { describe, it, expect } from 'vitest';
import {
  getAvailablePrefillOptions,
  // getUpstreamNodeIds, // Also testable if desired
  // getTransitiveUpstreamNodeIds, // Also testable if desired
} from './prefillSources';
import type { AppNode, AppEdge, FormField, ApiFormDefinition } from '../types/graph';
import type { PrefillOption } from '../types/prefill';

// --- Mock Data for Tests ---
const mockFormAFields: FormField[] = [
  { id: 'a_email', name: 'Email', type: 'string', format: 'email' },
  { id: 'a_name', name: 'Name', type: 'string' },
];
const mockFormBFields: FormField[] = [
  { id: 'b_address', name: 'Address', type: 'string' },
  { id: 'b_phone', name: 'Phone', type: 'string' },
];
const mockFormCFields: FormField[] = [
  { id: 'c_notes', name: 'Notes', type: 'string' },
];

const mockNodes: AppNode[] = [
  {
    id: 'A', type: 'default', position: { x: 0, y: 0 },
    data: { label: 'Form A', fields: mockFormAFields, componentId: 'fa' },
  },
  {
    id: 'B', type: 'default', position: { x: 0, y: 0 },
    data: { label: 'Form B', fields: mockFormBFields, componentId: 'fb' },
  },
  {
    id: 'C', type: 'default', position: { x: 0, y: 0 },
    data: { label: 'Form C', fields: mockFormCFields, componentId: 'fc' },
  },
];

const mockEdges: AppEdge[] = [
  { id: 'eA-B', source: 'A', target: 'B' }, // A -> B
  { id: 'eB-C', source: 'B', target: 'C' }, // B -> C, so A -> B -> C
];

const targetFieldMock: FormField = { id: 'c_target_field', name: 'Target Field', type: 'string' };

// --- Tests --- 
describe('PrefillSources Logic', () => {
  describe('getAvailablePrefillOptions', () => {
    it('should return only global options for a node with no parents', () => {
      const targetNodeA = mockNodes.find(n => n.id === 'A')!;
      const options = getAvailablePrefillOptions(targetNodeA, targetFieldMock, mockNodes, []);
      expect(options.length).toBe(3); // Assuming 3 global options
      expect(options.every(opt => opt.sourceType === 'global')).toBe(true);
    });

    it('should identify direct dependencies for Node B (parent A)', () => {
      const targetNodeB = mockNodes.find(n => n.id === 'B')!;
      const options = getAvailablePrefillOptions(targetNodeB, targetFieldMock, mockNodes, mockEdges);
      
      const formAOptions = options.filter(opt => opt.sourceNodeId === 'A');
      expect(formAOptions.length).toBe(mockFormAFields.length);
      formAOptions.forEach(opt => {
        expect(opt.meta?.dependencyType).toBe('direct');
        expect(opt.label).toContain('Form A');
      });
    });

    it('should identify transitive dependencies for Node C (grandparent A)', () => {
      const targetNodeC = mockNodes.find(n => n.id === 'C')!;
      const options = getAvailablePrefillOptions(targetNodeC, targetFieldMock, mockNodes, mockEdges);

      const formAOptions = options.filter(opt => opt.sourceNodeId === 'A');
      expect(formAOptions.length).toBe(mockFormAFields.length);
      formAOptions.forEach(opt => {
        expect(opt.meta?.dependencyType).toBe('transitive');
        expect(opt.label).toContain('Form A');
      });
    });

    it('should identify direct dependencies for Node C (parent B)', () => {
        const targetNodeC = mockNodes.find(n => n.id === 'C')!;
        const options = getAvailablePrefillOptions(targetNodeC, targetFieldMock, mockNodes, mockEdges);
  
        const formBOptions = options.filter(opt => opt.sourceNodeId === 'B');
        expect(formBOptions.length).toBe(mockFormBFields.length);
        formBOptions.forEach(opt => {
          expect(opt.meta?.dependencyType).toBe('direct');
          expect(opt.label).toContain('Form B');
        });
      });

    it('should correctly include global options alongside form options', () => {
      const targetNodeC = mockNodes.find(n => n.id === 'C')!;
      const options = getAvailablePrefillOptions(targetNodeC, targetFieldMock, mockNodes, mockEdges);
      const globalOptionsCount = options.filter(opt => opt.sourceType === 'global').length;
      expect(globalOptionsCount).toBe(3);
      const formOptionsCount = options.filter(opt => opt.sourceType === 'form').length;
      // Form A fields + Form B fields
      expect(formOptionsCount).toBe(mockFormAFields.length + mockFormBFields.length);
    });
  });
}); 