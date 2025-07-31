import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/components/context/AppContext';
import { Plan } from '@/api/entities';
import PlanRecipeCard from '@/components/plans/PlanRecipeCard';
import ShoppingListModal from '@/components/plans/ShoppingListModal';
import RecipeDetailModal from '@/components/recipes/RecipeDetailModal';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Calendar, Sparkles, Loader2 } from 'lucide-react';
import { format, startOfWeek } from 'date-fns';

const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const WEEKDAY_LABELS = {
  monday: 'Montag',
  tuesday: 'Dienstag',
  wednesday: 'Mittwoch',
  thursday: 'Donnerstag',
  friday: 'Freitag',
  saturday: 'Samstag',
  sunday: 'Sonntag',
};

export default function Plans() {
  const { user, getPersonalizedRecipesForPlan, questionnaire, allRecipes, isFavorite, toggleFavorite, isGeneratingPersonalizedRecipes } = useAppContext();
  const [weeklyPlan, setWeeklyPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [isShoppingListOpen, setIsShoppingListOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  const fetchWeeklyPlan = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const plans = await Plan.filter({ user_id: user.id, type: 'weekly', date: weekStart });
      setWeeklyPlan(plans.length > 0 ? plans[0] : null);
    } catch (error) {
      console.error("Failed to fetch weekly plan:", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if(user && !isGeneratingPersonalizedRecipes) {
        fetchWeeklyPlan();
    }
  }, [user, isGeneratingPersonalizedRecipes, allRecipes]);

  const generateNewPlan = async () => {
    if (!questionnaire || !user) {
      alert("Bitte fülle zuerst den Fragebogen aus.");
      return;
    }
    if (allRecipes.filter(r => r.is_ai_generated).length < 20) {
        alert("Deine persönliche Rezeptbibliothek ist noch nicht gross genug. Bitte fülle den Fragebogen aus oder warte einen Moment.");
        return;
    }

    setIsGeneratingPlan(true);
    try {
      const { nutrition } = questionnaire;
      const { meal_structure, calorie_distribution } = nutrition;
      const newMeals = [];
      
      for (const day of WEEKDAYS) {
        for (let i = 1; i <= meal_structure.meals_per_day; i++) {
          const mealType = i === 1 ? 'breakfast' : i === 2 ? 'lunch' : 'dinner';
          const targetCalories = calorie_distribution[`meal${i}`] || 500;
          const recipePool = getPersonalizedRecipesForPlan(mealType, targetCalories, questionnaire);
          if (recipePool.length > 0) {
            const recipe = recipePool[Math.floor(Math.random() * recipePool.length)];
            newMeals.push({ id: `${day}-meal-${i}-${Date.now()}`, day_of_week: day, name: recipe.title?.de || 'Rezept', type: mealType, calories: recipe.scaled_macros.calories, recipe_id: recipe.id, portions: recipe.scaled_portions, recipe: recipe });
          }
        }
        for (let i = 1; i <= meal_structure.snacks_per_day; i++) {
            const targetCalories = calorie_distribution[`snack${i}`] || 200;
            const recipePool = getPersonalizedRecipesForPlan('snack', targetCalories, questionnaire);
            if(recipePool.length > 0) {
                const recipe = recipePool[Math.floor(Math.random() * recipePool.length)];
                newMeals.push({ id: `${day}-snack-${i}-${Date.now()}`, day_of_week: day, name: recipe.title?.de || 'Snack', type: 'snack', calories: recipe.scaled_macros.calories, recipe_id: recipe.id, portions: recipe.scaled_portions, recipe: recipe });
            }
        }
      }

      const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
      if (weeklyPlan) await Plan.delete(weeklyPlan.id);
      const newPlan = await Plan.create({ user_id: user.id, type: 'weekly', date: weekStart, meals: newMeals, workouts: [] });
      setWeeklyPlan(newPlan);

    } catch (error) {
      console.error("Failed to generate new plan:", error);
    }
    setIsGeneratingPlan(false);
  };

  const handleRecipeClick = (recipe) => {
    if (recipe && recipe.id) {
        const fullRecipe = allRecipes.find(r => r.id === recipe.id) || recipe;
        setSelectedRecipe(fullRecipe);
    } else {
        console.warn("Attempted to open a recipe without a valid ID.", recipe);
    }
  };

  return (
    <>
      <RecipeDetailModal recipe={selectedRecipe} isOpen={!!selectedRecipe} onClose={() => setSelectedRecipe(null)} isFavorite={selectedRecipe ? isFavorite(selectedRecipe.id) : false} onFavoriteToggle={toggleFavorite} />
      <ShoppingListModal isOpen={isShoppingListOpen} onClose={() => setIsShoppingListOpen(false)} weeklyPlan={weeklyPlan} />
      <div className="container mx-auto p-4 md:p-8">
        <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3"><Calendar className="w-8 h-8" /> Wochenplan</h1>
            <p className="text-lg text-gray-600 mt-2">Dein persönlicher Ernährungsplan für die Woche.</p>
          </div>
          <div className="flex gap-4">
            <Button onClick={generateNewPlan} disabled={isGeneratingPlan || isGeneratingPersonalizedRecipes || !questionnaire} className="gradient-sage text-white gap-2">
              <Sparkles className="w-4 h-4" />
              {isGeneratingPlan ? 'Wird erstellt...' : weeklyPlan ? 'Neuen Plan erstellen' : 'Plan erstellen'}
            </Button>
            <Button onClick={() => setIsShoppingListOpen(true)} variant="outline" className="gap-2" disabled={!weeklyPlan}>
              <ShoppingCart className="w-4 h-4" /> Einkaufsliste
            </Button>
          </div>
        </header>

        {isGeneratingPersonalizedRecipes ? (
             <div className="text-center py-16 border-2 border-dashed border-purple-200 bg-purple-50 rounded-2xl">
                <Loader2 className="w-12 h-12 text-purple-500 mx-auto mb-4 animate-spin" />
                <h3 className="text-xl font-semibold text-purple-800">Deine persönliche Rezeptbibliothek wird noch erstellt...</h3>
                <p className="text-purple-700 mt-2">Bitte habe einen Moment Geduld, bevor du deinen ersten Plan erstellst.</p>
            </div>
        ) : isLoading ? (
            <p>Lade Plan...</p>
        ) : !weeklyPlan ? (
          <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-2xl">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700">Noch kein Wochenplan vorhanden</h3>
            <p className="text-gray-500 mt-2 mb-4">Erstelle deinen ersten personalisierten Plan, der auf deine Ziele zugeschnitten ist.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
            {WEEKDAYS.map(day => (
              <div key={day} className="space-y-4">
                <h2 className="text-center font-bold text-lg text-gray-700">{WEEKDAY_LABELS[day]}</h2>
                <div className="space-y-3">
                  {(weeklyPlan.meals || [])
                    .filter(meal => meal.day_of_week === day)
                    .sort((a, b) => {
                        const order = { breakfast: 1, lunch: 2, dinner: 3, snack: 4 };
                        return (order[a.type] || 99) - (order[b.type] || 99);
                    })
                    .map(meal => (
                      <PlanRecipeCard key={meal.id} meal={meal} onSelect={() => handleRecipeClick(meal.recipe)} isFavorited={isFavorite(meal.recipe?.id)} onFavorite={() => toggleFavorite(meal.recipe)} />
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}