import { omit, pick } from '../src/util/helpers';

describe('omit', () => {
    it('removes a single key given as a string', () => {
        expect(omit({ a: 1, b: 2 }, 'a')).toEqual({ b: 2 });
    });

    it('removes multiple keys given as an array', () => {
        expect(omit({ a: 1, b: 2, c: 3 }, ['a', 'c'])).toEqual({ b: 2 });
    });

    it('does not mutate the original object', () => {
        const input = { a: 1, b: 2 };
        omit(input, ['a']);
        expect(input).toEqual({ a: 1, b: 2 });
    });

    it('returns an empty object when the input is null or undefined', () => {
        expect(omit(null as never, ['a'])).toEqual({});
        expect(omit(undefined as never, 'a')).toEqual({});
    });
});

describe('pick', () => {
    it('keeps only the requested keys', () => {
        expect(pick({ a: 1, b: 2, c: 3 }, ['a', 'c'])).toEqual({ a: 1, c: 3 });
    });

    it('ignores keys that are not present', () => {
        expect(pick({ a: 1 }, ['a', 'b'])).toEqual({ a: 1 });
    });

    it('returns an empty object when the input is null or undefined', () => {
        expect(pick(null as never, ['a'])).toEqual({});
        expect(pick(undefined as never, ['a'])).toEqual({});
    });
});
