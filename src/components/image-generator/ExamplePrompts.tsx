import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";


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
        import(`./types/${type}.json`).then((module) => module.default)
      );

      const results = await Promise.all(promises);
      setTypePrompts(results);

      // Initialize prompt state with shuffled versions of each type's prompts
      const initialPromptState: { [key: string]: string[] } = {};
      results.forEach((item) => {
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
        updatedPrompts.push(...shuffleArray(typePrompts.find((item) => item.type === type)?.prompts || []));
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
