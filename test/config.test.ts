import { Config } from '../src/config';

describe('config', () => {
    it('can create a new instnace', () => {
        let c = new Config('test');
        expect(c.name).toEqual('test');
    });
});
