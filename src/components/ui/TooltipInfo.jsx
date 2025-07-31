import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

export default function TooltipInfo({ text }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors ml-2 flex-shrink-0">
            <Info className="w-3 h-3 text-gray-500 hover:text-gray-700" />
          </button>
        </TooltipTrigger>
        <TooltipContent 
          className="max-w-sm p-4 bg-white shadow-lg border border-gray-200 rounded-xl z-50"
          side="top"
          align="start"
        >
          <div className="text-sm leading-relaxed">
            {typeof text === 'string' ? <p>{text}</p> : text}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}