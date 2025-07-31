
import { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { InvokeLLM, GenerateImage } from '@/api/integrations';

export const usePersonalization = () => {
  const { questionnaire, allRecipes, favorites, personalizedRecipes } = useAppContext();

  const filterRecipesByProfile = useMemo(() => {
    return (recipes = personalizedRecipes, mealType = null) => {
      // Use the pre-computed personalized recipes as the base
      // If the passed 'recipes' (which defaults to personalizedRecipes) has items, use that.
      // Otherwise, fall back to allRecipes.
      const sourceRecipes = recipes.length > 0 ? recipes : allRecipes;
      
      if (!questionnaire || !questionnaire.nutrition) {
        return mealType ? sourceRecipes.filter(r => r.category === mealType) : sourceRecipes;
      }
      
      const { nutrition } = questionnaire;
      const {
        daily_calories = 2000,
        carb_target = 'moderate',
        preferred_foods = {},
        meal_structure = { meals_per_day: 3 }
      } = nutrition;

      const carbTargets = {
        keto: { max: 30 },
        low_carb: { max: 75 },
        moderate: { max: 125 },
        high_carb: { max: 200 }
      };
      
      const maxCarbsPerPortion = carbTargets[carb_target]?.max || 125;

      // Filter recipes
      const filtered = sourceRecipes.filter(recipe => {
        // Meal type filter
        if (mealType && recipe.category !== mealType) return false;
        
        // Carb filter (less strict for personalized recipes, allowing 20% over target)
        if (recipe.macros_per_portion?.carbs > maxCarbsPerPortion * 1.2) return false;
        
        return true;
      });

      // The scoring logic previously here for `allRecipes` has been removed as per the outline.
      // It's assumed that `personalizedRecipes` are already scored or scoring is handled elsewhere.
      return filtered.sort((a, b) => (b.personalizedScore || 0) - (a.personalizedScore || 0));
    };
  }, [questionnaire, allRecipes, personalizedRecipes]);

  // Enhanced generatePersonalizedRecipes function
  const generatePersonalizedRecipes = async (mealType, count = 5) => {
    // First try to get recipes from the pre-computed pool
    const filteredFromPool = filterRecipesByProfile(personalizedRecipes, mealType);
    
    if (filteredFromPool.length >= count) {
      return filteredFromPool.slice(0, count);
    }

    // If not enough in pool, generate new ones (fallback)
    if (!questionnaire?.nutrition) {
      // If no nutrition profile and pool doesn't have enough, return what's in the pool
      return filteredFromPool.slice(0, count); 
    }

    const neededCount = count - filteredFromPool.length;
    if (neededCount <= 0) {
      return filteredFromPool.slice(0, count); // Should not happen if `filteredFromPool.length >= count` was false
    }
    
    try {
      const { nutrition } = questionnaire;
      const {
        daily_calories = 2000,
        carb_target = 'moderate',
        preferred_foods = {},
        meal_structure = { meals_per_day: 3 }
      } = nutrition;

      const caloriesPerMeal = daily_calories / (meal_structure.meals_per_day || 3);
      const carbLimits = {
        keto: 30,
        low_carb: 75,
        moderate: 125,
        high_carb: 200
      };
      const maxCarbs = carbLimits[carb_target] || 125;
      
      const preferredIngredients = Object.values(preferred_foods).flat().join(', ') || 'gesunde Zutaten';

      const prompt = `
        Generate ${neededCount} healthy, hormone-friendly ${mealType} recipes for women 40+.
        Requirements:
        - Target calories per serving: ${Math.round(caloriesPerMeal)}
        - Max carbs per serving: ${maxCarbs}g
        - Preferred ingredients: ${preferredIngredients}
        - German recipe names and instructions
        - Include prep time, macros, and 3-5 ingredients each
        
        Make recipes simple, nutritious, and appealing.
      `;

      const response = await InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            recipes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "object", properties: { de: { type: "string" } } },
                  category: { type: "string" },
                  prep_time: { type: "number" },
                  cook_time: { type: "number" },
                  default_portions: { type: "number" },
                  macros_per_portion: {
                    type: "object",
                    properties: {
                      calories: { type: "number" },
                      protein: { type: "number" },
                      fat: { type: "number" },
                      carbs: { type: "number" },
                      fiber: { type: "number" }
                    }
                  },
                  ingredients: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "object", properties: { de: { type: "string" } } },
                        amount: { type: "number" },
                        unit: { type: "string" }
                      }
                    }
                  },
                  instructions: {
                    type: "object",
                    properties: {
                      de: { type: "array", items: { type: "string" } }
                    }
                  },
                  hormone_benefits: {
                    type: "object",
                    properties: {
                      de: { type: "string" }
                    }
                  },
                  hormone_friendly: { type: "boolean" },
                  difficulty: { type: "string" },
                  tags: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      });

      if (!response || !Array.isArray(response.recipes)) {
        console.error('LLM did not return a valid recipes array');
        return filteredFromPool; // Return what we have from the pool
      }

      // Generate AI images for each recipe
      const recipesWithImages = await Promise.all(
        response.recipes.map(async (recipe) => {
          try {
            const recipeTitle = recipe.title?.de || 'Untitled Recipe';
            const mainIngredients = (recipe.ingredients || [])
              .slice(0, 3)
              .map(ing => ing.name?.de || '')
              .filter(Boolean)
              .join(', ');
            
            const imagePrompt = `Photorealistic food photography of "${recipeTitle}", a healthy ${mealType}. Key ingredients: ${mainIngredients}. Served in a modern bowl, viewed from a 45-degree angle, with soft natural light creating a warm and inviting atmosphere. High-quality, professional food styling.`;

            const imageResponse = await GenerateImage({ prompt: imagePrompt });
            
            return {
              ...recipe,
              image_url: imageResponse?.url || null,
              id: `generated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              personalizedScore: 15, // Added per outline
              matchLevel: 'good'    // Added per outline
            };
          } catch (error) {
            console.error('Error generating image for recipe:', recipe.title?.de || 'Unknown Recipe', error);
            return {
              ...recipe,
              image_url: null,
              id: `generated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              personalizedScore: 15, // Added per outline
              matchLevel: 'good'    // Added per outline
            };
          }
        })
      );

      // Combine existing and newly generated recipes, then slice to `count`
      return [...filteredFromPool, ...recipesWithImages].slice(0, count);
    } catch (error) {
      console.error('Error generating personalized recipes:', error);
      return filteredFromPool; // Return what we have from the pool
    }
  };

  const getPersonalizedRecipes = (mealType = null, limit = null) => {
    const filtered = filterRecipesByProfile(personalizedRecipes, mealType);
    return limit ? filtered.slice(0, limit) : filtered;
  };

  const getFavoriteRecipes = (onlyMatching = false) => {
    if (onlyMatching) {
      return favorites.filter(f => f.isProfileMatch);
    }
    return favorites;
  };

  // Simplified check for profile restrictiveness based on the availability of personalized recipes.
  const isProfileTooRestrictive = personalizedRecipes.length < 10;

  const getCaloriesPerMeal = () => {
    if (!questionnaire?.nutrition) return 500; // Default fallback
    
    const { daily_calories = 2000, meal_structure = { meals_per_day: 3 } } = questionnaire.nutrition;
    return Math.round(daily_calories / (meal_structure.meals_per_day || 3));
  };

  const getCarbTarget = () => {
    if (!questionnaire?.nutrition?.carb_target) return 'moderate';
    return questionnaire.nutrition.carb_target;
  };

  return {
    getPersonalizedRecipes,
    generatePersonalizedRecipes,
    getFavoriteRecipes,
    filterRecipesByProfile,
    isProfileTooRestrictive,
    getCaloriesPerMeal,
    getCarbTarget,
    hasProfile: !!questionnaire?.nutrition
  };
};
