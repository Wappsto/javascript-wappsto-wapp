import { Model } from './model';
import { StreamModel } from './model.stream';
import { checkList } from '../util/helpers';
import { IConnectionModel, ConnectionCallback } from '../util/interfaces';

export class ConnectionModel extends StreamModel implements IConnectionModel {
    connectionCallbacks: ConnectionCallback[] = [];
    currentStatus = false;

    public isOnline(): boolean {
        if (this.meta.connection?.online === true) {
            return true;
        }
        return false;
    }

    public async onConnectionChange(
        callback: ConnectionCallback
    ): Promise<boolean> {
        Model.validateMethod(
            'ConnectionModel',
            'onConnectionChange',
            arguments
        );
        let res = false;
        this.currentStatus = this.isOnline();
        if (!checkList(this.connectionCallbacks, callback)) {
            this.connectionCallbacks.push(callback);
            res = await this.onEvent(() => {
                if (this.isOnline() !== this.currentStatus) {
                    this.currentStatus = this.isOnline();
                    this.connectionCallbacks.forEach((cb) => {
                        cb(this, this.isOnline());
                    });
                }
            });
        }
        return res;
    }
}
