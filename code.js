"use strict";
figma.showUI(__html__, { width: 400, height: 400 });
/**
 * Converts an RGB color (with r, g, b normalized between 0 and 1) to a hex string.
 */
function rgbToHex({ r, g, b }) {
    const toHex = (n) => {
        const hex = Math.round(n * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
/**
 * Checks if a value is a color (has r, g, b properties) and converts it to hex.
 */
function formatValue(value) {
    if (value && typeof value === "object" && "r" in value && "g" in value && "b" in value) {
        return rgbToHex(value);
    }
    return value;
}
/**
 * Mapping from Figma mode IDs to human-readable names.
 * Extend this mapping as needed.
 */
const modeMapping = {
    "1:0": "Base",
    "2.0": "Light"
};
/**
 * Processes the valuesByMode object: converts each mode's value (if a color) to hex
 * and replaces the key with a mapped mode name if available.
 */
function formatValuesByMode(valuesByMode) {
    const formatted = {};
    for (const mode in valuesByMode) {
        const mappedMode = modeMapping[mode] || mode;
        formatted[mappedMode] = formatValue(valuesByMode[mode]);
    }
    return formatted;
}
/**
 * Recursively inserts a variable object into the nested group structure.
 * @param currentGroup - The current group's array in which to insert.
 * @param path - An array of subgroup names to create/navigate.
 * @param varObj - The variable object to insert.
 */
function insertNested(currentGroup, path, varObj) {
    if (path.length === 0) {
        currentGroup.push(varObj);
    }
    else {
        const subgroupName = path[0].toLowerCase();
        // Find if this subgroup already exists in the current group array
        let subgroupObj = currentGroup.find(item => typeof item === "object" && item[subgroupName] !== undefined);
        if (!subgroupObj) {
            subgroupObj = {};
            subgroupObj[subgroupName] = [];
            currentGroup.push(subgroupObj);
        }
        insertNested(subgroupObj[subgroupName], path.slice(1), varObj);
    }
}
/**
 * Groups all Figma variables first by collection, then creates nested subgroups based on "/" delimiters.
 * For example, a variable named "neutral/test-1/neutral-50" will be placed under:
 *   Collection: (e.g.) "Reference Colors"
 *     Group "neutral" → Subgroup "test-1" → variable with name "neutral-50"
 * Variables with no "/" in their name are grouped under a key equal to the variable name (in lowercase).
 * The final output structure is transformed so that each collection maps to an array with one object containing the groups.
 */
function groupVariablesByCollection() {
    const allVariables = figma.variables.getLocalVariables();
    // collections: { [collectionName]: { [groupKey]: groupData } }
    const collections = {};
    allVariables.forEach(variable => {
        const collection = figma.variables.getVariableCollectionById(variable.variableCollectionId);
        const collectionName = collection ? collection.name : "Uncategorized";
        if (!collections[collectionName]) {
            collections[collectionName] = {};
        }
        // Split variable name by "/" to determine grouping
        const parts = variable.name.split("/");
        // Infer variable type – assume "Color" if the first value has r, g, b.
        let varType = "Other";
        const valueAnyMode = Object.values(variable.valuesByMode)[0];
        if (valueAnyMode && typeof valueAnyMode === "object" && "r" in valueAnyMode && "g" in valueAnyMode && "b" in valueAnyMode) {
            varType = "Color";
        }
        const formattedValues = formatValuesByMode(variable.valuesByMode);
        // Create the variable object, now including the variable id.
        let varObj = {
            id: variable.id,
            name: "",
            type: varType,
            valuesByMode: formattedValues
        };
        if (parts.length > 1) {
            // Use the first segment as the top-level group key.
            const topGroup = parts[0].toLowerCase();
            // The variable's own name should be the last segment.
            varObj.name = parts[parts.length - 1];
            // Prepare the nested path: all segments between the first and last.
            const nestedPath = parts.slice(1, parts.length - 1);
            // Ensure the top-level group array exists.
            if (!collections[collectionName][topGroup]) {
                collections[collectionName][topGroup] = [];
            }
            if (nestedPath.length > 0) {
                // Insert into nested subgroups under the top-level group.
                insertNested(collections[collectionName][topGroup], nestedPath, varObj);
            }
            else {
                // No additional subgroups; push variable directly.
                collections[collectionName][topGroup].push(varObj);
            }
        }
        else {
            // Variable name has no "/" delimiter. Use the variable name (lowercase) as its group.
            varObj.name = variable.name;
            const groupKey = variable.name.toLowerCase();
            if (!collections[collectionName][groupKey]) {
                collections[collectionName][groupKey] = [];
            }
            collections[collectionName][groupKey].push(varObj);
        }
    });
    // Transform collections into the desired structure:
    // Each collection name maps to an array with one object, which contains the groupings.
    const output = {};
    for (const collectionName in collections) {
        output[collectionName] = [collections[collectionName]];
    }
    return output;
}
figma.ui.onmessage = (msg) => {
    if (msg.type === "export-variables") {
        const variablesByCollection = groupVariablesByCollection();
        figma.ui.postMessage({ type: "json-data", data: variablesByCollection });
        figma.notify("Variables exported successfully!");
    }
};
