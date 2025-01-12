import { readFileSync, writeFileSync } from 'fs';

class RulesMerger {
  constructor() {
    this.helperFunctions = new Map();
    this.ruleBlocks = new Map();
    this.errors = [];
  }

  extractHelperFunctions(content, filename) {
    const lines = content.split('\n');
    let inFunction = false;
    let currentFunction = [];
    let functionName = '';
    let depth = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith('function ')) {
        inFunction = true;
        functionName = line.match(/function\s+([^(]+)/)[1];
        depth = 1;
        currentFunction = [lines[i]];
      } else if (inFunction) {
        currentFunction.push(lines[i]);
        depth += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;

        if (depth === 0) {
          // Skip isValidCartItem as it's unused
          if (functionName !== 'isValidCartItem') {
            this.helperFunctions.set(functionName, currentFunction.join('\n'));
          }
          inFunction = false;
          currentFunction = [];
        }
      }
    }
  }

  extractRuleBlock(content) {
    const lines = content.split('\n');
    let inMainBlock = false;
    let mainBlock = [];
    let depth = 0;

    for (const line of lines) {
      // Skip version and service declarations
      if (line.trim().startsWith('rules_version') ||
          line.trim().startsWith('service cloud.firestore') ||
          line.trim().startsWith('match /databases/{database}/documents')) {
        continue;
      }

      // Start collecting after main database match
      if (!inMainBlock) {
        if (line.trim().startsWith('match /')) {
          inMainBlock = true;
        }
      }

      if (inMainBlock) {
        mainBlock.push(line);
        depth += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
        
        // If we've closed all braces, we're done with this block
        if (depth === 0) {
          inMainBlock = false;
        }
      }
    }

    return mainBlock.join('\n');
  }

  processRulesFile(filename) {
    try {
      console.log(`Processing ${filename}...`);
      const content = readFileSync(filename, 'utf8');
      
      // Extract helper functions first
      this.extractHelperFunctions(content, filename);
      
      // Extract the main rules block
      const ruleBlock = this.extractRuleBlock(content);
      if (ruleBlock) {
        const name = filename.replace('firestore.', '').replace('.rules', '');
        this.ruleBlocks.set(name, ruleBlock);
      }
    } catch (error) {
      this.errors.push(`Error processing ${filename}: ${error.message}`);
    }
  }

  generateCombinedRules() {
    // Start with the base structure and built-in functions
    let combined = `rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Built-in function wrappers
    function isAuthenticated() {
      return request.auth != null;
    }

    // Common helper functions
    function isOwner(userId) {
      return request.auth.uid == userId;
    }

`;

    // Add helper functions in dependency order
    const helperOrder = [
      'isSeller',
      'isValidListing',
      'isValidOrder',
      'isValidInventory',
      'isValidReview',
      'hasVerifiedPurchase',
      'hasValidCartItems',
      'isCardOwner',
      'isValidCard',
      'isValidGeneration',
      'isCollaborator',
      'hasEditPermission',
      'isCollectionOwner',
      'isCollectionCollaborator',
      'hasCollectionEditAccess',
      'isValidCollectionCard',
      'isValidPack',
      'isValidPackOpening',
      'isValidPackTemplate',
      'isValidPackCollection',
      'canOpenPack'
    ];

    helperOrder.forEach(name => {
      const func = this.helperFunctions.get(name);
      if (func) {
        combined += `    ${func}\n\n`;
      }
    });

    // Add any remaining helper functions not in the order
    this.helperFunctions.forEach((func, name) => {
      if (!helperOrder.includes(name) && name !== 'isOwner') {
        combined += `    ${func}\n\n`;
      }
    });

    // Base user rules
    combined += `    // Base user rules
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && isOwner(userId);
      allow update: if isOwner(userId);
      allow delete: if false;
    }
`;

    // Add rule blocks in specific order
    const blockOrder = [
      'marketplace',
      'cart',
      'card-creator',
      'card-generation',
      'card-collaboration',
      'collection',
      'booster-packs',
      'claims'
    ];

    blockOrder.forEach(name => {
      const rules = this.ruleBlocks.get(name);
      if (rules) {
        // Fix the type error in booster packs section
        let processedRules = rules;
        if (name === 'booster-packs') {
          // Fix the packAnalytics rules to properly check pack ownership
          processedRules = rules.replace(
            /allow read: if isAuthenticated\(\) && \(\s*resource\.data\.packId in get\([^)]+\)\.data\.userId == request\.auth\.uid\s*\);/g,
            'allow read: if isAuthenticated() && exists(/databases/$(database)/documents/boosterPacks/$(resource.data.packId)) && get(/databases/$(database)/documents/boosterPacks/$(resource.data.packId)).data.userId == request.auth.uid;'
          );
        }
        combined += `\n    // ${name} rules\n${processedRules}\n`;
      }
    });

    // Add any remaining blocks not in the order
    this.ruleBlocks.forEach((rules, name) => {
      if (!blockOrder.includes(name)) {
        combined += `\n    // ${name} rules\n${rules}\n`;
      }
    });

    // Close the main blocks
    combined += '  }\n}';

    return combined;
  }
}

const RULES_FILES = [
  'firestore.marketplace.rules',
  'firestore.cart.rules',
  'firestore.card-creator.rules',
  'firestore.card-generation.rules',
  'firestore.card-collaboration.rules',
  'firestore.collection.rules',
  'firestore.booster-packs.rules',
  'firestore.claims.rules'
];

try {
  console.log('Starting rules merge...');
  const merger = new RulesMerger();
  
  // Process each rules file
  RULES_FILES.forEach(file => merger.processRulesFile(file));

  // Generate and write combined rules
  const mergedRules = merger.generateCombinedRules();
  writeFileSync('firestore.rules', mergedRules);
  
  console.log('\nRules merged successfully into firestore.rules');
  console.log('\nHelper functions found:');
  merger.helperFunctions.forEach((_, name) => {
    console.log(`- ${name}`);
  });
  
} catch (error) {
  console.error('Fatal error:', error);
  process.exit(1);
}
