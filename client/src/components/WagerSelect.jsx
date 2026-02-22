import { useWallet } from '@solana/wallet-adapter-react';

const TIERS = [
  { label: 'FREE',     amount: 0,           display: 'FREE' },
  { label: '0.01 SOL', amount: 10_000_000,  display: '0.01 SOL' },
  { label: '0.05 SOL', amount: 50_000_000,  display: '0.05 SOL' },
  { label: '0.1 SOL',  amount: 100_000_000, display: '0.1  SOL' },
];

export default function WagerSelect({ selected, onChange }) {
  const { publicKey, connect, disconnect, wallet, select, wallets } = useWallet();

  const handleWalletToggle = async () => {
    if (publicKey) {
      await disconnect();
    } else {
      // Auto-select Phantom if available, otherwise prompt
      const phantom = wallets.find((w) => w.adapter.name === 'Phantom');
      if (phantom) {
        select(phantom.adapter.name);
        try { await connect(); } catch {}
      }
    }
  };

  const shortKey = publicKey
    ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
    : null;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[7px] text-gray-600 pixel-shadow">&gt; WAGER MODE</p>
      <hr className="term-divider" />

      {/* Wallet connect */}
      <button
        type="button"
        onClick={handleWalletToggle}
        className={`pixel-btn text-[8px] py-2 px-3 w-full border ${
          publicKey ? 'border-green-900 text-green-500' : 'border-gray-700 text-gray-500'
        }`}
      >
        {publicKey ? `> WALLET: ${shortKey}` : '> CONNECT WALLET'}
      </button>

      {/* Tier selector */}
      <div className="grid grid-cols-2 gap-1">
        {TIERS.map((tier) => {
          const active = selected === tier.amount;
          const needsWallet = tier.amount > 0 && !publicKey;
          return (
            <button
              key={tier.amount}
              type="button"
              disabled={needsWallet}
              onClick={() => onChange(tier.amount)}
              className="pixel-btn text-[7px] py-2 px-2"
              style={{
                border: active ? '1px solid #cc2222' : '1px solid #2a2a2a',
                color:  active ? '#ff4444' : needsWallet ? '#333' : '#666',
                background: active ? '#0f0000' : '#0a0a0a',
              }}
            >
              {tier.display}
            </button>
          );
        })}
      </div>

      {selected > 0 && publicKey && (
        <p className="text-[7px] text-yellow-600 pixel-shadow leading-5">
          &gt; WAGER: {TIERS.find((t) => t.amount === selected)?.display} EACH<br />
          &gt; WIN: ~{(selected / 1e9 * 2 * 0.95).toFixed(3)} SOL (5% FEE)
        </p>
      )}
    </div>
  );
}
