import { Config } from '../src/config';

describe('config', () => {
    it('can create a new instance', () => {
        let c = new Config('test');
        expect(c.name).toEqual('test');
    });
});
