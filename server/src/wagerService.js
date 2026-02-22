/**
 * wagerService.js
 * Server-side Solana interactions for the wager escrow program.
 * Uses @solana/web3.js directly (CJS compatible) with manual Anchor
 * instruction encoding to avoid ESM dependency issues.
 */

const {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  sendAndConfirmTransaction,
} = require('@solana/web3.js');
const crypto = require('crypto');

// ── Config ────────────────────────────────────────────────────────────────────

const PROGRAM_ID = new PublicKey(
  process.env.CODEBATTLE_PROGRAM_ID || '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs'
);
const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';

let connection = null;
let serverKeypair = null;

function getConnection() {
  if (!connection) connection = new Connection(RPC_URL, 'confirmed');
  return connection;
}

function getServerKeypair() {
  if (serverKeypair) return serverKeypair;
  const raw = process.env.SOLANA_SERVER_KEYPAIR;
  if (!raw) {
    console.warn('[Wager] SOLANA_SERVER_KEYPAIR not set — wager payouts disabled');
    return null;
  }
  try {
    const bytes = Uint8Array.from(JSON.parse(raw));
    serverKeypair = Keypair.fromSecretKey(bytes);
    console.log(`[Wager] Server authority: ${serverKeypair.publicKey.toBase58()}`);
    return serverKeypair;
  } catch (e) {
    console.error('[Wager] Failed to parse SOLANA_SERVER_KEYPAIR:', e.message);
    return null;
  }
}

// ── Anchor discriminant helper ────────────────────────────────────────────────
// Anchor discriminants are the first 8 bytes of SHA-256("global:<ix_name>")

function discriminant(ixName) {
  return Buffer.from(
    crypto.createHash('sha256').update(`global:${ixName}`).digest()
  ).slice(0, 8);
}

const DISC = {
  declare_winner: discriminant('declare_winner'),
  cancel_wager:   discriminant('cancel_wager'),
};

// ── PDA helper ────────────────────────────────────────────────────────────────

async function getEscrowPda(roomId) {
  const [pda] = await PublicKey.findProgramAddress(
    [Buffer.from('wager'), Buffer.from(roomId)],
    PROGRAM_ID
  );
  return pda;
}

// ── Instruction builders ──────────────────────────────────────────────────────

/**
 * Build the `declare_winner` instruction data.
 * Layout: [8-byte discriminant | 32-byte winner pubkey]
 */
function buildDeclareWinnerData(winnerPubkey) {
  const data = Buffer.alloc(8 + 32);
  DISC.declare_winner.copy(data, 0);
  new PublicKey(winnerPubkey).toBuffer().copy(data, 8);
  return data;
}

/**
 * Build the `cancel_wager` instruction data.
 * Layout: [8-byte discriminant]
 */
function buildCancelWagerData() {
  return Buffer.from(DISC.cancel_wager);
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Called after game_over: transfers pot to winner, closes escrow.
 */
async function declareWinner(roomId, winnerPubkey, player1Pubkey, player2Pubkey) {
  const kp = getServerKeypair();
  if (!kp) return null;

  const conn    = getConnection();
  const escrow  = await getEscrowPda(roomId);
  const winner  = new PublicKey(winnerPubkey);
  const p1      = new PublicKey(player1Pubkey);
  const p2      = new PublicKey(player2Pubkey);

  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: kp.publicKey, isSigner: true,  isWritable: true  }, // authority
      { pubkey: p1,           isSigner: false, isWritable: true  }, // player1
      { pubkey: p2,           isSigner: false, isWritable: true  }, // player2
      { pubkey: escrow,       isSigner: false, isWritable: true  }, // wager PDA
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: buildDeclareWinnerData(winner),
  });

  const tx = new Transaction().add(ix);
  try {
    const sig = await sendAndConfirmTransaction(conn, tx, [kp]);
    console.log(`[Wager] declare_winner tx: ${sig}`);
    return sig;
  } catch (e) {
    console.error('[Wager] declare_winner failed:', e.message);
    return null;
  }
}

/**
 * Called on disconnect or wager timeout: refunds both players.
 */
async function cancelWager(roomId, player1Pubkey, player2Pubkey) {
  const kp = getServerKeypair();
  if (!kp) return null;

  const conn   = getConnection();
  const escrow = await getEscrowPda(roomId);
  const p1     = new PublicKey(player1Pubkey);
  const p2     = player2Pubkey
    ? new PublicKey(player2Pubkey)
    : SystemProgram.programId; // fallback if p2 never deposited

  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: kp.publicKey, isSigner: true,  isWritable: true  },
      { pubkey: p1,           isSigner: false, isWritable: true  },
      { pubkey: p2,           isSigner: false, isWritable: true  },
      { pubkey: escrow,       isSigner: false, isWritable: true  },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: buildCancelWagerData(),
  });

  const tx = new Transaction().add(ix);
  try {
    const sig = await sendAndConfirmTransaction(conn, tx, [kp]);
    console.log(`[Wager] cancel_wager tx: ${sig}`);
    return sig;
  } catch (e) {
    console.error('[Wager] cancel_wager failed:', e.message);
    return null;
  }
}

/**
 * Verify a deposit transaction is confirmed on-chain.
 * Returns true if the signature is confirmed.
 */
async function verifyDeposit(signature) {
  try {
    const conn   = getConnection();
    const status = await conn.getSignatureStatus(signature);
    return (
      status?.value?.confirmationStatus === 'confirmed' ||
      status?.value?.confirmationStatus === 'finalized'
    );
  } catch {
    return false;
  }
}

module.exports = {
  getEscrowPda,
  declareWinner,
  cancelWager,
  verifyDeposit,
  getServerKeypair,
  PROGRAM_ID,
};
