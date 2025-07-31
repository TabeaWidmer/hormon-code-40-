import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageProvider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Save, 
  ArrowLeft,
  Plus,
  Minus,
  Calendar,
  Sparkles,
  Check,
  X
} from 'lucide-react';

export default function RecipeEditModal({ 
  recipe, 
  isOpen, 
  onClose, 
  onSaveCustom,
  onAddToWeeklyPlan,
  initialPortions = 1
}) {
  const { t, language } = useLanguage();
  const [editedRecipe, setEditedRecipe] = useState({
    ...recipe,
    title: { ...recipe?.title },
    ingredients: recipe?.ingredients?.map(ing => ({ ...ing })) || [],
    instructions: { ...recipe?.instructions },
    macros_per_portion: { ...recipe?.macros_per_portion }
  });
  const [selectedPortions, setSelectedPortions] = useState(initialPortions);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  if (!recipe) return null;

  const handleIngredientChange = (index, field, value) => {
    const newIngredients = [...editedRecipe.ingredients];
    if (field === 'name') {
      newIngredients[index] = {
        ...newIngredients[index],
        name: { ...newIngredients[index].name, [language]: value }
      };
    } else {
      newIngredients[index] = {
        ...newIngredients[index],
        [field]: field === 'amount' ? parseFloat(value) || 0 : value
      };
    }
    setEditedRecipe(prev => ({ ...prev, ingredients: newIngredients }));
    setHasChanges(true);
  };

  const addIngredient = () => {
    setEditedRecipe(prev => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        {
          name: { [language]: '' },
          amount: 0,
          unit: '',
          optional: false
        }
      ]
    }));
    setHasChanges(true);
  };

  const removeIngredient = (index) => {
    setEditedRecipe(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
    setHasChanges(true);
  };

  const handleInstructionChange = (value) => {
    const steps = value.split('\n').filter(step => step.trim());
    setEditedRecipe(prev => ({
      ...prev,
      instructions: { ...prev.instructions, [language]: steps }
    }));
    setHasChanges(true);
  };

  const handleTimeChange = (field, value) => {
    setEditedRecipe(prev => ({
      ...prev,
      [field]: parseInt(value) || 0
    }));
    setHasChanges(true);
  };

  const generateAutoName = (originalRecipe) => {
    const originalTitle = originalRecipe.title?.[language] || originalRecipe.title?.de || 'Rezept';
    return `${originalTitle} (Angepasst)`;
  };

  const handleSave = async () => {
    if (!hasChanges) {
      onClose();
      return;
    }

    setIsSaving(true);
    try {
      const customRecipe = {
        ...editedRecipe,
        is_custom: true,
        original_recipe_id: recipe.id,
        custom_name: generateAutoName(recipe),
        // Keep original title structure but mark as custom
        title: {
          ...editedRecipe.title,
          [language]: generateAutoName(recipe)
        }
      };
      
      await onSaveCustom(customRecipe);
      
      // Show success message
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error('Error saving custom recipe:', error);
    }
    setIsSaving(false);
  };

  const handleAddToWeeklyPlan = () => {
    onAddToWeeklyPlan(editedRecipe, selectedPortions);
    onClose();
  };

  const originalTitle = recipe.title?.[language] || recipe.title?.de || 'Rezept';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 sm:p-6 pb-4 border-b">
          <div className="flex items-start justify-between gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Zurück</span>
            </Button>
            
            <Badge className="bg-purple-100 text-purple-800">
              <Sparkles className="w-3 h-3 mr-1" />
              Rezept anpassen
            </Badge>
          </div>
          
          <div className="text-left mt-4">
            <DialogTitle className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 leading-tight">
              {originalTitle}
            </DialogTitle>
            <p className="text-gray-600 mt-2">
              Passe die Zutaten und Mengen nach deinen Wünschen an
            </p>
          </div>
        </DialogHeader>

        {showSuccessMessage && (
          <Alert className="m-4 bg-green-50 border-green-200">
            <Check className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Dein Rezept wurde unter "Eigene Rezepte" gespeichert!
            </AlertDescription>
          </Alert>
        )}

        <ScrollArea className="flex-1">
          <div className="p-4 sm:p-6 lg:p-8 space-y-8">
            {/* Basic Recipe Info */}
            <Card className="border-rose-100">
              <CardHeader>
                <CardTitle className="text-lg text-gray-800">Grunddaten</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vorbereitungszeit (Min)</label>
                    <Input
                      type="number"
                      value={editedRecipe.prep_time || 0}
                      onChange={(e) => handleTimeChange('prep_time', e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kochzeit (Min)</label>
                    <Input
                      type="number"
                      value={editedRecipe.cook_time || 0}
                      onChange={(e) => handleTimeChange('cook_time', e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Portionen</label>
                    <Input
                      type="number"
                      value={editedRecipe.default_portions || 1}
                      onChange={(e) => handleTimeChange('default_portions', e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ingredients - Main Focus */}
            <Card className="border-rose-100">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-gray-800">Zutaten anpassen</CardTitle>
                  <Button 
                    onClick={addIngredient} 
                    size="sm" 
                    variant="outline" 
                    className="gap-2 hover:bg-rose-50"
                  >
                    <Plus className="w-4 h-4" />
                    Zutat hinzufügen
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {editedRecipe.ingredients.map((ingredient, index) => (
                  <div key={index} className="flex gap-2 items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <Input
                      placeholder="Zutat eingeben..."
                      value={ingredient.name?.[language] || ingredient.name?.de || ''}
                      onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                      className="flex-1 bg-white"
                    />
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="Menge"
                      value={ingredient.amount || ''}
                      onChange={(e) => handleIngredientChange(index, 'amount', e.target.value)}
                      className="w-24 bg-white"
                    />
                    <Input
                      placeholder="Einheit"
                      value={ingredient.unit || ''}
                      onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                      className="w-20 bg-white"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeIngredient(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                
                {editedRecipe.ingredients.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p className="mb-4">Noch keine Zutaten hinzugefügt</p>
                    <Button onClick={addIngredient} variant="outline" className="gap-2">
                      <Plus className="w-4 h-4" />
                      Erste Zutat hinzufügen
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card className="border-rose-100">
              <CardHeader>
                <CardTitle className="text-lg text-gray-800">Zubereitung</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Schritt 1: Zutaten vorbereiten&#10;Schritt 2: In der Pfanne anbraten&#10;Schritt 3: ..."
                  value={(editedRecipe.instructions?.[language] || editedRecipe.instructions?.de || []).join('\n')}
                  onChange={(e) => handleInstructionChange(e.target.value)}
                  rows={8}
                  className="resize-none"
                />
                <p className="text-xs text-gray-500 mt-2">Einen Schritt pro Zeile eingeben</p>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        {/* Fixed bottom action buttons */}
        <div className="p-4 sm:p-6 border-t bg-white space-y-3">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Portionen für Wochenplan:</span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedPortions(Math.max(1, selectedPortions - 1))}
                disabled={selectedPortions <= 1}
              >
                <Minus className="w-3 h-3" />
              </Button>
              <span className="w-8 text-center font-semibold">{selectedPortions}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedPortions(selectedPortions + 1)}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button 
              onClick={handleSave}
              disabled={isSaving}
              className={`flex-1 text-white gap-2 ${
                hasChanges 
                  ? 'gradient-sage-modern hover:opacity-90' 
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Speichern...' : hasChanges ? 'Speichern' : 'Keine Änderungen'}
            </Button>
            <Button 
              onClick={handleAddToWeeklyPlan}
              variant="outline"
              className="flex-1 gap-2"
            >
              <Calendar className="w-4 h-4" />
              Zum Wochenplan
            </Button>
          </div>
          
          {hasChanges && (
            <p className="text-xs text-gray-500 text-center">
              Wird automatisch als "{generateAutoName(recipe)}" gespeichert
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}