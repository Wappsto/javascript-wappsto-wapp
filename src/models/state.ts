import { Model } from './model';

export class State extends Model {
    static endpoint = '/2.0/state';

    data?: string;
    status?: string;
    type?: string;
    timestamp?: string;
    status_payment?: string;

    url(): string {
        return State.endpoint;
    }

    attributes(): string[] {
        return ['data', 'status', 'type', 'timestamp', 'status_payment'];
    }

    public static fetch = async () => {
        let data: any[] = await Model.fetch(State.endpoint + '?expand=1');
        let states: State[] = [];

        data?.forEach((json: any) => {
            states.push(State.fromJSON(json));
        });
        return states;
    };

    static fromJSON(json: any): State {
        let state = Object.create(State.prototype);
        return Object.assign(state, json);
    }
}
