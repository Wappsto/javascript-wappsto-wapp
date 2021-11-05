import { IMeta } from './meta';
import { Device } from './device';
import { Model } from './model';

interface NetworkJSON {
    meta: IMeta;
    name?: string;
    devices: Device[];
}

export class Network extends Model {
    static endpoint = '/2.0/network';
    name?: string;
    devices: Device[] = [];

    constructor(name?: string) {
        super();
        this.name = name;
    }

    getUrl(): string {
        return Network.endpoint;
    }

    getAttributes(): string[] {
        return ['meta', 'name', 'device'];
    }

    public static fetch = async () => {
        let data: any[] = await Model.fetch(Network.endpoint + '?expand=3');
        let networks: Network[] = [];

        data?.forEach((json: any) => {
            networks.push(Network.fromJSON(json));
        });
        return networks;
    };

    // fromJSON is used to convert an serialized version
    // of the User to an instance of the class
    static fromJSON(json: NetworkJSON | string): Network {
        if (typeof json === 'string') {
            // if it's a string, parse it first
            return JSON.parse(json, Network.reviver);
        } else {
            // create an instance of the User class
            let network = Object.create(Network.prototype);
            // copy all the fields from the json object
            return Object.assign(network, json);
        }
    }

    // reviver can be passed as the second parameter to JSON.parse
    // to automatically call User.fromJSON on the resulting value.
    static reviver(key: string, value: any): any {
        return key === '' ? Network.fromJSON(value) : value;
    }
}
