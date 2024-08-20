import { User } from '../models/user';
import wappsto from '../util/http_wrapper';

/**
 * Retrieves the version of the installed application.
 *
 * @return The version of the installed application. If the installation information is not available,
 *         the default version '1.0.0' is returned.
 */
export default async function getWappVersion(): Promise<string> {
    const me = await User.me();
    if (me?.installation) {
        const rsp = await wappsto.get(`/2.1/installation/${me.installation}`);

        return rsp.data.version_app || '1.0.0';
    }

    return '1.0.0';
}
