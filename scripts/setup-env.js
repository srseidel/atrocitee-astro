#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Path to the .env file
const envFilePath = path.join(process.cwd(), '.env');

// Check if .env already exists
const envExists = fs.existsSync(envFilePath);

// Variables we need for the Printful scripts
const requiredVars = [
  { name: 'PUBLIC_SUPABASE_URL', example: 'https://yourproject.supabase.co', description: 'Your Supabase project URL' },
  { name: 'SUPABASE_SERVICE_ROLE_KEY', example: 'eyJhbG...', description: 'Service role key from Supabase dashboard' },
  { name: 'PRINTFUL_API_KEY', example: 'Bearer abcd1234...', description: 'Printful API key' }
];

// Start with existing variables if the file exists
let existingVars = {};
if (envExists) {
  console.log('Found existing .env file. Will update with any missing variables.');
  
  const envContent = fs.readFileSync(envFilePath, 'utf8');
  const envLines = envContent.split('\n');
  
  envLines.forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      existingVars[match[1].trim()] = match[2].trim();
    }
  });
}

// Prompt the user for each missing variable
async function promptForVariables() {
  const newVars = { ...existingVars };
  
  for (const variable of requiredVars) {
    if (existingVars[variable.name]) {
      console.log(`${variable.name} is already set to: ${existingVars[variable.name]}`);
      const shouldUpdate = await new Promise(resolve => {
        rl.question(`Update ${variable.name}? (y/N): `, answer => {
          resolve(answer.toLowerCase() === 'y');
        });
      });
      
      if (!shouldUpdate) {
        continue;
      }
    }
    
    // Prompt for the variable
    const value = await new Promise(resolve => {
      rl.question(`Enter ${variable.name} (${variable.description})\nExample: ${variable.example}\n> `, answer => {
        resolve(answer.trim());
      });
    });
    
    if (value) {
      newVars[variable.name] = value;
    }
  }
  
  return newVars;
}

// Write the variables to the .env file
function writeEnvFile(variables) {
  const content = Object.entries(variables)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  fs.writeFileSync(envFilePath, content + '\n');
  console.log(`Environment variables written to ${envFilePath}`);
}

// Run the script
async function run() {
  console.log('Setting up environment variables for Printful scripts...');
  
  try {
    const variables = await promptForVariables();
    writeEnvFile(variables);
    console.log('\nSetup complete! You can now run the Printful scripts.');
    console.log('Try running: npm run get-printful-ids');
  } catch (error) {
    console.error('Error setting up environment variables:', error);
  } finally {
    rl.close();
  }
}

run(); 