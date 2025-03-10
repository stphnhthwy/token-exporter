const fs = require('fs');
const path = require('path');

// Create dist directory if it doesn't exist
if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
}

// Copy manifest.json to dist
fs.copyFileSync('manifest.json', 'dist/manifest.json');

// Copy UI file from src to dist
if (fs.existsSync('src/ui.html')) {
    fs.copyFileSync('src/ui.html', 'dist/ui.html');
} else {
    console.error('Error: src/ui.html not found');
    process.exit(1);
}

console.log('Build completed! Files copied to dist/'); 