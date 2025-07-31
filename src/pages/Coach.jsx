import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../components/i18n/LanguageProvider';
import { User, Questionnaire, DiaryEntry, InvokeLLM } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Send, Sparkles, User as UserIcon } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';

export default function CoachPage() {
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [contextData, setContextData] = useState(null);
  const [isLoadingContext, setIsLoadingContext] = useState(true);
  const scrollAreaRef = useRef(null);

  useEffect(() => {
    setMessages([
      { sender: 'ai', text: 'Hallo! Ich bin dein HormonCoach. Stelle mir deine Fragen rund um die Hormon-Balance oder wähle einen der Vorschläge unten, um zu starten.' }
    ]);
    
    const loadContext = async () => {
      setIsLoadingContext(true);
      try {
        const user = await User.me();
        const questionnaireData = await Questionnaire.filter({ user_id: user.id });
        const diaryEntries = await DiaryEntry.filter({ user_id: user.id }, '-date', 30); // Last 30 days
        setContextData({ user, questionnaire: questionnaireData[0], diaryEntries });
      } catch (error) {
        console.error("Error loading context for coach:", error);
      }
      setIsLoadingContext(false);
    };
    loadContext();
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages]);

  const handleSendMessage = async (messageText) => {
    const text = messageText || input;
    if (!text.trim() || isThinking) return;

    const userMessage = { sender: 'user', text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsThinking(true);

    try {
      const prompt = `
        You are HormonCoach, an empathetic and science-based AI assistant for women 40+ navigating perimenopause and menopause. 
        Your goal is to guide the user in understanding their body and assessing if bioidentical hormone therapy could be a suitable topic to discuss with their doctor.

        **IMPORTANT RULES:**
        - ALWAYS respond in ${language}.
        - NEVER give a definitive medical diagnosis or prescription. Your role is educational and supportive.
        - ALWAYS recommend consulting a qualified doctor for any final decisions or treatment plans. This is non-negotiable.
        - Your tone is supportive, professional, and reassuring.
        - Keep responses clear, concise, and well-structured (e.g., using bullet points).
        - If the user's data is insufficient, explain what's missing and why it's important.
        - Ask targeted, clarifying questions to guide the conversation when needed.

        **USER CONTEXT DATA:**
        This data is your primary source for personalization. Refer to it directly in your answers.
        
        1.  **User's Questionnaire Answers:**
            ${JSON.stringify(contextData?.questionnaire, null, 2)}

        2.  **Recent Diary Entries (last 30 days summary):**
            ${JSON.stringify(contextData?.diaryEntries.map(e => ({date: e.date, mood: e.mood, energy: e.energy_level, sleep: e.sleep_quality, symptoms: e.symptoms, notes: e.notes})), null, 2)}

        **CONVERSATION HISTORY (for context):**
        ${JSON.stringify(messages)}

        **USER'S LATEST MESSAGE:**
        "${text}"

        **YOUR TASK:**
        Based on all the context above, continue the conversation.
        1. Acknowledge the user's message.
        2. Provide a personalized, data-driven insight. For example, if they ask about sleep and their diary shows poor sleep quality, mention that.
        3. If you need more information to answer thoroughly, ask a follow-up question.
        4. Conclude with actionable advice or the next logical step, always reinforcing the need to consult a healthcare professional.
      `;
      
      const response = await InvokeLLM({ prompt });
      const aiMessage = { sender: 'ai', text: response };
      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error("Error calling HormonCoach AI:", error);
      const errorMessage = { sender: 'ai', text: 'Entschuldigung, ich habe gerade ein technisches Problem. Bitte versuche es später noch einmal.' };
      setMessages(prev => [...prev, errorMessage]);
    }
    
    setIsThinking(false);
  };
  
  const ConversationStarters = () => {
    const starters = [
      "Passen bioidentische Hormone zu mir?",
      "Analysiere meine Symptome der letzten Woche.",
      "Was kann ich gegen Hitzewallungen tun?",
    ];
    return (
        <div className="p-4 flex flex-wrap gap-2 justify-center">
            {starters.map(starter => (
                <Button 
                    key={starter}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendMessage(starter)}
                    disabled={isThinking || isLoadingContext}
                >
                    {starter}
                </Button>
            ))}
        </div>
    );
  }

  return (
    <div className="p-4 md:p-8 h-full flex flex-col">
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
           <div className="w-12 h-12 gradient-rose rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Hormon-Coach</h1>
            <p className="text-gray-600">
              Dein KI-Begleiter für personalisierte Einblicke
            </p>
          </div>
        </div>

        {/* Chat Area */}
        <Card className="flex-1 flex flex-col border-rose-100 shadow-lg">
          <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
            <div className="space-y-6">
              {messages.map((msg, index) => (
                <div key={index} className={`flex gap-3 text-sm md:text-base ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                  {msg.sender === 'ai' && (
                    <Avatar className="flex-shrink-0">
                      <AvatarFallback className="gradient-rose text-white"><Sparkles className="w-5 h-5"/></AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`p-3 md:p-4 rounded-2xl max-w-lg whitespace-pre-wrap ${
                    msg.sender === 'user' 
                      ? 'bg-sage-500 text-white rounded-br-none' 
                      : 'bg-rose-50 text-gray-800 rounded-bl-none'
                  }`}>
                    {msg.text}
                  </div>
                   {msg.sender === 'user' && (
                    <Avatar className="flex-shrink-0">
                      <AvatarFallback className="bg-gray-300"><UserIcon className="w-5 h-5 text-gray-600"/></AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {isThinking && (
                 <div className="flex gap-3">
                    <Avatar>
                      <AvatarFallback className="gradient-rose text-white"><Sparkles className="w-5 h-5"/></AvatarFallback>
                    </Avatar>
                    <div className="p-4 rounded-2xl bg-rose-50 text-gray-800 rounded-bl-none">
                      <div className="flex items-center gap-2">
                         <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                         <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                         <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                      </div>
                    </div>
                  </div>
              )}
            </div>
          </ScrollArea>
          
          {/* Conversation Starters & Input Form */}
          <div className="border-t border-rose-100">
            <ConversationStarters />
            <div className="p-4 border-t border-rose-100">
              <div className="flex gap-2">
                <Textarea 
                  placeholder={isLoadingContext ? "Lade deine Daten..." : "Frage den HormonCoach..."} 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }}}
                  rows={1}
                  className="flex-1 resize-none"
                  disabled={isThinking || isLoadingContext}
                />
                <Button onClick={() => handleSendMessage()} disabled={isThinking || !input.trim() || isLoadingContext} size="icon">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}