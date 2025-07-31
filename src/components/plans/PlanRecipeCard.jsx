import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Heart,
  Replace,
  Flame,
  Wheat,
  Clock,
  Sparkles,
  CheckCircle2,
  Circle,
  Users,
  RefreshCw,
  Image as ImageIcon // Importiere das Image-Icon für den Platzhalter
} from 'lucide-react';
import { useAppContext } from '../context/AppContext'; // Importiere AppContext

export default function PlanRecipeCard({
  meal,
  isEaten,
  isFavorited,
  onMarkAsEaten,
  onSwap,
  onFavorite,
  onSelect,
}) {
  const { generateAndSaveImageForRecipe } = useAppContext(); // Hole die neue Funktion
  
  // Zustand für die "lazy" Bildgenerierung
  const [thumbnailUrl, setThumbnailUrl] = useState(meal.recipe?.image_url);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);

  const macros = meal.recipe?.macros_per_portion || {};
  const totalTime = meal.recipe?.total_time || (meal.recipe?.prep_time || 0) + (meal.recipe?.cook_time || 0) || 30;
  const portions = meal.portions || 1;

  // useEffect zur Auslösung der On-Demand-Bildgenerierung
  useEffect(() => {
    const generateThumbnailIfNeeded = async () => {
      // Wenn wir bereits eine gültige URL haben, nichts tun.
      if (thumbnailUrl) {
        return;
      }
      
      // Wenn keine URL vorhanden ist und wir nicht bereits generieren, starte den Prozess.
      if (!isGeneratingThumbnail && meal.recipe?.id) {
        setIsGeneratingThumbnail(true);
        const newUrl = await generateAndSaveImageForRecipe(meal.recipe);
        setThumbnailUrl(newUrl); // Aktualisiere den lokalen Zustand, um das neue Bild anzuzeigen
        setIsGeneratingThumbnail(false);
      }
    };

    generateThumbnailIfNeeded();
  }, [thumbnailUrl, meal.recipe, generateAndSaveImageForRecipe, isGeneratingThumbnail]);

  const getMealTypeLabel = (type) => {
    const labels = {
      breakfast: 'Frühstück',
      lunch: 'Mittagessen',
      dinner: 'Abendessen',
      snack: 'Snack'
    };
    return labels[type] || type;
  };

  return (
    <Card className="border-0 shadow-soft rounded-xl glass-effect hover:shadow-medium transition-all duration-300 group relative bg-gradient-to-br from-white/90 to-rose-50/40 overflow-hidden">
      <CardContent className="p-3">
        <div className="flex items-center gap-3 mb-3">
          <div 
            className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 cursor-pointer shadow-soft hover:shadow-medium transition-all duration-200 hover:scale-105 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center"
            onClick={() => onSelect(meal.recipe)}
          >
            {isGeneratingThumbnail ? (
              <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
            ) : thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt={meal.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon className="w-5 h-5 text-gray-400" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 
              className={`font-semibold text-sm leading-tight cursor-pointer hover:text-rose-600 transition-colors line-clamp-2 ${
                isEaten ? 'line-through text-gray-500' : 'text-text-primary'
              }`}
              onClick={() => onSelect(meal.recipe)}
            >
              {meal.name}
            </h3>
            
            <div className="flex flex-wrap gap-1 mt-1.5">
              <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-gray-50 text-gray-600 border-gray-200">
                {getMealTypeLabel(meal.type)}
              </Badge>
              {meal.recipe?.hormone_friendly && (
                <Badge className="text-xs px-1.5 py-0.5 bg-purple-50 text-purple-700 border-purple-200">
                  <Sparkles className="w-2.5 h-2.5 mr-1" />
                  Hormonfreundlich
                </Badge>
              )}
            </div>
          </div>

          <div className="flex gap-1 flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onFavorite(meal.recipe); }}
              className="h-7 w-7 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white shadow-soft flex items-center justify-center transition-all duration-200"
            >
              <Heart className={`w-3 h-3 transition-colors ${isFavorited ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500'}`} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onMarkAsEaten(!isEaten); }}
              className="h-7 w-7 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white shadow-soft flex items-center justify-center transition-all duration-200"
            >
              {isEaten ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <Circle className="w-3 h-3 text-gray-400 hover:text-green-500" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs bg-white/60 rounded-lg px-3 py-1.5 mb-3">
          <div className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-500" /><span className="font-medium">{Math.round((macros.calories || meal.calories || 0) * portions)}</span><span className="text-gray-500">kcal</span></div>
          <div className="flex items-center gap-1"><Wheat className="w-3 h-3 text-yellow-600" /><span className="font-medium">{Math.round((macros.carbs || meal.carbs || 0) * portions)}g</span><span className="text-gray-500">KH</span></div>
          <div className="flex items-center gap-1"><Clock className="w-3 h-3 text-gray-500" /><span className="font-medium">{totalTime}min</span></div>
          {portions > 1 && (<div className="flex items-center gap-1"><Users className="w-3 h-3 text-gray-500" /><span className="font-medium">{portions}</span></div>)}
        </div>

        <div className="flex gap-2">
          <Button onClick={(e) => { e.stopPropagation(); onSwap(meal); }} variant="outline" className="flex-1 h-7 gap-1.5 rounded-lg border-rose-200 hover:bg-rose-50 font-medium text-xs" disabled={isEaten}>
            <Replace className="w-3 h-3" />
            Tauschen
          </Button>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-sage-50 transition-colors cursor-pointer" onClick={(e) => { e.stopPropagation(); onMarkAsEaten(!isEaten); }}>
            <Checkbox id={`eaten-${meal.id}`} checked={isEaten} onCheckedChange={onMarkAsEaten} className="h-3 w-3" />
            <label htmlFor={`eaten-${meal.id}`} className="text-xs font-medium leading-none cursor-pointer text-text-secondary">Gegessen</label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}