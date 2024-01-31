import { User } from '../models/user';
import wappsto from '../util/http_wrapper';

export default async function getWappVersion(): Promise<string> {
    const me = await User.me();
    if (me?.installation) {
        const rsp = await wappsto.get(`/2.1/installation/${me.installation}`);

        return rsp.data.version_app || '1.0.0';
    }

    return '1.0.0';
}
