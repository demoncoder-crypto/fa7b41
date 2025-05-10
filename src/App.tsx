import { useState, useEffect, useCallback } from 'react';
import ReactFlow, {
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  // NodeChange, // To be imported as type
  // EdgeChange, // To be imported as type
  addEdge,
  MarkerType,
  Position, // Import Position enum
} from 'reactflow';
import type { Connection, NodeChange, EdgeChange } from 'reactflow'; // Added NodeChange, EdgeChange here
import 'reactflow/dist/style.css';

import { fetchGraphData } from './services/api';
import type { AppNode, AppEdge, ApiGraphResponse, FormNodeData, FormField, ApiFormDefinition, ApiNode, ApiSchemaField } from './types/graph';
import { PrefillPanel } from './components/PrefillPanel/PrefillPanel';
import type { PrefillConfig } from './types/prefill';

// Helper to transform API data to React Flow compatible structure
// This also ensures nodes have a position for layout.
// A more sophisticated layout algorithm (Dagre, ELK) could be used for larger graphs.
const transformApiDataToFlow = (apiData: ApiGraphResponse): { nodes: AppNode[], edges: AppEdge[] } => {
  const formMap = new Map<string, ApiFormDefinition>(apiData.forms.map(form => [form.id, form]));

  const nodes: AppNode[] = apiData.nodes.map((apiNode: ApiNode, index: number) => {
    const formDefinition = formMap.get(apiNode.data.component_id);
    let extractedFields: FormField[] = [];

    if (formDefinition?.field_schema?.properties) {
      extractedFields = Object.entries(formDefinition.field_schema.properties)
        .map(([id, schema]: [string, ApiSchemaField]) => ({
          id: id,
          name: schema.title || id, // Use schema.title, fallback to field id
          type: schema.type,
          avantosType: schema.avantos_type, // Corrected to match graph.json (avantos_type)
          format: schema.format,
          items: schema.items,
        }));
    }

    return {
      id: apiNode.id,
      type: 'default', // Use 'default' for now, or map apiNode.type if it has meaning for React Flow types we define
      data: {
        label: apiNode.data.name, // This is "Form A", "Form B" etc.
        fields: extractedFields,
        componentId: apiNode.data.component_id,
      },
      position: apiNode.position || { x: (index % 5) * 250, y: Math.floor(index / 5) * 150 },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    };
  });

  const edges: AppEdge[] = apiData.edges.map((edge, index) => ({
    id: edge.id || `e${edge.source}-${edge.target}-${index}`, // Ensure unique edge ID
    source: edge.source,
    target: edge.target,
    markerEnd: { type: MarkerType.ArrowClosed },
  }));

  return { nodes, edges };
};

function App() {
  const [nodes, setNodes] = useState<AppNode[]>([]);
  const [edges, setEdges] = useState<AppEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<AppNode | null>(null);
  const [prefillConfigs, setPrefillConfigs] = useState<Record<string, Record<string, PrefillConfig>>>({}); // { nodeId: { fieldId: PrefillConfig } }
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const apiData = await fetchGraphData();
        const { nodes: flowNodes, edges: flowEdges } = transformApiDataToFlow(apiData);
        setNodes(flowNodes);
        setEdges(flowEdges);
      } catch (err) {
        console.error("Error loading graph:", err);
        setError(err instanceof Error ? err.message : 'Failed to load graph data. Check console.');
      }
      setIsLoading(false);
    };
    loadData();
  }, []);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds: AppNode[]) => applyNodeChanges(changes, nds)),
    [setNodes]
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds: AppEdge[]) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );
  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds: AppEdge[]) => addEdge(connection, eds)),
    [setEdges]
  );

  const onNodeClick = (_event: React.MouseEvent, node: AppNode) => {
    setSelectedNode(node);
  };

  const handleClosePanel = () => {
    setSelectedNode(null);
  };

  const handleUpdatePrefill = (nodeId: string, fieldId: string, config: PrefillConfig | null) => {
    setPrefillConfigs((prev: Record<string, Record<string, PrefillConfig>>) => {
      const newNodeConfigs = { ...(prev[nodeId] || {}) };
      if (config) {
        newNodeConfigs[fieldId] = config;
      } else {
        delete newNodeConfigs[fieldId];
      }
      return {
        ...prev,
        [nodeId]: newNodeConfigs,
      };
    });
  };

  if (isLoading) return <div style={{ padding: '20px' }}>Loading graph...</div>;
  if (error) return <div style={{ padding: '20px', color: 'red' }}>Error: {error} <button onClick={() => window.location.reload()}>Retry</button></div>;

  return (
    <div className="reactflow-wrapper">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        fitView
      >
        <Controls />
        <Background />
      </ReactFlow>
      {selectedNode && (
        <PrefillPanel
          node={selectedNode}
          prefillConfig={prefillConfigs[selectedNode.id] || {}}
          onClose={handleClosePanel}
          onUpdatePrefill={handleUpdatePrefill}
          allNodes={nodes} // Pass all nodes for dependency lookup
          allEdges={edges} // Pass all edges for dependency lookup
        />
      )}
    </div>
  );
}

export default App;
