import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Base indexes structure
const baseIndexes = {
  "indexes": [],
  "fieldOverrides": []
};

// Read all index files
const indexFiles = readdirSync('.')
  .filter(file => file.endsWith('.indexes.json') && file !== 'firestore.indexes.json');

// Extract and combine indexes
let combinedIndexes = baseIndexes;

for (const file of indexFiles) {
  console.log(`Processing ${file}...`);
  const content = readFileSync(file, 'utf8');
  const indexes = JSON.parse(content);
  
  // Add indexes from this file
  if (indexes.indexes) {
    combinedIndexes.indexes.push(...indexes.indexes);
  }
  
  // Add field overrides if they exist
  if (indexes.fieldOverrides) {
    combinedIndexes.fieldOverrides.push(...indexes.fieldOverrides);
  }
}

// Sort indexes for consistency
combinedIndexes.indexes.sort((a, b) => {
  // Sort by collection group first
  const collectionCompare = a.collectionGroup.localeCompare(b.collectionGroup);
  if (collectionCompare !== 0) return collectionCompare;
  
  // Then by fields
  const aFields = a.fields.map(f => `${f.fieldPath}:${f.order}`).join(',');
  const bFields = b.fields.map(f => `${f.fieldPath}:${f.order}`).join(',');
  return aFields.localeCompare(bFields);
});

// Write combined indexes
writeFileSync('firestore.indexes.json', JSON.stringify(combinedIndexes, null, 2));
console.log('Indexes merged successfully into firestore.indexes.json');