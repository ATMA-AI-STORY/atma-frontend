import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, ArrowRight, Play, Pause, Volume2, User } from "lucide-react";
import { useState } from "react";
import { VoiceSelectionDropdown } from "./VoiceSelectionDropdown";
import { Voice } from "@/lib/audioApi";

interface ChooseAudioProps {
  onNext: (audio: { music: string; voice: Voice | null; subtitles: boolean }) => void;
  onBack: () => void;
  canProceed?: boolean;
}

interface MusicTrack {
  id: string;
  name: string;
  mood: string;
  duration: string;
}

export default function ChooseAudio({ onNext, onBack, canProceed = true }: ChooseAudioProps) {
  const [selectedMusic, setSelectedMusic] = useState<string>('cinematic-default');
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true);
  const [playingMusic, setPlayingMusic] = useState<string | null>(null);

  const musicTracks: MusicTrack[] = [
    { id: 'cinematic-default', name: 'Default Cinematic', mood: 'Cinematic', duration: '4:30' },
    { id: 'emotional-piano', name: 'Gentle Piano Memories', mood: 'Emotional', duration: '3:24' },
    { id: 'uplifting-strings', name: 'Hopeful Journey', mood: 'Uplifting', duration: '4:12' },
    { id: 'calm-acoustic', name: 'Peaceful Moments', mood: 'Calm', duration: '3:45' },
    { id: 'celebration', name: 'Joyful Celebration', mood: 'Celebration', duration: '3:18' },
    { id: 'folk-guitar', name: 'Nostalgic Folk', mood: 'Nostalgic', duration: '3:56' }
  ];

  // Legacy voices are no longer used - replaced by VoiceSelectionDropdown with real API data

  const toggleMusicPlay = (trackId: string) => {
    // Only allow playing the default track
    if (trackId === 'cinematic-default') {
      setPlayingMusic(playingMusic === trackId ? null : trackId);
    }
  };

  const hasValidMusic = selectedMusic === 'cinematic-default'; // Only proceed with default music

  return (
    <div className="p-4 md:p-8">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Choose <span className="bg-gradient-memory bg-clip-text text-transparent">Music & Voice</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Select the perfect soundtrack and narrator voice to bring your story to life.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Music Selection */}
          <div>
            <h3 className="text-2xl font-semibold text-foreground mb-6 flex items-center gap-2">
              <Volume2 className="w-6 h-6" />
              Background Music
            </h3>
            
            <div className="space-y-4">
              {musicTracks.map((track) => {
                const isAvailable = track.id === 'cinematic-default';
                return (
                  <Card 
                    key={track.id}
                    className={`p-4 transition-all duration-300 border-2 ${
                      !isAvailable 
                        ? 'opacity-60 cursor-not-allowed border-gray-300 bg-gray-50' 
                        : selectedMusic === track.id 
                          ? 'border-primary shadow-card bg-white cursor-pointer' 
                          : 'border-transparent bg-white/95 hover:bg-white hover:shadow-soft cursor-pointer'
                    }`}
                    onClick={() => isAvailable && setSelectedMusic(track.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">{track.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {track.mood} • {track.duration}
                          {!isAvailable && ' • Coming Soon'}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isAvailable) {
                            toggleMusicPlay(track.id);
                          }
                        }}
                        disabled={!isAvailable}
                        className="ml-4"
                      >
                        {playingMusic === track.id ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Voice Selection */}
          <div>
            <h3 className="text-2xl font-semibold text-foreground mb-6 flex items-center gap-2">
              <User className="w-6 h-6" />
              Narrator Voice
            </h3>
            
            <VoiceSelectionDropdown
              onVoiceSelect={setSelectedVoice}
              selectedVoice={selectedVoice}
            />
          </div>
        </div>

        {/* Subtitle Options */}
        <Card className="p-6 mb-8 bg-white/95 backdrop-blur-sm border-0 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Subtitles</h3>
              <p className="text-muted-foreground">
                Display text on screen synchronized with the video
              </p>
            </div>
            <Switch
              checked={subtitlesEnabled}
              onCheckedChange={() => {}} // Disabled - always on
              disabled
            />
          </div>
          
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground mb-3">Subtitle style: (Auto-selected)</p>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input type="radio" name="subtitle-style" checked disabled className="text-primary" />
                <span className="text-muted-foreground">Clean & Simple (Selected)</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="subtitle-style" disabled className="text-primary opacity-50" />
                <span className="text-muted-foreground opacity-50">Elegant Serif (Coming Soon)</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="subtitle-style" disabled className="text-primary opacity-50" />
                <span className="text-muted-foreground opacity-50">Modern Bold (Coming Soon)</span>
              </label>
            </div>
          </div>
        </Card>

        {/* Audio Summary */}
        <Card className="p-6 mb-8 bg-gradient-memory text-white border-0 shadow-memory">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2">Audio Selection Summary</h3>
            <p className="text-white/90">
              Music: {musicTracks.find(t => t.id === selectedMusic)?.name} • 
              Voice: {selectedVoice ? `${selectedVoice.display_name} (${selectedVoice.locale})` : 'No voice selected'} • 
              Subtitles: {subtitlesEnabled ? 'Enabled' : 'Disabled'} (Clean & Simple)
            </p>
          </div>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button 
            variant="memory" 
            size="lg" 
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </Button>
          
          <Button 
            variant="hero" 
            size="lg" 
            onClick={() => onNext({
              music: selectedMusic,
              voice: selectedVoice, // Pass the selected voice object
              subtitles: subtitlesEnabled
            })}
            disabled={!hasValidMusic || !canProceed}
            className="flex items-center gap-2"
          >
            Continue
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}