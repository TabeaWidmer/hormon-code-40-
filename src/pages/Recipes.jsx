import React, { useState, useMemo } from 'react';
import { useAppContext } from '@/components/context/AppContext';
import LazyRecipeCard from '@/components/recipes/LazyRecipeCard';
import RecipeDetailModal from '@/components/recipes/RecipeDetailModal';
import RecipeEditModal from '@/components/recipes/RecipeEditModal';
import WeeklyPlanModal from '@/components/recipes/WeeklyPlanModal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, Search, Loader2, AlertTriangle } from 'lucide-react';

export default function Recipes() {
  const {
    user,
    personalizedRecipes,
    favorites,
    toggleFavorite,
    isFavorite,
    isLoading,
    allRecipes,
    isGeneratingPersonalizedRecipes,
    recipeGenerationError
  } = useAppContext();

  const [activeTab, setActiveTab] = useState('forYou');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [planningRecipe, setPlanningRecipe] = useState(null);
  const [selectedPortions, setSelectedPortions] = useState(1);

  const userRecipes = useMemo(() => {
    return allRecipes.filter(r => r.is_custom && r.user_id === user?.id);
  }, [allRecipes, user]);

  const favoriteRecipes = useMemo(() => {
      return favorites.map(fav => allRecipes.find(r => r.id === fav.item_id)).filter(Boolean);
  }, [favorites, allRecipes]);

  const filteredRecipes = useMemo(() => {
    let sourceRecipes;
    switch (activeTab) {
      case 'favorites': sourceRecipes = favoriteRecipes; break;
      case 'myRecipes': sourceRecipes = userRecipes; break;
      default: sourceRecipes = personalizedRecipes; break;
    }
    if (!searchTerm) return sourceRecipes;
    return sourceRecipes.filter(recipe => recipe.title?.de?.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [activeTab, searchTerm, personalizedRecipes, favoriteRecipes, userRecipes]);

  const handleSelectRecipe = (recipe, portions) => {
    setSelectedRecipe(recipe);
    setSelectedPortions(portions);
  };

  const handleAddToDay = (recipe, portions) => {
    setPlanningRecipe(recipe);
    setSelectedPortions(portions);
  };

  return (
    <>
      <RecipeDetailModal recipe={selectedRecipe} isOpen={!!selectedRecipe} onClose={() => setSelectedRecipe(null)} initialPortions={selectedPortions} onAddToDay={handleAddToDay} isFavorite={selectedRecipe ? isFavorite(selectedRecipe.id) : false} onFavoriteToggle={toggleFavorite} />
      <RecipeEditModal recipe={editingRecipe} isOpen={!!editingRecipe} onClose={() => setEditingRecipe(null)} />
      <WeeklyPlanModal recipe={planningRecipe} portions={selectedPortions} isOpen={!!planningRecipe} onClose={() => setPlanningRecipe(null)} userId={user?.id} />
      
      <div className="container mx-auto p-4 md:p-8">
        <header className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
                <h1 className="text-4xl font-bold text-gray-800">Rezepte für dich</h1>
                <p className="text-lg text-gray-600 mt-2">
                Entdecke hormonfreundliche Rezepte, die auf dein Profil zugeschnitten sind.
                </p>
            </div>
            <Button onClick={() => setEditingRecipe({ isNew: true })} className="gap-2">
                <PlusCircle className="w-4 h-4" />
                Eigenes Rezept erstellen
            </Button>
          </div>
        </header>

        {isGeneratingPersonalizedRecipes && (
            <div className="text-center py-16 border-2 border-dashed border-purple-200 bg-purple-50 rounded-2xl mb-8">
                <Loader2 className="w-12 h-12 text-purple-500 mx-auto mb-4 animate-spin" />
                <h3 className="text-xl font-semibold text-purple-800">Dein persönlicher Rezeptkatalog wird erstellt...</h3>
                <p className="text-purple-700 mt-2">Dies kann einen Moment dauern. Die Seite wird automatisch aktualisiert, sobald alles bereit ist.</p>
            </div>
        )}

        {recipeGenerationError && (
             <div className="text-center py-12 border-2 border-dashed border-red-300 bg-red-50 rounded-2xl mb-8">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-red-800">Ein Fehler ist aufgetreten</h3>
                <p className="text-red-700 mt-2">{recipeGenerationError}</p>
            </div>
        )}

        {!isGeneratingPersonalizedRecipes && !recipeGenerationError && (
            <>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                <TabsList>
                    <TabsTrigger value="forYou">Für dich</TabsTrigger>
                    <TabsTrigger value="favorites">Favoriten</TabsTrigger>
                    <TabsTrigger value="myRecipes">Meine Rezepte</TabsTrigger>
                </TabsList>
                </Tabs>

                <div className="relative mb-8">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input type="text" placeholder="Rezept suchen..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                </div>

                {isLoading ? (
                    <p>Lade Rezepte...</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredRecipes.map(recipe => (
                            <LazyRecipeCard key={recipe.id} recipe={recipe} onSelect={handleSelectRecipe} onEdit={setEditingRecipe} onAddToDay={handleAddToDay} isFavorite={isFavorite(recipe.id)} onFavoriteToggle={toggleFavorite} />
                        ))}
                    </div>
                )}
                
                {!isLoading && filteredRecipes.length === 0 && (
                    <div className="text-center py-16">
                        <p className="text-lg text-gray-600">Keine Rezepte für diese Auswahl gefunden.</p>
                        <p className="text-gray-500 mt-2">Fülle den Fragebogen aus, um deine persönliche Rezeptbibliothek zu erstellen.</p>
                    </div>
                )}
            </>
        )}
      </div>
    </>
  );
}