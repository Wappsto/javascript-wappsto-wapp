import { Data } from './models/data';

export class Config {
    name = '';
    id = '';
    data: Data;
    created = false;
    id_fetched = false;
    data_fetched = false;

    constructor(name: string) {
        this.name = name;
        this.data = new Data();
        /*
        Data.findById(name + '_config').then((data) => {

        });
        this.data = new Data(name + '_config', 'wapp_config');
        this.data.refresh().then((response) => {
            if (response.data === {}) {
                this.data.create();
            }
        });*/
    }
    /*
    public set = async (name: string, item: any): Promise<void> => {
        this.data.set(name, item);
        this.data.update();
    };

    public get = async (name: string): Promise<any> => {
        return new Promise<any>(async (response) => {
            if (this.data.meta.id) {
                await this.data.refresh();
            }
            resolve(this.data.get(name));
        });
    };

    reset_data(): void {
        this.data = new Data(this.id, this.name + '_config');
        if (this.created) {
            this.data.update();
        } else {
            this.create_data();
        }
    }*/
}
