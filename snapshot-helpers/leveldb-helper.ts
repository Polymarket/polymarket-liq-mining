import level from "level";


export const USERS_LEVEL_DB = "user-db";

export async function getOrCreateUsersDb(): Promise<any> {
    const db = await level(USERS_LEVEL_DB);
    return db;
}