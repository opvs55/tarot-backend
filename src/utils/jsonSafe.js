export const jsonSafe = (data) => JSON.parse(JSON.stringify(data ?? null));
