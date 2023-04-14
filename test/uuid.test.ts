import { isUUID } from '../src/util/helpers';

describe('util', () => {
    it('can validate an UUID', () => {
        expect(isUUID('b8546b68-548a-420b-8882-b96dbaa1edae')).toEqual(true);
    });

    it('can see that it is not an UUID', () => {
        expect(isUUID('asd')).toEqual(false);
        expect(isUUID('b8546b68-548a-420b-8882-b96dbaa1eda')).toEqual(false);
        expect(isUUID('b8546b68-548a-420b-8882-b96db6a1ed3g')).toEqual(false);
        expect(isUUID('b8546b68-548a-420b-8882-b96dbaa1edaee')).toEqual(false);
        expect(isUUID('b8546b68-548a-420b-8882eb96dbaa1edae')).toEqual(false);
    });
});
