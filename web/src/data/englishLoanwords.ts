/**
 * English words astrologers/seekers plausibly say mid-Hindi-sentence during a
 * chat consultation (astrology/consultation domain terms, plus everyday
 * conversational filler). Sourced from docs/hinglish-words.txt,
 * docs/hinglish-words-2.txt, and the English tail of HINGLISH_WORDS.
 *
 * Hindi speech recognition (Web Speech API, lang="hi-IN") transcribes these
 * phonetically into Devanagari rather than recognizing them as English, so
 * naive character-by-character transliteration back to Roman script produces
 * garbled approximations (e.g. "एस्ट्रोलॉजर" -> "Estrolojara" instead of
 * "astrologer") — see correctLoanword() in utils/hinglish.ts, which fuzzy-
 * matches a transliterated word against this list to recover the correct
 * English spelling.
 */
export const ENGLISH_LOANWORDS: readonly string[] = [
    'ability', 'abroad', 'absolutely', 'abundance', 'academic', 'accept', 'accident', 'accumulation',
    'accurate', 'actually', 'admission', 'advice', 'affair', 'afternoon', 'age', 'ahead', 'alignment',
    'alright', 'analysis', 'ancestral', 'anxiety', 'appraisal', 'approval', 'approximate', 'argument',
    'arranged', 'ascendant', 'aspect', 'asset', 'assets', 'astrologer', 'astrology', 'attachment',
    'attraction', 'authority', 'avoid', 'balance', 'bank', 'banking', 'believe', 'benefic', 'beneficial',
    'benefit', 'best', 'betrayal', 'better', 'birth', 'birthplace', 'blockage', 'blocked', 'body', 'bond',
    'boss', 'boyfriend', 'breakup', 'business', 'calculate', 'call', 'cancel', 'cash', 'caste', 'caution',
    'celestial', 'certainly', 'challenge', 'challenging', 'chance', 'chances', 'change', 'chant', 'chanting',
    'charity', 'chart', 'chat', 'cheating', 'check', 'choice', 'chronic', 'citizenship', 'city', 'clear',
    'clearly', 'client', 'closure', 'college', 'color', 'colour', 'combust', 'commitment', 'communication',
    'company', 'compatibility', 'compatible', 'competition', 'competitive', 'complete', 'concentration',
    'concern', 'condition', 'confidence', 'confirm', 'conflict', 'confused', 'confusion', 'congratulations',
    'conjunction', 'connection', 'constellation', 'consultation', 'consulting', 'contact', 'continue',
    'control', 'corporate', 'correct', 'cosmic', 'country', 'course', 'creation', 'creative', 'crush',
    'current', 'currently', 'customer', 'cycle', 'date', 'debilitated', 'debt', 'decide', 'decision', 'deep',
    'definitely', 'degree', 'delay', 'depression', 'destiny', 'detail', 'detailed', 'diet', 'difficult',
    'direct', 'direction', 'discipline', 'disease', 'dispute', 'distance', 'divine', 'divorce', 'doctor',
    'donate', 'donation', 'early', 'earning', 'economic', 'education', 'eighth', 'eleventh', 'emi',
    'emotional', 'emotions', 'employment', 'energy', 'engagement', 'entrance', 'entrepreneur',
    'entrepreneurship', 'especially', 'estate', 'evening', 'event', 'exact', 'exactly', 'exalted', 'exam',
    'examination', 'excellent', 'exercise', 'expansion', 'expected', 'expense', 'extramarital', 'failure',
    'fame', 'family', 'fast', 'fasting', 'fatigue', 'favorable', 'fee', 'feelings', 'field', 'fifth', 'fight',
    'financial', 'fine', 'first', 'fitness', 'flame', 'flow', 'focus', 'foreign', 'fortune', 'fourth',
    'freedom', 'freelancing', 'full', 'functional', 'funding', 'future', 'gain', 'gains', 'gemstone', 'gender',
    'generate', 'ghosting', 'girlfriend', 'golden', 'good', 'government', 'gradual', 'great', 'growth',
    'guarantee', 'guidance', 'happiness', 'harmony', 'healing', 'health', 'hello', 'help', 'higher', 'hike',
    'honestly', 'hope', 'horoscope', 'hospital', 'hospitalization', 'house', 'husband', 'idea', 'ideal',
    'ignoring', 'illness', 'immediate', 'immigration', 'immunity', 'impact', 'improve', 'improvement',
    'income', 'increment', 'independent', 'indication', 'influence', 'inheritance', 'inherited',
    'intelligence', 'inter', 'international', 'interpretation', 'interview', 'investment', 'investor', 'issue',
    'issues', 'job', 'joining', 'jupiter', 'karmic', 'land', 'late', 'later', 'latitude', 'leadership',
    'learning', 'legal', 'lesson', 'lessons', 'letter', 'level', 'liabilities', 'life', 'lifestyle', 'loan',
    'location', 'long', 'longevity', 'longitude', 'lord', 'loss', 'lottery', 'love', 'loyalty', 'luck',
    'lucky', 'luxury', 'major', 'malefic', 'manage', 'management', 'margin', 'marital', 'market', 'marks',
    'marriage', 'married', 'mars', 'match', 'matching', 'maybe', 'media', 'medical', 'medicine', 'meditate',
    'meditation', 'memory', 'mental', 'mercury', 'message', 'migration', 'minute', 'misunderstanding', 'money',
    'month', 'months', 'moon', 'morning', 'motion', 'multiple', 'name', 'natal', 'natural', 'near', 'negative',
    'neptune', 'next', 'night', 'ninth', 'non', 'number', 'obstacle', 'obviously', 'occupation', 'offer',
    'office', 'okay', 'one', 'online', 'onsite', 'opportunity', 'overall', 'overseas', 'partner',
    'partnership', 'passive', 'past', 'patch', 'path', 'patience', 'pattern', 'payment', 'percentage',
    'perfect', 'period', 'permanent', 'permanently', 'permit', 'person', 'personal', 'personalized',
    'personally', 'phase', 'photo', 'physical', 'place', 'placement', 'plan', 'planet', 'planetary',
    'planning', 'please', 'pluto', 'point', 'politics', 'position', 'positive', 'possibility', 'possible',
    'powerful', 'practically', 'practice', 'pray', 'prayer', 'precious', 'prediction', 'prepare', 'present',
    'pressure', 'previous', 'private', 'probability', 'probably', 'problem', 'profession', 'professional',
    'profit', 'progress', 'project', 'promotion', 'property', 'proposal', 'prosperity', 'purchase', 'rate',
    'reading', 'real', 'really', 'recognition', 'recommendation', 'reconciliation', 'recovery', 'refund',
    'rejection', 'relationship', 'relax', 'religion', 'relocation', 'remarriage', 'remedy', 'repayment',
    'reply', 'report', 'reputation', 'research', 'residency', 'respect', 'response', 'result', 'retrograde',
    'return', 'reunion', 'revenue', 'right', 'rising', 'risk', 'ritual', 'role', 'romance', 'running',
    'salary', 'sale', 'sales', 'satisfaction', 'saturn', 'savings', 'scholarship', 'school', 'screenshot',
    'second', 'sector', 'security', 'selection', 'self', 'senior', 'separation', 'sequence', 'settle',
    'settlement', 'seventh', 'share', 'shift', 'short', 'sided', 'sign', 'significator', 'situation', 'sixth',
    'sleep', 'software', 'solo', 'solution', 'soon', 'sorry', 'soulmate', 'source', 'speculation', 'spiritual',
    'spouse', 'stability', 'stable', 'start', 'startup', 'state', 'status', 'stock', 'stone', 'stream',
    'strength', 'stress', 'stressed', 'strong', 'student', 'studies', 'study', 'subject', 'success', 'sudden',
    'suggestion', 'suitable', 'sun', 'support', 'sure', 'surgery', 'switch', 'teaching', 'technical', 'temple',
    'tension', 'tenth', 'term', 'thank', 'thanks', 'third', 'time', 'timing', 'today', 'tomorrow', 'trading',
    'transfer', 'transit', 'travel', 'treatment', 'trip', 'true', 'trust', 'turning', 'twelfth', 'twin',
    'unblock', 'understanding', 'unexpected', 'unfavorable', 'universe', 'university', 'unlucky',
    'unnecessary', 'unstable', 'upcoming', 'uranus', 'venture', 'venus', 'video', 'visa', 'visit', 'wait',
    'weak', 'weakness', 'wealth', 'wedding', 'week', 'welcome', 'wellbeing', 'wellness', 'wife', 'wonderful',
    'work', 'workplace', 'worried', 'worry', 'worship', 'year', 'yes', 'yesterday', 'yoga', 'zodiac', 'zone',
] as const;
