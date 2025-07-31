import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/api/entities';

const translations = {
  de: {
    app_name: "HormonCode 40+",
    welcome: "Willkommen bei HormonCode 40+",
    dashboard: "Dashboard",
    questionnaire: "Fragebogen",
    diary: "Tagebuch",
    plans: "Pläne",
    knowledge: "Wissen",
    coach: "HormonCoach",
    profile: "Profil",
    settings: "Einstellungen",
    logout: "Abmelden",
    nutrition: "Ernährung",
    movement: "Bewegung",
    relaxation: "Entspannung",
    sleep: "Schlaf",
    mood: "Stimmung",
    energy: "Energie",
    digestion: "Verdauung",
    symptoms: "Symptome",
    notes: "Notizen",
    save: "Speichern",
    cancel: "Abbrechen",
    continue: "Weiter",
    back: "Zurück",
    complete: "Abschließen",
    loading: "Laden...",
    error: "Fehler",
    success: "Erfolgreich"
  },
  en: {
    app_name: "HormonCode 40+",
    welcome: "Welcome to HormonCode 40+",
    dashboard: "Dashboard",
    questionnaire: "Questionnaire",
    diary: "Diary",
    plans: "Plans",
    knowledge: "Knowledge",
    coach: "HormonCoach",
    profile: "Profile",
    settings: "Settings",
    logout: "Logout",
    nutrition: "Nutrition",
    movement: "Movement",
    relaxation: "Relaxation",
    sleep: "Sleep",
    mood: "Mood",
    energy: "Energy",
    digestion: "Digestion",
    symptoms: "Symptoms",
    notes: "Notes",
    save: "Save",
    cancel: "Cancel",
    continue: "Continue",
    back: "Back",
    complete: "Complete",
    loading: "Loading...",
    error: "Error",
    success: "Success"
  },
  fr: {
    app_name: "HormonCode 40+",
    welcome: "Bienvenue à HormonCode 40+",
    dashboard: "Tableau de bord",
    questionnaire: "Questionnaire",
    diary: "Journal",
    plans: "Plans",
    knowledge: "Connaissances",
    coach: "HormonCoach",
    profile: "Profil",
    settings: "Paramètres",
    logout: "Se déconnecter",
    nutrition: "Nutrition",
    movement: "Mouvement",
    relaxation: "Relaxation",
    sleep: "Sommeil",
    mood: "Humeur",
    energy: "Énergie",
    digestion: "Digestion",
    symptoms: "Symptômes",
    notes: "Notes",
    save: "Enregistrer",
    cancel: "Annuler",
    continue: "Continuer",
    back: "Retour",
    complete: "Terminer",
    loading: "Chargement...",
    error: "Erreur",
    success: "Succès"
  },
  se: {
    app_name: "HormonCode 40+",
    welcome: "Välkommen till HormonCode 40+",
    dashboard: "Instrumentpanel",
    questionnaire: "Frågeformulär",
    diary: "Dagbok",
    plans: "Planer",
    knowledge: "Kunskap",
    coach: "HormonCoach",
    profile: "Profil",
    settings: "Inställningar",
    logout: "Logga ut",
    nutrition: "Näring",
    movement: "Rörelse",
    relaxation: "Avkoppling",
    sleep: "Sömn",
    mood: "Humör",
    energy: "Energi",
    digestion: "Matsmältning",
    symptoms: "Symtom",
    notes: "Anteckningar",
    save: "Spara",
    cancel: "Avbryt",
    continue: "Fortsätt",
    back: "Tillbaka",
    complete: "Slutför",
    loading: "Laddar...",
    error: "Fel",
    success: "Framgång"
  }
};

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default function LanguageProvider({ children }) {
  const [currentLanguage, setCurrentLanguage] = useState('de');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserLanguage();
  }, []);

  const loadUserLanguage = async () => {
    try {
      const user = await User.me();
      if (user.language) {
        setCurrentLanguage(user.language);
      }
    } catch (error) {
      // User not logged in or error, use default
    }
    setIsLoading(false);
  };

  const changeLanguage = async (newLanguage) => {
    setCurrentLanguage(newLanguage);
    try {
      await User.updateMyUserData({ language: newLanguage });
    } catch (error) {
      console.error('Failed to save language preference:', error);
    }
  };

  const t = (key) => {
    return translations[currentLanguage]?.[key] || translations['de'][key] || key;
  };

  const value = {
    language: currentLanguage,
    changeLanguage,
    t,
    isLoading
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}