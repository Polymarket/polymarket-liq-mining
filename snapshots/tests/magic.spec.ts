import { expect } from "chai";
import { fetchMagicAddress } from "../src/magic";


describe.skip('Proxy wallet to magic address tests', () => {

    it('Fetch magic address given proxy wallet address', async () => {
        const proxyAddress = "0x730ae359e9441f836022f7ec14b941fdc942a0fe";
        const expectedMagicAddress = "0xFFBbD14951a7b48CEFA73bccBf071d6A3D14EAa2";
        const magicLinkAddress = await fetchMagicAddress(proxyAddress);
        expect(magicLinkAddress).to.eq(expectedMagicAddress);
    })

})
