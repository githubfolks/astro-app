/**
 * Devanagari -> Hinglish (Roman script) transliteration.
 *
 * The browser's speech recognizer (Web Speech API, lang="hi-IN") returns
 * Hindi speech as Devanagari text. Astrologers want to type/send in the
 * Hinglish their seekers are used to reading in chat, so we transliterate
 * on a best-effort character basis: consonants carry an inherent "a" unless
 * followed by a vowel matra or a virama (्) that suppresses it.
 *
 * English words spoken mid-Hindi-sentence (astrologer/consultation-domain
 * terms, e.g. "astrologer", "consultation") get transcribed phonetically in
 * Devanagari by the recognizer — char-by-char transliteration alone only
 * reconstructs an approximation ("Estrolojara"), not the real spelling. A
 * second pass (correctLoanword) fuzzy-matches each transliterated word
 * against a curated list of such words (data/englishLoanwords.ts) and swaps
 * in the correct English spelling when confident.
 */
import { ENGLISH_LOANWORDS } from '../data/englishLoanwords';
import { isHinglishWord, normalizePhonetic } from '../data/hinglishWords';

const INDEPENDENT_VOWELS: Record<string, string> = {
    'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee', 'उ': 'u', 'ऊ': 'oo',
    'ऋ': 'ri', 'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au',
    'अं': 'an', 'अः': 'ah',
    // Candra-E/O forms exist only to spell English loanwords phonetically
    // (e.g. "ऑफिस" office, "ऍग्जाम" exam) — without them, an English word
    // spoken mid-Hindi-sentence hits the "unrecognised, pass through
    // unchanged" fallback and the raw Devanagari glyph leaks into the
    // Hinglish output (e.g. "एस्ट्रोलॉजर" -> "Estrolaॉjara" instead of
    // "Estrolojar").
    'ऑ': 'o', 'ऍ': 'e',
};

// Vowel matras (combine with the preceding consonant, replacing its inherent "a")
const MATRAS: Record<string, string> = {
    'ा': 'aa', 'ि': 'i', 'ी': 'ee', 'ु': 'u', 'ू': 'oo',
    'ृ': 'ri', 'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au',
    // Candra-E/O matras — see INDEPENDENT_VOWELS comment above.
    'ॉ': 'o', 'ॅ': 'e',
};

const CONSONANTS: Record<string, string> = {
    'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ng',
    'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'ny',
    'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
    'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
    'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
    'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v',
    'श': 'sh', 'ष': 'sh', 'स': 's', 'ह': 'h',
    'क्ष': 'ksh', 'त्र': 'tr', 'ज्ञ': 'gy',
    'ड़': 'r', 'ढ़': 'rh',
};

const VIRAMA = '्';
const ANUSVARA = 'ं';
const CHANDRABINDU = 'ँ';
const VISARGA = 'ः';
const NUKTA = '़';
const DIGITS: Record<string, string> = {
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
    '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
};

/** Roman-cases the first letter of each sentence for readability. */
function capitalizeSentences(text: string): string {
    return text.replace(/(^\s*\w|[.!?]\s+\w)/g, (match) => match.toUpperCase());
}

function levenshtein(a: string, b: string): number {
    const m = a.length;
    const n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;
    let prev = Array.from({ length: n + 1 }, (_, j) => j);
    let curr = new Array(n + 1).fill(0);
    for (let i = 1; i <= m; i++) {
        curr[0] = i;
        for (let j = 1; j <= n; j++) {
            curr[j] = a[i - 1] === b[j - 1]
                ? prev[j - 1]
                : 1 + Math.min(prev[j - 1], prev[j], curr[j - 1]);
        }
        [prev, curr] = [curr, prev];
    }
    return prev[n];
}

let loanwordIndex: Map<string, string> | null = null;
function getLoanwordIndex(): Map<string, string> {
    if (!loanwordIndex) {
        loanwordIndex = new Map();
        for (const w of ENGLISH_LOANWORDS) loanwordIndex.set(normalizePhonetic(w), w);
    }
    return loanwordIndex;
}

/**
 * If `word` (already transliterated to Roman script) looks like a mangled
 * phonetic rendering of a known English loanword, returns the correct
 * English spelling; otherwise null.
 *
 * `allowFuzzy` gates edit-distance matching behind a precondition the caller
 * establishes: the source Devanagari actually used a candra-E/O
 * vowel (ॉ/ॅ/ऑ/ऍ) somewhere in this word. That sign is spelled almost
 * exclusively for English loanwords — real Hindi vocabulary essentially
 * never contains it — so it's a high-confidence trigger. Without it, only
 * an exact (zero-tolerance) match is attempted: fuzzy-matching every word
 * against this list, tried first and reverted, corrupted plain Hindi output
 * like "शादी" (shaadee/marriage) into "share" and "होगी" (hogee/will-be)
 * into "hope" — common Hindi words routinely land within a small edit
 * distance of some unrelated English word by coincidence.
 */
function correctLoanword(word: string, allowFuzzy: boolean): string | null {
    const key = normalizePhonetic(word);
    if (key.length < 4) return null;

    const index = getLoanwordIndex();
    const exact = index.get(key);
    if (exact) return exact;
    if (!allowFuzzy) return null;

    // Fuzzy fallback: the recognizer's phonetic spelling of a loanword can
    // vary by several edits (extra/missing vowel, consonant substitutions
    // like c->k, a trailing inherent-vowel artifact) — this can afford to be
    // generous because `allowFuzzy` already gated entry on a candra-vowel
    // signal that's essentially unique to loanwords, not on this distance
    // being tight.
    let best: string | null = null;
    let bestDist = Infinity;
    const maxDist = Math.max(1, Math.ceil(key.length * 0.4));
    for (const [normWord, canonical] of index) {
        if (Math.abs(normWord.length - key.length) > maxDist) continue;
        const d = levenshtein(key, normWord);
        if (d < bestDist) {
            bestDist = d;
            best = canonical;
        }
    }
    return bestDist <= maxDist ? best : null;
}

const CANDRA_CHARS = new Set(['ऑ', 'ऍ', 'ॉ', 'ॅ']);

export function devanagariToHinglish(input: string): string {
    if (!input) return '';

    let result = '';
    let word = '';
    let wordHasCandra = false;
    const chars = Array.from(input);

    const flushWord = () => {
        if (word) {
            result += isHinglishWord(word) ? word : (correctLoanword(word, wordHasCandra) ?? word);
        }
        word = '';
        wordHasCandra = false;
    };

    for (let i = 0; i < chars.length; i++) {
        const ch = chars[i];

        // Multi-char consonant clusters (क्ष, त्र, ज्ञ) — check longest first
        const threeChar = chars.slice(i, i + 3).join('');
        if (CONSONANTS[threeChar]) {
            const { text, usedCandra } = appendConsonant(threeChar, chars, i);
            word += text;
            if (usedCandra) wordHasCandra = true;
            i += 2;
            continue;
        }

        if (CONSONANTS[ch]) {
            const { text, usedCandra } = appendConsonant(ch, chars, i);
            word += text;
            if (usedCandra) wordHasCandra = true;
            continue;
        }

        if (CANDRA_CHARS.has(ch)) wordHasCandra = true;
        if (INDEPENDENT_VOWELS[ch]) {
            word += INDEPENDENT_VOWELS[ch];
            continue;
        }

        if (DIGITS[ch]) {
            word += DIGITS[ch];
            continue;
        }

        if (ch === ANUSVARA || ch === CHANDRABINDU) {
            word += 'n';
            continue;
        }

        if (ch === VISARGA) {
            word += 'h';
            continue;
        }

        if (ch === VIRAMA || ch === NUKTA || MATRAS[ch]) {
            // Matras and virama are consumed via lookahead in appendConsonant;
            // reaching one here just means the loop caught up to it — skip it.
            continue;
        }

        if (ch === '।' || ch === '॥') {
            flushWord();
            result += '.';
            continue;
        }

        if (/[a-zA-Z']/.test(ch)) {
            // Latin letters the recognizer already gave us verbatim (a
            // code-switched run it didn't attempt to phoneticize) — keep
            // them part of the current word so isHinglishWord/loanword
            // correction still sees the whole token.
            word += ch;
            continue;
        }

        // Anything else we don't recognise (punctuation, emoji, whitespace)
        // is a word boundary — flush, then pass the character through.
        flushWord();
        result += ch;
    }
    flushWord();

    return capitalizeSentences(result.replace(/\s+/g, ' ').trim());
}

function appendConsonant(consonant: string, chars: string[], index: number): { text: string; usedCandra: boolean } {
    const base = CONSONANTS[consonant];
    const consumedLength = consonant.length;
    const next = chars[index + consumedLength];

    if (next === VIRAMA) {
        // Inherent "a" suppressed; consonant stands alone (handled by caller's loop
        // continuing past the virama since we only advance past the consonant itself).
        return { text: base, usedCandra: false };
    }
    if (next && MATRAS[next]) {
        return { text: base + MATRAS[next], usedCandra: CANDRA_CHARS.has(next) };
    }
    // Default: inherent "a" vowel
    return { text: base + 'a', usedCandra: false };
}
