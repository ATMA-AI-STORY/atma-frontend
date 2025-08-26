import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, ArrowRight, Play, Pause, Volume2, User } from "lucide-react";
import { useState } from "react";

interface ChooseAudioProps {
  onNext: (audio: { music: string; voice: string; subtitles: boolean }) => void;
  onBack: () => void;
}

interface MusicTrack {
  id: string;
  name: string;
  mood: string;
  duration: string;
}

interface Voice {
  id: string;
  name: string;
  gender: string;
  accent: string;
  sample: string;
}

export default function ChooseAudio({ onNext, onBack }: ChooseAudioProps) {
  const [selectedMusic, setSelectedMusic] = useState<string>('emotional-piano');
  const [selectedVoice, setSelectedVoice] = useState<string>('sarah-warm');
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true);
  const [playingMusic, setPlayingMusic] = useState<string | null>(null);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);

  const musicTracks: MusicTrack[] = [
    { id: 'emotional-piano', name: 'Gentle Piano Memories', mood: 'Emotional', duration: '3:24' },
    { id: 'uplifting-strings', name: 'Hopeful Journey', mood: 'Uplifting', duration: '4:12' },
    { id: 'calm-acoustic', name: 'Peaceful Moments', mood: 'Calm', duration: '3:45' },
    { id: 'celebration', name: 'Joyful Celebration', mood: 'Celebration', duration: '3:18' },
    { id: 'cinematic', name: 'Epic Life Story', mood: 'Cinematic', duration: '4:30' },
    { id: 'folk-guitar', name: 'Nostalgic Folk', mood: 'Nostalgic', duration: '3:56' }
  ];

  const voices: Voice[] = [
    { id: 'sarah-warm', name: 'Sarah', gender: 'Female', accent: 'American', sample: 'Warm and compassionate, perfect for family stories' },
    { id: 'michael-narrator', name: 'Michael', gender: 'Male', accent: 'British', sample: 'Distinguished narrator voice with gentle authority' },
    { id: 'emma-gentle', name: 'Emma', gender: 'Female', accent: 'Canadian', sample: 'Soft and nurturing, ideal for personal memories' },
    { id: 'david-wise', name: 'David', gender: 'Male', accent: 'American', sample: 'Wise and reflective, great for life journey stories' },
    { id: 'maria-expressive', name: 'Maria', gender: 'Female', accent: 'Neutral', sample: 'Expressive and engaging, brings stories to life' }
  ];

  const toggleMusicPlay = (trackId: string) => {
    setPlayingMusic(playingMusic === trackId ? null : trackId);
  };

  const toggleVoicePlay = (voiceId: string) => {
    setPlayingVoice(playingVoice === voiceId ? null : voiceId);
  };

  const canProceed = selectedMusic && selectedVoice;

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
              {musicTracks.map((track) => (
                <Card 
                  key={track.id}
                  className={`p-4 cursor-pointer transition-all duration-300 border-2 ${
                    selectedMusic === track.id 
                      ? 'border-primary shadow-card bg-white' 
                      : 'border-transparent bg-white/95 hover:bg-white hover:shadow-soft'
                  }`}
                  onClick={() => setSelectedMusic(track.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">{track.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {track.mood} • {track.duration}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMusicPlay(track.id);
                      }}
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
              ))}
            </div>
          </div>

          {/* Voice Selection */}
          <div>
            <h3 className="text-2xl font-semibold text-foreground mb-6 flex items-center gap-2">
              <User className="w-6 h-6" />
              Narrator Voice
            </h3>
            
            <div className="space-y-4">
              {voices.map((voice) => (
                <Card 
                  key={voice.id}
                  className={`p-4 cursor-pointer transition-all duration-300 border-2 ${
                    selectedVoice === voice.id 
                      ? 'border-primary shadow-card bg-white' 
                      : 'border-transparent bg-white/95 hover:bg-white hover:shadow-soft'
                  }`}
                  onClick={() => setSelectedVoice(voice.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">
                        {voice.name} ({voice.gender})
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {voice.accent} accent
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {voice.sample}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleVoicePlay(voice.id);
                      }}
                      className="ml-4"
                    >
                      {playingVoice === voice.id ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Subtitle Options */}
        <Card className="p-6 mb-8 bg-white/95 backdrop-blur-sm border-0 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Subtitles</h3>
              <p className="text-muted-foreground">
                Display text on screen synchronized with the narration
              </p>
            </div>
            <Switch
              checked={subtitlesEnabled}
              onCheckedChange={setSubtitlesEnabled}
            />
          </div>
          
          {subtitlesEnabled && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground mb-3">Subtitle options:</p>
              <div className="flex gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input type="radio" name="subtitle-style" defaultChecked className="text-primary" />
                  <span>Clean & Simple</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="subtitle-style" className="text-primary" />
                  <span>Elegant Serif</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="subtitle-style" className="text-primary" />
                  <span>Modern Bold</span>
                </label>
              </div>
            </div>
          )}
        </Card>

        {/* Audio Summary */}
        <Card className="p-6 mb-8 bg-gradient-memory text-white border-0 shadow-memory">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2">Audio Selection Summary</h3>
            <p className="text-white/90">
              Music: {musicTracks.find(t => t.id === selectedMusic)?.name} • 
              Voice: {voices.find(v => v.id === selectedVoice)?.name} • 
              Subtitles: {subtitlesEnabled ? 'Enabled' : 'Disabled'}
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
              voice: selectedVoice,
              subtitles: subtitlesEnabled
            })}
            disabled={!canProceed}
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