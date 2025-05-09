#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('Patching React DOM server module for Cloudflare compatibility...');

// Path to react-dom server module
const modulePath = path.resolve('./node_modules/react-dom/server.js');

// Check if the file exists
if (!fs.existsSync(modulePath)) {
  console.error(`File not found: ${modulePath}`);
  process.exit(1);
}

// Read the file
let content = fs.readFileSync(modulePath, 'utf8');

// Apply patch for MessageChannel
if (content.includes('MessageChannel')) {
  console.log('Found MessageChannel usage, applying patch...');
  
  // Replace MessageChannel with a shim that works in Cloudflare
  const patchedContent = content.replace(
    'new MessageChannel()',
    '(typeof MessageChannel !== "undefined" ? new MessageChannel() : { port1: {}, port2: {} })'
  );
  
  // Write the patched file
  fs.writeFileSync(modulePath, patchedContent);
  console.log('Successfully patched React DOM server module!');
} else {
  console.log('No MessageChannel usage found in the file.');
}

// Path to react-dom server browser module
const browserModulePath = path.resolve('./node_modules/react-dom/server.browser.js');

// Check if the browser file exists and patch it as well
if (fs.existsSync(browserModulePath)) {
  console.log('Patching browser server module as well...');
  
  // Read the file
  let browserContent = fs.readFileSync(browserModulePath, 'utf8');
  
  // Apply patch for MessageChannel
  if (browserContent.includes('MessageChannel')) {
    // Replace MessageChannel with a shim that works in Cloudflare
    const patchedBrowserContent = browserContent.replace(
      'new MessageChannel()',
      '(typeof MessageChannel !== "undefined" ? new MessageChannel() : { port1: {}, port2: {} })'
    );
    
    // Write the patched file
    fs.writeFileSync(browserModulePath, patchedBrowserContent);
    console.log('Successfully patched React DOM browser server module!');
  } else {
    console.log('No MessageChannel usage found in the browser file.');
  }
} 