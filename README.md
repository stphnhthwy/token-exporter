# Figma Token Exporter

This project is still in development and is built around Figma's API, specifically for exporting Variable Tokens. It follows the [Design Token Specification](https://tr.designtokens.org/format/#design-token).

## How to Use This Figma Plugin

1. **Install & Run**: Load this plugin into Figma via the Plugins menu.
2. **Export Variables**: The plugin will gather and export Figma Variables as structured JSON.
3. **Preview & Select**: View the exported JSON inside the plugin UI and select which variables to include.
4. **Download JSON**: Save the finalized token export.

### **Figma Plugin Manifest**
To use this plugin, ensure that the `manifest.json` file is included in the `dist` folder. Upload the manifest to Figma when loading the plugin.

## Results

- The exported JSON is saved inside the `tokens` folder in this repository.
- The JSON structure follows the Design Token Specification to ensure compatibility with multiple platforms.

## What's Next

Future enhancements under consideration:
- **Edit tokens before exporting**: Enable modification of values within the UI.
- **Multi-format exports**: Convert JSON into formats compatible with **SwiftUI, React, and other frameworks**.
- **Performance optimizations**: Improve processing speed and efficiency.

---

Let me know if you'd like any tweaks! 🚀
