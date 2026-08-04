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
    // Some Android/Chrome speech engines re-finalize already-spoken words
    // under a *new* result index rather than re-firing the same one, so a
    // per-index dedup misses it — the growing transcript keeps reappearing
    // under fresh indices. Track everything finalized so far for the whole
    // session and diff each new chunk against that, not just its own index.
    const finalizedByIndexRef = useRef<string[]>([]);
    const finalizedTotalRef = useRef('');

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
        // A rapid double-tap on the mic button (common on mobile) can call
        // start() twice before React state commits isListening=true; without
        // this guard both SpeechRecognition instances would independently
        // transcribe the same audio into the shared onFinalRef callback.
        if (recognitionRef.current) return;
        const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!Recognition) return;

        onFinalRef.current = onFinalTranscript;
        finalizedByIndexRef.current = [];
        finalizedTotalRef.current = '';
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
                    const alreadySentAtIndex = finalizedByIndexRef.current[i] || '';
                    finalizedByIndexRef.current[i] = transcript;

                    // Diff this index's transcript against everything finalized
                    // so far this session (not just its own prior value) — some
                    // engines re-finalize already-spoken words under a brand new
                    // index, which a per-index-only diff would miss entirely.
                    const total = finalizedTotalRef.current;
                    let newPart: string;
                    if (transcript.startsWith(total)) {
                        newPart = transcript.slice(total.length);
                    } else if (total.endsWith(transcript)) {
                        newPart = '';
                    } else {
                        newPart = transcript.startsWith(alreadySentAtIndex)
                            ? transcript.slice(alreadySentAtIndex.length)
                            : transcript;
                    }
                    if (newPart) finalizedTotalRef.current = total + newPart;
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
            recognitionRef.current = null;
        };

        recognition.onend = () => {
            setIsListening(false);
            setInterimText('');
            recognitionRef.current = null;
        };

        recognitionRef.current = recognition;
        try {
            recognition.start();
            setIsListening(true);
        } catch (err) {
            console.error('[speech-debug] start() threw', err);
            recognitionRef.current = null;
        }
    }, [isSupported]);

    const stop = useCallback(() => {
        recognitionRef.current?.stop();
        setIsListening(false);
    }, []);

    return { isSupported, isListening, interimText, error, start, stop };
}
