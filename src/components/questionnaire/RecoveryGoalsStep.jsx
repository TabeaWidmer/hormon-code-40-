import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Moon, Sparkles, Brain, Target } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import TooltipInfo from '../ui/TooltipInfo';

export default function RecoveryGoalsStep({ data, onChange }) {
  const handleToggle = (key, value) => {
    const current = data[key] || [];
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];
    onChange({ ...data, [key]: updated });
  };

  const primaryGoals = [
    'Gewicht regulieren', 'Energie steigern', 'Hitzewallungen reduzieren', 
    'Stimmung stabilisieren', 'Schlaf verbessern', 'Hautbild verbessern', 
    'Libido steigern', 'Geistige Klarheit'
  ];

  const sleepPreferences = [
    'Früh ins Bett (vor 22:00)', 'Spät ins Bett (nach 23:00)',
    'Früh aufstehen (vor 6:00)', 'Spät aufstehen (nach 7:00)',
    'Kurzer Schlaf (< 7h)', 'Langer Schlaf (> 8h)'
  ];

  const relaxationMethods = [
    'Meditation', 'Atemübungen', 'Yoga Nidra', 'Warmes Bad',
    'Lesen', 'Musik hören', 'Journaling', 'Spaziergang'
  ];

  return (
    <div className="space-y-8">
      <Card className="border-rose-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Target className="w-5 h-5 text-rose-500" />
            Deine primären Ziele
            <TooltipInfo text="Wähle die wichtigsten Ziele aus, die du mit einer besseren Hormonbalance erreichen möchtest." />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {primaryGoals.map(goal => (
              <Badge
                key={goal}
                variant={(data.primary_goals || []).includes(goal) ? "default" : "outline"}
                className="cursor-pointer text-base p-2"
                onClick={() => handleToggle('primary_goals', goal)}
              >
                {goal}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-rose-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Moon className="w-5 h-5 text-rose-500" />
            Schlafgewohnheiten
            <TooltipInfo text="Wie sehen deine typischen Schlafgewohnheiten aus?" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {sleepPreferences.map((item) => (
              <Badge
                key={item}
                variant={(data.sleep_preferences || []).includes(item) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => handleToggle('sleep_preferences', item)}
              >
                {item}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-rose-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Sparkles className="w-5 h-5 text-rose-500" />
            Bevorzugte Entspannungsmethoden
            <TooltipInfo text="Was hilft dir am besten, um abzuschalten und zu entspannen?" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {relaxationMethods.map((item) => (
              <Badge
                key={item}
                variant={(data.relaxation_methods || []).includes(item) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => handleToggle('relaxation_methods', item)}
              >
                {item}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-rose-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Brain className="w-5 h-5 text-rose-500" />
            Aktuelles Stresslevel
            <TooltipInfo text="Bewerte dein durchschnittliches Stresslevel der letzten Wochen auf einer Skala von 1 (tiefenentspannt) bis 10 (extrem gestresst)." />
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
             <span>Entspannt</span>
             <span>Extrem gestresst</span>
          </div>
          <Slider 
            defaultValue={[data.stress_level || 5]} 
            max={10} 
            min={1}
            step={1} 
            onValueChange={(value) => onChange({ ...data, stress_level: value[0] })} 
          />
        </CardContent>
      </Card>
    </div>
  );
}