import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  AlertTriangle, 
  CheckCircle, 
  Flag,
  RefreshCw
} from 'lucide-react';

export default function ImageQualityReporter({ recipe, onReportIssue, onRequestNewImage }) {
  const [isReporting, setIsReporting] = useState(false);
  const [hasReported, setHasReported] = useState(false);

  const handleReport = async () => {
    setIsReporting(true);
    try {
      await onReportIssue(recipe.id, {
        recipe_name: recipe.title?.de,
        image_url: recipe.image_url,
        issue_type: 'visual_mismatch',
        timestamp: new Date().toISOString()
      });
      setHasReported(true);
    } catch (error) {
      console.error('Failed to report image issue:', error);
    }
    setIsReporting(false);
  };

  const handleRequestNew = async () => {
    try {
      await onRequestNewImage(recipe.id);
    } catch (error) {
      console.error('Failed to request new image:', error);
    }
  };

  return (
    <div className="flex items-center gap-2 text-xs">
      {recipe.image_source === 'fallback' && (
        <span className="text-amber-600 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Ersatzbild
        </span>
      )}
      
      {!hasReported ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReport}
          disabled={isReporting}
          className="text-xs h-6 px-2 text-gray-500 hover:text-red-600"
        >
          <Flag className="w-3 h-3 mr-1" />
          {isReporting ? 'Melden...' : 'Bild melden'}
        </Button>
      ) : (
        <span className="text-green-600 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Gemeldet
        </span>
      )}
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleRequestNew}
        className="text-xs h-6 px-2 text-gray-500 hover:text-blue-600"
      >
        <RefreshCw className="w-3 h-3 mr-1" />
        Neues Bild
      </Button>
    </div>
  );
}