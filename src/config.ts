import wappsto from './axios_wrapper';
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

        this.data = new Data(undefined, name + '_config');
    }

    get_id = async () => {
        if (this.id !== '') {
            return this.id;
        }
        if (this.id_fetched) {
            return this.id;
        }
        this.id_fetched = true;
        await wappsto
            .get('/2.1/user/me')
            .then((response) => {
                this.id = response.data.meta.id + '_' + this.name;
                this.data.data_meta.id = this.id;
                this.data.meta.redirect = this.id;
            })
            .catch(() => {
                this.id_fetched = false;
            });
        return this.id;
    };

    get_data = async () => {
        if (this.data.meta.id) {
            return this.data;
        }
        if (this.data_fetched || this.id !== '') {
            return this.data;
        }
        this.data_fetched = true;
        var self = this;
        await wappsto
            .get('/2.0/data/' + this.id)
            .then((response) => {
                if (response.data.meta.type === 'attributelist') {
                    self.create_data();
                } else {
                    self.created = true;
                    self.data = response.data;
                }
            })
            .catch(() => {
                self.create_data();
            });
        return this.data;
    };

    create_data = async () => {
        if (!this.id) {
            await this.get_id();
        }
        var self = this;
        wappsto
            .post('/2.0/data', this.data)
            .then((response) => {
                self.created = true;
                self.data = response.data;
            })
            .catch(() => {
                this.data_fetched = false;
            });
        return this.data;
    };

    patch = async (body: any) => {
        if (this.created) {
            var self = this;
            wappsto.patch('/2.0/data/' + this.id, body).then((response) => {
                self.data = response.data;
            });
        }
    };

    patch_data = async (path: string, value: string) => {
        let arrPath = path.split('.');
        var data = this.data;
        arrPath.forEach(function (p) {
            if (p !== arrPath[arrPath.length - 1]) {
                if (!data.data[p]) {
                    data.data[p] = {};
                }
                data = data[p];
            } else {
                data[p] = value;
            }
        });
        if (this.created) {
            wappsto.put('/2.0/data/' + this.id, this.data);
        } else {
            this.create_data();
        }
    };

    reset_data(): void {
        var self = this;
        this.data = new Data(this.id, this.name + '_config');
        if (this.created) {
            wappsto
                .put('/2.0/data/' + this.id, this.data.toJSON())
                .then((response) => {
                    self.data = response.data;
                });
        } else {
            this.create_data();
        }
    }
}
