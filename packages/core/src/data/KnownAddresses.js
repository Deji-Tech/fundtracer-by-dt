/**
 * Known infrastructure addresses (Bridges, Exchanges, Mixers)
 * Used to identify terminals in funding trees and prevent false positives in risk scoring.
 */
// Map: ChainId -> Address (lowercase) -> Info
export const KNOWN_ADDRESSES = {
    'ethereum': {
        '0x00000000219ab540356cbb839cbe05303d7705fa': { name: 'Beacon Deposit Contract', type: 'contract' },
        '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': { name: 'WETH', type: 'contract' },
        '0x7a250d5630b4cf539739df2c5dacb4c659f2488d': { name: 'Uniswap V2 Router', type: 'contract', category: 'dex' },
        '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45': { name: 'Uniswap V3 Router', type: 'contract', category: 'dex' },
        '0x12b66ca9ebf262c5700486c8f6114e9d038759e4': { name: 'Tornado Cash Proxy', type: 'mixer' },
        // Exchanges (Hot Wallets - simplistic list)
        '0x28c6c06298d514db089934071355e5743bf21d60': { name: 'Binance 14', type: 'exchange', category: 'cex' },
        '0x21a31ee1afc51d94c2efccaa2092ad1028285549': { name: 'Binance 15', type: 'exchange', category: 'cex' },
        '0x71660c4005ba85c37ccec55d0c4493e66fe775d3': { name: 'Coinbase 1', type: 'exchange', category: 'cex' },
    },
    'linea': {
        // Bridges
        '0x2fc617e933a52713247ce25730f6695920b3befe': { name: 'Layerswap: Bridge', type: 'bridge' },
        '0x353012dc4a9a6cf55c941badc267f82004a8ceb9': { name: 'Linea: L2 Token Bridge', type: 'bridge' },
        '0x508ca82df566dcd1b0de8296e70a96332cd644ec': { name: 'Linea: L2 Message Service', type: 'bridge' },
        '0x508ca82df566dcd1b0de8296e70a96313eda5665': { name: 'Linea: Message Service (Old)', type: 'bridge' },
        '0xde94a613d2a01297e6878e1b65fd32f310d57106': { name: 'Linea: Official Bridge', type: 'bridge' },
        '0x41d3d33156ae7c62c094aae2995003ae63f587b3': { name: 'Orbiter Finance: Bridge', type: 'bridge' },
        '0x3bdb03ad7363152dfbc185ee23ebc93f0cf93fd2': { name: 'Orbiter Finance: Bridge 6', type: 'bridge' },
        '0x81f6138153d473e8c5ecebd3dc8cd4903506b075': { name: 'Stargate: Pool Native', type: 'bridge' },
        '0x7e63a5f1a8f0b4d0934b2f2327daed3f6bb2ee75': { name: 'Across: Linea SpokePool', type: 'bridge' },
        '0x1a44076050125825900e736c501f859c50fe728c': { name: 'LayerZero: EndpointV2', type: 'bridge' },
        '0x45a318273749d6eb00f5f6ca3bc7cd3de26d642a': { name: 'Owlto Finance: Bridge', type: 'bridge' },
        '0x549feb73f2348f6cd99b9fc8c69252034897f06c': { name: 'Chainlink: CCIP Router', type: 'bridge' },
        '0x1b0dc9cb7eadda36f4ccfb8130b0ad967b0a3508': { name: 'Everclear: Fee Adapter', type: 'bridge' },
        '0x1650683e50e075efc778be4d1a6be929f3831719': { name: 'Pheasant Network: Relayer', type: 'bridge' },
        '0x2796317b0ff8538f253012862c06787adfb8ceb6': { name: 'Synapse: Bridge', type: 'bridge' },
        // Exchanges
        '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be': { name: 'Binance: Hot Wallet', type: 'exchange', category: 'cex' },
        '0xd3d7dbe73bbdd5a5c7a49ca322763c4d400fc240': { name: 'OKX: Hot Wallet', type: 'exchange', category: 'cex' },
        '0x0ba37936c50bbcdc7130c67d931e5fe14285b8eb': { name: 'OKX: Hot Wallet 2', type: 'exchange', category: 'cex' },
        '0xf89d7b9c864f589bbf53a82105107622b35eaa40': { name: 'Bybit: Hot Wallet', type: 'exchange', category: 'cex' },
        '0xc882b111a75c0c657fc507c04fbfcd2cc984f071': { name: 'Gate.io: Hot Wallet', type: 'exchange', category: 'cex' },
        '0x4b68038e910941b7438e70a3943dcc4fd543715c': { name: 'MEXC: Hot Wallet', type: 'exchange', category: 'cex' },
        '0x2b5634c42055806a59e9107ed44d43c426e58258': { name: 'KuCoin: Hot Wallet', type: 'exchange', category: 'cex' },
        '0xe80623a9d41f2f05780d9cd9cea0f797fd53062a': { name: 'Bitget: Hot Wallet', type: 'exchange', category: 'cex' },
    },
    'arbitrum': {
        '0x0000000000000000000000000000000000000064': { name: 'ArbSys', type: 'contract' },
    }
};
/**
 * Check if an address is a known infrastructure address
 */
export function getAddressInfo(address, chainId) {
    const chainAddresses = KNOWN_ADDRESSES[chainId];
    if (!chainAddresses)
        return null;
    return chainAddresses[address.toLowerCase()] || null;
}
