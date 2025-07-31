import React, { useState, useEffect } from 'react';
import { Recipe } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import RecipeForm from '../components/admin/RecipeForm';

export default function AdminRecipesPage() {
  const [recipes, setRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    setIsLoading(true);
    try {
      const fetchedRecipes = await Recipe.list('-created_date');
      setRecipes(fetchedRecipes);
    } catch (error) {
      console.error("Failed to load recipes:", error);
    }
    setIsLoading(false);
  };

  const handleCreateRecipe = async (recipeData) => {
    try {
      await Recipe.create(recipeData);
      setShowForm(false);
      await loadRecipes();
    } catch (error) {
      console.error("Failed to create recipe:", error);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-text-primary">Rezept-Verwaltung</h1>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus className="w-4 h-4" />
            Neues Rezept erstellen
          </Button>
        </div>

        {showForm && (
          <Card className="mb-8 shadow-medium glass-effect">
            <CardHeader>
              <CardTitle>Neues Rezept</CardTitle>
            </CardHeader>
            <CardContent>
              <RecipeForm
                onSubmit={handleCreateRecipe}
                onCancel={() => setShowForm(false)}
              />
            </CardContent>
          </Card>
        )}

        <Card className="shadow-soft glass-effect">
          <CardHeader>
            <CardTitle>Bestehende Rezepte ({recipes.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Lade Rezepte...</p>
            ) : (
              <div className="space-y-4">
                {recipes.map(recipe => (
                  <div key={recipe.id} className="flex items-center justify-between p-3 bg-white/80 rounded-lg">
                    <div className="flex items-center gap-4">
                      <img
                        src={recipe.image_url}
                        alt={recipe.title?.de}
                        className="w-16 h-16 rounded-md object-cover"
                      />
                      <div>
                        <p className="font-semibold text-text-primary">{recipe.title?.de}</p>
                        <p className="text-sm text-text-secondary">{recipe.category}</p>
                      </div>
                    </div>
                    {/* Add Edit/Delete buttons here in the future */}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}