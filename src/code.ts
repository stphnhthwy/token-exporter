// Function to format keys
function formatKey(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, " ") // Remove non-alphanumeric characters
             .split(" ") // Split by spaces
             .map((word, index) => index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1))
             .join(""); // Convert to camelCase
}

// Function to assign nested objects
function assignNestedObject(obj: any, path: string[], value: any) {
  let current = obj;
  for (let i = 0; i < path.length - 1; i++) {
    if (!current[path[i]]) {
      current[path[i]] = {};
    }
    current = current[path[i]];
  }
  current[path[path.length - 1]] = value;
}

function rgbaToHex(r: number, g: number, b: number, a: number = 1): string {
  const toHex = (value: number) => Math.round(value * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}${a < 1 ? toHex(a) : ""}`.toUpperCase();
}

// Function to find token path by ID
function findTokenPathById(output: Record<string, any>, targetId: string): string | null {
  function search(obj: any, path: string[]): string | null {
    for (let key in obj) {
      if (typeof obj[key] === "object") {
        const currentPath = path.concat(key).join(".");

        // Check inside `valuesByMode`
        if (obj[key].valuesByMode) {
          for (const mode in obj[key].valuesByMode) {
            if (
              obj[key].valuesByMode[mode]?.$type === "VARIABLE_ALIAS" &&
              obj[key].valuesByMode[mode]?.$id === targetId
            ) {
              return currentPath;
            }
          }
        }

        // Check inside `$value`
        if (obj[key].$value && obj[key].$value.$type === "VARIABLE_ALIAS" && obj[key].$value.$id === targetId) {
          return currentPath;
        }

        // Recursively search deeper
        let found = search(obj[key], path.concat(key));
        if (found) return found;
      }
    }
    return null;
  }
  return search(output, []);
}

figma.showUI(__html__, { width: 800, height: 600 });

// Move fullJsonExport outside the function to make it accessible
let fullJsonExport: Record<string, any> = {};

async function exportToJSON() {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const allVariables = await figma.variables.getLocalVariablesAsync();
  let output: Record<string, any> = {};

  for (const collection of collections) {
    let collectionName = formatKey(collection.name);
    output[collectionName] = {};

    const collectionVariables = allVariables.filter(v => v.variableCollectionId === collection.id);

    for (const variable of collectionVariables) {
      let pathParts = variable.name.split("/").map(part => formatKey(part));

      let valuesByMode: Record<string, any> = {};
      for (const mode of collection.modes) {
        const modeName = formatKey(mode.name || mode.modeId);
        let modeValue = variable.valuesByMode[mode.modeId];
      
        if (modeValue !== undefined) {
          if (typeof modeValue === "object" && "id" in modeValue) {
            // Handle variable references according to the spec
            const referencedVar = allVariables.find(v => v.id === modeValue.id);
            if (referencedVar) {
              const refCollection = collections.find(c => c.id === referencedVar.variableCollectionId);
              const refCollectionName = refCollection ? formatKey(refCollection.name) : formatKey(referencedVar.variableCollectionId);
              valuesByMode[modeName] = {
                "$type": "color",
                "$value": `{${refCollectionName}.${referencedVar.name.split("/").map(formatKey).join(".")}}`
              };
            }
          } else if (typeof modeValue === "object" && "r" in modeValue && "g" in modeValue && "b" in modeValue) {
            valuesByMode[modeName] = {
              "$type": "color",
              "$value": rgbaToHex(modeValue.r, modeValue.g, modeValue.b, "a" in modeValue ? modeValue.a : 1)
            };
          } else {
            valuesByMode[modeName] = modeValue;
          }
        }
      }

      assignNestedObject(output[collectionName], pathParts, {
        "$type": variable.resolvedType.toLowerCase(),
        "$value": valuesByMode
      });
    }
  }

  // Store the processed data
  fullJsonExport = output;
}

// Single consolidated message handler
figma.ui.onmessage = async (msg) => {
  console.log('Plugin received message:', msg); // Debug log
  
  if (msg.type === "export") {
    await exportToJSON();
    console.log('Sending JSON data:', fullJsonExport); // Debug log
    figma.ui.postMessage({ 
      type: "jsonData", 
      json: fullJsonExport 
    });
  } 
  else if (msg.type === "loadJson") {
    let jsonToSend;
    if (msg.collection === "all") {
      jsonToSend = fullJsonExport;
    } else {
      jsonToSend = fullJsonExport[msg.collection] || {};
    }
    console.log('Sending collection data:', jsonToSend); // Debug log
    figma.ui.postMessage({ 
      type: "jsonData", 
      json: jsonToSend 
    });
  }
};