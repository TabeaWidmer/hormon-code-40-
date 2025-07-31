import React, { useState } from 'react';
import CustomEntryModal from '../ui/CustomEntryModal';
import InfoPopup from '../ui/InfoPopup';
import TooltipInfo from '../ui/TooltipInfo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dumbbell, Target, Clock, Zap, Plus } from 'lucide-react';

export default function MovementStep({ data, onChange }) {
  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: '' });
  const [popupConfig, setPopupConfig] = useState({ isOpen: false });

  const predefined = {
    activities: ['Yoga', 'Pilates', 'Krafttraining', 'Cardio', 'Schwimmen', 'Radfahren'],
    goals: ['Gewichtsverlust', 'Muskelaufbau', 'Ausdauer verbessern', 'Flexibilität erhöhen'],
    equipment: ['Keine Geräte', 'Yoga-Matte', 'Hanteln', 'Widerstandsbänder'],
  };

  const handleToggle = (key, value) => {
    const current = data[key] || [];
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];
    onChange({ ...data, [key]: updated });
  };
  
  const handleCustomSave = (type) => (value) => {
    const allItems = [...(predefined[type] || []), ...(data[type] || [])];
    if (allItems.map(i => i.toLowerCase()).includes(value.toLowerCase())) {
      setPopupConfig({ 
        isOpen: true, 
        title: 'Eintrag existiert bereits', 
        message: `"${value}" ist bereits in der Liste vorhanden.`,
        type: 'warning'
      });
    } else {
      handleToggle(type, value);
    }
    setModalConfig({ isOpen: false, type: '' });
  };

  const renderBadgeList = (type, title, icon, tooltip) => {
    const Icon = icon;
    const allItems = [...(predefined[type] || []), ...(data[type] || [])].filter((v, i, a) => a.indexOf(v) === i);
    const customItems = (data[type] || []).filter(item => !(predefined[type] || []).includes(item));
    
    return (
      <Card className="border-rose-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Icon className="w-5 h-5 text-rose-500" />
            {title}
            {tooltip && <TooltipInfo text={tooltip} />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {predefined[type].map(item => (
              <Badge key={item} variant={(data[type] || []).includes(item) ? 'default' : 'outline'} className="cursor-pointer" onClick={() => handleToggle(type, item)}>
                {item}
              </Badge>
            ))}
            {customItems.map(item => (
              <Badge key={item} variant="default" className="cursor-pointer bg-purple-500 hover:bg-purple-600" onClick={() => handleToggle(type, item)}>
                {item}
              </Badge>
            ))}
            <Button variant="outline" size="sm" onClick={() => setModalConfig({ isOpen: true, type })} className="gap-2">
              <Plus className="w-4 h-4" /> Hinzufügen
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-8">
      <CustomEntryModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ isOpen: false, type: '' })}
        onSave={handleCustomSave(modalConfig.type)}
        title={`Eigene ${modalConfig.type === 'activities' ? 'Aktivität' : modalConfig.type === 'goals' ? 'Ziel' : 'Ausrüstung'} hinzufügen`}
        inputLabel="Name"
      />
      <InfoPopup {...popupConfig} onClose={() => setPopupConfig({ isOpen: false })} />
      
      {renderBadgeList('activities', 'Bevorzugte Aktivitäten', Dumbbell, 'Wähle Aktivitäten, die dir Spaß machen.')}
      {renderBadgeList('goals', 'Fitness-Ziele', Target, 'Was möchtest du mit deinem Training erreichen?')}
      
      {/* Time & Equipment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-rose-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <Clock className="w-5 h-5 text-rose-500" />
              Verfügbare Zeit pro Tag
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="number"
              placeholder="Minuten pro Tag für Bewegung, z.B. 30"
              value={data.time_availability || ''}
              onChange={(e) => onChange({ ...data, time_availability: parseInt(e.target.value) })}
            />
          </CardContent>
        </Card>
        {renderBadgeList('equipment', 'Verfügbare Ausrüstung', Zap, 'Welche Geräte stehen dir zur Verfügung?')}
      </div>
      
      {/* Physical Limitations */}
      <Card className="border-rose-100">
        <CardHeader>
          <CardTitle className="text-gray-800">Körperliche Einschränkungen</CardTitle>
          <p className="text-sm text-gray-600">
            Gib uns Bescheid, falls du Verletzungen oder Einschränkungen hast. Dies hilft uns, sichere Übungen vorzuschlagen.
          </p>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="z.B. Rückenschmerzen, Knieprobleme, etc. (optional)"
            value={data.physical_limitations || ''}
            onChange={(e) => onChange({ ...data, physical_limitations: e.target.value })}
            rows={3}
          />
        </CardContent>
      </Card>
    </div>
  );
}