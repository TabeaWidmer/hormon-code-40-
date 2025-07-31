import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageProvider';
import { InvokeLLM } from '@/api/integrations';
import InfoPopup from '../ui/InfoPopup';
import ConfirmationDialog from '../ui/ConfirmationDialog';
import CalorieCalculator from './CalorieCalculator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Utensils, Clock, Plus, GlassWater, Beef, Wheat, Leaf, Apple, Droplets, CheckCircle, ThumbsDown, ThumbsUp, Coffee, Sun, Moon, Cookie, AlertTriangle, ChevronDown, ChevronUp, PlusCircle } from 'lucide-react';

export default function NutritionStep({ data, onChange }) {
  const { t } = useLanguage();

  const [popupConfig, setPopupConfig] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [confirmationConfig, setConfirmationConfig] = useState({ isOpen: false, title: '', description: '', onConfirm: () => {} });
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [expandedCarbInfo, setExpandedCarbInfo] = useState(null);

  // New state for custom food input fields
  const [customFood, setCustomFood] = useState('');

  const carbOptions = [
    {
      key: 'keto',
      title: 'Ketogen',
      subtitle: 'Strikt Low-Carb',
      grams: 25,
      pros: ['Kann schnellen Gewichtsverlust fördern', 'Stabile Blutzucker- und Energielevel', 'Reduziert Heißhungerattacken'],
      cons: ['Sehr restriktiv und schwer durchzuhalten', 'Risiko für Nährstoffmängel (Keto-Grippe)', 'Soziale und kulinarische Einschränkungen'],
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-200'
    },
    {
      key: 'low_carb',
      title: 'Low-Carb',
      subtitle: 'Moderat reduziert',
      grams: 50,
      pros: ['Effektiv für Gewichtsmanagement', 'Verbessert Insulinstabilität', 'Gute Sättigung durch mehr Protein & Fett'],
      cons: ['Anfängliche Umstellung kann Energie kosten', 'Benötigt bewusste Planung der Mahlzeiten', 'Kann Ballaststoffzufuhr reduzieren'],
      color: 'text-sky-600',
      bg: 'bg-sky-50',
      border: 'border-sky-200'
    },
    {
      key: 'moderate',
      title: 'Ausgewogen',
      subtitle: 'Balance & Flexibilität',
      grams: 100,
      pros: ['Nachhaltig und flexibel im Alltag', 'Gute Energieversorgung für Sport', 'Unterstützt eine breite Nährstoffvielfalt'],
      cons: ['Gewichtsverlust kann langsamer sein', 'Achtsamkeit bei der Portionsgröße nötig', 'Passt nicht zu allen Stoffwechseltypen'],
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200'
    },
    {
      key: 'high_carb',
      title: 'Higher-Carb',
      subtitle: 'Für Aktive',
      grams: 150,
      pros: ['Optimale Energie für intensives Training', 'Unterstützt den Muskelaufbau', 'Kann die Schilddrüsenfunktion fördern'],
      cons: ['Kann bei Inaktivität zu Gewichtszunahme führen', 'Kann Blutzuckerschwankungen verursachen', 'Erfordert Fokus auf komplexe Kohlenhydrate'],
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200'
    },
  ];

  const foodCategories = {
    vegetables: {
      label: 'Gemüse & Blattgrün',
      icon: Leaf,
      items: ['Spinat', 'Grünkohl', 'Rucola', 'Brokkoli', 'Blumenkohl', 'Rosenkohl', 'Karotten', 'Rote Bete', 'Süßkartoffeln', 'Zucchini', 'Paprika', 'Tomaten', 'Gurken', 'Avocado', 'Artischocken']
    },
    proteins: {
      label: 'Proteine & Proteinquellen',
      icon: Beef,
      items: ['Bio-Rindfleisch', 'Bio-Huhn', 'Bio-Pute', 'Wildlachs', 'Sardinen', 'Makrele', 'Bio-Eier', 'Tofu', 'Tempeh', 'Linsen', 'Kichererbsen', 'Schwarze Bohnen', 'Hanfprotein', 'Kollagen-Protein', 'Spirulina']
    },
    complex_carbs: {
      label: 'Komplexe Kohlenhydrate',
      icon: Wheat,
      items: ['Quinoa', 'Buchweizen', 'Hirse', 'Amaranth', 'Haferflocken', 'Vollkorn-Reis', 'Süßkartoffeln', 'Kürbis', 'Pastinaken', 'Rote Bete', 'Vollkorn-Pasta', 'Ezekiel-Brot', 'Roggenvollkornbrot']
    },
    healthy_fats: {
      label: 'Gesunde Fette, Samen & Nüsse',
      icon: Droplets,
      items: ['Olivenöl extra vergine', 'Kokosöl', 'Avocadoöl', 'Leinöl', 'Walnüsse', 'Mandeln', 'Macadamia-Nüsse', 'Paranüsse', 'Leinsamen', 'Chia-Samen', 'Hanfsamen', 'Kürbiskerne', 'Sonnenblumenkerne', 'Tahini', 'Mandelmus']
    },
    phytoestrogens: {
      label: 'Phytoöstrogene',
      icon: Apple,
      items: ['Leinsamen', 'Sesamsamen', 'Sojabohnen', 'Tempeh', 'Miso', 'Edamame', 'Rotklee-Tee', 'Alfalfa-Sprossen', 'Fenchelsamen', 'Hopfen', 'Granatapfel', 'Äpfel', 'Kirschen', 'Datteln']
    },
    low_sugar_fruits: {
      label: 'Zuckerarme Früchte & Beeren',
      icon: Apple,
      items: ['Heidelbeeren', 'Himbeeren', 'Brombeeren', 'Erdbeeren', 'Cranberries', 'Goji-Beeren', 'Aronia-Beeren', 'Zitrone', 'Limette', 'Grapefruit', 'Granny Smith Äpfel', 'Kiwi', 'Papaya', 'Kokosnuss']
    },
    fermented_foods: {
      label: 'Fermentierte Lebensmittel',
      icon: GlassWater,
      items: ['Sauerkraut', 'Kimchi', 'Kefir', 'Kombucha', 'Miso', 'Tempeh', 'Joghurt (zuckerfrei)', 'Griechischer Joghurt', 'Kokosjoghurt', 'Wasserkefir', 'Fermentierte Gurken', 'Kvass', 'Natto']
    },
    herbs_spices: {
      label: 'Kräuter & Gewürze',
      icon: Leaf,
      items: ['Kurkuma', 'Ingwer', 'Zimt', 'Kreuzkümmel', 'Koriander', 'Petersilie', 'Basilikum', 'Oregano', 'Thymian', 'Rosmarin', 'Salbei', 'Dill', 'Schnittlauch', 'Cayennepfeffer', 'Schwarzer Pfeffer']
    },
    beverages: {
      label: 'Tees & Getränke',
      icon: Coffee,
      items: ['Grüner Tee', 'Matcha', 'Weißer Tee', 'Rooibos-Tee', 'Brennnessel-Tee', 'Frauenmantel-Tee', 'Rotklee-Tee', 'Ingwer-Tee', 'Kurkuma-Latte', 'Knochenbrühe', 'Kokoswasser', 'Zitronenwasser', 'Kräutertees', 'Adaptogen-Tees']
    }
  };

  const handleFoodToggle = (category, food) => {
    const trimmedFood = typeof food === 'string' ? food.trim() : '';
    if (!trimmedFood) return;

    const currentFoods = data.preferred_foods?.[category] || [];
    let newFoods;

    const isAlreadySelected = currentFoods.some(f => (typeof f === 'string' ? f.trim() : '') === trimmedFood);

    if (isAlreadySelected) {
      newFoods = currentFoods.filter(f => (typeof f === 'string' ? f.trim() : '') !== trimmedFood);
    } else {
      newFoods = [...currentFoods, trimmedFood];
    }
    
    const uniqueFoods = [...new Set(newFoods.filter(f => typeof f === 'string' && f.trim() !== ''))];

    onChange({
      ...data,
      preferred_foods: {
        ...data.preferred_foods,
        [category]: uniqueFoods
      }
    });
  };

  const addFoodToState = (category, food) => {
    const trimmedFood = food.trim();
    if (!trimmedFood) return;

    const currentFoods = data.preferred_foods?.[category] || [];
    const isAlreadySelected = currentFoods.some(f => (typeof f === 'string' ? f.trim() : '') === trimmedFood);

    if (!isAlreadySelected) {
      const newFoods = [...currentFoods, trimmedFood];
      onChange({
        ...data,
        preferred_foods: {
          ...data.preferred_foods,
          [category]: newFoods,
        },
      });
    }
  };

  const handleAnalyzeAndAddCustomFood = async () => {
    const trimmedFood = customFood.trim();
    if (!trimmedFood) return;
    setIsAnalyzing(true);
    
    const categoriesForPrompt = Object.entries(foodCategories)
        .map(([key, { label }]) => `- ${key}: ${label}`)
        .join('\n');

    const prompt = `
        Analysiere das folgende deutsche Lebensmittel: "${trimmedFood}".

        Aufgaben:
        1.  Bestimme die passende Kategorie aus der folgenden Liste. Gib NUR den Key zurück (z.B. "proteins").
            Liste der Kategorien:
            ${categoriesForPrompt}
        2.  Bewerte, ob dieses Lebensmittel für Frauen 40+ grundsätzlich hormonfreundlich ist (true/false).
        3.  Gib eine kurze, einfache Begründung (max. 2 Sätze) auf Deutsch.
        4.  Gib den korrekten deutschen Namen des Lebensmittels zurück.

        Antworte NUR mit einem JSON-Objekt im folgenden Format:
        {
          "category": "string",
          "is_hormone_friendly": boolean,
          "reasoning": "string",
          "food_name_de": "string"
        }
    `;

    try {
        const response = await InvokeLLM({
            prompt,
            response_json_schema: {
                type: "object",
                properties: {
                    category: { type: "string" },
                    is_hormone_friendly: { type: "boolean" },
                    reasoning: { type: "string" },
                    food_name_de: { type: "string" }
                },
                required: ["category", "is_hormone_friendly", "reasoning", "food_name_de"]
            }
        });

        if (response && foodCategories[response.category]) {
            const { category, is_hormone_friendly, reasoning, food_name_de } = response;

            // NEUE PRÜFUNG: Ist das Lebensmittel bereits vorhanden?
            const currentFoodsInCategory = data.preferred_foods?.[category] || [];
            if (currentFoodsInCategory.includes(food_name_de)) {
                setPopupConfig({
                    isOpen: true,
                    title: "Bereits vorhanden",
                    message: `'${food_name_de}' befindet sich bereits in deinen Präferenzen für die Kategorie '${foodCategories[category].label}'.`,
                    type: 'info'
                });
                return; // Funktion hier beenden
            }
            
            if (is_hormone_friendly) {
                addFoodToState(category, food_name_de);
                setPopupConfig({
                    isOpen: true,
                    title: "Hormonfreundliches Lebensmittel!",
                    message: `'${food_name_de}' wurde zur Kategorie '${foodCategories[category].label}' hinzugefügt. ${reasoning}`,
                    type: 'success'
                });
            } else {
                setConfirmationConfig({
                    isOpen: true,
                    title: "Hinweis zum Lebensmittel",
                    description: `'${food_name_de}' ist nicht optimal. Grund: ${reasoning}\n\nMöchtest du es trotzdem zu deinen Präferenzen hinzufügen?`,
                    onConfirm: () => {
                        addFoodToState(category, food_name_de);
                        setPopupConfig({
                            isOpen: true,
                            title: "Lebensmittel hinzugefügt",
                            message: `'${food_name_de}' wurde zur Kategorie '${foodCategories[category].label}' hinzugefügt.`,
                            type: 'info'
                        });
                    }
                });
            }
        } else {
            throw new Error("AI response was invalid or category not found.");
        }
    } catch (error) {
        console.error("AI food analysis failed:", error);
        setPopupConfig({
            isOpen: true,
            title: "Analyse fehlgeschlagen",
            message: "Die automatische Analyse ist fehlgeschlagen. Bitte versuche es erneut.",
            type: 'warning'
        });
    } finally {
        setIsAnalyzing(false);
        setCustomFood('');
    }
  };

  const handleCarbSelect = (key) => {
    onChange({ ...data, carb_target: key });
  };

  const mealBenefitMap = {
    '1-0': {
      title: "1 Mahlzeit (OMAD)",
      benefit: "Maximiert Autophagie und kann bei starker Gewichtsreduktion helfen. Erfordert jedoch Disziplin und ist nicht für jeden geeignet."
    },
    '2-0': {
      title: "2 Mahlzeiten (16:8)",
      benefit: "Unterstützt Insulinstabilität und Fettverbrennung in der Menopause. Kann den Cortisolrhythmus und die Schlafqualität verbessern."
    },
    '2-1': {
      title: "2 Mahlzeiten + 1 Snack",
      benefit: "Gute Balance zwischen Fastenvorteilen und Flexibilität. Der Snack hilft bei Heißhungerattacken zwischen den Mahlzeiten."
    },
    '2-2': {
      title: "2 Mahlzeiten + 2 Snacks",
      benefit: "Kann hilfreich sein, um den Blutzucker bei intensivem Sport oder Hypoglykämie-Neigung stabil zu halten."
    },
    '3-0': {
      title: "3 Mahlzeiten",
      benefit: "Klassischer Rhythmus mit stabiler Energieversorgung. Ideal für aktive Frauen und bei Blutzuckerproblemen."
    },
    '3-1': {
      title: "3 Mahlzeiten + 1 Snack",
      benefit: "Optimiert Sättigung und verhindert Heißhunger. Gut für Frauen mit hohem Energiebedarf oder körperlicher Arbeit."
    },
    '3-2': {
      title: "3 Mahlzeiten + 2 Snacks",
      benefit: "Stabilisiert den Blutzucker den ganzen Tag. Kann bei Verdauungsproblemen oder niedrigem Blutzucker hilfreich sein."
    },
  };

  const handleMealStructureChange = (type, value) => {
    const newMealStructure = { 
      ...(data.meal_structure || {}), 
      [type]: value 
    };

    const dailyCalories = data.daily_calories || 0;
    let newCalorieDistribution = { ...(data.calorie_distribution || {}) };

    if (dailyCalories > 0) {
      const meals = newMealStructure.meals_per_day || 3;
      const snacks = newMealStructure.snacks_per_day || 0;

      const totalSnackCalories = snacks > 0 ? Math.round(dailyCalories * 0.15) : 0;
      const totalMealCalories = dailyCalories - totalSnackCalories;
      
      const caloriesPerMeal = meals > 0 ? Math.round(totalMealCalories / meals) : 0;
      
      let caloriesPerSnack1 = 0;
      let caloriesPerSnack2 = 0;
      
      if (snacks === 1) {
        caloriesPerSnack1 = totalSnackCalories;
      } else if (snacks === 2) {
        caloriesPerSnack1 = Math.round(totalSnackCalories / 2);
        caloriesPerSnack2 = totalSnackCalories - caloriesPerSnack1;
      }

      newCalorieDistribution = {
        meal1: meals >= 1 ? caloriesPerMeal : 0,
        meal2: meals >= 2 ? caloriesPerMeal : 0,
        meal3: meals >= 3 ? caloriesPerMeal : 0,
        snack1: caloriesPerSnack1,
        snack2: caloriesPerSnack2,
      };
      
      let distributedTotal = 
        (newCalorieDistribution.meal1 || 0) + 
        (newCalorieDistribution.meal2 || 0) + 
        (newCalorieDistribution.meal3 || 0) + 
        (newCalorieDistribution.snack1 || 0) +
        (newCalorieDistribution.snack2 || 0);
      const roundingDifference = dailyCalories - distributedTotal;

      if (roundingDifference !== 0) {
        if (meals >= 3) newCalorieDistribution.meal3 = (newCalorieDistribution.meal3 || 0) + roundingDifference;
        else if (meals >= 2) newCalorieDistribution.meal2 = (newCalorieDistribution.meal2 || 0) + roundingDifference;
        else if (meals >= 1) newCalorieDistribution.meal1 = (newCalorieDistribution.meal1 || 0) + roundingDifference;
      }
    } else {
        const meals = newMealStructure.meals_per_day || 3;
        const snacks = newMealStructure.snacks_per_day || 0;
        newCalorieDistribution.meal3 = meals < 3 ? 0 : (newCalorieDistribution.meal3 || '');
        newCalorieDistribution.snack1 = snacks < 1 ? 0 : (newCalorieDistribution.snack1 || '');
        newCalorieDistribution.snack2 = snacks < 2 ? 0 : (newCalorieDistribution.snack2 || '');
    }

    onChange({
      ...data,
      meal_structure: newMealStructure,
      calorie_distribution: newCalorieDistribution,
    });
  };

  const handleCalorieDistributionChange = (field, value) => {
    const numericValue = parseInt(value, 10);
    const finalValue = !isNaN(numericValue) && numericValue >= 0 ? numericValue : '';

    onChange({
      ...data,
      calorie_distribution: {
        ...(data.calorie_distribution || {}),
        [field]: finalValue
      }
    });
  };

  const handleTimeChange = (e) => {
    const value = e.target.value;
    onChange({ ...data, available_time: parseInt(value, 10) || '' });
  };

  const cd = data.calorie_distribution || {};
  const meal1Kcal = parseInt(cd.meal1) || 0;
  const meal2Kcal = parseInt(cd.meal2) || 0;
  const meal3Kcal = parseInt(cd.meal3) || 0;
  const snack1Kcal = parseInt(cd.snack1) || 0;
  const snack2Kcal = parseInt(cd.snack2) || 0;

  const manualTotal = meal1Kcal + meal2Kcal + meal3Kcal + snack1Kcal + snack2Kcal;
  const targetCalories = data.daily_calories || 0;
  const difference = targetCalories - manualTotal;

  let differenceMessage = '';
  let differenceColor = 'text-gray-500';
  let differenceIcon = null;

  if (targetCalories > 0) {
    if (difference === 0) {
      differenceMessage = '✅ Ziel erreicht';
      differenceColor = 'text-green-600';
      differenceIcon = <CheckCircle className="w-4 h-4" />;
    } else if (difference > 0) {
      differenceMessage = `+${difference} kcal übrig`;
      differenceColor = 'text-amber-600';
      differenceIcon = <AlertTriangle className="w-4 h-4" />;
    } else { // difference < 0
      differenceMessage = `${difference} kcal zu viel`;
      differenceColor = 'text-red-600';
      differenceIcon = <AlertTriangle className="w-4 h-4" />;
    }
  }

  const currentMeals = data.meal_structure?.meals_per_day || 3;
  const currentSnacks = data.meal_structure?.snacks_per_day || 0;

  const combinationKey = `${currentMeals}-${currentSnacks}`;
  const currentBenefit = mealBenefitMap[combinationKey] || {
    title: "Benutzerdefinierte Struktur",
    benefit: "Deine gewählte Kombination wird individuell angepasst."
  };

  return (
    <div className="space-y-8">
      <InfoPopup {...popupConfig} onClose={() => setPopupConfig({ ...popupConfig, isOpen: false })} />
      <ConfirmationDialog {...confirmationConfig} onClose={() => setConfirmationConfig({ ...confirmationConfig, isOpen: false })} />

      <CalorieCalculator data={data} onChange={onChange} />

      <Card className="border-0 shadow-soft rounded-2xl glass-effect">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-text-primary text-xl font-bold">
            <Utensils className="w-6 h-6 text-rose-500" />
            Dein tägliches Kohlenhydrat-Ziel
          </CardTitle>
          <p className="text-text-secondary text-base leading-relaxed mt-3">
            Wähle dein bevorzugtes Kohlenhydrat-Level. Klicke auf "Mehr erfahren" für Details zu Vor- und Nachteilen.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {carbOptions.map((option) => {
              const isSelected = data.carb_target === option.key;
              const isExpanded = expandedCarbInfo === option.key;
              const carbCalories = option.grams * 4;
              const percentage = data.daily_calories > 0 ? Math.round((carbCalories / data.daily_calories) * 100) : 0;

              return (
                <div key={option.key} className="space-y-0">
                  {/* Main Selection Card */}
                  <div
                    className={`p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                      isSelected 
                        ? `${option.border} ${option.bg} shadow-md` 
                        : 'bg-white/70 border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                    onClick={() => handleCarbSelect(option.key)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-bold text-lg text-text-primary">{option.title}</h4>
                          {isSelected && <CheckCircle className={`w-5 h-5 ${option.color}`} />}
                        </div>
                        <p className="text-sm text-text-secondary mt-1">
                          {option.subtitle} (~{option.grams}g)
                        </p>
                        {isSelected && data.daily_calories > 0 && (
                          <div className="mt-2 inline-block px-3 py-1 bg-white/80 rounded-lg text-sm font-medium text-text-primary">
                            {percentage}% deiner ~{data.daily_calories} kcal
                          </div>
                        )}
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent triggering the card selection
                          setExpandedCarbInfo(isExpanded ? null : option.key);
                        }}
                        className="text-xs text-text-secondary hover:text-text-primary ml-4"
                      >
                        {isExpanded ? 'Weniger' : 'Mehr erfahren'}
                        <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </Button>
                    </div>
                  </div>

                  {/* Expandable Info Section */}
                  <Collapsible open={isExpanded}>
                    <CollapsibleContent className="overflow-hidden">
                      <div className="mt-2 mx-4 p-4 bg-gray-50/80 rounded-lg border-l-4 border-gray-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Vorteile */}
                          <div>
                            <h5 className="font-semibold mb-3 flex items-center gap-2 text-green-700">
                              <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                                <ThumbsUp className="w-3 h-3 text-green-600" />
                              </div>
                              Vorteile
                            </h5>
                            <ul className="space-y-2">
                              {option.pros.map((pro, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                                  <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center mt-0.5 flex-shrink-0">
                                    <span className="text-green-600 text-xs font-bold">+</span>
                                  </div>
                                  <span>{pro}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Nachteile */}
                          <div>
                            <h5 className="font-semibold mb-3 flex items-center gap-2 text-red-700">
                              <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                                <AlertTriangle className="w-3 h-3 text-red-600" />
                              </div>
                              Zu beachten
                            </h5>
                            <ul className="space-y-2">
                              {option.cons.map((con, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                                  <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center mt-0.5 flex-shrink-0">
                                    <span className="text-red-600 text-xs font-bold">–</span>
                                  </div>
                                  <span>{con}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Optional: Calorie Bar Visualization */}
                        {data.daily_calories > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                              <span>Kohlenhydrate: {option.grams}g</span>
                              <span>{carbCalories} kcal ({percentage}%)</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-500 ${option.color.replace('text-', 'bg-')}`}
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-soft rounded-2xl glass-effect">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-text-primary text-xl font-bold">
            <Clock className="w-6 h-6 text-rose-500" />
            Dein Mahlzeitenrhythmus
          </CardTitle>
          <p className="text-text-secondary text-base leading-relaxed mt-3">
            Wähle deinen bevorzugten Mahlzeitenrhythmus. Du kannst ihn jederzeit anpassen und im Tagebuch verfolgen, wie er für dich funktioniert.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h4 className="font-semibold text-text-primary mb-3">Anzahl Hauptmahlzeiten</h4>
                <div className="flex flex-wrap gap-3">
                  {[1, 2, 3].map(num => (
                    <Button
                      key={`meal-${num}`}
                      variant={currentMeals === num ? 'default' : 'outline'}
                      onClick={() => handleMealStructureChange('meals_per_day', num)}
                      className={`h-auto p-3 rounded-2xl transition-all duration-300 ${currentMeals === num ? 'gradient-sage-modern text-white shadow-soft' : 'bg-white/70 border-gray-200 hover:border-sage-300 hover:bg-sage-50 text-text-secondary'}`}
                    >
                      <div className="flex items-center gap-2">
                        {Array.from({ length: num }).map((_, i) => <Utensils key={i} className="w-5 h-5" />)}
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-text-primary mb-3">Anzahl Snacks</h4>
                <div className="flex flex-wrap gap-3">
                   {[0, 1, 2].map(num => (
                    <Button
                      key={`snack-${num}`}
                      variant={currentSnacks === num ? 'default' : 'outline'}
                      onClick={() => handleMealStructureChange('snacks_per_day', num)}
                       className={`h-auto p-3 rounded-2xl transition-all duration-300 ${currentSnacks === num ? 'gradient-sage-modern text-white shadow-soft' : 'bg-white/70 border-gray-200 hover:border-sage-300 hover:bg-sage-50 text-text-secondary'}`}
                    >
                      <div className="flex items-center gap-2">
                        {num === 0 ? <span className="px-2 text-base">Keine</span> : Array.from({ length: num }).map((_, i) => <Apple key={i} className="w-5 h-5" />)}
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-sage-50 to-mint-pastel/30 p-5 rounded-2xl border border-sage-100 h-full flex flex-col justify-center">
                <h4 className="font-bold text-sage-800 mb-2">
                  {currentBenefit.title}
                </h4>
                <p className="text-sm text-sage-700 leading-relaxed">
                  {currentBenefit.benefit}
                </p>
              </div>
            </div>
          </div>

          {data.daily_calories > 0 && (
            <div className="mt-8 p-6 bg-gradient-to-r from-cream-base to-rose-pastel/20 rounded-2xl">
              <h4 className="font-bold text-text-primary mb-1">Manuelle Kalorienverteilung</h4>
              <p className="text-text-secondary mb-4 text-sm">Passe die Kalorien pro Mahlzeit an. Dein Ziel sind ~{targetCalories} kcal pro Tag.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentMeals >= 1 && (
                  <div>
                    <Label htmlFor="meal1-kcal" className="font-medium text-text-secondary">Mahlzeit 1 (kcal)</Label>
                    <Input
                      id="meal1-kcal"
                      type="number"
                      min="0"
                      placeholder="z.B. 400"
                      value={cd.meal1 ?? ''}
                      onChange={(e) => handleCalorieDistributionChange('meal1', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                )}
                {currentMeals >= 2 && (
                  <div>
                    <Label htmlFor="meal2-kcal" className="font-medium text-text-secondary">Mahlzeit 2 (kcal)</Label>
                    <Input
                      id="meal2-kcal"
                      type="number"
                      min="0"
                      placeholder="z.B. 600"
                      value={cd.meal2 ?? ''}
                      onChange={(e) => handleCalorieDistributionChange('meal2', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                )}
                {currentMeals >= 3 && (
                  <div>
                    <Label htmlFor="meal3-kcal" className="font-medium text-text-secondary">Mahlzeit 3 (kcal)</Label>
                    <Input
                      id="meal3-kcal"
                      type="number"
                      min="0"
                      placeholder="z.B. 400"
                      value={cd.meal3 ?? ''}
                      onChange={(e) => handleCalorieDistributionChange('meal3', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="snack1-kcal" className="font-semibold text-text-secondary">Snack 1 (kcal)</Label>
                  <Input
                    id="snack1-kcal"
                    type="number"
                    min="0"
                    placeholder="z.B. 150"
                    value={cd.snack1 ?? ''}
                    onChange={(e) => handleCalorieDistributionChange('snack1', e.target.value)}
                    className="mt-1"
                    disabled={currentSnacks < 1}
                  />
                </div>
                 <div>
                  <Label htmlFor="snack2-kcal" className="font-semibold text-text-secondary">Snack 2 (kcal)</Label>
                  <Input
                    id="snack2-kcal"
                    type="number"
                    min="0"
                    placeholder="z.B. 150"
                    value={cd.snack2 ?? ''}
                    onChange={(e) => handleCalorieDistributionChange('snack2', e.target.value)}
                    className="mt-1"
                    disabled={currentSnacks < 2}
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between p-4 bg-white/90 rounded-xl border border-gray-100 shadow-sm">
                <span className="font-semibold text-text-primary">
                  Gesamt: {manualTotal} / {targetCalories} kcal
                </span>
                {targetCalories > 0 && (
                  <div className={`flex items-center gap-2 text-sm font-bold ${differenceColor} transition-all duration-300`}>
                    {differenceIcon}
                    <span>{differenceMessage}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preferred Foods Section */}
      <Card className="border-0 shadow-soft rounded-2xl glass-effect">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-text-primary text-xl font-bold">
            <Utensils className="w-6 h-6 text-rose-500" />
            Deine Lebensmittelpräferenzen
          </CardTitle>
          <p className="text-text-secondary text-base leading-relaxed mt-3">
            Wähle Lebensmittel, die du gerne isst und die deine Hormone unterstützen. Deine Auswahl beeinflusst direkt deine personalisierten Rezeptvorschläge.
          </p>
        </CardHeader>
        <CardContent className="space-y-8">
          {Object.entries(foodCategories).map(([categoryKey, { label, icon: Icon, items }]) => {
            const selectedFoods = data.preferred_foods?.[categoryKey] || [];
            
            const allAvailableFoods = [];
            
            items.forEach(item => {
              if (typeof item === 'string' && item.trim()) {
                allAvailableFoods.push({ name: item.trim(), isCustom: false });
              }
            });
            
            selectedFoods.forEach(selectedFood => {
              if (typeof selectedFood === 'string' && selectedFood.trim()) {
                const cleanSelected = selectedFood.trim();
                if (!items.some(item => typeof item === 'string' && item.trim() === cleanSelected)) {
                  allAvailableFoods.push({ name: cleanSelected, isCustom: true });
                }
              }
            });

            const uniqueFoods = [...new Map(allAvailableFoods.map(item => [item['name'], item])).values()];
            
            return (
              <div key={categoryKey} className="space-y-4">
                <h4 className="font-bold text-lg text-text-primary flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-rose-600" />
                  </div>
                  {label}
                  <span className="text-sm text-text-muted font-normal">
                    ({selectedFoods.length} ausgewählt)
                  </span>
                </h4>
                
                <div className="flex flex-wrap gap-2">
                  {uniqueFoods.map((foodItem, index) => {
                    const isSelected = selectedFoods.some(f => (typeof f === 'string' ? f.trim() : '') === foodItem.name);
                    return (
                      <Badge
                        key={`${categoryKey}-${foodItem.name}-${index}`}
                        variant={isSelected ? 'default' : 'outline'}
                        className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
                          isSelected 
                            ? 'bg-gray-800 hover:bg-gray-900 text-white border-gray-800 font-semibold' 
                            : 'bg-white text-gray-700 border-gray-300 hover:border-gray-800'
                        }`}
                        onClick={() => handleFoodToggle(categoryKey, foodItem.name)}
                      >
                        <span>{foodItem.name}</span>
                        {foodItem.isCustom && (
                          <span className="ml-1 text-xs opacity-80">(eigene)</span>
                        )}
                      </Badge>
                    )
                  })}
                </div>
              </div>
            );
          })}

          {/* Add Custom Food Section */}
          <div className="pt-6 border-t border-gray-200">
            <h4 className="font-bold text-lg text-text-primary flex items-center gap-3 mb-4">
              <PlusCircle className="w-5 h-5 text-rose-500" />
              Eigene Lebensmittel hinzufügen (mit KI-Analyse)
            </h4>
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-2xl">
              <p className="text-text-secondary mb-4 leading-relaxed">
                Gib ein Lebensmittel ein. Unsere KI analysiert es, ordnet es einer Kategorie zu und prüft, ob es hormonfreundlich ist.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  placeholder="z.B. Leinsamen, Rinderhackfleisch..."
                  value={customFood}
                  onChange={(e) => setCustomFood(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAnalyzeAndAddCustomFood()}
                  className="md:col-span-2"
                  disabled={isAnalyzing}
                />
                <Button 
                    onClick={handleAnalyzeAndAddCustomFood} 
                    className="md:col-span-1 gradient-sage-modern text-white"
                    disabled={isAnalyzing || !customFood.trim()}
                >
                  {isAnalyzing ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Analysiere...
                    </>
                  ) : 'Hinzufügen'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-rose-100">
          <CardHeader>
            <CardTitle className="text-gray-800">Kocherfahrung</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={data.cooking_experience || ''}
              onValueChange={(value) => onChange({ ...data, cooking_experience: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Wähle deine Kocherfahrung" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Anfänger</SelectItem>
                <SelectItem value="intermediate">Fortgeschritten</SelectItem>
                <SelectItem value="advanced">Experte</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="border-rose-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <Clock className="w-5 h-5 text-rose-500" />
              Verfügbare Zeit (Minuten/Tag)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="number"
              placeholder="z.B. 30"
              value={data.available_time || ''}
              onChange={handleTimeChange}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}