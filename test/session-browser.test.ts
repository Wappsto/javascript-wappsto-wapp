/**
 * @jest-environment jsdom
 */
describe('session', () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
        jest.resetModules(); // Most important - it clears the cache
        process.env = { ...OLD_ENV }; // Make a copy
    });

    afterAll(() => {
        process.env = OLD_ENV; // Restore old environment
    });

    it('loads the session from Cookie', () => {
        global.window.document.cookie =
            'sessionID=d9406290-6c3d-41b7-a84d-58b4e060f931; x-session=ab86cca5-16b0-4179-9dfc-0a139c274352;';

        /* eslint @typescript-eslint/no-var-requires: 0 */
        const session = require('../src/session').session;

        expect(session).toEqual('d9406290-6c3d-41b7-a84d-58b4e060f931');
    });
});
