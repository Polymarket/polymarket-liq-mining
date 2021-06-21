import { expect } from "chai";
import { fetchMagicAddress, getMagicLinkAddress } from "../src/magic";


describe('Proxy wallet to magic address tests', () => {

    it('Fetch magic address given proxy wallet address', async () => {
        const proxyAddress = "0x730ae359e9441f836022f7ec14b941fdc942a0fe";
        const expectedMagicAddress = "0xFFBbD14951a7b48CEFA73bccBf071d6A3D14EAa2";
        const magicLinkAddress = await fetchMagicAddress(proxyAddress);
        expect(magicLinkAddress).to.eq(expectedMagicAddress);
    })

    it('Get magic address from proxy wallet, without the cache', async () => {
        const proxyAddress = "0x730ae359e9441f836022f7ec14b941fdc942a0fe";
        const expectedMagicAddress = "0xFFBbD14951a7b48CEFA73bccBf071d6A3D14EAa2";
        
        const magicLinkAddress = await getMagicLinkAddress(proxyAddress);
        
        expect(magicLinkAddress).to.eq(expectedMagicAddress);
    })

})
