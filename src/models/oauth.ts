import { openStream } from '../stream_helpers';
import { printDebug } from '../util/debug';
import {
    JSONObject,
    OAuthConnect,
    OAuthRequestHandler,
    StreamData,
    ValidateParams,
} from '../util/interfaces';
import { Model } from './model';

export class OAuth extends Model {
    static endpoint = '/2.1/oauth_connect';

    name: string;
    api?: string;
    installation?: string;
    token?: string;
    secret_token?: string;
    params?: JSONObject;

    constructor(name: string) {
        super('oauth');
        Model.validateMethod('OAuth', 'constructor', arguments);
        this.name = name;
    }

    getToken(handler?: OAuthRequestHandler) {
        OAuth.#validate('getToken', arguments);
        return new Promise<Record<string, string>>(async (resolve, reject) => {
            try {
                const data = await Model.fetch({
                    endpoint: `/2.1/oauth_connect/${this.name}`,
                    throw_error: true,
                });

                const oauth = data[0] as OAuthConnect;
                if (
                    oauth?.params?.oauth_token ||
                    oauth?.params?.access_token ||
                    oauth?.token
                ) {
                    resolve(oauth.params ?? {});
                    return;
                }

                printDebug(
                    'OAuth token is not valid, waiting for token on stream'
                );
                openStream.subscribeService(
                    '/oauth_connect',
                    (data: StreamData): boolean => {
                        const d = data as OAuthConnect;
                        if (d?.name === this.name) {
                            printDebug('Got OAuth token from stream');
                            resolve(d.params ?? {});
                            return true;
                        }
                        return false;
                    }
                );

                if (handler) {
                    handler(oauth?.data?.request);
                }
            } catch (e) {
                reject(e);
            }
        });
    }

    static getToken = (name: string, handler?: OAuthRequestHandler) => {
        OAuth.#validate('staticGetToken', [name, handler]);
        const oauth = new OAuth(name);
        return oauth.getToken(handler);
    };

    static #validate(name: string, params: ValidateParams): void {
        Model.validateMethod('OAuth', name, params);
    }
}
