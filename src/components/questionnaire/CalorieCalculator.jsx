import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Calculator } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export default function CalorieCalculator({ data, onChange }) {
  const [calculatorData, setCalculatorData] = useState({
    age: data.age || '',
    height: data.height || '',
    weight: data.weight || '',
    activity_level: data.activity_level || '',
    goal: data.goal || 'maintain',
    weight_loss_speed: data.weight_loss_speed || 'moderate',
    ...data
  });

  const [results, setResults] = useState({
    bmr: 0,
    tdee: 0,
    adjusted_calories: 0,
    breakdown: {
      bmr: 0,
      activity_adjustment: 0,
      hormonal_adjustment: 0,
      goal_adjustment: 0
    }
  });

  const activityMultipliers = {
    sedentary: { value: 1.2, label: 'Wenig aktiv (Bürojob, wenig Bewegung)' },
    lightly_active: { value: 1.375, label: 'Leicht aktiv (Sport 1-3x/Woche)' },
    moderately_active: { value: 1.55, label: 'Moderat aktiv (Sport 3-5x/Woche)' },
    very_active: { value: 1.725, label: 'Sehr aktiv (Sport 6-7x/Woche)' }
  };

  const goalOptions = [
    { key: 'lose_weight', label: 'Gewicht verlieren' },
    { key: 'maintain', label: 'Gewicht halten' },
    { key: 'gain_weight', label: 'Gewicht zunehmen' }
  ];

  const speedOptions = {
    lose_weight: [
      { key: 'slow', label: 'Langsam (~0.25 kg/Woche)', deficit: 275 },
      { key: 'moderate', label: 'Moderat (~0.5 kg/Woche)', deficit: 550 },
      { key: 'fast', label: 'Schnell (~0.75 kg/Woche)', deficit: 825 }
    ],
    gain_weight: [
      { key: 'slow', label: 'Langsam (~0.25 kg/Woche)', deficit: -200 },
      { key: 'moderate', label: 'Moderat (~0.4 kg/Woche)', deficit: -350 },
      { key: 'fast', label: 'Schnell (~0.6 kg/Woche)', deficit: -500 }
    ]
  };

  useEffect(() => {
    if (calculatorData.age && calculatorData.height && calculatorData.weight && calculatorData.activity_level) {
      calculateCalories();
    }
  }, [calculatorData]);

  const calculateCalories = () => {
    const { age, height, weight, activity_level, goal, weight_loss_speed } = calculatorData;
    
    // Mifflin-St. Jeor formula for women
    const bmr = Math.round(10 * parseFloat(weight) + 6.25 * parseFloat(height) - 5 * parseFloat(age) - 161);
    
    // Activity level adjustment
    const activityMultiplier = activityMultipliers[activity_level]?.value || 1.2;
    const tdee = Math.round(bmr * activityMultiplier);
    
    // Hormonal adjustment for women 40+
    const hormonalAdjustment = parseFloat(age) >= 40 ? Math.round(tdee * -0.05) : 0;
    const hormonallyAdjustedTDEE = tdee + hormonalAdjustment;
    
    // Goal-based adjustment
    let goalAdjustment = 0;
    let finalCalories = hormonallyAdjustedTDEE;
    
    if (goal === 'lose_weight') {
      const speedConfig = speedOptions.lose_weight.find(s => s.key === weight_loss_speed);
      goalAdjustment = -(speedConfig?.deficit || 550);
      finalCalories = Math.max(1200, hormonallyAdjustedTDEE + goalAdjustment);
    } else if (goal === 'gain_weight') {
      const speedConfig = speedOptions.gain_weight.find(s => s.key === weight_loss_speed);
      goalAdjustment = -(speedConfig?.deficit || -350);
      finalCalories = hormonallyAdjustedTDEE + goalAdjustment;
    }

    const newResults = {
      bmr,
      tdee,
      adjusted_calories: finalCalories,
      breakdown: {
        bmr,
        activity_adjustment: tdee - bmr,
        hormonal_adjustment: hormonalAdjustment,
        goal_adjustment: goalAdjustment
      }
    };

    setResults(newResults);
    
    // Update parent component
    onChange({
      ...calculatorData,
      daily_calories: finalCalories,
      calculator_results: newResults
    });
  };

  const handleInputChange = (field, value) => {
    const updatedData = { ...calculatorData, [field]: value };
    setCalculatorData(updatedData);
    onChange(updatedData);
  };

  const handleGoalChange = (goalKey) => {
    const updatedData = { 
      ...calculatorData, 
      goal: goalKey,
      weight_loss_speed: goalKey === 'maintain' ? '' : 'moderate'
    };
    setCalculatorData(updatedData);
    onChange(updatedData);
  };

  const handleSpeedChange = (speedKey) => {
    const updatedData = { ...calculatorData, weight_loss_speed: speedKey };
    setCalculatorData(updatedData);
    onChange(updatedData);
  };

  const showSpeedSelection = calculatorData.goal === 'lose_weight' || calculatorData.goal === 'gain_weight';

  const ResultsDisplay = () => {
    const [showDetails, setShowDetails] = useState(false);

    if (!results.adjusted_calories) return null;

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6"
      >
        <div className="bg-gradient-to-r from-sage-50 to-mint-pastel/30 p-6 rounded-2xl border border-sage-100">
          <div className="text-center mb-4">
            <p className="text-text-secondary text-sm mb-2">Dein tägliches Kalorienziel</p>
            <h3 className="text-3xl font-bold text-sage-800">
              {results.adjusted_calories} kcal
            </h3>
          </div>

          <Collapsible open={showDetails} onOpenChange={setShowDetails}>
            <CollapsibleTrigger asChild>
              <Button variant="link" className="w-full text-sage-700 hover:text-sage-800">
                {showDetails ? "Details ausblenden" : "Berechnung anzeigen"}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <div className="bg-white/60 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Grundumsatz (BMR):</span>
                  <span className="font-semibold">{results.breakdown.bmr} kcal</span>
                </div>
                <div className="flex justify-between">
                  <span>Aktivität:</span>
                  <span className="font-semibold text-green-600">+{results.breakdown.activity_adjustment} kcal</span>
                </div>
                {results.breakdown.hormonal_adjustment !== 0 && (
                  <div className="flex justify-between">
                    <span>Hormonelle Anpassung (40+):</span>
                    <span className="font-semibold text-purple-600">{results.breakdown.hormonal_adjustment} kcal</span>
                  </div>
                )}
                {results.breakdown.goal_adjustment !== 0 && (
                  <div className="flex justify-between">
                    <span>Ziel-Anpassung:</span>
                    <span className="font-semibold text-orange-600">
                      {results.breakdown.goal_adjustment > 0 ? '+' : ''}{results.breakdown.goal_adjustment} kcal
                    </span>
                  </div>
                )}
                <div className="border-t border-gray-300 my-2"></div>
                <div className="flex justify-between text-base font-bold">
                  <span>Gesamt:</span>
                  <span className="text-sage-800">{results.adjusted_calories} kcal</span>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </motion.div>
    );
  };

  return (
    <Card className="border-0 shadow-soft rounded-2xl glass-effect">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-text-primary text-xl font-bold">
          <Calculator className="w-6 h-6 text-rose-500" />
          Dein persönlicher Kalorienrechner
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Zeile 1: Alter, Größe, Gewicht */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="age" className="font-medium text-text-secondary">Alter (Jahre)</Label>
            <Input
              id="age"
              type="number"
              placeholder="z.B. 45"
              value={calculatorData.age}
              onChange={(e) => handleInputChange('age', e.target.value)}
              className="mt-1 h-11"
            />
          </div>
          
          <div>
            <Label htmlFor="height" className="font-medium text-text-secondary">Größe (cm)</Label>
            <Input
              id="height"
              type="number"
              placeholder="z.B. 165"
              value={calculatorData.height}
              onChange={(e) => handleInputChange('height', e.target.value)}
              className="mt-1 h-11"
            />
          </div>
          
          <div>
            <Label htmlFor="weight" className="font-medium text-text-secondary">Gewicht (kg)</Label>
            <Input
              id="weight"
              type="number"
              placeholder="z.B. 70"
              value={calculatorData.weight}
              onChange={(e) => handleInputChange('weight', e.target.value)}
              className="mt-1 h-11"
            />
          </div>
        </div>

        {/* Zeile 2: Aktivitätslevel (volle Breite) */}
        <div>
          <Label htmlFor="activity" className="font-medium text-text-secondary">Aktivitätslevel</Label>
          <Select
            value={calculatorData.activity_level}
            onValueChange={(value) => handleInputChange('activity_level', value)}
          >
            <SelectTrigger className="mt-1 h-11">
              <SelectValue placeholder="Wähle dein Aktivitätslevel" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(activityMultipliers).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Zeile 3: Ziel und Geschwindigkeit */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="goal" className="font-medium text-text-secondary">Ziel</Label>
            <Select
              value={calculatorData.goal}
              onValueChange={handleGoalChange}
            >
              <SelectTrigger className="mt-1 h-11">
                <SelectValue placeholder="Wähle dein Ziel" />
              </SelectTrigger>
              <SelectContent>
                {goalOptions.map((option) => (
                  <SelectItem key={option.key} value={option.key}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="speed" className="font-medium text-text-secondary">Wie schnell?</Label>
            <Select
              value={calculatorData.weight_loss_speed}
              onValueChange={handleSpeedChange}
              disabled={!showSpeedSelection}
            >
              <SelectTrigger className={`mt-1 h-11 ${!showSpeedSelection ? 'opacity-50' : ''}`}>
                <SelectValue placeholder={showSpeedSelection ? "Wähle Geschwindigkeit" : "Nicht verfügbar"} />
              </SelectTrigger>
              <SelectContent>
                {showSpeedSelection && (speedOptions[calculatorData.goal] || []).map((option) => (
                  <SelectItem key={option.key} value={option.key}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Ergebnisanzeige */}
        <AnimatePresence>
          {results.adjusted_calories > 0 && <ResultsDisplay />}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}