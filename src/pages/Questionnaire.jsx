import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/components/context/AppContext';
import NutritionStep from '@/components/questionnaire/NutritionStep';
import MovementStep from '@/components/questionnaire/MovementStep';
import RecoveryGoalsStep from '@/components/questionnaire/RecoveryGoalsStep';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

const steps = [
  { id: 'nutrition', title: 'Ernährung', component: NutritionStep },
  { id: 'movement', title: 'Bewegung', component: MovementStep },
  { id: 'recovery', title: 'Erholung & Ziele', component: RecoveryGoalsStep },
];

export default function Questionnaire() {
  const { questionnaire, updateQuestionnaire, recipeGenerationError } = useAppContext();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    if (questionnaire) {
      setFormData(questionnaire);
    }
  }, [questionnaire]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await updateQuestionnaire(formData);
      setSaveSuccess(true);
      setTimeout(() => {
        navigate('/recipes');
      }, 2000);
    } catch (error) {
      console.error("Failed to save questionnaire and generate recipes:", error);
      setSaveError(error.message || "Ein unbekannter Fehler ist aufgetreten.");
    } finally {
      setIsSaving(false);
    }
  };

  const CurrentStepComponent = steps[currentStep].component;
  const progress = ((currentStep + 1) / steps.length) * 100;

  if (isSaving) {
      return (
        <div className="container mx-auto p-4 md:p-8 flex items-center justify-center min-h-[60vh]">
            <Card className="w-full max-w-lg text-center p-8">
                <Loader2 className="w-16 h-16 text-purple-500 mx-auto mb-4 animate-spin" />
                <h2 className="text-2xl font-bold text-gray-800">Speichern & Generieren...</h2>
                <p className="text-gray-600 mt-4">
                    Dein Fragebogen wird gespeichert und dein persönlicher Rezeptkatalog wird erstellt.
                    Dieser Vorgang kann bis zu einer Minute dauern. Bitte schliesse das Fenster nicht.
                </p>
            </Card>
        </div>
      )
  }

  if (saveSuccess) {
      return (
        <div className="container mx-auto p-4 md:p-8 flex items-center justify-center min-h-[60vh]">
            <Card className="w-full max-w-lg text-center p-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800">Erfolgreich!</h2>
                <p className="text-gray-600 mt-4">
                    Dein persönlicher Rezeptkatalog wurde erstellt. Du wirst jetzt weitergeleitet.
                </p>
            </Card>
        </div>
      )
  }
  
  if (saveError) {
       return (
        <div className="container mx-auto p-4 md:p-8 flex items-center justify-center min-h-[60vh]">
            <Card className="w-full max-w-lg text-center p-8">
                <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800">Fehler beim Speichern</h2>
                <p className="text-gray-600 mt-4 bg-red-50 p-4 rounded-md">
                    {saveError}
                </p>
                <Button onClick={() => setSaveError(null)} className="mt-6">Erneut versuchen</Button>
            </Card>
        </div>
      )
  }


  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Dein persönlicher Fragebogen</h1>
        <p className="text-lg text-gray-600 mt-2">
          Lass uns deine Reise mit den richtigen Grundlagen beginnen.
        </p>
      </header>
      
      <div className="mb-6">
        <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">{steps[currentStep].title}</span>
            <span className="text-sm text-gray-500">Schritt {currentStep + 1} von {steps.length}</span>
        </div>
        <Progress value={progress} />
      </div>

      <Card>
        <CardContent className="p-6">
          <CurrentStepComponent data={formData} onChange={setFormData} />
        </CardContent>
      </Card>

      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={handleBack} disabled={currentStep === 0}>
          Zurück
        </Button>
        {currentStep < steps.length - 1 ? (
          <Button onClick={handleNext}>Weiter</Button>
        ) : (
          <Button onClick={handleSave}>
            Speichern & Rezepte erstellen
          </Button>
        )}
      </div>
    </div>
  );
}