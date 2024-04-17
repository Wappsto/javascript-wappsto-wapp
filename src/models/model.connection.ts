import { checkList, checkListIndex } from '../util/helpers';
import { ConnectionCallback, IConnectionModel } from '../util/interfaces';
import { Model } from './model';
import { StreamModel } from './model.stream';

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
        let res = true;
        this.currentStatus = this.isOnline();
        if (!checkList(this.connectionCallbacks, callback)) {
            this.connectionCallbacks.push(callback);
            res = await this.onEvent(async () => {
                if (this.isOnline() !== this.currentStatus) {
                    this.currentStatus = this.isOnline();
                    for (let i = 0; i < this.connectionCallbacks.length; i++) {
                        await this.connectionCallbacks[i](
                            this,
                            this.isOnline()
                        );
                    }
                }
            });
        }
        return res;
    }

    public async cancelOnConnectionChange(callback: ConnectionCallback) {
        Model.validateMethod(
            'ConnectionModel',
            'cancelOnConnectionChange',
            arguments
        );
        const index = checkListIndex(this.connectionCallbacks, callback);
        if (index > -1) {
            this.connectionCallbacks.splice(index, 1);
        }
    }
}
