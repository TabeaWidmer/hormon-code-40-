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
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { 
  Clock, 
  Users, 
  ChefHat, 
  Heart, 
  Plus, 
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';

export default function RecipeDetailModal({ 
  recipe, 
  isOpen, 
  onClose, 
  onAddToDay, 
  onFavoriteToggle, 
  isFavorite = false,
  initialPortions = 1
}) {
  const { t, language } = useLanguage();
  const [selectedPortions, setSelectedPortions] = useState(initialPortions);
  const [showHormoneInfo, setShowHormoneInfo] = useState(false);

  if (!recipe) return null;

  const categoryLabels = {
    breakfast: { de: 'Frühstück', en: 'Breakfast', fr: 'Petit-déjeuner', se: 'Frukost' },
    lunch: { de: 'Mittagessen', en: 'Lunch', fr: 'Déjeuner', se: 'Lunch' },
    dinner: { de: 'Abendessen', en: 'Dinner', fr: 'Dîner', se: 'Middag' },
    snack: { de: 'Snack', en: 'Snack', fr: 'Collation', se: 'Mellanmål' },
    dessert: { de: 'Dessert', en: 'Dessert', fr: 'Dessert', se: 'Efterrätt' }
  };

  const difficultyLabels = {
    easy: { de: 'Einfach', en: 'Easy', fr: 'Facile', se: 'Lätt' },
    medium: { de: 'Mittel', en: 'Medium', fr: 'Moyen', se: 'Mellan' },
    hard: { de: 'Schwer', en: 'Hard', fr: 'Difficile', se: 'Svår' }
  };

  const totalTime = recipe.total_time || (recipe.prep_time + (recipe.cook_time || 0));
  
  const adjustedMacros = {
    calories: Math.round(recipe.macros_per_portion.calories * selectedPortions),
    protein: Math.round(recipe.macros_per_portion.protein * selectedPortions),
    fat: Math.round(recipe.macros_per_portion.fat * selectedPortions),
    carbs: Math.round(recipe.macros_per_portion.carbs * selectedPortions),
    fiber: recipe.macros_per_portion.fiber ? Math.round(recipe.macros_per_portion.fiber * selectedPortions) : null
  };

  const adjustedIngredients = recipe.ingredients.map(ingredient => ({
    ...ingredient,
    adjustedAmount: ingredient.amount * selectedPortions
  }));

  const handleAddToDay = () => {
    onAddToDay(recipe, selectedPortions);
    onClose();
  };

  const handleFavorite = () => {
    onFavoriteToggle(recipe);
  };

  const formatAmount = (amount, unit) => {
    if (amount % 1 === 0) {
      return `${amount} ${unit}`;
    }
    return `${amount.toFixed(1)} ${unit}`;
  };

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
            
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={handleFavorite}
              className="h-8 w-8"
            >
              <Heart className={`w-4 h-4 transition-colors ${
                isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500'
              }`} />
            </Button>
          </div>
          
          <div className="text-left">
            <DialogTitle className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 leading-tight mb-3">
              {recipe.title?.[language] || recipe.title?.de}
            </DialogTitle>
            
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <Badge className="bg-rose-100 text-rose-800">
                {categoryLabels[recipe.category]?.[language] || recipe.category}
              </Badge>
              {recipe.difficulty && (
                <Badge variant="outline">
                  <ChefHat className="w-3 h-3 mr-1" />
                  {difficultyLabels[recipe.difficulty]?.[language] || recipe.difficulty}
                </Badge>
              )}
              {recipe.hormone_friendly && (
                <Badge className="bg-purple-100 text-purple-800">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Hormon-freundlich
                </Badge>
              )}
              <div className="flex items-center gap-1 text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{totalTime} Min</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1">
          {recipe.image_url && (
            <div className="w-full h-48 sm:h-64 lg:h-80 overflow-hidden">
              <img 
                src={recipe.image_url} 
                alt={recipe.title?.[language]} 
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-4 sm:p-6 lg:p-8 space-y-8">
            {/* Portion Selector and Macros */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Nährwerte</h3>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-600" />
                  <Select
                    value={selectedPortions.toString()}
                    onValueChange={(value) => setSelectedPortions(parseInt(value))}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 8, 10].map(num => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-gray-600">
                    {selectedPortions === 1 ? 'Portion' : 'Portionen'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-rose-50 rounded-xl">
                  <div className="text-2xl font-bold text-rose-600">{adjustedMacros.calories}</div>
                  <div className="text-sm text-gray-600">kcal</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <div className="text-2xl font-bold text-blue-600">{adjustedMacros.protein}g</div>
                  <div className="text-sm text-gray-600">Protein</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <div className="text-2xl font-bold text-green-600">{adjustedMacros.fat}g</div>
                  <div className="text-sm text-gray-600">Fett</div>
                </div>
                <div className="text-center p-4 bg-amber-50 rounded-xl">
                  <div className="text-2xl font-bold text-amber-600">{adjustedMacros.carbs}g</div>
                  <div className="text-sm text-gray-600">Kohlenhydrate</div>
                </div>
                {adjustedMacros.fiber && (
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <div className="text-2xl font-bold text-gray-600">{adjustedMacros.fiber}g</div>
                    <div className="text-sm text-gray-600">Ballaststoffe</div>
                  </div>
                )}
              </div>
            </div>

            {/* Hormone Benefits */}
            {recipe.hormone_benefits?.[language] && (
              <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                <CardContent className="p-6">
                  <Button
                    variant="ghost"
                    onClick={() => setShowHormoneInfo(!showHormoneInfo)}
                    className="flex items-center gap-2 p-0 h-auto text-left font-semibold text-purple-800 hover:bg-transparent"
                  >
                    <Sparkles className="w-5 h-5" />
                    Hormonelle Vorteile
                    {showHormoneInfo ? 
                      <ChevronUp className="w-4 h-4" /> : 
                      <ChevronDown className="w-4 h-4" />
                    }
                  </Button>
                  {showHormoneInfo && (
                    <div className="mt-4 text-gray-700 leading-relaxed">
                      {recipe.hormone_benefits[language]}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Ingredients */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Zutaten</h3>
              <div className="space-y-3">
                {adjustedIngredients.map((ingredient, index) => (
                  <div 
                    key={index} 
                    className={`flex justify-between items-center p-3 rounded-lg border transition-colors ${
                      ingredient.optional ? 'bg-gray-50 border-gray-200' : 'bg-white border-rose-100'
                    }`}
                  >
                    <span className={`${ingredient.optional ? 'text-gray-600' : 'text-gray-800'}`}>
                      {ingredient.name?.[language] || ingredient.name?.de}
                      {ingredient.optional && <span className="text-xs ml-2">(optional)</span>}
                    </span>
                    <span className="font-medium text-gray-700">
                      {formatAmount(ingredient.adjustedAmount, ingredient.unit)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Zubereitung</h3>
              <div className="space-y-4">
                {(recipe.instructions?.[language] || recipe.instructions?.de || []).map((step, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-sage-500 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 text-gray-700 leading-relaxed pt-1">
                      {step}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tags */}
            {recipe.tags && recipe.tags.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-800">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {recipe.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="bg-gray-50">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Fixed bottom action button */}
        <div className="p-4 sm:p-6 border-t bg-white">
          <Button 
            onClick={handleAddToDay}
            className="w-full gradient-sage text-white gap-2 h-12"
            size="lg"
          >
            <Plus className="w-5 h-5" />
            Für heute auswählen ({selectedPortions} {selectedPortions === 1 ? 'Portion' : 'Portionen'})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}