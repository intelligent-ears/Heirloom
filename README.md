# 🏺 Heirloom

> *"Your legacy, forever on-chain."*

**Cross-chain inheritance protocol with cryptographic proof-of-life mechanisms.**

## 🎯 The Problem

$100B+ in cryptocurrency is estimated to be lost due to forgotten keys and sudden death. Traditional inheritance systems don't work for digital assets - lawyers can't access private keys, courts can't decrypt wallets.

## 💡 The Solution

**Heirloom** automates digital asset inheritance through:

- **Proof-of-Life**: Periodic "heartbeat" transactions confirm you're still active
- **Grace Period**: Configurable delay (30-365 days) before settlement begins
- **Gradual Liquidation**: Market-safe distribution via Uniswap v4 hooks
- **ENS Identity**: Inherit by name, not address (grandfather.eth → grandson.eth)

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Heirloom Protocol                      │
├─────────────────┬─────────────────┬─────────────────────────┤
│   Sui Network   │   Ethereum L1   │       Frontend          │
├─────────────────┼─────────────────┼─────────────────────────┤
│ • LegacyVault   │ • Liquidation   │ • React + Vite          │
│ • Heartbeat FSM │   Hook (v4)     │ • RainbowKit            │
│ • Guardians     │ • ENS Text      │ • Sui dApp Kit          │
│                 │   Records       │                         │
└─────────────────┴─────────────────┴─────────────────────────┘
```

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Run frontend
cd frontend && pnpm dev

# Build Sui contracts (requires Sui CLI)
cd contracts-sui && sui move build

# Build ETH contracts (requires Foundry)
cd contracts-eth && forge build
```

## 📁 Project Structure

```
heirloom/
├── frontend/           # React + Vite + RainbowKit
├── contracts-sui/      # Sui Move (LegacyVault)
├── contracts-eth/      # Solidity (Uniswap v4 hooks + ENS)
└── agent/              # Liquidation automation
```

## 🏆 HackMoney 2026 Tracks

| Track | Prize | Our Integration |
|-------|-------|-----------------|
| **Sui** | $10K | Core vault logic, heartbeat state machine |
| **Uniswap v4** | $10K | Gradual liquidation hooks |
| **ENS** | $5K | Heir resolution, text records |

## � License

MIT
