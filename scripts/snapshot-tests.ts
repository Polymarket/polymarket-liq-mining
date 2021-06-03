import { expect } from "chai";
import fs from "fs";
import {describe, it } from "mocha";
import { generateVolumeSnapshot } from "./volume-snapshot";


async function getExpectedSnapshotBalances(filePath: string){
    const expectedBalances = JSON.parse(
        fs.readFileSync(filePath).toString());
    return expectedBalances;
}

describe('Testing snapshots', function() {

    it('Test volume snapshot using timestamp: 1622650767029', async function() {
        let args: {timestamp: number, supply: number, snapshotFilePath: string};
        args.timestamp = 1622650767029;
        args.supply = 1000000;
        args.snapshotFilePath = "./snapshots/tests/test-volume-weighted-";

        const snapshotBalances = await generateVolumeSnapshot(args);

        const expectedFilePath = `./snapshots/tests/volume-weighted-${args.timestamp}.json`;
        const expectedBalances = await getExpectedSnapshotBalances(expectedFilePath);

        expect(snapshotBalances.length).to.eq(expectedBalances.length);
        
        //users to verify 
        const users: string[] = expectedBalances.map(el => el.proxyWallet);
        for(const user of users){
            const actual = snapshotBalances[user];
            const expected = expectedBalances[user];
            expect(actual.proxyWallet).to.eq(expected.proxyWallet);
            expect(actual.magicWallet).to.eq(expected.magicWallet);
            expect(actual.amount).to.eq(expected.amount);
        }
    });
});
