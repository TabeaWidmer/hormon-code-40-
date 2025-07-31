import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '@/components/context/AppContext';
import DiaryEntryCard from '@/components/diary/DiaryEntryCard';
import DiaryCharts from '@/components/diary/DiaryCharts';
import ReportGenerator from '@/components/diary/ReportGenerator';
import { Button } from '@/components/ui/button';
import { DiaryEntry } from '@/api/entities';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { BarChart2 } from 'lucide-react';

export default function Diary() {
  const { user, questionnaire } = useAppContext();
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCharts, setShowCharts] = useState(false);

  // Zustand, um zu steuern, welcher Eintrag geöffnet ist.
  const [openEntryId, setOpenEntryId] = useState(null);

  const fetchEntries = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const userEntries = await DiaryEntry.filter({ user_id: user.id });
      setEntries(userEntries);

      // Den heutigen Eintrag standardmässig öffnen
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const todayEntry = userEntries.find(e => e.date === todayStr);
      if (todayEntry) {
        setOpenEntryId(todayEntry.id);
      } else {
        setOpenEntryId(`new-${todayStr}`);
      }

    } catch (error) {
      console.error("Failed to fetch diary entries:", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchEntries();
  }, [user]);

  // Memoized diary entries, um einen Platzhalter für heute hinzuzufügen, falls er nicht existiert
  const diaryDays = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const existingTodayEntry = entries.find(e => e.date === todayStr);

    let allDays = [...entries];

    if (!existingTodayEntry) {
      const newEntryPlaceholder = {
        id: `new-${todayStr}`,
        date: todayStr,
        mood: 5,
        energy_level: 5,
        sleep_quality: 5,
        digestion: 5,
        symptoms: [],
        notes: '',
        isNew: true,
      };
      allDays.push(newEntryPlaceholder);
    }
    
    // Einträge nach Datum absteigend sortieren
    return allDays.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [entries]);

  const handleSave = (savedEntry) => {
    // Platzhalter ersetzen oder bestehenden Eintrag aktualisieren
    setEntries(prevEntries => {
      const otherEntries = prevEntries.filter(e => e.id !== savedEntry.id && e.id !== `new-${savedEntry.date}`);
      return [...otherEntries, savedEntry];
    });
    // Den gerade gespeicherten Eintrag geöffnet lassen
    setOpenEntryId(savedEntry.id);
  };

  // Funktion, um den offenen Eintrag zu wechseln
  const handleToggleEntry = (entryId) => {
    setOpenEntryId(prevId => (prevId === entryId ? null : entryId));
  };
  
  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Dein Tagebuch</h1>
        <p className="text-lg text-gray-600 mt-2">
          Verfolge deine Symptome, deine Stimmung und deinen Lebensstil, um Muster zu erkennen.
        </p>
      </header>

      <div className="flex flex-wrap gap-4 mb-8">
        <ReportGenerator diaryEntries={entries} questionnaire={questionnaire} />
        <Button onClick={() => setShowCharts(!showCharts)} variant="outline" className="gap-2">
          <BarChart2 className="w-4 h-4" />
          {showCharts ? 'Trends ausblenden' : 'Trends anzeigen'}
        </Button>
      </div>

      {showCharts && (
        <div className="mb-8">
          <DiaryCharts entries={entries} />
        </div>
      )}

      {isLoading ? (
        <p>Lade Einträge...</p>
      ) : (
        <div className="space-y-6">
          {diaryDays.map(entry => (
            <DiaryEntryCard
              key={entry.id}
              entryData={entry}
              userId={user.id}
              dateLocale={de}
              onSave={handleSave}
              allEntries={entries} // Übergebe alle Einträge für die Mustererkennung
              isOpen={openEntryId === entry.id} // Steuere den offenen Zustand von aussen
              onToggle={() => handleToggleEntry(entry.id)} // Funktion zum Öffnen/Schliessen
            />
          ))}
        </div>
      )}
    </div>
  );
}