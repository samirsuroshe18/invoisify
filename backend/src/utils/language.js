import { Filter } from 'bad-words';

// Words the stock list treats as offensive that an honest review, or a person's name,
// may well contain. Everyday words must not block a review.
const ALLOWED = [
    'sex', 'sexy', 'god', 'balls', 'crap', 'damn', 'sadist', 'hell', 'butt', 'screw', 'screwed', 'screwing',
    'suck', 'sucks', 'sucked', 'piss', 'pissed', 'poop', 'fart', 'drunk', 'kill', 'die', 'dead',
    'bloody', 'willy', 'dick', 'hoar', 'pawn', 'knob', 'tit', 'homo', 'bum', 'fanny', 'cox', 'snatch', 'lust', 'flange', 'jap',
];

const filter = new Filter();
filter.removeWords(...ALLOWED);

const isOffensive = (word) => Boolean(word) && filter.isProfane(word);

// the first offensive word in a text, as it was written, or null
const offensiveWord = (text) => {
    if (typeof text !== 'string' || !text) return null;

    const words = text.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
    const found = words.find(isOffensive);
    if (found) return found;

    // a word spelled out letter by letter ("s.h.i.t", "s h i t") is still the word
    let run = '';
    for (const word of [...words, '']) {
        if (word.length === 1 && /\p{L}/u.test(word)) {
            run += word;
            continue;
        }

        if (run.length > 2 && isOffensive(run)) return run;
        run = '';
    }

    return null;
};

const hasOffensiveLanguage = (text) => offensiveWord(text) !== null;

export { hasOffensiveLanguage, offensiveWord }
