const fs = require('fs');
const path = require('path');

// Create dist directory if it doesn't exist
if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
}

// Copy and modify manifest.json to dist
if (fs.existsSync('manifest.json')) {
    // Read the manifest file
    const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
    
    // Update paths to be relative to dist folder
    if (manifest.main && manifest.main.startsWith('dist/')) {
        manifest.main = manifest.main.replace('dist/', '');
    }
    if (manifest.ui && manifest.ui.startsWith('dist/')) {
        manifest.ui = manifest.ui.replace('dist/', '');
    }
    
    // Write the modified manifest to dist
    fs.writeFileSync('dist/manifest.json', JSON.stringify(manifest, null, 2));
    console.log('Manifest copied and modified for dist');
} else {
    console.error('Error: manifest.json not found');
    process.exit(1);
}

// Copy UI file from src to dist
if (fs.existsSync('src/ui.html')) {
    fs.copyFileSync('src/ui.html', 'dist/ui.html');
} else {
    console.error('Error: src/ui.html not found');
    process.exit(1);
}

console.log('Build completed! Files copied to dist/'); 