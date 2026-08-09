export interface ZodiacSignData {
    slug: string;
    name: string;
    hindi: string;
    symbol: string;
    glyph: string;
    dates: string;
    element: 'Fire' | 'Earth' | 'Air' | 'Water';
    ruling_planet: string;
    quality: string;
    traits: string[];
    strengths: string;
    challenges: string;
    lucky_color: string;
    lucky_number: string;
    compatible: string;
    desc: string;
}

export const ZODIAC_SIGNS: Record<string, ZodiacSignData> = {
    aries: {
        slug: 'aries', name: 'Aries', hindi: 'मेष', symbol: '♈', glyph: '🐏',
        dates: 'March 21 – April 19',
        element: 'Fire', ruling_planet: 'Mars', quality: 'Cardinal',
        traits: ['Bold', 'Energetic', 'Pioneering', 'Competitive', 'Direct'],
        strengths: 'Natural leadership, courage, enthusiasm, and an unstoppable drive to initiate.',
        challenges: 'Impatience, impulsiveness, and a tendency to start things without finishing them.',
        lucky_color: 'Red', lucky_number: '9', compatible: 'Leo, Sagittarius, Gemini',
        desc: 'Aries is the first sign of the zodiac, representing new beginnings and raw ambition. Ruled by Mars — the planet of action — Aries natives are fearless trailblazers who charge ahead where others hesitate.',
    },
    taurus: {
        slug: 'taurus', name: 'Taurus', hindi: 'वृषभ', symbol: '♉', glyph: '🐂',
        dates: 'April 20 – May 20',
        element: 'Earth', ruling_planet: 'Venus', quality: 'Fixed',
        traits: ['Reliable', 'Patient', 'Sensual', 'Determined', 'Practical'],
        strengths: 'Rock-solid reliability, financial acumen, sensory appreciation, and deep loyalty.',
        challenges: 'Stubbornness, resistance to change, and over-attachment to material comfort.',
        lucky_color: 'Green', lucky_number: '6', compatible: 'Virgo, Capricorn, Cancer',
        desc: 'Taurus is ruled by Venus and embodies earthly pleasures — comfort, beauty, and stability. Taurus natives build lasting wealth and relationships through patient, steady effort.',
    },
    gemini: {
        slug: 'gemini', name: 'Gemini', hindi: 'मिथुन', symbol: '♊', glyph: '👯',
        dates: 'May 21 – June 20',
        element: 'Air', ruling_planet: 'Mercury', quality: 'Mutable',
        traits: ['Witty', 'Versatile', 'Curious', 'Communicative', 'Adaptable'],
        strengths: 'Quick intellect, outstanding communication, social agility, and creative thinking.',
        challenges: 'Inconsistency, superficiality, and difficulty committing to one path.',
        lucky_color: 'Yellow', lucky_number: '5', compatible: 'Libra, Aquarius, Aries',
        desc: 'Ruled by Mercury — planet of the mind — Gemini is the ultimate communicator. Twins of the zodiac, Geminis are multifaceted, quick-witted, and endlessly curious about the world around them.',
    },
    cancer: {
        slug: 'cancer', name: 'Cancer', hindi: 'कर्क', symbol: '♋', glyph: '🦀',
        dates: 'June 21 – July 22',
        element: 'Water', ruling_planet: 'Moon', quality: 'Cardinal',
        traits: ['Nurturing', 'Intuitive', 'Protective', 'Emotional', 'Loyal'],
        strengths: 'Deep empathy, powerful intuition, fierce loyalty, and the ability to create home and belonging.',
        challenges: 'Moodiness, clinginess, over-sensitivity, and withdrawing into a shell when hurt.',
        lucky_color: 'Silver', lucky_number: '2', compatible: 'Scorpio, Pisces, Taurus',
        desc: 'Cancer is ruled by the Moon, making it the most emotionally attuned sign. Cancerians are fierce protectors of family and loved ones, guided by deep intuition and an unwavering need to nurture.',
    },
    leo: {
        slug: 'leo', name: 'Leo', hindi: 'सिंह', symbol: '♌', glyph: '🦁',
        dates: 'July 23 – August 22',
        element: 'Fire', ruling_planet: 'Sun', quality: 'Fixed',
        traits: ['Charismatic', 'Generous', 'Confident', 'Creative', 'Warm-hearted'],
        strengths: 'Natural magnetism, generous heart, creative brilliance, and unshakeable confidence.',
        challenges: 'Pride, need for admiration, stubbornness, and dominating tendencies.',
        lucky_color: 'Gold', lucky_number: '1', compatible: 'Aries, Sagittarius, Libra',
        desc: 'Ruled by the Sun — source of all light — Leo shines with natural authority and warmth. Leos are born leaders who command attention and inspire others with their magnificent creativity.',
    },
    virgo: {
        slug: 'virgo', name: 'Virgo', hindi: 'कन्या', symbol: '♍', glyph: '👧',
        dates: 'August 23 – September 22',
        element: 'Earth', ruling_planet: 'Mercury', quality: 'Mutable',
        traits: ['Analytical', 'Meticulous', 'Helpful', 'Reliable', 'Modest'],
        strengths: 'Unmatched analytical skills, attention to detail, strong work ethic, and deep desire to serve.',
        challenges: 'Perfectionism, overcritical nature, excessive worry, and self-doubt.',
        lucky_color: 'Navy Blue', lucky_number: '5', compatible: 'Taurus, Capricorn, Scorpio',
        desc: 'Virgo is the master craftsperson of the zodiac — methodical, precise, and always striving for improvement. Ruled by Mercury, Virgos apply sharp intellect to practical problems and excel as healers and analysts.',
    },
    libra: {
        slug: 'libra', name: 'Libra', hindi: 'तुला', symbol: '♎', glyph: '⚖️',
        dates: 'September 23 – October 22',
        element: 'Air', ruling_planet: 'Venus', quality: 'Cardinal',
        traits: ['Diplomatic', 'Fair-minded', 'Social', 'Gracious', 'Idealistic'],
        strengths: 'Natural diplomacy, aesthetic sense, charm, and an innate ability to see all sides.',
        challenges: 'Indecisiveness, people-pleasing, avoidance of confrontation, and superficiality.',
        lucky_color: 'Pink', lucky_number: '6', compatible: 'Gemini, Aquarius, Leo',
        desc: 'Ruled by Venus, Libra seeks beauty, balance, and harmonious relationships above all. Librans are the consummate diplomats — refined, fair, and deeply idealistic about love and justice.',
    },
    scorpio: {
        slug: 'scorpio', name: 'Scorpio', hindi: 'वृश्चिक', symbol: '♏', glyph: '🦂',
        dates: 'October 23 – November 21',
        element: 'Water', ruling_planet: 'Mars & Ketu', quality: 'Fixed',
        traits: ['Intense', 'Perceptive', 'Determined', 'Passionate', 'Resourceful'],
        strengths: 'Depth of perception, unwavering determination, transformative power, and magnetic presence.',
        challenges: 'Jealousy, secretiveness, controlling behaviour, and difficulty forgiving.',
        lucky_color: 'Dark Red', lucky_number: '8', compatible: 'Cancer, Pisces, Virgo',
        desc: 'Scorpio is the sign of death and rebirth — transformation at its most profound. Ruled by Mars and Ketu, Scorpios possess penetrating insight and an almost psychic ability to uncover hidden truths.',
    },
    sagittarius: {
        slug: 'sagittarius', name: 'Sagittarius', hindi: 'धनु', symbol: '♐', glyph: '🏹',
        dates: 'November 22 – December 21',
        element: 'Fire', ruling_planet: 'Jupiter', quality: 'Mutable',
        traits: ['Optimistic', 'Adventurous', 'Philosophical', 'Honest', 'Freedom-loving'],
        strengths: 'Boundless optimism, thirst for knowledge, philosophical wisdom, and inspiring generosity.',
        challenges: 'Over-promising, tactlessness, restlessness, and inability to focus long-term.',
        lucky_color: 'Purple', lucky_number: '3', compatible: 'Aries, Leo, Aquarius',
        desc: 'Ruled by Jupiter — the planet of expansion and wisdom — Sagittarius is the great explorer of the zodiac. Archers seek meaning, truth, and adventure across cultures, philosophies, and horizons.',
    },
    capricorn: {
        slug: 'capricorn', name: 'Capricorn', hindi: 'मकर', symbol: '♑', glyph: '🕷️',
        dates: 'December 22 – January 19',
        element: 'Earth', ruling_planet: 'Saturn', quality: 'Cardinal',
        traits: ['Disciplined', 'Ambitious', 'Responsible', 'Strategic', 'Persistent'],
        strengths: 'Extraordinary discipline, long-term strategic vision, leadership, and the ability to build lasting structures.',
        challenges: 'Workaholism, pessimism, emotional rigidity, and excessive focus on status.',
        lucky_color: 'Black/Brown', lucky_number: '8', compatible: 'Taurus, Virgo, Scorpio',
        desc: 'Ruled by Saturn — planet of karma and discipline — Capricorn is the zodiac\'s supreme achiever. Patient and strategic, Capricorns build empires through sustained effort and mastery of their chosen craft.',
    },
    aquarius: {
        slug: 'aquarius', name: 'Aquarius', hindi: 'कुंभ', symbol: '♒', glyph: '🏺',
        dates: 'January 20 – February 18',
        element: 'Air', ruling_planet: 'Saturn & Rahu', quality: 'Fixed',
        traits: ['Innovative', 'Humanitarian', 'Independent', 'Intellectual', 'Eccentric'],
        strengths: 'Visionary thinking, humanitarian ideals, technological brilliance, and fierce independence.',
        challenges: 'Emotional detachment, rebellion, unpredictability, and detachment from feelings.',
        lucky_color: 'Electric Blue', lucky_number: '4', compatible: 'Gemini, Libra, Sagittarius',
        desc: 'Ruled by Saturn and Rahu, Aquarius is the visionary rebel — the sign that dares to imagine a radically different future. Aquarians are ahead of their time, driven by ideals of freedom and human progress.',
    },
    pisces: {
        slug: 'pisces', name: 'Pisces', hindi: 'मीन', symbol: '♓', glyph: '🐟',
        dates: 'February 19 – March 20',
        element: 'Water', ruling_planet: 'Jupiter & Neptune', quality: 'Mutable',
        traits: ['Compassionate', 'Intuitive', 'Artistic', 'Dreamy', 'Selfless'],
        strengths: 'Deep compassion, boundless creativity, spiritual sensitivity, and healing presence.',
        challenges: 'Escapism, over-idealism, boundary difficulties, and susceptibility to illusion.',
        lucky_color: 'Sea Green', lucky_number: '7', compatible: 'Cancer, Scorpio, Capricorn',
        desc: 'Ruled by Jupiter and Neptune, Pisces dissolves boundaries between the material and spiritual worlds. The dreamers of the zodiac, Pisceans possess rare empathy and an otherworldly creative imagination.',
    },
};

export const ZODIAC_SIGN_LIST: ZodiacSignData[] = Object.values(ZODIAC_SIGNS);
