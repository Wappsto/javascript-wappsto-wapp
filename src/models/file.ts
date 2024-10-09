import { findModel } from '../util/modelStore';
import { IFile, ValidateParams } from '../util/types';
import { Model } from './model';
import { StreamModel } from './model.stream';

export class File extends StreamModel implements IFile {
    static endpoint = '/2.1/file';
    static attributes = ['name', 'type', 'size', 'published'];
    name = '';
    type;
    size = 0;
    published = false;

    constructor(name?: string, type?: string) {
        super('file');
        Model.validateMethod('File', 'constructor', arguments);
        this.name = name || '';
        this.type = type;
    }

    getAttributes(): string[] {
        return File.attributes;
    }

    getUrl(): string {
        if (this.meta.id) {
            return `${super.getUrl()}/document`;
        }
        return super.getUrl();
    }

    static #validate(name: string, params: ValidateParams): void {
        Model.validateMethod('File', name, params);
    }

    static fetchById = async (id: string) => {
        File.#validate('fetchById', [id]);
        const model = findModel('file', id);
        if (model) {
            return model as File;
        }

        const data = await Model.fetch({
            endpoint: `${File.endpoint}/${id}/document`,
        });
        const res = File.fromArray(data);
        if (res[0]) {
            return res[0] as File;
        }
        return undefined;
    };

    static fetch = async () => {
        const params = { expand: 0 };
        const url = File.endpoint;

        const data = await Model.fetch({ endpoint: url, params });
        return File.fromArray(data) as File[];
    };
}
