import type { ApiGraphResponse } from '../types/graph';

// Using placeholder values for namespace and blueprint_id as the mock server path requires them.
// These might need to be configurable or discovered in a real scenario.
const MOCK_API_NAMESPACE = 'test-namespace';
const MOCK_API_BLUEPRINT_ID = 'test-blueprint';

const API_BASE_URL = 'http://localhost:3000'; // Mock server URL
const GRAPH_ENDPOINT = `/api/v1/${MOCK_API_NAMESPACE}/actions/blueprints/${MOCK_API_BLUEPRINT_ID}/graph`;

export const fetchGraphData = async (): Promise<ApiGraphResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}${GRAPH_ENDPOINT}`);
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorData}`);
    }
    const data: ApiGraphResponse = await response.json();
    
    // The mock graph.json has nodes under a "nodes" key and edges under an "edges" key directly.
    // But it seems it's an object with { id, name, forms: { nodes, edges } }
    // Let's check the actual structure of graph.json from the server files.
    // For now, assuming direct nodes/edges as per typical graph libs, adjust if server differs.
    // The provided server serves graph.json directly, which seems to be an object with nodes and edges keys at the top level.
    return data;
  } catch (error) {
    console.error("Failed to fetch graph data:", error);
    // In a real app, handle this more gracefully (e.g., show error to user)
    // For the challenge, re-throwing allows the caller to see the issue.
    throw error;
  }
}; 