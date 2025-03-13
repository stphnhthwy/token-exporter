"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// Function to format keys
function formatKey(name) {
    return name.replace(/[^a-zA-Z0-9]/g, " ") // Remove non-alphanumeric characters
        .split(" ") // Split by spaces
        .map((word, index) => index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1))
        .join(""); // Convert to camelCase
}
// Function to assign nested objects
function assignNestedObject(obj, path, value) {
    let current = obj;
    for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) {
            current[path[i]] = {};
        }
        current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
}
function rgbaToHex(r, g, b, a = 1) {
    const toHex = (value) => Math.round(value * 255).toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}${a < 1 ? toHex(a) : ""}`.toUpperCase();
}
// Function to find token path by ID
function findTokenPathById(output, targetId) {
    function search(obj, path) {
        var _a, _b;
        for (let key in obj) {
            if (typeof obj[key] === "object") {
                const currentPath = path.concat(key).join(".");
                // Check inside `valuesByMode`
                if (obj[key].valuesByMode) {
                    for (const mode in obj[key].valuesByMode) {
                        if (((_a = obj[key].valuesByMode[mode]) === null || _a === void 0 ? void 0 : _a.$type) === "VARIABLE_ALIAS" &&
                            ((_b = obj[key].valuesByMode[mode]) === null || _b === void 0 ? void 0 : _b.$id) === targetId) {
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
                if (found)
                    return found;
            }
        }
        return null;
    }
    return search(output, []);
}
figma.showUI(__html__, { width: 400, height: 300 });
// Export variables to JSON
function exportToJSON() {
    return __awaiter(this, void 0, void 0, function* () {
        const collections = yield figma.variables.getLocalVariableCollectionsAsync();
        const allVariables = yield figma.variables.getLocalVariablesAsync();
        let output = {};
        for (const collection of collections) {
            let collectionName = formatKey(collection.name);
            output[collectionName] = {};
            const collectionVariables = allVariables.filter(v => v.variableCollectionId === collection.id);
            for (const variable of collectionVariables) {
                let pathParts = variable.name.split("/").map(part => formatKey(part));
                let valuesByMode = {};
                for (const mode of collection.modes) {
                    const modeName = formatKey(mode.name || mode.modeId);
                    let modeValue = variable.valuesByMode[mode.modeId];
                    if (modeValue !== undefined) {
                        if (typeof modeValue === "object" && "id" in modeValue) {
                            // Handle variable references according to the spec
                            const referencedVar = allVariables.find(v => v.id === modeValue.id);
                            if (referencedVar) {
                                valuesByMode[modeName] = {
                                    "$type": "color",
                                    "$value": `{${referencedVar.name.split("/").join(".")}}`
                                };
                            }
                        }
                        else if (typeof modeValue === "object" && "r" in modeValue && "g" in modeValue && "b" in modeValue) {
                            valuesByMode[modeName] = {
                                "$type": "color",
                                "$value": rgbaToHex(modeValue.r, modeValue.g, modeValue.b, "a" in modeValue ? modeValue.a : 1)
                            };
                        }
                        else {
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
        figma.ui.postMessage({ type: "EXPORT_RESULT", data: JSON.stringify(output, null, 2) });
    });
}
// Handle messages from the UI
figma.ui.onmessage = (msg) => {
    if (msg.type === "export") {
        exportToJSON();
    }
};
