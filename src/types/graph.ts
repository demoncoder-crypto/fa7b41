import type { Node as RFNode, Edge as RFEdge } from 'reactflow';
import { Position } from 'reactflow'; // Position is an enum, so it's a value import

// Represents a field as defined in the API's field_schema.properties
export interface ApiSchemaField {
  // id is the key of this field in the properties object
  title?: string;        // Display name of the field (e.g., "Email Address")
  type: string;        // JSON schema type (e.g., "string", "object")
  avantos_type?: string; // Custom Avantos type (e.g., "short-text") - Note: changed from avantosType to match graph.json
  format?: string;      // e.g., "email"
  items?: { enum?: string[], type?: string }; // For arrays
  properties?: Record<string, ApiSchemaField>; // For nested objects
  // Add any other properties from field_schema that might be needed
}

// Our internal representation of a field, adapted for the UI
export interface FormField {
  id: string;          // The key of the field in properties (e.g., "email")
  name: string;        // User-friendly name (derived from title or id)
  type: string;        // JSON schema type
  avantosType?: string; // Custom Avantos type
  format?: string;
  items?: { enum?: string[], type?: string };
}

// Represents the data associated with a form node in our React Flow graph
export interface FormNodeData {
  label: string;       // The name of the form (e.g., "Form A")
  fields: FormField[]; // List of fields in this form, adapted for UI
  componentId: string; // Original component_id from the API node data
}

// Our application's representation of a node, extending React Flow's Node type
// It uses FormNodeData for its data payload.
export type AppNode = RFNode<FormNodeData>;

// Our application's representation of an edge, can be a basic React Flow Edge
export type AppEdge = RFEdge;

// Simplified structure of a form definition from the top-level "forms" array in API response
export interface ApiFormDefinition {
  id: string; 
  name: string; 
  field_schema?: {
    type?: string; 
    properties?: Record<string, ApiSchemaField>; // Use ApiSchemaField here
    required?: string[];
  };
}

export interface ApiGraphResponseNodeData {
    id: string; 
    component_key: string; 
    component_type: string; 
    component_id: string; 
    name: string; 
}

export interface ApiNode {
    id: string; 
    type: string; 
    position: { x: number; y: number };
    data: ApiGraphResponseNodeData;
}

export interface ApiEdge {
    id?: string; 
    source: string;
    target: string;
}

export interface ApiGraphResponse {
  id: string; 
  name: string; 
  nodes: ApiNode[];
  edges: ApiEdge[];
  forms: ApiFormDefinition[];
} 