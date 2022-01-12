import { IValueTemplate } from './interfaces';

export class ValueTemplate {
    template: IValueTemplate;

    static version = '0.0.1';
    static Number = new ValueTemplate({
        value_type: 'number',
        type: 'number',
        number: { min: 0, max: 255, step: 1 },
    });
    static String = new ValueTemplate({
        value_type: 'string',
        type: 'string',
        string: { max: 100 },
    });

    private constructor(template: IValueTemplate) {
        this.template = template;
    }
}
