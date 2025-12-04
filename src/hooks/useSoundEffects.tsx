import { useCallback, useRef } from "react";

export const useSoundEffects = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType = "sine", volume: number = 0.3) => {
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (error) {
      console.error("Error playing sound:", error);
    }
  }, [getAudioContext]);

  const playStartSound = useCallback(() => {
    // Ascending two-tone beep
    playTone(440, 0.1, "sine", 0.2);
    setTimeout(() => playTone(660, 0.15, "sine", 0.25), 100);
  }, [playTone]);

  const playStopSound = useCallback(() => {
    // Descending two-tone beep
    playTone(660, 0.1, "sine", 0.2);
    setTimeout(() => playTone(440, 0.15, "sine", 0.25), 100);
  }, [playTone]);

  const playLapSound = useCallback(() => {
    // Quick click sound
    playTone(880, 0.08, "square", 0.15);
  }, [playTone]);

  const playResetSound = useCallback(() => {
    // Soft descending sweep
    playTone(523, 0.1, "triangle", 0.2);
    setTimeout(() => playTone(392, 0.1, "triangle", 0.18), 80);
    setTimeout(() => playTone(262, 0.15, "triangle", 0.15), 160);
  }, [playTone]);

  return {
    playStartSound,
    playStopSound,
    playLapSound,
    playResetSound,
  };
};
