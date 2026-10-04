import request from 'supertest';
import app from '../src/app.js';
import { Review } from '../src/models/review.model.js';
import { loggedIn } from './helpers.js';

const api = '/api/v1/reviews';
const mine = `${api}/mine`;
const good = { rating: 5, comment: 'Clear invoices and I always know what is unpaid.' };

beforeAll(async () => {
    await Review.init();
});

describe('reading', () => {
    test('anyone sees the reviews, newest first, with the average and nothing but the name', async () => {
        const first = await loggedIn({ name: 'Asha Rao' });
        const second = await loggedIn({ name: 'Vikram Shah' });
        await first.agent.put(mine).send({ rating: 4, comment: 'Does what it says.' });
        await second.agent.put(mine).send(good);

        const res = await request(app).get(api);

        expect(res.status).toBe(200);
        expect(res.body.data).toMatchObject({ count: 2, average: 4.5 });
        expect(res.body.data.reviews.map((review) => review.name)).toEqual(['Vikram Shah', 'Asha Rao']);
        expect(res.body.data.reviews[0]).toEqual({ name: 'Vikram Shah', rating: 5, comment: good.comment, date: expect.any(String) });
        expect(JSON.stringify(res.body)).not.toMatch(/@test\.dev|"user"|_id/);
    });

    test('no reviews yet', async () => {
        expect((await request(app).get(api)).body.data).toEqual({ reviews: [], count: 0, average: null });
    });

    test('the average is over every review, although only the newest fifty are listed', async () => {
        const reviews = Array.from({ length: 55 }, (_, index) => ({ user: `507f1f77bcf86cd7994390${String(index).padStart(2, '0')}`, name: `User ${index}`, rating: index < 5 ? 1 : 5, comment: 'Fine.' }));
        await Review.insertMany(reviews);

        const { data } = (await request(app).get(api)).body;

        expect(data.reviews).toHaveLength(50);
        expect(data.count).toBe(55);
        // (5 x 1 + 50 x 5) / 55 = 4.636...
        expect(data.average).toBe(4.6);
    });

    test('a user reads their own review, or learns there is none', async () => {
        const { agent } = await loggedIn();

        expect((await agent.get(mine)).body.data).toEqual({ review: null });
        await agent.put(mine).send(good);
        expect((await agent.get(mine)).body.data.review).toMatchObject(good);
        expect((await request(app).get(mine)).status).toBe(401);
    });
});

describe('writing', () => {
    test('a verified user posts one review; posting again changes it', async () => {
        const { user, agent } = await loggedIn({ name: 'Asha Rao' });

        const first = await agent.put(mine).send({ rating: '4', comment: '  Good.  ', name: 'Someone Else', user: '507f1f77bcf86cd799439011' });
        const second = await agent.put(mine).send(good);

        expect([first.status, first.body.message]).toEqual([200, 'Thank you for your review']);
        expect([second.status, second.body.message]).toEqual([200, 'Your review was updated']);
        const saved = await Review.find();
        expect(saved).toHaveLength(1);
        expect(saved[0]).toMatchObject({ name: 'Asha Rao', rating: 5, comment: good.comment });
        expect(String(saved[0].user)).toBe(String(user._id));
    });

    test('two saves at once still leave one review', async () => {
        const { agent } = await loggedIn();

        const answers = await Promise.all([agent.put(mine).send(good), agent.put(mine).send({ rating: 3, comment: 'Second.' })]);

        expect(answers.map((res) => res.status)).toEqual([200, 200]);
        expect(await Review.countDocuments()).toBe(1);
    });

    test('a rating is a whole number from 1 to 5, and a comment of up to 500 characters is required', async () => {
        const { agent } = await loggedIn();
        const refused = async (body) => {
            const res = await agent.put(mine).send(body);
            return [res.status, res.body.message];
        };

        for (const rating of [0, 6, 4.5, 'five', '', undefined, null, [5], { $gt: 0 }, true]) {
            expect(await refused({ ...good, rating })).toEqual([400, 'Rating must be a whole number from 1 to 5']);
        }
        expect(await refused({ rating: 5 })).toEqual([400, 'Comment is required']);
        expect(await refused({ rating: 5, comment: 'c'.repeat(501) })).toEqual([400, 'Comment must be at most 500 characters']);
        expect(await refused({ rating: 5, comment: { $gt: '' } })).toEqual([400, 'Comment must be text']);
        expect(await Review.countDocuments()).toBe(0);
    });

    test('offensive language is refused', async () => {
        const { agent } = await loggedIn();

        const res = await agent.put(mine).send({ rating: 1, comment: 'This is shit.' });

        expect([res.status, res.body.message]).toEqual([400, 'Please keep the review free of offensive language ("shit")']);
        expect((await agent.put(mine).send({ rating: 2, comment: 'The PDF could be better, but the assessment is fair.' })).status).toBe(200);
    });

    test('a user removes their review', async () => {
        const { agent } = await loggedIn();
        await agent.put(mine).send(good);

        const res = await agent.delete(mine);

        expect([res.status, res.body.message]).toEqual([200, 'Your review was removed']);
        expect(await Review.countDocuments()).toBe(0);
        expect((await agent.delete(mine)).status).toBe(200);
    });

    test('visitors, unverified accounts and the demo account cannot write', async () => {
        const unverified = await loggedIn({ isVerified: false });
        const demo = await loggedIn({ isDemo: true });

        for (const method of ['put', 'delete']) {
            expect((await request(app)[method](mine).send(good)).status).toBe(401);
            const first = await unverified.agent[method](mine).send(good);
            expect([first.status, first.body.message]).toEqual([403, 'Verify your email to do this']);
            const second = await demo.agent[method](mine).send(good);
            expect([second.status, second.body.message]).toEqual([403, 'The demo account cannot do this']);
        }
        expect(await Review.countDocuments()).toBe(0);
    });

    test('a review keeps the name it was written under', async () => {
        const { user, agent } = await loggedIn({ name: 'Asha Rao' });
        await agent.put(mine).send(good);
        await user.updateOne({ name: 'Renamed' });

        expect((await request(app).get(api)).body.data.reviews[0].name).toBe('Asha Rao');
    });
});
