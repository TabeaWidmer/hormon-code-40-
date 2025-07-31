import React, { useState, useRef, useEffect } from 'react';
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
  Eye,
  Image as ImageIcon // Importiere das Image-Icon für den Platzhalter
} from 'lucide-react';
import { useAppContext } from '../context/AppContext'; // Importiere AppContext

// Lazy-Loading Bildkomponente
const LazyImage = ({ src, alt, className, fallback = null, isGenerating }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  const handleLoad = () => setIsLoaded(true);
  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  if (isGenerating) {
    return (
        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse rounded-t-2xl flex items-center justify-center">
            <ImageIcon className="w-10 h-10 text-gray-400 animate-spin" />
        </div>
    );
  }

  return (
    <div className={className}>
      {hasError || !src ? (
        fallback || (
          <div className="w-full h-full bg-gradient-to-br from-rose-100 to-orange-100 flex items-center justify-center">
            <ImageIcon className="w-16 h-16 text-rose-300" />
          </div>
        )
      ) : (
        <>
          {!isLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse rounded-t-2xl" />
          )}
          <img
            src={src}
            alt={alt}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={handleLoad}
            onError={handleError}
            loading="lazy"
          />
        </>
      )}
    </div>
  );
};

export default function LazyRecipeCard({
  recipe,
  onSelect,
  onEdit,
  onAddToDay,
  onFavoriteToggle,
  isFavorite = false,
  isProfileMismatch = false,
  profileMismatchReasons = []
}) {
  const { language } = useLanguage();
  const { generateAndSaveImageForRecipe } = useAppContext(); // Hole die neue Funktion aus dem Context

  const [selectedPortions, setSelectedPortions] = useState(recipe.default_portions || 1);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef();

  // Zustand für die "lazy" Bildgenerierung
  const [imageUrl, setImageUrl] = useState(recipe.image_url);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // useEffect zur Auslösung der On-Demand-Bildgenerierung
  useEffect(() => {
    // Generiere nur, wenn die Karte sichtbar ist, keine Bild-URL vorhanden ist und wir nicht bereits generieren.
    if (isVisible && !imageUrl && !isGeneratingImage && recipe.id) {
        const generate = async () => {
            setIsGeneratingImage(true);
            const newUrl = await generateAndSaveImageForRecipe(recipe);
            setImageUrl(newUrl); // Aktualisiere den lokalen Zustand, um das neue Bild anzuzeigen
            setIsGeneratingImage(false);
        };
        generate();
    }
  }, [isVisible, imageUrl, recipe, generateAndSaveImageForRecipe, isGeneratingImage]);

  const categoryLabels = {
    breakfast: { de: 'Frühstück' },
    lunch: { de: 'Mittagessen' },
    dinner: { de: 'Abendessen' },
    snack: { de: 'Snack' },
    dessert: { de: 'Dessert' }
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

  const getMatchStyling = () => {
    if (recipe.matchLevel === 'poor') {
      return { cardClass: 'bg-gradient-to-br from-red-50/80 to-pink-50/50', warningIcon: true, warningColor: 'text-red-600' };
    }
    if (recipe.matchLevel === 'partial' || isProfileMismatch) {
      return { cardClass: 'bg-gradient-to-br from-amber-50/80 to-orange-50/50', warningIcon: true, warningColor: 'text-amber-600' };
    }
    return { cardClass: 'bg-gradient-to-br from-white/80 to-rose-50/50', warningIcon: false, warningColor: '' };
  };

  const styling = getMatchStyling();
  const recipeTitle = recipe.title?.[language] || recipe.title?.de || recipe.custom_name;

  if (!isVisible) {
    return (
      <div ref={cardRef} className="h-[600px]">
        <Card className="h-full border-0 shadow-soft rounded-2xl glass-effect animate-pulse">
          <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-2xl" />
          <CardHeader className="pb-3">
            <div className="h-6 bg-gray-200 rounded mb-2" />
            <div className="h-4 bg-gray-100 rounded w-3/4" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (<div key={i} className="h-16 bg-gray-100 rounded-xl" />))}
            </div>
            <div className="h-10 bg-gray-100 rounded-2xl" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card
      ref={cardRef}
      onClick={handleView}
      className={`border-0 shadow-soft rounded-2xl glass-effect hover:shadow-medium transition-all duration-300 group cursor-pointer relative h-full flex flex-col ${styling.cardClass}`}
    >
      <div className="h-48 overflow-hidden rounded-t-2xl relative">
        <LazyImage
          src={imageUrl}
          alt={recipeTitle}
          className="w-full h-full relative"
          isGenerating={isGeneratingImage}
        />
        <div className="absolute top-3 right-3 flex gap-2">
          <Button size="icon" variant="ghost" onClick={handleFavorite} className="h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white shadow-soft">
            <Heart className={`w-5 h-5 transition-colors ${isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500'}`} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" onClick={(e) => e.stopPropagation()} className="h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white shadow-soft">
                <MoreVertical className="w-5 h-5 text-gray-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={handleView}><Eye className="w-4 h-4 mr-2" />Ansehen</DropdownMenuItem>
              {recipe.is_custom && <DropdownMenuItem onClick={handleEdit}><Edit className="w-4 h-4 mr-2" />Bearbeiten</DropdownMenuItem>}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {styling.warningIcon && (
          <div className="absolute top-3 left-3 h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm shadow-soft flex items-center justify-center">
            <AlertTriangle className={`w-5 h-5 ${styling.warningColor}`} />
          </div>
        )}
      </div>
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className={`text-xl font-bold group-hover:text-rose-600 transition-colors leading-tight mb-2 text-text-primary`}>
          {recipeTitle}
        </CardTitle>
        <div className="flex items-center gap-4 text-sm text-text-secondary">
          <div className="flex items-center gap-1.5"><Clock className="w-4 h-4" /><span>{totalTime} Min</span></div>
          <span className="text-text-muted">•</span>
          <span>{categoryLabels[recipe.category]?.[language] || recipe.category}</span>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between space-y-4">
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
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-primary flex items-center gap-1"><Users className="w-4 h-4" />Portionen</span>
            <div className="flex items-center gap-2">
              <Button size="icon" variant="outline" className="h-8 w-8 rounded-full border-rose-200 hover:bg-rose-50" onClick={(e) => handlePortionChange(-1, e)} disabled={selectedPortions <= 1}><Minus className="w-3 h-3" /></Button>
              <span className="w-8 text-center font-semibold text-text-primary">{selectedPortions}</span>
              <Button size="icon" variant="outline" className="h-8 w-8 rounded-full border-rose-200 hover:bg-rose-50" onClick={(e) => handlePortionChange(1, e)} disabled={selectedPortions >= 10}><Plus className="w-3 h-3" /></Button>
            </div>
          </div>
        </div>
        <Button onClick={handleAddToDay} className="w-full gradient-sage-modern text-white font-semibold py-3 rounded-2xl shadow-soft hover:shadow-medium transition-all duration-300 hover:transform hover:translate-y-[-1px]">
          Für heute auswählen
        </Button>
      </CardContent>
    </Card>
  );
}