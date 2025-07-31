import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Questionnaire, Favorite, Recipe, Plan, UserRecipe } from '@/api/entities';
import { InvokeLLM } from '@/api/integrations';

const AppContext = createContext();

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [questionnaire, setQuestionnaire] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [allRecipes, setAllRecipes] = useState([]);
  const [personalizedRecipes, setPersonalizedRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isGeneratingPersonalizedRecipes, setIsGeneratingPersonalizedRecipes] = useState(false);
  const [recipeGenerationError, setRecipeGenerationError] = useState(null);

  const refreshAllRecipes = useCallback(async (userId) => {
    if (!userId) return [];
    console.log("Refreshing all recipes for user:", userId);
    try {
      const globalRecipes = await Recipe.list('-created_date');
      const userRecipes = await UserRecipe.filter({ user_id: userId });
      const combinedRecipes = [...globalRecipes, ...userRecipes];
      setAllRecipes(combinedRecipes);
      console.log(`Recipe pool refreshed. Total recipes: ${combinedRecipes.length}`);
      return combinedRecipes;
    } catch (error) {
      console.error("Failed to refresh recipes:", error);
      setAllRecipes([]);
      return [];
    }
  }, []);

  const scoreAndSetPersonalizedRecipes = useCallback((recipes, profile) => {
    if (!profile?.nutrition) {
      setPersonalizedRecipes(recipes);
      return;
    }
    // Implementiere hier eine richtige Scoring-Logik, falls gewünscht
    const scored = recipes.map(recipe => ({ ...recipe, personalizedScore: recipe.hormone_friendly ? 10 : 0 }));
    setPersonalizedRecipes(scored.sort((a, b) => b.personalizedScore - a.personalizedScore));
  }, []);

  const initializeApp = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      const qData = await Questionnaire.filter({ user_id: currentUser.id });
      const userQ = qData.length > 0 ? qData[0] : null;
      setQuestionnaire(userQ);
      
      const recipes = await refreshAllRecipes(currentUser.id);
      scoreAndSetPersonalizedRecipes(recipes, userQ);

      const favs = await Favorite.filter({ user_id: currentUser.id, item_type: 'recipe' });
      setFavorites(favs);
    } catch (error) {
      console.error('Error initializing app:', error);
    } finally {
      setIsInitialized(true);
      setIsLoading(false);
    }
  }, [refreshAllRecipes, scoreAndSetPersonalizedRecipes]);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  const generateComprehensivePersonalizedRecipes = async (questionnaireData, userId) => {
    // Diese Funktion führt jetzt den gesamten Prozess aus und gibt erst am Ende zurück.
    setIsGeneratingPersonalizedRecipes(true);
    setRecipeGenerationError(null);
    try {
      console.log("Starting comprehensive recipe generation...");
      
      console.log("Deleting old AI-generated recipes...");
      const oldAiRecipes = await UserRecipe.filter({ user_id: userId, is_ai_generated: true });
      await Promise.all(oldAiRecipes.map(recipe => UserRecipe.delete(recipe.id)));
      console.log(`Deleted ${oldAiRecipes.length} old AI-generated recipes.`);

      const { nutrition } = questionnaireData;
      const { preferred_foods = {} } = nutrition;
      const getIngredientSummary = (foods) => {
          const allFoods = Object.values(foods).flat().filter(Boolean);
          return allFoods.length > 0 ? `Zutaten wie ${allFoods.slice(0, 5).join(', ')}` : 'gesunde, hormonfreundliche Zutaten';
      };
      const preferredIngredientsSummary = getIngredientSummary(preferred_foods);
      
      const recipeDistribution = { breakfast: 22, lunch: 25, dinner: 25, snack: 12, dessert: 12 };
      const allGeneratedRecipes = [];
      const BATCH_SIZE = 4;
      
      for (const [mealType, totalCount] of Object.entries(recipeDistribution)) {
        if (totalCount === 0) continue;
        const numBatches = Math.ceil(totalCount / BATCH_SIZE);
        for (let i = 0; i < numBatches; i++) {
          const count = Math.min(BATCH_SIZE, totalCount - (i * BATCH_SIZE));
          if (count <= 0) continue;
          
          const existingTitles = allGeneratedRecipes.map(r => r.title?.de).join(', ') || 'keine';
          const prompt = `Erstelle ${count} absolut einzigartige, kreative, hormonfreundliche ${mealType}-Rezepte für Frauen 40+. WICHTIG: KEINE DUPLIKATE und wiederhole NICHT: ${existingTitles}. Inspiriert von: ${preferredIngredientsSummary}. Deutsche Namen/Anweisungen, für 1 Person.`;
          
          const response = await InvokeLLM({ prompt, response_json_schema: { type: "object", properties: { recipes: { type: "array", items: { type: "object", properties: { title: { type: "object", properties: { de: { type: "string" } } }, category: { type: "string" }, prep_time: { type: "number" }, cook_time: { type: "number" }, macros_per_portion: { type: "object", properties: { calories: { type: "number" }, protein: { type: "number" }, fat: { type: "number" }, carbs: { type: "number" } }, required: ["calories", "protein", "fat", "carbs"] }, ingredients: { type: "array", items: { type: "object", properties: { name: { type: "object", properties: { de: { type: "string" } } }, amount: { type: "number" }, unit: { type: "string" } }, required: ["name", "amount", "unit"] } }, instructions: { type: "object", properties: { de: { type: "array", items: { type: "string" } } }, required: ["de"] } }, required: ["title", "category", "macros_per_portion", "ingredients", "instructions"] } } }, required: ["recipes"] } });

          if (response?.recipes?.length > 0) {
            allGeneratedRecipes.push(...response.recipes.map(r => ({...r, category: r.category || mealType})));
          }
        }
      }

      if (allGeneratedRecipes.length > 20) {
        const recipesToSave = allGeneratedRecipes.map(recipe => ({ ...recipe, user_id: userId, is_ai_generated: true }));
        console.log(`💾 Saving ${recipesToSave.length} new recipes to database...`);
        const SAVE_CHUNK_SIZE = 10;
        for (let i = 0; i < recipesToSave.length; i += SAVE_CHUNK_SIZE) {
          await UserRecipe.bulkCreate(recipesToSave.slice(i, i + SAVE_CHUNK_SIZE));
        }
        console.log(`✅ Recipe generation complete!`);
      } else {
        throw new Error(`Nur ${allGeneratedRecipes.length} Rezepte wurden generiert. Das ist zu wenig.`);
      }

    } catch (error) {
      console.error('❌ Error in recipe generation process:', error);
      setRecipeGenerationError(`Rezeptgenerierung fehlgeschlagen: ${error.message}`);
      throw error; // Fehler weiterwerfen, damit aufrufende Funktion ihn fangen kann
    } finally {
      setIsGeneratingPersonalizedRecipes(false);
    }
  };

  const updateQuestionnaire = async (newQuestionnaireData) => {
    try {
      // 1. Speichere den Fragebogen
      let savedQuestionnaire;
      if (questionnaire?.id) {
        savedQuestionnaire = await Questionnaire.update(questionnaire.id, newQuestionnaireData);
      } else {
        if (!user?.id) throw new Error('User not logged in.');
        savedQuestionnaire = await Questionnaire.create({ ...newQuestionnaireData, user_id: user.id });
      }
      setQuestionnaire(savedQuestionnaire);
      await User.updateMyUserData({ questionnaire_completed: true });
      
      // 2. Rufe die blockierende Generierungsfunktion auf und WARTE auf das Ergebnis
      await generateComprehensivePersonalizedRecipes(savedQuestionnaire, user.id);
      
      // 3. Lade die neuen Daten und aktualisiere den Zustand
      const finalRecipes = await refreshAllRecipes(user.id);
      scoreAndSetPersonalizedRecipes(finalRecipes, savedQuestionnaire);
      
      return savedQuestionnaire;
    } catch (error) {
      console.error('Error in updateQuestionnaire flow:', error);
      // Stelle sicher, dass der Ladezustand zurückgesetzt wird
      setIsGeneratingPersonalizedRecipes(false);
      throw error;
    }
  };

  const toggleFavorite = async (recipe) => {
    if (!user) return;
    try {
      const existingFavorite = favorites.find(f => f.item_id === recipe.id);
      if (existingFavorite) {
        await Favorite.delete(existingFavorite.id);
        setFavorites(prev => prev.filter(f => f.id !== existingFavorite.id));
      } else {
        const newFavorite = await Favorite.create({ user_id: user.id, item_id: recipe.id, item_type: 'recipe', item_data: recipe });
        setFavorites(prev => [...prev, newFavorite]);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const isFavorite = (recipeId) => favorites.some(f => f.item_id === recipeId);

  const getPersonalizedRecipesForPlan = (mealType, targetCalories, questionnaireData) => {
    if (!allRecipes || allRecipes.length === 0) return [];
    
    const mealTypeRecipes = allRecipes.filter(r => r.category && r.category.toLowerCase() === mealType.toLowerCase());
    const scored = mealTypeRecipes.map(r => {
      const baseCalories = r.macros_per_portion?.calories || 400;
      const scalingFactor = targetCalories / baseCalories;
      return {
        ...r,
        scaled_macros: {
          calories: Math.round((r.macros_per_portion?.calories || 0) * scalingFactor),
        },
        scaled_portions: Math.round(scalingFactor * 10) / 10,
        personalizedScore: r.personalizedScore || 0
      };
    });
    
    return scored.sort((a, b) => (b.personalizedScore || 0) - (a.personalizedScore || 0));
  };

  const value = {
    user,
    questionnaire,
    favorites,
    allRecipes,
    personalizedRecipes,
    isLoading,
    isInitialized,
    isGeneratingPersonalizedRecipes,
    recipeGenerationError,
    updateQuestionnaire,
    toggleFavorite,
    isFavorite,
    getPersonalizedRecipesForPlan,
    refreshUserRecipes: () => user ? refreshAllRecipes(user.id) : Promise.resolve(),
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};