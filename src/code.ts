figma.showUI(__html__, { width: 400, height: 200 });

/**
 * Converts an RGB color (with r, g, b normalized between 0 and 1) to a hex string.
 */
function rgbToHex({ r, g, b }: { r: number; g: number; b: number }): string {
  const toHex = (n: number) => {
    const hex = Math.round(n * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Checks if a value is a color (has r, g, b properties) and converts it to hex.
 */
function formatValue(value: any): any {
  if (value && typeof value === "object" && "r" in value && "g" in value && "b" in value) {
    return rgbToHex(value);
  }
  return value;
}

/**
 * Determines the type of a variable based on its value.
 */
function inferVariableType(value: any): string {
  if (value === null || value === undefined) return "Other";
  
  // Check for color
  if (typeof value === "object" && "r" in value && "g" in value && "b" in value) {
    return "Color";
  }
  
  // Check for variable alias
  if (typeof value === "object" && value.type === "VARIABLE_ALIAS") {
    return "Alias";
  }
  
  // Check for primitive types
  if (typeof value === "number") {
    return "Number";
  }
  
  if (typeof value === "string") {
    return "String";
  }
  
  if (typeof value === "boolean") {
    return "Boolean";
  }
  
  // Default fallback
  return "Other";
}

/**
 * Mapping from Figma mode IDs to human-readable names.
 */
const modeMapping: Record<string, string> = {
  "1:0": "Base",
  "2.0": "Light"
};

/**
 * Processes the valuesByMode object: converts each mode's value (if a color) to hex
 * and replaces the key with a mapped mode name if available.
 */
function formatValuesByMode(valuesByMode: Record<string, any>): Record<string, any> {
  const formatted: Record<string, any> = {};
  for (const mode in valuesByMode) {
    const mappedMode = modeMapping[mode] || mode;
    formatted[mappedMode] = formatValue(valuesByMode[mode]);
  }
  return formatted;
}

/**
 * Groups variables by their first path segment.
 */
function groupVariablesByFirstSegment(variables: any[]): Record<string, any[]> {
  const groups: Record<string, any[]> = {};
  
  variables.forEach(variable => {
    if (variable.name.includes('/')) {
      const segments = variable.name.split('/');
      const firstSegment = segments[0];
      const restOfName = segments.slice(1).join('/');
      
      if (!groups[firstSegment]) {
        groups[firstSegment] = [];
      }
      
      groups[firstSegment].push({
        ...variable,
        name: restOfName
      });
    } else {
      if (!groups[variable.name]) {
        groups[variable.name] = [];
      }
      
      // For variables without slashes, we create a group with the variable name
      // and put the variable itself inside that group
      groups[variable.name].push({
        ...variable,
        name: variable.name
      });
    }
  });
  
  return groups;
}

/**
 * Recursively processes variables to create the nested structure.
 */
function processVariablesRecursively(variables: any[]): any[] {
  // Group variables by their first path segment
  const groups = groupVariablesByFirstSegment(variables);
  
  // Convert the groups to the desired array format
  return Object.entries(groups).map(([groupName, groupVariables]) => {
    // Check if these variables need further processing
    const needsMoreProcessing = groupVariables.some(v => v.name.includes('/'));
    
    if (needsMoreProcessing) {
      // Process this group recursively
      return { [groupName]: processVariablesRecursively(groupVariables) };
    } else {
      // This is a leaf group, just return the variables
      return { [groupName]: groupVariables.map(v => ({
        id: v.id,
        name: v.name,
        type: v.type,
        valuesByMode: v.valuesByMode
      }))};
    }
  });
}

/**
 * Groups all Figma variables by collection and formats their values.
 */
function groupVariablesByCollection() {
  const allVariables = figma.variables.getLocalVariables();
  const collections: Record<string, any[]> = {};

  // First, group variables by collection
  allVariables.forEach(variable => {
    const collection = figma.variables.getVariableCollectionById(variable.variableCollectionId);
    const collectionName = collection ? collection.name : "Uncategorized";
    
    if (!collections[collectionName]) {
      collections[collectionName] = [];
    }

    // Get the first value to determine type
    const valueAnyMode = Object.values(variable.valuesByMode)[0];
    const varType = inferVariableType(valueAnyMode);

    // Add the variable to its collection
    collections[collectionName].push({
      id: variable.id,
      name: variable.name,
      type: varType,
      valuesByMode: formatValuesByMode(variable.valuesByMode)
    });
  });

  // Then, process each collection to create the nested structure
  const result: Record<string, any[]> = {};
  for (const [collectionName, variables] of Object.entries(collections)) {
    result[collectionName] = processVariablesRecursively(variables);
  }

  return result;
}

figma.ui.onmessage = (msg) => {
  if (msg.type === "export-variables") {
    const variablesByCollection = groupVariablesByCollection();
    const jsonData = JSON.stringify(variablesByCollection, null, 2);
    
    figma.ui.postMessage({ 
      type: "download", 
      data: jsonData,
      filename: "figma-variables.json"
    });
    
    figma.notify("Variables processed! Download should start automatically.");
  }
};