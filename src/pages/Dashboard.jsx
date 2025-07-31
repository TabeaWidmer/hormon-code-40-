import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '@/components/context/AppContext';
import { Plan } from '@/api/entities';
import LazyRecipeCard from '@/components/recipes/LazyRecipeCard';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user, allRecipes } = useAppContext();
  const [todaysMeals, setTodaysMeals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTodaysPlan = async () => {
      if (!user || allRecipes.length === 0) {
        setIsLoading(false);
        return;
      };
      
      setIsLoading(true);
      try {
        const today = new Date();
        const weekStart = format(new Date(today.setDate(today.getDate() - today.getDay() + 1)), 'yyyy-MM-dd');
        const plans = await Plan.filter({ user_id: user.id, type: 'weekly', date: weekStart });
        
        if (plans.length > 0) {
          const weeklyPlan = plans[0];
          const todayStr = format(new Date(), 'eeee').toLowerCase();
          const meals = (weeklyPlan.meals || [])
            .filter(meal => meal.day_of_week === todayStr)
            .map(meal => {
                // Anreichern des Rezepts mit den vollen Daten aus allRecipes
                const fullRecipe = allRecipes.find(r => r.id === meal.recipe_id);
                return { ...meal, recipe: fullRecipe || meal.recipe };
            });
          setTodaysMeals(meals);
        } else {
          setTodaysMeals([]);
        }
      } catch (error) {
        console.error("Failed to fetch today's plan:", error);
      }
      setIsLoading(false);
    };

    fetchTodaysPlan();
  }, [user, allRecipes]);

  const todayFormatted = format(new Date(), "EEEE, dd. MMMM yyyy", { locale: de });

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Dein Tag heute</h1>
        <p className="text-lg text-gray-600 mt-2">{todayFormatted}</p>
      </header>
      
      {/* Tagesfortschritt (Beispiel) */}
      <div className="mb-12">
        <div className="bg-white p-6 rounded-2xl shadow-soft">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Tagesfortschritt</h2>
            <div className="flex items-center gap-4">
                <div className="w-full bg-gray-200 rounded-full h-4">
                    <div className="bg-green-500 h-4 rounded-full" style={{width: "60%"}}></div>
                </div>
                <span className="font-bold text-lg text-gray-700">60%</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">3 von 5 Zielen heute erreicht</p>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Deine Mahlzeiten</h2>
          <Link to="/recipes" className="text-rose-600 font-semibold hover:underline">
            Alle Rezepte →
          </Link>
        </div>
        
        {isLoading && <p>Lade Mahlzeiten für heute...</p>}

        {!isLoading && todaysMeals.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-2xl">
                <h3 className="text-lg font-semibold text-gray-700">Keine Mahlzeiten für heute geplant.</h3>
                <p className="text-gray-500 mt-2">Gehe zur "Pläne"-Seite, um einen neuen Wochenplan zu erstellen.</p>
            </div>
        )}

        {!isLoading && todaysMeals.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {todaysMeals.map(meal => (
                meal.recipe ? (
                    <LazyRecipeCard key={meal.id} recipe={meal.recipe} />
                ) : null
            ))}
          </div>
        )}
      </div>
    </div>
  );
}