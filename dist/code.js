"use strict";
figma.showUI(__html__, { width: 400, height: 200 });
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
 * Groups all Figma variables by collection and formats their values.
 */
function groupVariablesByCollection() {
    const allVariables = figma.variables.getLocalVariables();
    const collections = {};
    allVariables.forEach(variable => {
        const collection = figma.variables.getVariableCollectionById(variable.variableCollectionId);
        const collectionName = collection ? collection.name : "Uncategorized";
        if (!collections[collectionName]) {
            collections[collectionName] = [];
        }
        // Infer variable type
        let varType = "Other";
        const valueAnyMode = Object.values(variable.valuesByMode)[0];
        if (valueAnyMode && typeof valueAnyMode === "object" && "r" in valueAnyMode) {
            varType = "Color";
        }
        collections[collectionName].push({
            id: variable.id,
            name: variable.name,
            type: varType,
            valuesByMode: formatValuesByMode(variable.valuesByMode)
        });
    });
    return collections;
}
figma.ui.onmessage = (msg) => {
    if (msg.type === "export-variables") {
        const variablesByCollection = groupVariablesByCollection();
        figma.ui.postMessage({
            type: "download",
            data: JSON.stringify(variablesByCollection, null, 2),
            filename: "figma-variables.json"
        });
        figma.notify("Variables exported successfully!");
    }
};
