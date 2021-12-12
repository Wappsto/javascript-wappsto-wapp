import { Model } from './model';
import { openStream } from './stream';

export class OAuth extends Model {
    static endpoint = '/2.0/oauth_connect';

    name: string;

    constructor(name: string) {
        super('2.0', 'oauth');
        this.name = name;
    }

    public getToken = async () => {
        return new Promise<any>(async (resolve) => {
            let data = await Model.fetch(`/2.0/oauth_connect/${this.name}`, {});
            let oauth = data[0];

            if (oauth?.params?.oauth_token) {
                resolve(oauth?.params);
                return;
            }

            openStream.subscribeService(
                '/oauth',
                async (event: any): Promise<true | undefined> => {
                    if (event) {
                        return true;
                    }
                    return;
                }
            );

            if (oauth?.code === 436000002) {
                // configure oauth
                if (typeof window !== 'undefined' && window.open) {
                    window.open(
                        oauth.data.request,
                        `OAuth - ${oauth.message}`,
                        'popup,height=300,width=300'
                    );
                }
            }
        });
    };

    static getToken = async (name: string) => {
        let oauth = new OAuth(name);
        return await oauth.getToken();
    };
}
