export function isUUID(data: string) {
    const reg =
        /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-b8-9][a-f0-9]{3}-[a-f0-9]{12}$/i;
    return reg.test(data);
}
