import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Base rules structure
const baseRules = `rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && isOwner(userId);
      allow update: if isOwner(userId);
      allow delete: if false; // Users cannot be deleted
    }

    // Rules will be merged here
  }
}`;

// Function to extract rules content (everything between first and last match block)
function extractRules(content) {
  const lines = content.split('\n');
  let rules = [];
  let isCollectingRules = false;
  let functionBuffer = [];
  let isFunctionBlock = false;
  let matchBlockDepth = 0;

  for (const line of lines) {
    // Skip empty lines and comments at the start
    if (rules.length === 0 && (line.trim() === '' || line.trim().startsWith('//'))) {
      continue;
    }

    // Collect function definitions
    if (line.trim().startsWith('function ')) {
      isFunctionBlock = true;
      functionBuffer = [line];
      continue;
    }
    
    if (isFunctionBlock) {
      functionBuffer.push(line);
      if (line.trim().endsWith('}')) {
        rules.push(functionBuffer.join('\n'));
        functionBuffer = [];
        isFunctionBlock = false;
      }
      continue;
    }

    // Track match block depth
    if (line.trim().startsWith('match /')) {
      isCollectingRules = true;
      matchBlockDepth++;
    }
    
    if (isCollectingRules) {
      rules.push(line);
      
      // Count additional nested braces
      const openBraces = (line.match(/{/g) || []).length;
      const closeBraces = (line.match(/}/g) || []).length;
      matchBlockDepth += openBraces - closeBraces;
      
      // Only stop collecting when we've closed all match blocks
      if (matchBlockDepth === 0) {
        isCollectingRules = false;
      }
    }
  }

  return rules.join('\n');
}

// Read all rules files in specific order
const ruleFiles = [
  'firestore.marketplace.rules',
  'firestore.cart.rules',
  'firestore.card-creator.rules',
  'firestore.card-generation.rules',
  'firestore.card-collaboration.rules',
  'firestore.collection.rules'
].filter(file => readdirSync('.').includes(file));

// Extract and combine rules
let combinedRules = baseRules;
const insertPoint = combinedRules.indexOf('// Rules will be merged here');

for (const file of ruleFiles) {
  console.log(`Processing ${file}...`);
  const content = readFileSync(file, 'utf8');
  const rules = extractRules(content);
  
  // Insert rules at the marked position
  combinedRules = combinedRules.slice(0, insertPoint) + 
    '\n    // Rules from ' + file + '\n' + 
    rules + '\n' +
    combinedRules.slice(insertPoint);
}

// Remove the merge marker
combinedRules = combinedRules.replace('// Rules will be merged here', '');

// Write combined rules
writeFileSync('firestore.rules', combinedRules);
console.log('Rules merged successfully into firestore.rules');