import { expect } from "chai";
import { fetchEoaAddress, getEoaLinkAddress  } from "../src/magic";

describe('Proxy wallet to eoa wallet tests', () => {

    it('Fetch eoa address given proxy wallet address', async () => {
        const proxyAddress = "0x730ae359e9441f836022f7ec14b941fdc942a0fe";
        const expectedMagicAddress = "0xFFBbD14951a7b48CEFA73bccBf071d6A3D14EAa2";
        const magicLinkAddress = await fetchEoaAddress(proxyAddress);
        expect(magicLinkAddress).to.eq(expectedMagicAddress);
    })

    it('Get eoa address from proxy wallet, without the cache', async () => {
        const proxyAddress = "0x730ae359e9441f836022f7ec14b941fdc942a0fe";
        const expectedMagicAddress = "0xFFBbD14951a7b48CEFA73bccBf071d6A3D14EAa2";
        const magicLinkAddress = await getEoaLinkAddress(proxyAddress);
        expect(magicLinkAddress).to.eq(expectedMagicAddress);
    })
})
