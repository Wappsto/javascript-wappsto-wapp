describe('session', () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
        jest.resetModules(); // Most important - it clears the cache
        process.env = { ...OLD_ENV }; // Make a copy
    });

    afterAll(() => {
        process.env = OLD_ENV; // Restore old environment
    });

    it('loads session to empty session when ENV is not defined', () => {
        const session = require('../src/session').session;

        expect(session).toEqual('');
    });

    it('loads extSyncToken to empty when ENV is not defined', () => {
        const extSyncToken = require('../src/session').extSyncToken;

        expect(extSyncToken).toEqual('');
    });

    it('loads baseUrl to /services when ENV is not defined', () => {
        const baseUrl = require('../src/session').baseUrl;

        expect(baseUrl).toEqual('/services');
    });

    it('loads the session from ENV', () => {
        process.env.sessionID = 'd9406290-6c3d-41b7-a84d-58b4e060f931';

        const session = require('../src/session').session;

        expect(session).toEqual('d9406290-6c3d-41b7-a84d-58b4e060f931');
    });

    it('loads the extSyncToken from ENV', () => {
        process.env.tokenID = 'ba0709c6-e48e-4460-a9ad-6b2ea63678d6';

        const extSyncToken = require('../src/session').extSyncToken;

        expect(extSyncToken).toEqual('ba0709c6-e48e-4460-a9ad-6b2ea63678d6');
    });

    it('loads the baseURL from ENV', () => {
        process.env.baseUrl = 'https://dev.wappsto.com';

        const baseUrl = require('../src/session').baseUrl;

        expect(baseUrl).toEqual('https://dev.wappsto.com');
    });

    it('loads the session from Cookie', () => {
        window.document.cookie =
            'sessionID=d9406290-6c3d-41b7-a84d-58b4e060f931; x-session=ab86cca5-16b0-4179-9dfc-0a139c274352;';

        const session = require('../src/session').session;

        expect(session).toEqual('d9406290-6c3d-41b7-a84d-58b4e060f931');
    });
});
