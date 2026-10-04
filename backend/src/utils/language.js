import { Filter } from 'bad-words';

// Words the stock list treats as offensive that an honest review may use: everyday
// words must not block one.
const ALLOWED = [
    'sex', 'sexy', 'god', 'balls', 'crap', 'damn', 'sadist', 'hell', 'butt', 'screw', 'screwed',
    'suck', 'sucks', 'sucked', 'piss', 'pissed', 'poop', 'fart', 'drunk', 'kill', 'die', 'dead',
];

const filter = new Filter();
filter.removeWords(...ALLOWED);

// the first offensive word in a text, as it was written, or null
const offensiveWord = (text) => {
    if (typeof text !== 'string' || !text) return null;

    return text.split(/[^\p{L}\p{N}]+/u).find((word) => word && filter.isProfane(word)) || null;
};

const hasOffensiveLanguage = (text) => offensiveWord(text) !== null;

export { hasOffensiveLanguage, offensiveWord }
