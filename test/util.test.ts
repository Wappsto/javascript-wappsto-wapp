import { isUUID } from '../src/util/uuid';

describe('util', () => {
    it('can validate an UUID', () => {
        expect(isUUID('asd')).toEqual(false);
        expect(isUUID('b8546b68-548a-420b-8882-b96dbaa1edae')).toEqual(true);
    });
});
