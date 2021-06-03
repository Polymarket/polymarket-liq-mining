import { expect } from "chai";
import * as fsReader from "fs";
import {describe, it } from "mocha";
import { generateVolumeSnapshot } from "../scripts/volume-snapshot";


async function getExpectedSnapshotBalances(filePath: string){
    const expectedBalances = JSON.parse(
        fsReader.readFileSync(filePath).toString());
    return expectedBalances;
}

describe('Testing snapshots', function() {

    it('Test volume snapshot using: 1609390800000(Dec 31 2020)', async () => {
        let args: {timestamp: number, supply: number, snapshotFilePath: string};
        args.timestamp = 1609390800000;
        args.supply = 1000000;
        args.snapshotFilePath = "./snapshots/tests/test-volume-weighted-";

        const snapshotBalances = await generateVolumeSnapshot(args);

        const expectedFilePath = `./snapshot-tests/expected/2020-eoy-volume-weighted-${args.timestamp}.json`;
        const expectedBalances = await getExpectedSnapshotBalances(expectedFilePath);

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