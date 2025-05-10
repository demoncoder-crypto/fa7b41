// Defines the structure of a prefill configuration for a single field
export interface PrefillConfig {
  sourceNodeId: string;    // ID of the node from which data is being pulled
  sourceFieldId: string;   // ID of the field within the source node
  // Potentially add a source type (e.g., 'form', 'global') if needed for display or logic
  sourceType: 'form' | 'global'; 
  // Display labels for quick reference in UI, can be denormalized here
  sourceNodeLabel?: string;
  sourceFieldLabel?: string; 
}

// Represents an available option for prefilling
export interface PrefillOption {
  id: string; // Unique ID for this option, e.g., "formA.email" or "global.userName"
  label: string; // User-friendly label, e.g., "Form A - Email Field" or "Global - User Name"
  sourceNodeId: string; // For form fields, the ID of the source node
  sourceFieldId: string; // For form fields, the ID of the source field
  sourceType: 'form' | 'global';
  meta?: {
    dependencyType?: 'direct' | 'transitive';
  };
  // value?: any; // Actual value if it's a global constant, or for display
} 