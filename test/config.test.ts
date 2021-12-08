import { Config } from '../src/config';

describe('config', () => {
    it('can create a new instance', () => {
        let c = new Config('test');
        expect(c.name).toEqual('test');
    });
    /*
    it('can add a new item', async () => {
        let c = new Config('test');
        c.set('key', 'item');
        let res = c.get('key');
        expect(res).toBe('item');
    });*/
});
