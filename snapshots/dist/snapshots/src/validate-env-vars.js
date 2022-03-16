"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnvVars = void 0;
async function validateEnvVars(checkArray) {
    for (const v of checkArray) {
        if (process.env[v] === null || process.env[v] === undefined || process.env[v] === "") {
            console.error(`Missing ENV VAR for ${v}. Set this in .env file before next run.`);
            return false;
        }
    }
    return true;
}
exports.validateEnvVars = validateEnvVars;
