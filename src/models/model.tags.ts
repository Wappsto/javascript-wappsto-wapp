import { OntologyModel } from './model.ontology';

export class TagsModel extends OntologyModel {
    addTag = async (tag: string) => {
        this.meta.tag_by_user = [...(this.meta.tag_by_user ?? []), tag];
        return this.update();
    };

    removeTag = async (tag: string) => {
        this.meta.tag_by_user = this.meta.tag_by_user?.filter((t) => t !== tag);
        if (this.meta.tag_by_user !== undefined) {
            return this.update();
        }
    };

    getTags = () => {
        return this.meta.tag_by_user ?? [];
    };

    clearTags = async () => {
        this.meta.tag_by_user = [];
        return this.update();
    };
}
