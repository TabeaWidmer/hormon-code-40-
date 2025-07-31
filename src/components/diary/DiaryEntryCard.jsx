
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { DiaryEntry, Plan } from '@/api/entities';
import { InvokeLLM } from '@/api/integrations';
import { 
  ChevronDown, 
  ChevronUp, 
  Utensils, 
  Dumbbell, 
  Save, 
  CheckCircle, 
  Sparkles,
  AlertCircle,
  TrendingUp,
  MessageCircle,
  ExternalLink,
  Calendar
} from 'lucide-react';

const COMMON_SYMPTOMS = [
  'Hitzewallungen', 'Nachtschweiß', 'Schlafstörungen', 'Stimmungsschwankungen',
  'Reizbarkeit', 'Müdigkeit', 'Gewichtszunahme', 'Gelenkschmerzen',
  'Kopfschmerzen', 'Konzentrationsprobleme', 'Herzrasen', 'Schwindel',
  'Verdauungsprobleme', 'Hautprobleme', 'Haarausfall', 'Libidoverlust'
];

export default function DiaryEntryCard({ 
  entryData, 
  userId, 
  dateLocale = de, 
  onSave, 
  allEntries = [], 
  isOpen, 
  onToggle 
}) {
  const [data, setData] = useState(entryData);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [todaysPlan, setTodaysPlan] = useState(null);
  const [coachFeedback, setCoachFeedback] = useState(null);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [showFeedbackPreparation, setShowFeedbackPreparation] = useState(false);
  const feedbackRef = useRef(null);

  useEffect(() => {
    setData(entryData);
  }, [entryData]);

  useEffect(() => {
    if (isOpen && data.date) {
      loadTodaysPlan();
    }
  }, [isOpen, data.date]);

  const loadTodaysPlan = async () => {
    try {
      const plans = await Plan.filter({ user_id: userId, date: data.date, type: 'daily' });
      if (plans.length > 0) {
        setTodaysPlan(plans[0]);
      }
    } catch (error) {
      console.error("Failed to load today's plan:", error);
    }
  };

  // Intelligente Mustererkennung über die letzten 7 Tage
  const analyzePatterns = () => {
    if (!allEntries || allEntries.length < 2) return { hasPatterns: false, insights: [] };
    
    const last7Days = allEntries
      .filter(entry => entry.date !== data.date) // Aktueller Tag ausschließen
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 7);

    if (last7Days.length < 3) return { hasPatterns: false, insights: [] };

    const patterns = [];
    
    // Pattern 1: Wiederkehrende Symptome (>=3x in 7 Tagen)
    const symptomCounts = {};
    last7Days.forEach(entry => {
      (entry.symptoms || []).forEach(symptom => {
        symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1;
      });
    });
    
    Object.entries(symptomCounts).forEach(([symptom, count]) => {
      if (count >= 3) {
        patterns.push({
          type: 'recurring_symptom',
          severity: count >= 5 ? 'high' : 'medium',
          symptom,
          count,
          message: `${symptom} tritt wiederholt auf (${count}x in den letzten 7 Tagen)`
        });
      }
    });

    // Pattern 2: Anhaltend niedrige Energie (durchschnittlich <=3 über 5+ Tage)
    const energyLevels = last7Days.map(e => e.energy_level).filter(e => e != null);
    if (energyLevels.length >= 5) {
      const avgEnergy = energyLevels.reduce((sum, e) => sum + e, 0) / energyLevels.length;
      if (avgEnergy <= 3) {
        patterns.push({
          type: 'low_energy_trend',
          severity: avgEnergy <= 2 ? 'high' : 'medium',
          avgValue: avgEnergy.toFixed(1),
          message: `Anhaltend niedrige Energie (Ø ${avgEnergy.toFixed(1)}/10 über ${energyLevels.length} Tage)`
        });
      }
    }

    // Pattern 3: Schlechte Schlafqualität (durchschnittlich <=3 über 4+ Tage)
    const sleepLevels = last7Days.map(e => e.sleep_quality).filter(s => s != null);
    if (sleepLevels.length >= 4) {
      const avgSleep = sleepLevels.reduce((sum, s) => sum + s, 0) / sleepLevels.length;
      if (avgSleep <= 3) {
        patterns.push({
          type: 'poor_sleep_trend',
          severity: avgSleep <= 2 ? 'high' : 'medium',
          avgValue: avgSleep.toFixed(1),
          message: `Anhaltend schlechter Schlaf (Ø ${avgSleep.toFixed(1)}/10 über ${sleepLevels.length} Tage)`
        });
      }
    }

    // Pattern 4: Negative Stimmung (durchschnittlich <=4 über 4+ Tage)
    const moodLevels = last7Days.map(e => e.mood).filter(m => m != null);
    if (moodLevels.length >= 4) {
      const avgMood = moodLevels.reduce((sum, m) => sum + m, 0) / moodLevels.length;
      if (avgMood <= 4) {
        patterns.push({
          type: 'low_mood_trend',
          severity: avgMood <= 3 ? 'high' : 'medium',
          avgValue: avgMood.toFixed(1),
          message: `Anhaltend gedrückte Stimmung (Ø ${avgMood.toFixed(1)}/10 über ${moodLevels.length} Tage)`
        });
      }
    }

    return {
      hasPatterns: patterns.length > 0,
      insights: patterns,
      dataPoints: last7Days.length
    };
  };

  const generateIntelligentCoachFeedback = async () => {
    setIsGeneratingFeedback(true);
    setShowFeedbackPreparation(true);

    try {
      const patternAnalysis = analyzePatterns();
      const currentSymptoms = data.symptoms || [];
      const currentMood = data.mood || 5;
      const currentEnergy = data.energy_level || 5;
      const currentSleep = data.sleep_quality || 5;
      const currentDigestion = data.digestion || 5;
      const userNotes = data.notes || '';

      // Erstelle einen sehr detaillierten Prompt für die KI
      const prompt = `
Du bist "HormonCoach", ein einfühlsamer KI-Begleiter für Frauen 40+ in der Perimenopause/Menopause. 

**BENUTZER-KONTEXT:**
Heutige Werte:
- Stimmung: ${currentMood}/10
- Energie: ${currentEnergy}/10  
- Schlafqualität: ${currentSleep}/10
- Verdauung: ${currentDigestion}/10
- Symptome heute: ${currentSymptoms.length > 0 ? currentSymptoms.join(', ') : 'Keine'}
- Notizen: "${userNotes}"

**MUSTER-ANALYSE (letzte 7 Tage):**
${patternAnalysis.hasPatterns ? 
  `ERKANNTE MUSTER (${patternAnalysis.dataPoints} Datenpunkte verfügbar):
${patternAnalysis.insights.map(insight => `- ${insight.message} (Schweregrad: ${insight.severity})`).join('\n')}` 
  : `Keine signifikanten Muster erkannt (${patternAnalysis.dataPoints} Datenpunkte verfügbar).`}

**DEINE AUFGABE:**
Erstelle eine empathische, strukturierte Antwort basierend auf folgender Logik:

**FALL 1: Keine Muster + gute Tageswerte** (Energie ≥6, Stimmung ≥6, Schlaf ≥6)
→ Kurze, ermutigende Bestätigung (2-3 Sätze)

**FALL 2: Keine Muster, aber schlechte Tageswerte** (ein Wert ≤4)
→ Empathische Ermutigung + 1-2 praktische Sofort-Tipps

**FALL 3: Beginnende Muster** (1 Muster erkannt)
→ Behutsam auf das Muster hinweisen + konkrete Lösungsvorschläge

**FALL 4: Klare Muster** (2+ Muster erkannt)
→ Strukturierte Antwort mit Handlungsempfehlungen + CTA

**ANTWORT-FORMAT (JSON):**
{
  "feedback_type": "encouraging|supportive|pattern_alert|action_needed",
  "title": "Kurzer, einfühlsamer Titel",
  "message": "Hauptnachricht in empathischem, verständnisvollem Ton. Verwende 'du' und spreche die Frau direkt an.",
  "action_items": ["Praktischer Tipp 1", "Praktischer Tipp 2"] (nur bei Mustern),
  "cta_text": "Button-Text" (nur bei schweren Mustern, z.B. 'Experten-Tipps ansehen'),
  "severity": "low|medium|high"
}

**WICHTIGE REGELN:**
- Sei warm, verständnisvoll und ermutigend
- Keine medizinischen Diagnosen oder Behandlungsempfehlungen
- Bei schweren Mustern: Ermutige professionelle Beratung
- Verwende eine natürliche, persönliche Sprache
- Erkenne auch kleine Erfolge an
`.trim();

      const response = await InvokeLLM({ 
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            feedback_type: { type: "string" },
            title: { type: "string" },
            message: { type: "string" },
            action_items: { type: "array", items: { type: "string" } },
            cta_text: { type: "string" },
            severity: { type: "string" }
          },
          required: ["feedback_type", "title", "message", "severity"]
        }
      });

      setCoachFeedback(response);
      setShowFeedbackPreparation(false);

      // Scroll zur Feedback-Box nach einer kurzen Verzögerung
      setTimeout(() => {
        if (feedbackRef.current) {
          feedbackRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }, 500);

    } catch (error) {
      console.error("Failed to generate coach feedback:", error);
      setCoachFeedback({
        feedback_type: "error",
        title: "Entschuldigung",
        message: "Ich kann momentan kein Feedback generieren. Versuche es später noch einmal.",
        severity: "low"
      });
      setShowFeedbackPreparation(false);
    }
    
    setIsGeneratingFeedback(false);
  };

  const handleSave = async () => {
    if (!data.mood || !data.energy_level || !data.sleep_quality || !data.digestion) {
      alert('Bitte fülle alle Bewertungsfelder aus.');
      return;
    }

    setIsSaving(true);
    try {
      let savedEntry;
      if (data.id && !data.id.startsWith('new-')) {
        savedEntry = await DiaryEntry.update(data.id, data);
      } else {
        const { id, isNew, ...entryToCreate } = data;
        savedEntry = await DiaryEntry.create({ ...entryToCreate, user_id: userId });
      }
      
      setIsSaved(true);
      onSave(savedEntry);
      
      // Zeige die Feedback-Vorbereitung an
      setShowFeedbackPreparation(true);
      
      // Generiere intelligentes Feedback
      setTimeout(() => {
        generateIntelligentCoachFeedback();
      }, 1000);
      
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      console.error("Failed to save diary entry:", error);
      alert('Fehler beim Speichern des Eintrags.');
    }
    setIsSaving(false);
  };

  const handleSymptomToggle = (symptom) => {
    const currentSymptoms = data.symptoms || [];
    const newSymptoms = currentSymptoms.includes(symptom)
      ? currentSymptoms.filter(s => s !== symptom)
      : [...currentSymptoms, symptom];
    setData({ ...data, symptoms: newSymptoms });
  };

  const addCustomSymptom = (customSymptom) => {
    if (customSymptom.trim() && !(data.symptoms || []).includes(customSymptom.trim())) {
      const newSymptoms = [...(data.symptoms || []), customSymptom.trim()];
      setData({ ...data, symptoms: newSymptoms });
    }
  };

  const isToday = data.date === format(new Date(), 'yyyy-MM-dd');
  const formattedDate = format(new Date(data.date), 'EEEE, dd. MMMM yyyy', { locale: dateLocale });

  return (
    <Card className="mb-6 shadow-lg">
      <CardHeader 
        className="cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-800">
                {isToday ? '🌟 Heute' : formattedDate}
              </CardTitle>
              {!isOpen && (
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    Stimmung: {data.mood || '?'}/10
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Energie: {data.energy_level || '?'}/10
                  </Badge>
                  {(data.symptoms || []).length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {data.symptoms.length} Symptom{data.symptoms.length === 1 ? '' : 'e'}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isSaved && (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
            {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </CardHeader>

      {isOpen && (
        <CardContent className="space-y-6">
          {/* Bewertungsslider */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Stimmung: {data.mood || 5}/10
              </label>
              <Slider
                value={[data.mood || 5]}
                onValueChange={(value) => setData({ ...data, mood: value[0] })}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Energie: {data.energy_level || 5}/10
              </label>
              <Slider
                value={[data.energy_level || 5]}
                onValueChange={(value) => setData({ ...data, energy_level: value[0] })}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Schlafqualität: {data.sleep_quality || 5}/10
              </label>
              <Slider
                value={[data.sleep_quality || 5]}
                onValueChange={(value) => setData({ ...data, sleep_quality: value[0] })}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Verdauung: {data.digestion || 5}/10
              </label>
              <Slider
                value={[data.digestion || 5]}
                onValueChange={(value) => setData({ ...data, digestion: value[0] })}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
            </div>
          </div>

          {/* Symptome */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-3 block">
              Symptome heute:
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {COMMON_SYMPTOMS.map(symptom => (
                <Badge
                  key={symptom}
                  variant={(data.symptoms || []).includes(symptom) ? "default" : "outline"}
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSymptomToggle(symptom)}
                >
                  {symptom}
                </Badge>
              ))}
            </div>
            
            <Input
              placeholder="Eigenes Symptom hinzufügen..."
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addCustomSymptom(e.target.value);
                  e.target.value = '';
                }
              }}
              className="mt-2"
            />
          </div>

          {/* Notizen */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Notizen:
            </label>
            <Textarea
              placeholder="Wie geht es dir heute? Was beschäftigt dich?"
              value={data.notes || ''}
              onChange={(e) => setData({ ...data, notes: e.target.value })}
              rows={3}
            />
          </div>

          {/* Körpermaße (optional) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Gewicht (kg)
              </label>
              <Input
                type="number"
                placeholder="Optional"
                value={data.weight || ''}
                onChange={(e) => setData({ ...data, weight: e.target.value ? parseFloat(e.target.value) : null })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Taillenumfang (cm)
              </label>
              <Input
                type="number"
                placeholder="Optional"
                value={data.waist_circumference || ''}
                onChange={(e) => setData({ ...data, waist_circumference: e.target.value ? parseFloat(e.target.value) : null })}
              />
            </div>
          </div>

          {/* Plan des Tages */}
          {todaysPlan && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Plan für heute:
              </h4>
              <div className="space-y-2">
                {(todaysPlan.meals || []).map(meal => (
                  <div key={meal.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`meal-${meal.id}`}
                      checked={(data.completed_meals || []).includes(meal.id)}
                      onCheckedChange={(checked) => {
                        const completedMeals = data.completed_meals || [];
                        const newCompletedMeals = checked
                          ? [...completedMeals, meal.id]
                          : completedMeals.filter(id => id !== meal.id);
                        setData({ ...data, completed_meals: newCompletedMeals });
                      }}
                    />
                    <label htmlFor={`meal-${meal.id}`} className="text-sm cursor-pointer flex items-center gap-1">
                      <Utensils className="w-3 h-3" />
                      {meal.name}
                    </label>
                  </div>
                ))}
                {(todaysPlan.workouts || []).map(workout => (
                  <div key={workout.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`workout-${workout.id}`}
                      checked={(data.completed_workouts || []).includes(workout.id)}
                      onCheckedChange={(checked) => {
                        const completedWorkouts = data.completed_workouts || [];
                        const newCompletedWorkouts = checked
                          ? [...completedWorkouts, workout.id]
                          : completedWorkouts.filter(id => id !== workout.id);
                        setData({ ...data, completed_workouts: newCompletedWorkouts });
                      }}
                    />
                    <label htmlFor={`workout-${workout.id}`} className="text-sm cursor-pointer flex items-center gap-1">
                      <Dumbbell className="w-3 h-3" />
                      {workout.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Speichern Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Speichere...
                </>
              ) : isSaved ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Gespeichert!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Eintrag speichern
                </>
              )}
            </Button>
          </div>

          {/* Feedback-Vorbereitung */}
          {showFeedbackPreparation && !coachFeedback && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <div>
                  <p className="font-medium text-blue-800">Dein HormonCoach bereitet eine persönliche Antwort vor...</p>
                  <p className="text-sm text-blue-600">Analysiere deine letzten Einträge für maßgeschneiderte Empfehlungen.</p>
                </div>
              </div>
            </div>
          )}

          {/* Coach Feedback */}
          {coachFeedback && (
            <div ref={feedbackRef} className="mt-6 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                    {coachFeedback.severity === 'high' && <AlertCircle className="w-4 h-4 text-orange-500" />}
                    {coachFeedback.severity === 'medium' && <TrendingUp className="w-4 h-4 text-blue-500" />}
                    {coachFeedback.severity === 'low' && <MessageCircle className="w-4 h-4 text-green-500" />}
                    {coachFeedback.title}
                  </h4>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    {coachFeedback.message}
                  </p>
                  
                  {coachFeedback.action_items && coachFeedback.action_items.length > 0 && (
                    <div className="mb-4">
                      <p className="font-medium text-purple-700 mb-2">💡 Meine Empfehlungen für dich:</p>
                      <ul className="space-y-1">
                        {coachFeedback.action_items.map((item, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="text-purple-500 font-bold">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {coachFeedback.cta_text && (
                    <Button variant="outline" className="gap-2 text-purple-700 border-purple-300 hover:bg-purple-50">
                      <ExternalLink className="w-4 h-4" />
                      {coachFeedback.cta_text}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
