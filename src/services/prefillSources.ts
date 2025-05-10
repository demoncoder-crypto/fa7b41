import type { AppNode, AppEdge, FormField } from '../types/graph';
import type { PrefillOption } from '../types/prefill';

// --- Graph Traversal Utilities ---

const getUpstreamNodeIds = (targetNodeId: string, edges: AppEdge[]): string[] => {
  return edges.filter(edge => edge.target === targetNodeId).map(edge => edge.source);
};

const getTransitiveUpstreamNodeIds = (targetNodeId: string, nodes: AppNode[], edges: AppEdge[]): string[] => {
  const directUpstream = getUpstreamNodeIds(targetNodeId, edges);
  const allUpstream = new Set<string>(directUpstream);
  const queue = [...directUpstream];

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (currentId) {
      const parents = getUpstreamNodeIds(currentId, edges);
      parents.forEach(parentId => {
        if (!allUpstream.has(parentId)) {
          allUpstream.add(parentId);
          queue.push(parentId);
        }
      });
    }
  }
  return Array.from(allUpstream);
};

// --- Data Source Providers (Conceptual) ---
// In a more advanced setup, these could be classes implementing an IDataSource interface.

const getDirectDependencyOptions = (
  targetNode: AppNode,
  _targetField: FormField, // Target field might be used for type compatibility checks later
  allNodes: AppNode[],
  allEdges: AppEdge[],
): PrefillOption[] => {
  const options: PrefillOption[] = [];
  const directUpstreamIds = getUpstreamNodeIds(targetNode.id, allEdges);

  directUpstreamIds.forEach(sourceNodeId => {
    const sourceNode = allNodes.find(n => n.id === sourceNodeId);
    if (sourceNode) {
      sourceNode.data.fields.forEach((sourceField: FormField) => {
        options.push({
          id: `${sourceNode.id}.${sourceField.id}`,
          label: `${sourceNode.data.label} - ${sourceField.name}`,
          sourceNodeId: sourceNode.id,
          sourceFieldId: sourceField.id,
          sourceType: 'form',
          meta: { dependencyType: 'direct' },
        });
      });
    }
  });
  return options;
};

const getTransitiveDependencyOptions = (
  targetNode: AppNode,
  _targetField: FormField,
  allNodes: AppNode[],
  allEdges: AppEdge[],
): PrefillOption[] => {
  const options: PrefillOption[] = [];
  const allUpstreamIds = getTransitiveUpstreamNodeIds(targetNode.id, allNodes, allEdges);
  const directUpstreamIds = getUpstreamNodeIds(targetNode.id, allEdges); // To exclude direct ones
  const transitiveOnlyIds: string[] = [];

  allUpstreamIds.forEach(sourceNodeId => {
    if (directUpstreamIds.includes(sourceNodeId)) return; // Already covered by direct

    if (!directUpstreamIds.includes(sourceNodeId)) {
      transitiveOnlyIds.push(sourceNodeId);
      const sourceNode = allNodes.find(n => n.id === sourceNodeId);
      if (sourceNode) {
        sourceNode.data.fields.forEach((sourceField: FormField) => {
          options.push({
            id: `${sourceNode.id}.${sourceField.id}`,
            label: `${sourceNode.data.label} - ${sourceField.name}`,
            sourceNodeId: sourceNode.id,
            sourceFieldId: sourceField.id,
            sourceType: 'form',
            meta: { dependencyType: 'transitive' },
          });
        });
      }
    }
  });
  return options;
};

const getGlobalDataOptions = (
  _targetNode: AppNode, // Included for consistent signature, might be used later
  _targetField: FormField,
): PrefillOption[] => {
  // Mock global data as per challenge instructions
  // "For 3, you can ignore Action Properties and Client Organization Properties and use whatever global data you want."
  const mockGlobalData: PrefillOption[] = [
    {
      id: 'global.currentUserEmail',
      label: 'Global - Current User Email',
      sourceNodeId: 'global', // Special ID for global sources
      sourceFieldId: 'currentUserEmail',
      sourceType: 'global',
    },
    {
      id: 'global.currentDate',
      label: 'Global - Current Date',
      sourceNodeId: 'global',
      sourceFieldId: 'currentDate',
      sourceType: 'global',
    },
    {
      id: 'global.clientName',
      label: 'Global - Client Name (Mocked)',
      sourceNodeId: 'global',
      sourceFieldId: 'clientName',
      sourceType: 'global',
    },
  ];
  return mockGlobalData;
};

// --- Main Orchestrator ---

export const getAvailablePrefillOptions = (
  targetNode: AppNode,
  targetField: FormField,
  allNodes: AppNode[],
  allEdges: AppEdge[],
): PrefillOption[] => {
  // "You should design your code so that any combination of these data sources can be easily used without code changes.
  // Moreover, you should design for easy support of future, new data sources."
  // This array acts as a registry of data source providers.
  // To add a new source, add its provider function here.
  const dataSourceProviders = [
    getDirectDependencyOptions,
    getTransitiveDependencyOptions,
    getGlobalDataOptions,
    // Future providers can be added here, e.g.:
    // getSiblingNodeOptions, // If forms at the same level could prefill each other
    // getExternalApiOptions, // If data could come from another API call
  ];

  let allOptions: PrefillOption[] = [];
  dataSourceProviders.forEach(provider => {
    allOptions = allOptions.concat(provider(targetNode, targetField, allNodes, allEdges));
  });

  return allOptions;
}; 