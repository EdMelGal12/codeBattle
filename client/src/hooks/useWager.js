import { useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, TransactionInstruction, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import IDL from '../idl/codebattle.json';

const PROGRAM_ID = new PublicKey(IDL.metadata.address);
const WAGER_SEED = Buffer.from('wager');

export function useWager() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const getProgram = useCallback(() => {
    if (!wallet.publicKey || !wallet.signTransaction) return null;
    const provider = new AnchorProvider(
      connection,
      { publicKey: wallet.publicKey, signTransaction: wallet.signTransaction, signAllTransactions: wallet.signAllTransactions },
      { commitment: 'confirmed' }
    );
    return new Program(IDL, provider);
  }, [connection, wallet]);

  const getEscrowPda = useCallback(async (roomId) => {
    const [pda] = await PublicKey.findProgramAddress(
      [WAGER_SEED, Buffer.from(roomId)],
      PROGRAM_ID
    );
    return pda;
  }, []);

  /**
   * Player 1: Create escrow and deposit.
   * @param {string} roomId - UUID from server
   * @param {number} amount - lamports
   * @param {string} serverPubkey - server authority public key
   */
  const initializeWager = useCallback(async (roomId, amount, serverPubkey) => {
    const program = getProgram();
    if (!program) throw new Error('Wallet not connected');

    const escrowPda = await getEscrowPda(roomId);

    const tx = await program.methods
      .initializeWager(roomId, new BN(amount))
      .accounts({
        player1:       wallet.publicKey,
        authority:     new PublicKey(serverPubkey),
        wager:         escrowPda,
        systemProgram: SystemProgram.programId,
      })
      .transaction();

    tx.feePayer = wallet.publicKey;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    const signed = await wallet.signTransaction(tx);
    const sig = await connection.sendRawTransaction(signed.serialize());
    await connection.confirmTransaction(sig, 'confirmed');
    return sig;
  }, [getProgram, getEscrowPda, wallet, connection]);

  /**
   * Player 2: Join existing escrow and deposit.
   * @param {string} roomId - UUID from server
   * @param {number} amount - lamports (must match player1's amount)
   */
  const joinWager = useCallback(async (roomId, amount) => {
    const program = getProgram();
    if (!program) throw new Error('Wallet not connected');

    const escrowPda = await getEscrowPda(roomId);

    const tx = await program.methods
      .joinWager()
      .accounts({
        player2:       wallet.publicKey,
        wager:         escrowPda,
        systemProgram: SystemProgram.programId,
      })
      .transaction();

    tx.feePayer = wallet.publicKey;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    const signed = await wallet.signTransaction(tx);
    const sig = await connection.sendRawTransaction(signed.serialize());
    await connection.confirmTransaction(sig, 'confirmed');
    return sig;
  }, [getProgram, getEscrowPda, wallet, connection]);

  return {
    initializeWager,
    joinWager,
    getEscrowPda,
    walletPubkey: wallet.publicKey?.toBase58() ?? null,
    connected: !!wallet.publicKey,
  };
}
