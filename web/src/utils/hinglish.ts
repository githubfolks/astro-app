/**
 * Devanagari -> Hinglish (Roman script) transliteration.
 *
 * The browser's speech recognizer (Web Speech API, lang="hi-IN") returns
 * Hindi speech as Devanagari text. Astrologers want to type/send in the
 * Hinglish their seekers are used to reading in chat, so we transliterate
 * on a best-effort character basis: consonants carry an inherent "a" unless
 * followed by a vowel matra or a virama (्) that suppresses it.
 */

const INDEPENDENT_VOWELS: Record<string, string> = {
    'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee', 'उ': 'u', 'ऊ': 'oo',
    'ऋ': 'ri', 'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au',
    'अं': 'an', 'अः': 'ah',
};

// Vowel matras (combine with the preceding consonant, replacing its inherent "a")
const MATRAS: Record<string, string> = {
    'ा': 'aa', 'ि': 'i', 'ी': 'ee', 'ु': 'u', 'ू': 'oo',
    'ृ': 'ri', 'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au',
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

export function devanagariToHinglish(input: string): string {
    if (!input) return '';

    let result = '';
    const chars = Array.from(input);

    for (let i = 0; i < chars.length; i++) {
        const ch = chars[i];

        // Multi-char consonant clusters (क्ष, त्र, ज्ञ) — check longest first
        const threeChar = chars.slice(i, i + 3).join('');
        if (CONSONANTS[threeChar]) {
            result += appendConsonant(threeChar, chars, i);
            i += 2;
            continue;
        }

        if (CONSONANTS[ch]) {
            result += appendConsonant(ch, chars, i);
            continue;
        }

        if (INDEPENDENT_VOWELS[ch]) {
            result += INDEPENDENT_VOWELS[ch];
            continue;
        }

        if (DIGITS[ch]) {
            result += DIGITS[ch];
            continue;
        }

        if (ch === ANUSVARA || ch === CHANDRABINDU) {
            result += 'n';
            continue;
        }

        if (ch === VISARGA) {
            result += 'h';
            continue;
        }

        if (ch === VIRAMA || ch === NUKTA || MATRAS[ch]) {
            // Matras and virama are consumed via lookahead in appendConsonant;
            // reaching one here just means the loop caught up to it — skip it.
            continue;
        }

        if (ch === '।' || ch === '॥') {
            result += '.';
            continue;
        }

        // Anything we don't recognise (Latin text, punctuation, emoji, spaces)
        // passes through unchanged.
        result += ch;
    }

    return capitalizeSentences(result.replace(/\s+/g, ' ').trim());
}

function appendConsonant(consonant: string, chars: string[], index: number): string {
    const base = CONSONANTS[consonant];
    const consumedLength = consonant.length;
    const next = chars[index + consumedLength];

    if (next === VIRAMA) {
        // Inherent "a" suppressed; consonant stands alone (handled by caller's loop
        // continuing past the virama since we only advance past the consonant itself).
        return base;
    }
    if (next && MATRAS[next]) {
        return base + MATRAS[next];
    }
    // Default: inherent "a" vowel
    return base + 'a';
}
