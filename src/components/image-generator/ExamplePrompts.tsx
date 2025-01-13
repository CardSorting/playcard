import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import TypeIcon from "@/components/card-creator/TypeIcon";
import { PokemonType } from "@/components/card-creator/types";

interface ExamplePromptsProps {
  onSelectExample: (prompt: string) => void;
}

const ExamplePrompts: React.FC<ExamplePromptsProps> = ({ onSelectExample }) => {
  const [typePrompts, setTypePrompts] = useState<{ type: string; prompts: string[] }[]>([]);
  const [promptState, setPromptState] = useState<{ [key: string]: string[] }>({});

  useEffect(() => {
    // Load all JSON files dynamically
    const loadPrompts = async () => {
      const types = [
        'fire',
        'water',
        'grass',
        'electric',
        'psychic',
        'ice',
        'dark',
        'fairy',
        'fighting',
        'ground',
        'rock',
        'bug',
        'ghost',
        'dragon',
        'normal',
      ];

      const promises = types.map((type) =>
        import(`./types/${type}.json`)
          .then((module) => {
            if (!module.default || !module.default.type || !module.default.prompts) {
              console.error(`Invalid JSON structure in ${type}.json`);
              return null;
            }
            return module.default;
          })
          .catch((error) => {
            console.error(`Failed to load ${type}.json:`, error);
            return null;
          })
      );

      const results = await Promise.all(promises);
      
      // Filter and log invalid results
      const validResults = results.filter((item) => {
        if (!item) {
          return false;
        }
        if (!item.type || !item.prompts || !Array.isArray(item.prompts)) {
          console.error('Invalid JSON structure:', item);
          return false;
        }
        return true;
      });

      if (validResults.length === 0) {
        console.error('No valid prompt files loaded');
        return;
      }
      
      console.log('Successfully loaded:', validResults.map(r => r.type));
      setTypePrompts(validResults);

      // Initialize prompt state with shuffled versions of each type's prompts
      const initialPromptState: { [key: string]: string[] } = {};
      validResults.forEach((item) => {
        initialPromptState[item.type] = shuffleArray([...item.prompts]);
      });
      setPromptState(initialPromptState);
    };

    loadPrompts();
  }, []);

  // Utility function to shuffle an array
  const shuffleArray = (array: string[]): string[] => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const handleIconClick = (type: string) => {
    let currentPrompts = promptState[type];
    if (currentPrompts && currentPrompts.length > 0) {
      const nextPrompt = currentPrompts[0];
      onSelectExample(nextPrompt); // Pass the randomly selected prompt

      // Remove the used prompt and update state
      const updatedPrompts = currentPrompts.slice(1);
      if (updatedPrompts.length === 0) {
        // Re-shuffle if all prompts are used up
        const typeData = typePrompts.find((item) => item.type === type);
        if (typeData && Array.isArray(typeData.prompts)) {
          updatedPrompts.push(...shuffleArray(typeData.prompts));
        } else {
          console.error(`No prompts found for type: ${type}`);
          updatedPrompts.push(...[]);
        }
      }
      setPromptState((prevState) => ({ ...prevState, [type]: updatedPrompts }));
    }
  };

  return (
    <Card className="p-4">
      <p className="text-lg font-semibold mb-2">
        Choose a Pokémon Type to Populate an Example Prompt:
      </p>
      <div className="grid grid-cols-5 gap-2">
        {typePrompts.map((item, index) => {
          return (
            <div key={index} className="text-center">
                {/* Display icon and trigger random prompt on click */}
                <Button
                  variant="ghost"
                  onClick={() => handleIconClick(item.type)}
                  className="flex flex-col items-center justify-center p-2"
                >
                  <TypeIcon type={item.type as PokemonType}  />
                  <p className="text-xs mt-1">
                    {item.type}
                  </p>
                </Button>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default ExamplePrompts;
