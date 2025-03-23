const fs = require('fs');
const path = require('path');

// Create dist directory if it doesn't exist
if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
}

// Copy UI files
fs.copyFileSync('src/ui.html', 'dist/ui.html');
fs.copyFileSync('src/ui.js', 'dist/ui.js');

// Copy and modify manifest.json
const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
manifest.main = 'code.js';
manifest.ui = 'ui.html';
fs.writeFileSync('dist/manifest.json', JSON.stringify(manifest, null, 2));

console.log('Build completed!'); 