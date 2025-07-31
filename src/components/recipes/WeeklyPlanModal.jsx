
import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageProvider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { 
  Calendar,
  Clock,
  Users,
  Check
} from 'lucide-react';
import { Plan } from '@/api/entities';

const WEEKDAYS = [
  { key: 'monday', label: 'Montag' },
  { key: 'tuesday', label: 'Dienstag' },
  { key: 'wednesday', label: 'Mittwoch' },
  { key: 'thursday', label: 'Donnerstag' },
  { key: 'friday', label: 'Freitag' },
  { key: 'saturday', label: 'Samstag' },
  { key: 'sunday', label: 'Sonntag' }
];

const MEAL_TYPES = [
  { key: 'breakfast', label: 'Frühstück' },
  { key: 'lunch', label: 'Mittagessen' },
  { key: 'dinner', label: 'Abendessen' },
  { key: 'snack', label: 'Snack' }
];

export default function WeeklyPlanModal({ 
  recipe, 
  portions,
  isOpen, 
  onClose, 
  userId
}) {
  const { t, language } = useLanguage();
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedMealType, setSelectedMealType] = useState(recipe?.category || '');
  const [isAdding, setIsAdding] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!recipe) return null;

  const handleAddToPlan = async () => {
    if (!selectedDay || !selectedMealType || !userId) return;
    
    setIsAdding(true);
    try {
      // Get current week's plan
      const today = new Date();
      const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 1));
      const weekStart = startOfWeek.toISOString().split('T')[0];

      const existingPlans = await Plan.filter({ 
        user_id: userId, 
        type: 'weekly',
        date: weekStart
      });

      const mealData = {
        id: `recipe_${recipe.id}_${Date.now()}`,
        day_of_week: selectedDay,
        name: recipe.title?.[language] || recipe.title?.de || recipe.custom_name,
        type: selectedMealType,
        calories: Math.round((recipe.macros_per_portion?.calories || 0) * portions),
        recipe_id: recipe.id,
        portions: portions,
        recipe: recipe,
        is_custom: recipe.is_custom || false
      };

      if (existingPlans.length > 0) {
        const plan = existingPlans[0];
        
        // Sanitize existing meals to ensure recipe is an object
        const sanitizedMeals = (plan.meals || []).map(meal => {
          if (typeof meal.recipe !== 'object' || meal.recipe === null) {
            return {
              ...meal,
              recipe: {
                title: { de: meal.name || 'Altes Rezept' }, // Provide a fallback title
                instructions: { de: [] } // Provide fallback instructions
              }
            };
          }
          return meal;
        });
        
        const updatedMeals = [...sanitizedMeals, mealData];
        await Plan.update(plan.id, { meals: updatedMeals });
      } else {
        await Plan.create({
          user_id: userId,
          type: 'weekly',
          date: weekStart,
          meals: [mealData],
          workouts: []
        });
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error adding recipe to weekly plan:', error);
    }
    setIsAdding(false);
  };

  if (success) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Erfolgreich hinzugefügt!
            </h3>
            <p className="text-gray-600">
              Das Rezept wurde zu deinem Wochenplan hinzugefügt.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-rose-500" />
            Zum Wochenplan hinzufügen
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Recipe Summary */}
          <Card className="border-rose-100">
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                {recipe.title?.[language] || recipe.title?.de || recipe.custom_name}
                {recipe.is_custom && (
                  <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                    Mein Rezept
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {portions} Portion{portions > 1 ? 'en' : ''}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {recipe.prep_time + (recipe.cook_time || 0)} Min
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Day Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Wähle einen Tag
            </label>
            <Select value={selectedDay} onValueChange={setSelectedDay}>
              <SelectTrigger>
                <SelectValue placeholder="Tag auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {WEEKDAYS.map(day => (
                  <SelectItem key={day.key} value={day.key}>
                    {day.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Meal Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mahlzeitentyp
            </label>
            <Select value={selectedMealType} onValueChange={setSelectedMealType}>
              <SelectTrigger>
                <SelectValue placeholder="Mahlzeit auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {MEAL_TYPES.map(meal => (
                  <SelectItem key={meal.key} value={meal.key}>
                    {meal.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              Abbrechen
            </Button>
            <Button 
              onClick={handleAddToPlan}
              disabled={!selectedDay || !selectedMealType || isAdding}
              className="flex-1 gradient-sage text-white"
            >
              {isAdding ? 'Hinzufügen...' : 'Hinzufügen'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
