# FundTracer CLI

Command-line interface for blockchain wallet forensics and analysis.

## Installation

```bash
# Clone the repository
git clone https://github.com/Deji-Tech/fundtracer-by-dt.git
cd fundtracer-by-dt

# Install dependencies
npm install

# Build the CLI
npm run build --workspace=@fundtracer/cli

# Link globally (optional)
npm link --workspace=@fundtracer/cli
```

## Configuration

Before using the CLI, set your Etherscan API key:

```bash
# Set your API key
fundtracer config --set-key YOUR_ETHERSCAN_API_KEY

# Verify configuration
fundtracer config --show
```

Get your free API key at: https://etherscan.io/apis

## Usage

### Analyze a Single Wallet

```bash
# Basic analysis
fundtracer analyze 0x742d35Cc6634C0532925a3b844Bc9e7595f8fC71

# Specify chain
fundtracer analyze 0x742d35Cc6634C0532925a3b844Bc9e7595f8fC71 --chain ethereum

# Set analysis depth (1-5)
fundtracer analyze 0x742d35Cc6634C0532925a3b844Bc9e7595f8fC71 --depth 3

# Output as JSON
fundtracer analyze 0x742d35Cc6634C0532925a3b844Bc9e7595f8fC71 --json
```

### Compare Multiple Wallets (Sybil Detection)

```bash
# Compare 2+ wallets for shared funding patterns
fundtracer compare 0xAddress1 0xAddress2 0xAddress3

# Output detailed report
fundtracer compare wallet1.txt --file --detailed
```

### Interactive Mode

```bash
# Start interactive shell
fundtracer interactive

# Commands in interactive mode:
> analyze 0x...
> compare 0x... 0x...
> chain ethereum
> depth 3
> exit
```

## Supported Chains

| Chain     | Flag        | Status     |
|-----------|-------------|------------|
| Ethereum  | `ethereum`  | Supported  |
| Linea     | `linea`     | Supported  |
| Arbitrum  | `arbitrum`  | Supported  |
| Base      | `base`      | Supported  |
| Optimism  | `optimism`  | Coming Soon|
| Polygon   | `polygon`   | Coming Soon|

## Output Examples

### Risk Assessment
```
WALLET ANALYSIS: 0x742d35Cc6634C0532925a3b844Bc9e7595f8fC71
Chain: Ethereum

Risk Score: 72/100 [HIGH]

Suspicious Indicators:
  [!] Rapid fund movement detected (5 instances)
  [!] Same-block transactions in 3 blocks
  [!] Circular flow with 4 addresses

Funding Sources:
  └── 0xabc... (Binance Hot Wallet) - 2.5 ETH
      └── 0xdef... (Unknown) - 1.0 ETH
```

### Sybil Comparison
```
MULTI-WALLET COMPARISON
Analyzing 3 wallets...

Shared Funding Sources: 2
  - 0xSharedSource1... funded all 3 wallets
  - 0xSharedSource2... funded 2/3 wallets

Sybil Probability: HIGH (89%)
Pattern: All wallets received funds within 24h from same source
```

## Troubleshooting

### Rate Limiting
If you see rate limit errors, the CLI will automatically retry with exponential backoff. For heavy usage, consider upgrading your Etherscan API plan.

### Invalid Address
Ensure addresses are valid 42-character Ethereum addresses starting with `0x`.

## License

MIT License - Built by DT Development
