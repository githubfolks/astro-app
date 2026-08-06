import { useEffect, useRef, useState } from 'react';
import Typo from 'typo-js';
import { HINGLISH_WORDS, isHinglishWord } from '../data/hinglishWords';

const MAX_SUGGESTIONS = 5;
const MIN_WORD_LENGTH = 2;

/** Filters out proper nouns and possessive/contraction forms, which make poor suggestions. */
function isCommonForm(word: string): boolean {
    return word === word.toLowerCase() && !word.includes("'");
}

interface Dictionary {
    typo: Typo;
    words: string[];
}

let dictionaryPromise: Promise<Dictionary> | null = null;

function loadDictionary(): Promise<Dictionary> {
    if (!dictionaryPromise) {
        dictionaryPromise = Promise.all([
            fetch('/dictionaries/en_US/en_US.aff').then((r) => r.text()),
            fetch('/dictionaries/en_US/en_US.dic').then((r) => r.text()),
        ]).then(([affData, wordsData]) => {
            const typo = new Typo('en_US', affData, wordsData);
            // Merge in the curated Hinglish list so common Romanized-Hindi words
            // (e.g. "namaste", "kundli") appear as completions alongside English ones.
            const words = Array.from(new Set([...typo.dictionaryTable.keys(), ...HINGLISH_WORDS])).sort((a, b) =>
                a.length - b.length || a.localeCompare(b)
            );
            return { typo, words };
        });
    }
    return dictionaryPromise;
}

/** Finds the word touching the cursor, plus its start/end offsets in `text`. */
export function getWordAtCursor(text: string, cursor: number): { word: string; start: number; end: number } {
    let start = cursor;
    while (start > 0 && /[a-zA-Z']/.test(text[start - 1])) start--;
    let end = cursor;
    while (end < text.length && /[a-zA-Z']/.test(text[end])) end++;
    return { word: text.slice(start, end), start, end };
}

export function useTextSuggestions() {
    const [ready, setReady] = useState(false);
    const dictRef = useRef<Dictionary | null>(null);

    useEffect(() => {
        let cancelled = false;
        loadDictionary().then((dict) => {
            if (cancelled) return;
            dictRef.current = dict;
            setReady(true);
        }).catch(() => {
            // Dictionary is a nice-to-have; silently degrade to no suggestions.
        });
        return () => { cancelled = true; };
    }, []);

    /**
     * Returns completion/correction candidates for `word`.
     * `isFinished` = the word is already terminated (space/punctuation just typed),
     * so we spell-check it rather than treat it as a live prefix.
     */
    const getSuggestions = (word: string, isFinished: boolean): string[] => {
        const dict = dictRef.current;
        if (!dict || word.length < MIN_WORD_LENGTH) return [];

        const lower = word.toLowerCase();

        if (isFinished) {
            // Known Hinglish words (e.g. "namaste", "kundli") aren't in the English
            // dictionary — without this check they'd get flagged as misspelled and
            // "corrected" to an unrelated English word (e.g. "namaste" -> "lambaste").
            if (dict.typo.check(word) || isHinglishWord(word)) return [];
            return dict.typo.suggest(word, MAX_SUGGESTIONS).filter(isCommonForm);
        }

        // Still typing: prefer genuine completions of the word in progress. But if
        // this prefix barely matches any real words, it's more likely the start of a
        // typo than a rare word — fall back to edit-distance corrections instead.
        const completions: string[] = [];
        for (const candidate of dict.words) {
            if (candidate.length <= lower.length) continue;
            if (candidate.startsWith(lower) && isCommonForm(candidate)) {
                completions.push(candidate);
                if (completions.length >= MAX_SUGGESTIONS) break;
            }
        }
        // Any genuine completion beats a guess — edit-distance on an incomplete
        // word produces unrelated suggestions (e.g. "exampl" -> junk instead of
        // "example"). Only fall back when nothing at all matches the prefix.
        if (completions.length > 0) return completions;

        return dict.typo.suggest(lower, MAX_SUGGESTIONS).filter(isCommonForm);
    };

    return { ready, getSuggestions };
}
