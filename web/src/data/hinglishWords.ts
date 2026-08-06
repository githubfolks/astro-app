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

    // Additional Hinglish/Sanskrit terms from docs/hinglish-words.txt
    'aage', 'aana', 'aayega', 'abhishek', 'agle', 'aisa', 'amatyakarak', 'anukul', 'anushthan',
    'arghya', 'ashtakavarga', 'ashtakoot', 'atmakarak', 'ayushya', 'bachana', 'badhegi', 'badlega',
    'banega', 'bata', 'bhakoot', 'bhav', 'bhavesh', 'bhavishya', 'bhavishyavani', 'bhratrukarak',
    'bolna', 'brahmand', 'brihaspati', 'bura', 'chadhana', 'chahiye', 'chalega', 'chalisa',
    'charan', 'cheezein', 'daan', 'darakarak', 'dasha', 'dekh', 'dekhna', 'dhaiya', 'dhyaan',
    'dhyan', 'dikh', 'dikhana', 'dikkat', 'diya', 'dobara', 'drishti', 'ek', 'filhaal',
    'gajakesari', 'gana', 'ghar', 'gochar', 'gomed', 'gyatikarak', 'hafte', 'havan', 'heera',
    'hongi', 'hounga', 'jaana', 'jaap', 'jal', 'jalana', 'jald', 'jaldbazi', 'janam', 'jaunga',
    'jaungi', 'kaal', 'kamzor', 'karak', 'karega', 'karu', 'karun', 'ke', 'kharcha', 'khatam',
    'ki', 'kismat', 'lagegi', 'lagnesh', 'lahsuniya', 'maitri', 'mandal', 'mandir', 'manglik',
    'manik', 'marak', 'margi', 'matrukarak', 'mohabbat', 'moonga', 'moti', 'mrityunjaya', 'nadi',
    'naseeb', 'navamsa', 'navgraha', 'nazar', 'neech', 'neelam', 'nikalna', 'pada', 'padhai',
    'padhna', 'pandit', 'pareshaan', 'patri', 'patrika', 'peepal', 'phir', 'pitra', 'pitru',
    'prabhav', 'pratikool', 'pratyantar', 'pukhraj', 'purva', 'putrakarak', 'pyaar', 'raha',
    'rahe', 'rahi', 'rakhna', 'ratna', 'rehna', 'rudrabhishek', 'rudraksha', 'rukawat', 'rukna',
    'saavdhan', 'sach', 'sadhana', 'sakte', 'sakti', 'samay', 'sanket', 'sarp', 'sati', 'sehat',
    'seva', 'shadbala', 'shanti', 'shatru', 'shri', 'shuru', 'soch', 'sthan', 'swarashi', 'tak',
    'tareekh', 'tel', 'uchcha', 'upvas', 'vakri', 'vasya', 'vimshottari', 'vipreet', 'vrat',
    'wapas', 'waqt', 'yagya', 'yantra', 'yog', 'yogini', 'yoni', 'yuti',
    'ast', 'tara', 'panna', 'varna', 'ayu', 'mein', 'hoon', 'baar', 'banana', 'chal', 'lena',
    'maha', 'gayatri', 'hanuman', 'mitra', 'sade', 'shastra', 'swami', 'tulsi', 'guna',

    // English words seekers commonly mix into Hinglish chat (from docs/hinglish-words.txt)
    'arranged', 'boyfriend', 'caste', 'challenging', 'chances', 'emotions', 'employment',
    'expected', 'extramarital', 'feelings', 'freelancing', 'funding', 'gemstone', 'ghosting',
    'girlfriend', 'ignoring', 'iit', 'inherited', 'inter', 'liabilities', 'long', 'malefic',
    'marks', 'non', 'okay', 'one', 'online', 'onsite', 'patch', 'personalized', 'planning', 'plz',
    'pr', 'religion', 'sales', 'savings', 'self', 'short', 'sided', 'soulmate', 'ssc', 'startup',
    'stressed', 'studies', 'term', 'up', 'upsc', 'wellbeing',
] as const;

/**
 * Lowercase letters only, with runs of a repeated letter collapsed to one
 * (aa->a, ee->e, ...). Typed Hinglish uses single-vowel spelling ("shaadi"),
 * but voice input's phonetic transliteration (utils/hinglish.ts) doubles
 * matra vowels ("shaadee") — without normalizing both sides the same way,
 * isHinglishWord() below would never recognise a voice-transcribed word,
 * silently letting every real Hindi word fall through to the caller's
 * English-loanword fuzzy-match and get "corrected" into the wrong word.
 *
 * Also folds "ph"->"f" and "w"->"v": फ transliterates to "ph" (e.g. "office"
 * -> "ophisa") while English often spells the same sound with a single "f"
 * ("office", not "opphice") — left unfolded, an edit-distance match can
 * land on a wrong-but-closer word (e.g. "office" matched "phase" instead,
 * since "ophisa" is fewer edits from "phase" than from unfolded "office").
 * व is similarly ambiguous between English "v" and "w".
 */
export function normalizePhonetic(word: string): string {
    return word.toLowerCase().replace(/[^a-z]/g, '')
        .replace(/ph/g, 'f').replace(/w/g, 'v')
        .replace(/(.)\1+/g, '$1');
}

let cachedSet: Set<string> | null = null;

export function isHinglishWord(word: string): boolean {
    if (!cachedSet) cachedSet = new Set(HINGLISH_WORDS.map(normalizePhonetic));
    return cachedSet.has(normalizePhonetic(word));
}
