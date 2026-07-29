/**
 * Curated list of common Hinglish (Romanized Hindi) words used in this app's chat.
 * The spell-check dictionary is English-only (Hunspell en_US), so without this list
 * ordinary Hinglish words like "namaste" or "kundli" get flagged as misspelled and
 * "corrected" to unrelated English words (e.g. "namaste" -> "lambaste"). Words here
 * are treated as valid and can also surface as completions while typing.
 *
 * Not exhaustive — covers greetings, pronouns/question words, common verbs/courtesy
 * words, and astrology-domain terms relevant to this app. Extend as gaps are found.
 */
export const HINGLISH_WORDS: readonly string[] = [
    // Greetings & courtesy
    'namaste', 'namaskar', 'pranam', 'shukriya', 'dhanyavaad', 'dhanyavad',
    'swagat', 'alvida', 'theek', 'thik', 'accha', 'achha', 'acha', 'haan', 'han',
    'nahi', 'nahin', 'ji', 'bilkul', 'zaroor', 'jarur',

    // Pronouns & question words
    'aap', 'aapka', 'aapki', 'aapke', 'aapko', 'aapse', 'aapne',
    'main', 'mera', 'meri', 'mere', 'mujhe', 'mujhko',
    'hum', 'humara', 'humari', 'humein', 'humko',
    'tum', 'tumhara', 'tumhari', 'tumhein', 'tera', 'teri', 'tere',
    'kya', 'kaise', 'kyu', 'kyun', 'kaun', 'kaunsa', 'kab', 'kahan', 'kaha',
    'kitna', 'kitne', 'kitni', 'kis', 'kisi', 'koi', 'kuch', 'naam',

    // Common verbs / helpers
    'hai', 'hain', 'tha', 'thi', 'the', 'hoga', 'hogi', 'honge',
    'kar', 'karo', 'karenge', 'karna', 'kiya', 'kijiye', 'kijiyega',
    'batao', 'bataiye', 'bataye', 'dijiye', 'lijiye', 'dekho', 'dekhiye',
    'suno', 'suniye', 'chaliye', 'ruko', 'rukiye', 'samjha', 'samjhe', 'samajh',
    'bolo', 'boliye', 'milega', 'milegi', 'milenge',

    // Time & relations
    'aaj', 'kal', 'abhi', 'jaldi', 'der', 'saal', 'mahina', 'mahine',
    'din', 'raat', 'subah', 'shaam', 'dopahar',
    'pati', 'patni', 'beta', 'beti', 'bachcha', 'bachche', 'parivar',
    'shaadi', 'vivah', 'vivaah', 'sagai', 'rishta', 'rishtey',

    // Astrology-domain terms
    'kundli', 'kundali', 'rashifal', 'rashi', 'grah', 'graha', 'grahon',
    'dosh', 'dosha', 'nakshatra', 'mangal', 'shani', 'rahu', 'ketu',
    'guru', 'shukra', 'budh', 'surya', 'chandra', 'lagna', 'muhurat',
    'panchang', 'tithi', 'varsh', 'mahadasha', 'antardasha',
    'shubh', 'ashubh', 'gun', 'milan', 'career', 'naukri', 'vyapar',
    'dhan', 'paisa', 'santan', 'pooja', 'puja', 'upay', 'totka', 'mantra',
    'jyotish', 'jyotishi', 'bhagya', 'karma', 'rog', 'swasthya',
] as const;

let cachedSet: Set<string> | null = null;

export function isHinglishWord(word: string): boolean {
    if (!cachedSet) cachedSet = new Set(HINGLISH_WORDS);
    return cachedSet.has(word.toLowerCase());
}
