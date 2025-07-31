import { de } from 'date-fns/locale';
import { format } from 'date-fns';

/**
 * Filters and scores recipes based on a user's questionnaire data with fallback logic.
 * @param {Array} allRecipes - The full list of available recipes.
 * @param {Object} questionnaire - The user's questionnaire data.
 * @param {String} [mealType=null] - Optional meal type to filter for (e.g., 'breakfast').
 * @returns {Array} - A filtered and scored list of recipes with match indicators.
 */
export const filterRecipesByProfile = (allRecipes, questionnaire, mealType = null) => {
  if (!questionnaire || Object.keys(questionnaire).length === 0) {
    return mealType ? allRecipes.filter(r => r.category === mealType) : allRecipes;
  }
  
  const { nutrition } = questionnaire;
  const {
    daily_calories = 2000,
    carb_target = 'moderate',
    preferred_foods = {},
    meal_structure = { meals_per_day: 3 },
  } = nutrition || {};

  const carbTargets = {
    keto: { max: 30, preferred: 20 },
    low_carb: { max: 75, preferred: 50 },
    moderate: { max: 125, preferred: 100 },
    high_carb: { max: 200, preferred: 150 },
  };
  const carbTarget = carbTargets[carb_target] || carbTargets.moderate;
  const caloriesPerMeal = daily_calories / (meal_structure.meals_per_day || 3);

  // First pass: Apply meal type filter only (most basic filter)
  let baseFiltered = mealType ? allRecipes.filter(r => r.category === mealType) : allRecipes;

  // Score all recipes based on how well they match the profile
  const scored = baseFiltered.map(recipe => {
    let score = 0;
    let matchLevel = 'perfect'; // perfect, good, partial, poor
    const issues = [];

    // Base score for hormone-friendly recipes
    if (recipe.hormone_friendly) {
      score += 15;
    }

    // Carb scoring (more nuanced approach)
    const recipeCarbs = recipe.macros_per_portion?.carbs || 0;
    if (recipeCarbs <= carbTarget.preferred) {
      score += 10; // Perfect carb match
    } else if (recipeCarbs <= carbTarget.max) {
      score += 5; // Good carb match
    } else if (recipeCarbs <= carbTarget.max * 1.5) {
      score -= 5; // Slightly high carbs
      matchLevel = 'partial';
      issues.push(`Etwas höhere Kohlenhydrate (${Math.round(recipeCarbs)}g vs. ${carbTarget.max}g Ziel)`);
    } else {
      score -= 15; // Very high carbs
      matchLevel = 'poor';
      issues.push(`Deutlich höhere Kohlenhydrate (${Math.round(recipeCarbs)}g vs. ${carbTarget.max}g Ziel)`);
    }

    // Calorie scoring (flexible approach)
    const recipeCalories = recipe.macros_per_portion?.calories || 0;
    const calorieDiff = Math.abs(recipeCalories - caloriesPerMeal);
    if (calorieDiff <= 100) {
      score += 10; // Perfect calorie match
    } else if (calorieDiff <= 200) {
      score += 5; // Good calorie match
    } else if (calorieDiff <= 350) {
      score -= 2; // Acceptable calorie difference
      if (matchLevel === 'perfect') matchLevel = 'good';
    } else {
      score -= 8; // Large calorie difference
      if (matchLevel === 'perfect' || matchLevel === 'good') matchLevel = 'partial';
      const direction = recipeCalories > caloriesPerMeal ? 'höher' : 'niedriger';
      issues.push(`Kalorien ${direction} als optimal (${Math.round(calorieDiff)} kcal Abweichung)`);
    }

    // Preferred foods bonus (significant boost for matching preferences)
    const recipeIngredients = recipe.ingredients?.map(i => i.name?.de?.toLowerCase() || '') || [];
    let preferredFoodMatches = 0;
    
    if (preferred_foods && typeof preferred_foods === 'object') {
      Object.keys(preferred_foods).forEach(category => {
        if (Array.isArray(preferred_foods[category])) {
          preferred_foods[category].forEach(preferredFood => {
            if (recipeIngredients.some(ingredient => 
              ingredient.includes(preferredFood.toLowerCase())
            )) {
              score += 8;
              preferredFoodMatches++;
            }
          });
        }
      });
    }

    // Boost score based on number of preferred ingredient matches
    if (preferredFoodMatches >= 3) {
      score += 10; // Lots of preferred ingredients
    } else if (preferredFoodMatches >= 1) {
      score += 5; // Some preferred ingredients
    }

    // Determine final match level
    if (score >= 25) {
      matchLevel = 'perfect';
    } else if (score >= 10) {
      matchLevel = 'good';
    } else if (score >= -5) {
      matchLevel = 'partial';
    } else {
      matchLevel = 'poor';
    }
    
    return { 
      ...recipe, 
      personalizedScore: score,
      matchLevel,
      profileIssues: issues,
      preferredIngredientCount: preferredFoodMatches
    };
  });

  // Sort by score (highest first)
  const sorted = scored.sort((a, b) => b.personalizedScore - a.personalizedScore);

  // Apply smart filtering with fallback logic
  let filtered = [];
  
  // First, get all perfect and good matches
  const perfectAndGoodMatches = sorted.filter(r => r.matchLevel === 'perfect' || r.matchLevel === 'good');
  
  // If we have enough good matches, use them
  if (perfectAndGoodMatches.length >= 8) {
    filtered = perfectAndGoodMatches.slice(0, 20); // Take top 20 to ensure variety
  } else {
    // Not enough good matches, include partial matches
    const partialMatches = sorted.filter(r => r.matchLevel === 'partial');
    filtered = [
      ...perfectAndGoodMatches,
      ...partialMatches.slice(0, Math.max(15 - perfectAndGoodMatches.length, 5))
    ];
    
    // If still not enough, include some poor matches as last resort
    if (filtered.length < 10) {
      const poorMatches = sorted.filter(r => r.matchLevel === 'poor');
      filtered = [
        ...filtered,
        ...poorMatches.slice(0, 10 - filtered.length)
      ];
    }
  }

  // Ensure we always return at least some recipes (minimum 5)
  if (filtered.length < 5 && sorted.length >= 5) {
    filtered = sorted.slice(0, Math.min(10, sorted.length));
  }

  return filtered;
};

/**
 * Validates if a recipe matches the current user profile
 * @param {Object} recipe - The recipe to validate
 * @param {Object} questionnaire - The user's current questionnaire data
 * @returns {Object} - { isValid: boolean, reasons: string[] }
 */
export const validateRecipeAgainstProfile = (recipe, questionnaire) => {
  if (!questionnaire || !recipe) {
    return { isValid: true, reasons: [] };
  }

  const reasons = [];
  const { nutrition } = questionnaire;
  
  if (!nutrition) {
    return { isValid: true, reasons: [] };
  }

  const {
    daily_calories = 2000,
    carb_target = 'moderate',
    preferred_foods = {},
    meal_structure = { meals_per_day: 3 },
    excluded_foods = [] // Assuming this might be added later
  } = nutrition;

  // Check carb targets
  const carbTargets = {
    keto: { max: 30, label: 'Ketogen' },
    low_carb: { max: 75, label: 'Low-Carb' },
    moderate: { max: 125, label: 'Ausgewogen' },
    high_carb: { max: 200, label: 'Higher-Carb' },
  };
  
  const targetInfo = carbTargets[carb_target];
  if (targetInfo && recipe.macros_per_portion && recipe.macros_per_portion.carbs > targetInfo.max) {
    reasons.push(`Zu viele Kohlenhydrate für dein ${targetInfo.label}-Ziel (${Math.round(recipe.macros_per_portion.carbs)}g > ${targetInfo.max}g)`);
  }

  // Check calories per meal
  const caloriesPerMeal = daily_calories / (meal_structure.meals_per_day || 3);
  const calorieTolerance = 200; // More lenient for validation than filtering
  const calorieDiff = Math.abs(recipe.macros_per_portion.calories - caloriesPerMeal);
  
  if (calorieDiff > calorieTolerance) {
    const direction = recipe.macros_per_portion.calories > caloriesPerMeal ? 'hoch' : 'niedrig';
    reasons.push(`Kalorien zu ${direction} für deine Mahlzeitenstruktur (${Math.round(recipe.macros_per_portion.calories)} kcal vs. ~${Math.round(caloriesPerMeal)} kcal Ziel)`);
  }

  // Check excluded ingredients (if implemented)
  if (excluded_foods && excluded_foods.length > 0) {
    const recipeIngredients = recipe.ingredients.map(i => i.name.de.toLowerCase());
    const foundExclusions = excluded_foods.filter(excluded => 
      recipeIngredients.some(ingredient => ingredient.includes(excluded.toLowerCase()))
    );
    
    if (foundExclusions.length > 0) {
      reasons.push(`Enthält ausgeschlossene Zutaten: ${foundExclusions.join(', ')}`);
    }
  }

  return {
    isValid: reasons.length === 0,
    reasons
  };
};

/**
 * Validates and enriches favorite items with profile compatibility info
 * @param {Array} favorites - Array of favorite objects
 * @param {Object} questionnaire - Current questionnaire data
 * @returns {Array} - Favorites with validation info added
 */
export const validateFavorites = (favorites, questionnaire) => {
  return favorites.map(favorite => {
    const recipe = favorite.item_data;
    const validation = validateRecipeAgainstProfile(recipe, questionnaire);
    
    return {
      ...favorite,
      isProfileMatch: validation.isValid,
      profileMismatchReasons: validation.reasons
    };
  });
};