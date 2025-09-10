import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  ChevronDown, 
  Volume2, 
  Play, 
  Pause, 
  User, 
  UserCheck,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Voice, audioNarrationService } from "@/lib/audioApi";
import { cn } from "@/lib/utils";

interface VoiceSelectionDropdownProps {
  onVoiceSelect: (voice: Voice | null) => void;
  selectedVoice?: Voice | null;
  className?: string;
}

// Flag and country mappings for voice locales
const getFlagEmoji = (locale: string): string => {
  const flagMap: Record<string, string> = {
    'en-US': '🇺🇸',
    'en-GB': '🇬🇧', 
    'en-AU': '🇦🇺',
    'en-CA': '🇨🇦',
    'en-IN': '🇮🇳',
    'en-ZA': '🇿🇦',
    'es-ES': '🇪🇸',
    'es-MX': '🇲🇽',
    'fr-FR': '🇫🇷',
    'fr-CA': '🇨🇦',
    'de-DE': '🇩🇪',
    'it-IT': '🇮🇹',
    'pt-BR': '🇧🇷',
    'pt-PT': '🇵🇹',
    'ja-JP': '🇯🇵',
    'ko-KR': '🇰🇷',
    'zh-CN': '🇨🇳',
    'zh-TW': '🇹🇼',
    'ru-RU': '🇷🇺',
    'ar-SA': '🇸🇦',
    'hi-IN': '🇮🇳',
    'th-TH': '🇹🇭',
    'vi-VN': '🇻🇳',
    'tr-TR': '🇹🇷',
    'pl-PL': '🇵🇱',
    'nl-NL': '🇳🇱',
    'sv-SE': '🇸🇪',
    'no-NO': '🇳🇴',
    'da-DK': '🇩🇰',
    'fi-FI': '🇫🇮',
  };
  
  return flagMap[locale] || '🌐';
};

const getGenderIcon = (gender: 'male' | 'female') => {
  return gender === 'male' ? (
    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
      <User className="w-3 h-3 text-blue-600" />
    </div>
  ) : (
    <div className="w-5 h-5 rounded-full bg-pink-100 flex items-center justify-center">
      <User className="w-3 h-3 text-pink-600" />
    </div>
  );
};

const getLanguageName = (locale: string): string => {
  const languageMap: Record<string, string> = {
    'en-US': 'English (US)',
    'en-GB': 'English (UK)',
    'en-AU': 'English (Australia)',
    'en-CA': 'English (Canada)',
    'en-IN': 'English (India)',
    'en-ZA': 'English (South Africa)',
    'es-ES': 'Spanish (Spain)',
    'es-MX': 'Spanish (Mexico)',
    'fr-FR': 'French (France)',
    'fr-CA': 'French (Canada)',
    'de-DE': 'German',
    'it-IT': 'Italian',
    'pt-BR': 'Portuguese (Brazil)',
    'pt-PT': 'Portuguese (Portugal)',
    'ja-JP': 'Japanese',
    'ko-KR': 'Korean',
    'zh-CN': 'Chinese (Simplified)',
    'zh-TW': 'Chinese (Traditional)',
    'ru-RU': 'Russian',
    'ar-SA': 'Arabic (Saudi Arabia)',
    'hi-IN': 'Hindi',
    'th-TH': 'Thai',
    'vi-VN': 'Vietnamese',
    'tr-TR': 'Turkish',
    'pl-PL': 'Polish',
    'nl-NL': 'Dutch',
    'sv-SE': 'Swedish',
    'no-NO': 'Norwegian',
    'da-DK': 'Danish',
    'fi-FI': 'Finnish',
  };
  
  return languageMap[locale] || locale;
};

export const VoiceSelectionDropdown: React.FC<VoiceSelectionDropdownProps> = ({
  onVoiceSelect,
  selectedVoice,
  className
}) => {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);

  // Load voices on component mount
  useEffect(() => {
    loadVoices();
  }, []);

  const loadVoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await audioNarrationService.getVoices();
      setVoices(response.voices);
    } catch (err) {
      console.error('Failed to load voices:', err);
      setError(err instanceof Error ? err.message : 'Failed to load voices');
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceSelect = (voiceName: string) => {
    const voice = voices.find(v => v.name === voiceName);
    onVoiceSelect(voice || null);
  };

  const handlePlaySample = (voice: Voice) => {
    // TODO: Implement voice sample playback
    setPlayingVoice(playingVoice === voice.name ? null : voice.name);
    console.log('Playing sample for voice:', voice.name);
  };

  // Group voices by language for better organization
  const groupedVoices = voices.reduce((acc, voice) => {
    const language = getLanguageName(voice.locale);
    if (!acc[language]) {
      acc[language] = [];
    }
    acc[language].push(voice);
    return acc;
  }, {} as Record<string, Voice[]>);

  if (loading) {
    return (
      <Card className={cn("p-6 bg-white/95 backdrop-blur-sm border-0 shadow-card", className)}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
          <span className="text-muted-foreground">Loading voice models...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("p-6 bg-white/95 backdrop-blur-sm border-0 shadow-card", className)}>
        <div className="flex items-center justify-center py-8 text-destructive">
          <AlertCircle className="w-6 h-6 mr-2" />
          <div className="text-center">
            <p className="font-medium">Failed to load voices</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadVoices}
              className="mt-3"
            >
              Try Again
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("p-6 bg-white/95 backdrop-blur-sm border-0 shadow-card", className)}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            Select Voice Model
          </h4>
          <Badge variant="secondary" className="text-xs">
            {voices.length} voices available
          </Badge>
        </div>

        <Select onValueChange={handleVoiceSelect} value={selectedVoice?.name || ""}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose a voice narrator">
              {selectedVoice && (
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getFlagEmoji(selectedVoice.locale)}</span>
                  {getGenderIcon(selectedVoice.gender)}
                  <span className="font-medium">{selectedVoice.display_name}</span>
                  <span className="text-sm text-muted-foreground">
                    ({getLanguageName(selectedVoice.locale)})
                  </span>
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          
          <SelectContent className="max-h-80">
            {Object.entries(groupedVoices).map(([language, languageVoices]) => (
              <div key={language}>
                <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground border-b">
                  {language}
                </div>
                {languageVoices.map((voice) => (
                  <SelectItem 
                    key={voice.name} 
                    value={voice.name}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <span className="text-lg">{getFlagEmoji(voice.locale)}</span>
                      {getGenderIcon(voice.gender)}
                      <div className="flex-1 text-left">
                        <div className="font-medium">{voice.display_name}</div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {voice.gender} • {voice.locale}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </div>
            ))}
          </SelectContent>
        </Select>

        {selectedVoice && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getFlagEmoji(selectedVoice.locale)}</span>
                {getGenderIcon(selectedVoice.gender)}
                <div>
                  <h5 className="font-medium">{selectedVoice.display_name}</h5>
                  <p className="text-sm text-muted-foreground">
                    {selectedVoice.friendly_name}
                  </p>
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePlaySample(selectedVoice)}
                className="flex items-center gap-2"
              >
                {playingVoice === selectedVoice.name ? (
                  <>
                    <Pause className="w-4 h-4" />
                    Stop Sample
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Play Sample
                  </>
                )}
              </Button>
            </div>
            
            <div className="mt-3 flex gap-2">
              <Badge variant="outline" className="text-xs">
                {selectedVoice.suggested_codec.toUpperCase()}
              </Badge>
              <Badge 
                variant={selectedVoice.gender === 'male' ? 'default' : 'secondary'} 
                className="text-xs capitalize"
              >
                {selectedVoice.gender}
              </Badge>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p>💡 Tip: Each voice has unique characteristics. Try different voices to find the perfect match for your story's tone.</p>
        </div>
      </div>
    </Card>
  );
};

export default VoiceSelectionDropdown;
