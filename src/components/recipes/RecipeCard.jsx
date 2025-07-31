import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Clock,
  Heart,
  Plus,
  Minus,
  Users,
  Flame,
  Wheat,
  Beef,
  Droplets,
  AlertTriangle,
  MoreVertical,
  Edit,
  Eye
} from 'lucide-react';

export default function RecipeCard({
  recipe,
  onSelect,
  onEdit,
  onAddToDay,
  onFavoriteToggle,
  isFavorite = false,
  isProfileMismatch = false,
  profileMismatchReasons = []
}) {
  const { t, language } = useLanguage();
  const [selectedPortions, setSelectedPortions] = useState(recipe.default_portions || 1);

  const categoryLabels = {
    breakfast: { de: 'Frühstück', en: 'Breakfast', fr: 'Petit-déjeuner', se: 'Frukost' },
    lunch: { de: 'Mittagessen', en: 'Lunch', fr: 'Déjeuner', se: 'Lunch' },
    dinner: { de: 'Abendessen', en: 'Dinner', fr: 'Dîner', se: 'Middag' },
    snack: { de: 'Snack', en: 'Snack', fr: 'Collation', se: 'Mellanmål' },
    dessert: { de: 'Dessert', en: 'Dessert', fr: 'Dessert', se: 'Efterrätt' }
  };

  const totalTime = recipe.total_time || (recipe.prep_time + (recipe.cook_time || 0));
  const adjustedMacros = {
    calories: Math.round((recipe.macros_per_portion?.calories || 0) * selectedPortions),
    protein: Math.round((recipe.macros_per_portion?.protein || 0) * selectedPortions),
    fat: Math.round((recipe.macros_per_portion?.fat || 0) * selectedPortions),
    carbs: Math.round((recipe.macros_per_portion?.carbs || 0) * selectedPortions)
  };

  const handleAddToDay = (e) => {
    e.stopPropagation();
    onAddToDay(recipe, selectedPortions);
  };

  const handleFavorite = (e) => {
    e.stopPropagation();
    onFavoriteToggle(recipe);
  };

  const handlePortionChange = (delta, e) => {
    e.stopPropagation();
    const newPortions = Math.max(1, Math.min(10, selectedPortions + delta));
    setSelectedPortions(newPortions);
  };

  const handleView = (e) => {
    e.stopPropagation();
    onSelect(recipe, selectedPortions);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(recipe, selectedPortions);
  };

  // Determine match level and styling
  const getMatchStyling = () => {
    if (isProfileMismatch) {
      return {
        cardClass: 'bg-gradient-to-br from-amber-50/80 to-orange-50/50',
        warningIcon: true
      };
    }
    
    if (recipe.matchLevel === 'partial') {
      return {
        cardClass: 'bg-gradient-to-br from-yellow-50/80 to-amber-50/50',
        warningIcon: true
      };
    }
    
    if (recipe.matchLevel === 'poor') {
      return {
        cardClass: 'bg-gradient-to-br from-red-50/80 to-pink-50/50',
        warningIcon: true
      };
    }
    
    return {
      cardClass: 'bg-gradient-to-br from-white/80 to-rose-50/50',
      warningIcon: false
    };
  };

  const styling = getMatchStyling();

  const recipeTitle = recipe.title?.[language] || recipe.title?.de || recipe.custom_name;
  const recipeImage = recipe.image_url || `https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop`;

  return (
    <Card
      className={`border-0 shadow-soft rounded-2xl glass-effect hover:shadow-medium transition-all duration-300 group cursor-pointer relative h-full flex flex-col ${styling.cardClass}`}
    >
      {/* Recipe Image */}
      <div className="h-48 overflow-hidden rounded-t-2xl relative">
        <img
          src={recipeImage}
          alt={recipeTitle}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Actions Overlay */}
        <div className="absolute top-3 right-3 flex gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={handleFavorite}
            className="h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white shadow-soft"
          >
            <Heart className={`w-5 h-5 transition-colors ${
              isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500'
            }`} />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white shadow-soft"
              >
                <MoreVertical className="w-5 h-5 text-gray-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleView}>
                <Eye className="w-4 h-4 mr-2" />
                Ansehen
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Bearbeiten
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Profile Match Warning */}
        {styling.warningIcon && (
          <div className="absolute top-3 left-3 h-10 w-10 rounded-full bg-amber-100/90 backdrop-blur-sm shadow-soft flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
        )}

        {/* Custom Recipe Badge */}
        {recipe.is_custom && (
          <Badge className="absolute bottom-3 right-3 bg-purple-100 text-purple-800 text-xs font-semibold px-2 py-1 rounded-xl">
            Mein Rezept
          </Badge>
        )}
        
        {/* Hormone Friendly Badge */}
        {recipe.hormone_friendly && !recipe.is_custom && (
          <Badge className="absolute bottom-3 left-3 bg-purple-100 text-purple-800 text-xs font-semibold px-2 py-1 rounded-xl">
            Hormon-freundlich
          </Badge>
        )}
      </div>

      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className={`text-xl font-bold group-hover:text-rose-600 transition-colors leading-tight mb-2 text-text-primary`}>
          {recipeTitle}
        </CardTitle>

        {/* Profile Mismatch Warning for Favorites */}
        {isProfileMismatch && (
          <div className="mb-3 p-2 bg-amber-100/80 rounded-lg border border-amber-200">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-semibold text-amber-800">
                Passt nicht zu deinem aktuellen Profil
              </span>
            </div>
            {profileMismatchReasons.length > 0 && (
              <div className="text-xs text-amber-700">
                {profileMismatchReasons[0]}
              </div>
            )}
          </div>
        )}
        
        {/* Time and Category */}
        <div className="flex items-center gap-4 text-sm text-text-secondary">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>{totalTime} Min</span>
          </div>
          <span className="text-text-muted">•</span>
          <span>{categoryLabels[recipe.category]?.[language] || recipe.category}</span>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between space-y-4">
        {/* Macronutrients */}
        <div className="space-y-3">
          <h4 className="font-semibold text-text-primary text-sm">Nährwerte ({selectedPortions} Portion{selectedPortions > 1 ? 'en' : ''})</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-2 bg-orange-50/80 rounded-xl">
              <Flame className="w-4 h-4 text-orange-500" />
              <div>
                <div className="text-base font-bold text-orange-600">{adjustedMacros.calories}</div>
                <div className="text-xs text-orange-500">kcal</div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 bg-blue-50/80 rounded-xl">
              <Beef className="w-4 h-4 text-blue-500" />
              <div>
                <div className="text-base font-bold text-blue-600">{adjustedMacros.protein}g</div>
                <div className="text-xs text-blue-500">Protein</div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 bg-green-50/80 rounded-xl">
              <Droplets className="w-4 h-4 text-green-500" />
              <div>
                <div className="text-base font-bold text-green-600">{adjustedMacros.fat}g</div>
                <div className="text-xs text-green-500">Fett</div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 bg-amber-50/80 rounded-xl">
              <Wheat className="w-4 h-4 text-amber-500" />
              <div>
                <div className="text-base font-bold text-amber-600">{adjustedMacros.carbs}g</div>
                <div className="text-xs text-amber-500">Kohlenhydrate</div>
              </div>
            </div>
          </div>
        </div>

        {/* Portion Selector */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-primary flex items-center gap-1">
              <Users className="w-4 h-4" />
              Portionen
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 rounded-full border-rose-200 hover:bg-rose-50"
                onClick={(e) => handlePortionChange(-1, e)}
                disabled={selectedPortions <= 1}
              >
                <Minus className="w-3 h-3" />
              </Button>
              <span className="w-8 text-center font-semibold text-text-primary">{selectedPortions}</span>
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 rounded-full border-rose-200 hover:bg-rose-50"
                onClick={(e) => handlePortionChange(1, e)}
                disabled={selectedPortions >= 10}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Select for Today Button */}
        <Button
          onClick={handleAddToDay}
          className="w-full gradient-sage-modern text-white font-semibold py-3 rounded-2xl shadow-soft hover:shadow-medium transition-all duration-300 hover:transform hover:translate-y-[-1px]"
        >
          Für heute auswählen
        </Button>
      </CardContent>
    </Card>
  );
}