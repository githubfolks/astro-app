import { useCallback, useEffect, useRef, useState } from 'react';
import { devanagariToHinglish } from '../utils/hinglish';

// The Web Speech API's SpeechRecognition types aren't in the default TS DOM lib.
interface SpeechRecognitionResultLike {
    isFinal: boolean;
    0: { transcript: string };
}
interface SpeechRecognitionEventLike {
    resultIndex: number;
    results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionLike extends EventTarget {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    start: () => void;
    stop: () => void;
    onresult: ((event: SpeechRecognitionEventLike) => void) | null;
    onerror: ((event: { error: string }) => void) | null;
    onend: (() => void) | null;
}

declare global {
    interface Window {
        SpeechRecognition?: new () => SpeechRecognitionLike;
        webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    }
}

/**
 * Captures Hindi speech via the browser's Web Speech API and transliterates
 * the recognized Devanagari text into Hinglish (Roman script) — astrologers
 * can speak in Hindi and get text they can send straight into chat.
 */
export function useSpeechToText() {
    const [isSupported] = useState(() =>
        typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition)
    );
    const [isListening, setIsListening] = useState(false);
    const [interimText, setInterimText] = useState('');
    const [error, setError] = useState<string | null>(null);
    const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
    const onFinalRef = useRef<(text: string) => void>(() => {});
    // Some Android/Chrome speech engines re-fire the same result index as
    // final multiple times, each time with the cumulative transcript so far
    // rather than just the new words. Track what's already been emitted per
    // index so we only forward the new suffix, not the whole growing chunk.
    const finalizedByIndexRef = useRef<string[]>([]);

    useEffect(() => {
        return () => {
            recognitionRef.current?.stop();
        };
    }, []);

    const start = useCallback((onFinalTranscript: (hinglishText: string) => void) => {
        if (!isSupported) {
            setError('Voice input is not supported in this browser.');
            return;
        }
        const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!Recognition) return;

        onFinalRef.current = onFinalTranscript;
        finalizedByIndexRef.current = [];
        setError(null);

        const recognition = new Recognition();
        recognition.lang = 'hi-IN';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event) => {
            let finalChunk = '';
            let interimChunk = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                const transcript = result[0].transcript;
                if (result.isFinal) {
                    const alreadySent = finalizedByIndexRef.current[i] || '';
                    const newPart = transcript.startsWith(alreadySent)
                        ? transcript.slice(alreadySent.length)
                        : transcript;
                    finalizedByIndexRef.current[i] = transcript;
                    finalChunk += newPart;
                } else {
                    interimChunk += transcript;
                }
            }
            if (finalChunk) {
                onFinalRef.current(devanagariToHinglish(finalChunk));
            }
            setInterimText(interimChunk ? devanagariToHinglish(interimChunk) : '');
        };

        recognition.onerror = (event) => {
            console.error('[speech-debug] onerror', event.error);
            setError(event.error === 'not-allowed'
                ? 'Microphone access was denied.'
                : `Voice input error: ${event.error}`);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
            setInterimText('');
        };

        recognitionRef.current = recognition;
        try {
            recognition.start();
            setIsListening(true);
        } catch (err) {
            console.error('[speech-debug] start() threw', err);
        }
    }, [isSupported]);

    const stop = useCallback(() => {
        recognitionRef.current?.stop();
        setIsListening(false);
    }, []);

    return { isSupported, isListening, interimText, error, start, stop };
}
