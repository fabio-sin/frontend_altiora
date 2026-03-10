import { Injectable, signal } from '@angular/core';

// Web Speech API compat types (not always present in strict lib.dom.d.ts)
interface SpeechRecognitionResultItem {
  readonly transcript: string;
  readonly confidence: number;
}
interface SpeechRecognitionEventCompat extends Event {
  readonly results: { [index: number]: SpeechRecognitionResultItem[]; };
  readonly resultIndex: number;
}
interface SpeechRecognitionErrorEventCompat extends Event {
  readonly error: string;
}
interface SpeechRecognitionCompat extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult:   ((ev: SpeechRecognitionEventCompat) => void) | null;
  onerror:    ((ev: SpeechRecognitionErrorEventCompat) => void) | null;
  onend:      ((ev: Event) => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionCompat;

@Injectable({ providedIn: 'root' })
export class SpeechService {
  isListening  = signal(false);
  isSpeaking   = signal(false);
  sttSupported = signal(false);
  ttsSupported = signal(false);

  private recognition: SpeechRecognitionCompat | null = null;
  private synthesis   = window.speechSynthesis;

  constructor() {
    const win = window as unknown as Record<string, unknown>;
    const SR: SpeechRecognitionCtor | undefined =
      (win['SpeechRecognition'] as SpeechRecognitionCtor | undefined) ??
      (win['webkitSpeechRecognition'] as SpeechRecognitionCtor | undefined);

    if (SR) {
      this.sttSupported.set(true);
      this.recognition = new SR();
      this.recognition.lang = 'fr-FR';
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 1;
    }

    if (this.synthesis) this.ttsSupported.set(true);
  }

  startListening(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('SpeechRecognition non supporté dans ce navigateur.'));
        return;
      }
      this.isListening.set(true);
      this.recognition.start();

      this.recognition.onresult = (event: SpeechRecognitionEventCompat) => {
        const transcript = event.results[0][0].transcript;
        this.isListening.set(false);
        resolve(transcript);
      };
      this.recognition.onerror = (event: SpeechRecognitionErrorEventCompat) => {
        this.isListening.set(false);
        reject(new Error(event.error));
      };
      this.recognition.onend = () => this.isListening.set(false);
    });
  }

  stopListening(): void {
    this.recognition?.stop();
    this.isListening.set(false);
  }

  speak(text: string): void {
    if (!this.synthesis) return;
    this.synthesis.cancel();
    const clean = text
      .replace(/```[\s\S]*?```/g, 'code masqué.')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/#+\s/g, '')
      .replace(/[-•]\s/g, '')
      .trim();

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang  = 'fr-FR';
    utterance.rate  = 1.0;
    utterance.pitch = 1.0;
    utterance.onstart = () => this.isSpeaking.set(true);
    utterance.onend   = () => this.isSpeaking.set(false);
    utterance.onerror = () => this.isSpeaking.set(false);
    this.synthesis.speak(utterance);
  }

  stopSpeaking(): void {
    this.synthesis.cancel();
    this.isSpeaking.set(false);
  }
}
