import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GenerateImage } from '@/api/integrations';
import { RefreshCw, Sparkles } from 'lucide-react';

export default function RecipeForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    title: { de: '' },
    category: 'lunch',
    prep_time: 15,
    cook_time: 20,
    default_portions: 2,
    macros_per_portion: { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 },
    ingredients: [],
    instructions: { de: [] },
    hormone_benefits: { de: '' },
    tags: [],
    difficulty: 'easy',
    hormone_friendly: true,
  });
  const [ingredientsText, setIngredientsText] = useState('');
  const [instructionsText, setInstructionsText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [field, subfield] = name.split('.');
      setFormData(prev => ({ ...prev, [field]: { ...prev[field], [subfield]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleSelectChange = (name, value) => {
     setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleMacroChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      macros_per_portion: { ...prev.macros_per_portion, [name]: Number(value) }
    }));
  };

  const handleTextareaChange = (setter, value) => {
    setter(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsGenerating(true);

    try {
      // 1. Construct the prompt for AI image generation
      const mainIngredients = ingredientsText.split('\n').slice(0, 3).map(line => line.split(',')[0]).join(', ');
      const prompt = `Photorealistic food photography of "${formData.title.de}", a healthy and fresh ${formData.category}. Key ingredients: ${mainIngredients}. Served in a rustic bowl, viewed from a 45-degree angle, with soft natural light creating a warm and inviting atmosphere.`;

      // 2. Generate the image
      const imageResponse = await GenerateImage({ prompt });
      const imageUrl = imageResponse.url;

      // 3. Prepare the final recipe data
      const finalRecipeData = {
        ...formData,
        image_url: imageUrl,
        ingredients: ingredientsText.split('\n').map(line => {
          const parts = line.split(',');
          return { name: { de: parts[0]?.trim() }, amount: parseFloat(parts[1]) || 0, unit: parts[2]?.trim() || '' };
        }),
        instructions: { de: instructionsText.split('\n') },
        tags: formData.tags.length > 0 ? formData.tags.split(',') : []
      };
      
      // 4. Submit the data
      onSubmit(finalRecipeData);

    } catch (error) {
      console.error("Failed to generate image or create recipe:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input name="title.de" placeholder="Titel (z.B. Zucchini-Nudeln)" onChange={handleChange} required />
        <Select name="category" onValueChange={(v) => handleSelectChange('category', v)} defaultValue="lunch">
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="breakfast">Frühstück</SelectItem>
            <SelectItem value="lunch">Mittagessen</SelectItem>
            <SelectItem value="dinner">Abendessen</SelectItem>
            <SelectItem value="snack">Snack</SelectItem>
            <SelectItem value="dessert">Dessert</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Textarea
        placeholder="Zutaten (eine pro Zeile, z.B. Zucchini,1,Stück)"
        value={ingredientsText}
        onChange={(e) => handleTextareaChange(setIngredientsText, e.target.value)}
        rows={5}
        required
      />
      <Textarea
        placeholder="Zubereitung (ein Schritt pro Zeile)"
        value={instructionsText}
        onChange={(e) => handleTextareaChange(setInstructionsText, e.target.value)}
        rows={5}
        required
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Input name="calories" type="number" placeholder="Kalorien" onChange={handleMacroChange} />
        <Input name="protein" type="number" placeholder="Protein" onChange={handleMacroChange} />
        <Input name="fat" type="number" placeholder="Fett" onChange={handleMacroChange} />
        <Input name="carbs" type="number" placeholder="Kohlenhydrate" onChange={handleMacroChange} />
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button type="submit" disabled={isGenerating} className="gap-2">
          {isGenerating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Bild wird generiert...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Rezept erstellen & Bild generieren</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}