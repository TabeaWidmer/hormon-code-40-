import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { InvokeLLM } from '@/api/integrations';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileText, Download, Calendar } from 'lucide-react';

export default function ReportGenerator({ diaryEntries, questionnaire }) {
  const [isOpen, setIsOpen] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState(null);

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      const filteredEntries = diaryEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        return entryDate >= startDate && entryDate <= endDate;
      });

      // Analyze symptoms frequency
      const symptomFrequency = {};
      filteredEntries.forEach(entry => {
        (entry.symptoms || []).forEach(symptom => {
          symptomFrequency[symptom] = (symptomFrequency[symptom] || 0) + 1;
        });
      });

      // Calculate averages
      const averages = {
        mood: filteredEntries.reduce((sum, e) => sum + (e.mood || 0), 0) / filteredEntries.length,
        energy: filteredEntries.reduce((sum, e) => sum + (e.energy_level || 0), 0) / filteredEntries.length,
        sleep: filteredEntries.reduce((sum, e) => sum + (e.sleep_quality || 0), 0) / filteredEntries.length,
        digestion: filteredEntries.reduce((sum, e) => sum + (e.digestion || 0), 0) / filteredEntries.length,
      };

      const prompt = `
        Als Hormon-Spezialistin für Frauen 40+, erstelle einen professionellen Gesundheitsbericht basierend auf diesen Daten:

        Zeitraum: ${dateRange.start} bis ${dateRange.end}
        
        Durchschnittswerte:
        - Stimmung: ${averages.mood.toFixed(1)}/10
        - Energie: ${averages.energy.toFixed(1)}/10
        - Schlaf: ${averages.sleep.toFixed(1)}/10
        - Verdauung: ${averages.digestion.toFixed(1)}/10

        Häufigste Symptome:
        ${Object.entries(symptomFrequency)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([symptom, count]) => `- ${symptom}: ${count}x`)
          .join('\n')}

        Erstelle einen strukturierten Bericht mit:
        1. Zusammenfassung der wichtigsten Trends
        2. Potenzielle hormonelle Zusammenhänge
        3. Empfohlene Laboruntersuchungen
        4. Ernährungs-/Supplement-Empfehlungen
        5. Überlegungen zu bioidentischen Hormonen
        6. Nächste Schritte für die Behandlung
      `;

      const response = await InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            hormone_connections: { type: "string" },
            lab_recommendations: { type: "string" },
            nutrition_supplements: { type: "string" },
            hormone_therapy: { type: "string" },
            next_steps: { type: "string" }
          }
        }
      });

      setReport({
        ...response,
        period: `${dateRange.start} bis ${dateRange.end}`,
        averages,
        top_symptoms: Object.entries(symptomFrequency)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
      });

    } catch (error) {
      console.error('Report generation failed:', error);
    }
    setIsGenerating(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-sage text-white gap-2">
          <FileText className="w-4 h-4" />
          Bericht erstellen
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-rose-500" />
            Professioneller Gesundheitsbericht
          </DialogTitle>
        </DialogHeader>

        {!report ? (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-date">Startdatum</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="end-date">Enddatum</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                />
              </div>
            </div>

            <Button
              onClick={generateReport}
              disabled={isGenerating || !dateRange.start || !dateRange.end}
              className="w-full gradient-rose text-white"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Bericht wird erstellt...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Bericht generieren
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div className="bg-gradient-to-r from-rose-50 to-sage-50 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Gesundheitsbericht: {report.period}
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-rose-600">{report.averages.mood.toFixed(1)}</div>
                  <div className="text-sm text-gray-600">Stimmung</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{report.averages.energy.toFixed(1)}</div>
                  <div className="text-sm text-gray-600">Energie</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">{report.averages.sleep.toFixed(1)}</div>
                  <div className="text-sm text-gray-600">Schlaf</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-600">{report.averages.digestion.toFixed(1)}</div>
                  <div className="text-sm text-gray-600">Verdauung</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <ReportSection title="📊 Zusammenfassung" content={report.summary} />
              <ReportSection title="🧬 Hormonelle Zusammenhänge" content={report.hormone_connections} />
              <ReportSection title="🔬 Empfohlene Laboruntersuchungen" content={report.lab_recommendations} />
              <ReportSection title="🥗 Ernährung & Supplemente" content={report.nutrition_supplements} />
              <ReportSection title="💊 Bioidentische Hormontherapie" content={report.hormone_therapy} />
              <ReportSection title="🎯 Nächste Schritte" content={report.next_steps} />
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Häufigste Symptome:</h4>
              <div className="flex flex-wrap gap-2">
                {report.top_symptoms.map(([symptom, count]) => (
                  <span key={symptom} className="bg-rose-100 text-rose-800 px-3 py-1 rounded-full text-sm">
                    {symptom} ({count}x)
                  </span>
                ))}
              </div>
            </div>

            <Button onClick={() => window.print()} className="w-full gradient-sage text-white gap-2">
              <Download className="w-4 h-4" />
              Als PDF speichern/drucken
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ReportSection({ title, content }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700 whitespace-pre-wrap">{content}</p>
      </CardContent>
    </Card>
  );
}