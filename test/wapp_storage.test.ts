import { WappStorage } from '../src/wapp_storage';

describe('WappStorage', () => {
    it('can create a new instance', () => {
        let ws = new WappStorage('test');
        expect(ws.name).toEqual('test');
    });
    /*
    it('can add a new item', async () => {
        let c = new Config('test');
        c.set('key', 'item');
        let res = c.get('key');
        expect(res).toBe('item');
    });*/
});
