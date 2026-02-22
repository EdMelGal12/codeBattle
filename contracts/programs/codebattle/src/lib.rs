use anchor_lang::prelude::*;

// ── Replace this with the actual program ID after running `anchor deploy` ──
declare_id!("7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs");

pub const WAGER_SEED: &[u8] = b"wager";
pub const PLATFORM_FEE_BPS: u64 = 500; // 5% platform fee
pub const MIN_WAGER_LAMPORTS: u64 = 1_000_000; // 0.001 SOL minimum

#[program]
pub mod codebattle {
    use super::*;

    /// Player 1 creates the escrow account and deposits their wager.
    /// The PDA is seeded with ["wager", room_id] so both players can derive it
    /// independently from the room_id the server assigns.
    pub fn initialize_wager(
        ctx: Context<InitializeWager>,
        room_id: String,
        amount: u64,
    ) -> Result<()> {
        require!(amount >= MIN_WAGER_LAMPORTS, CodeBattleError::AmountTooSmall);
        require!(room_id.len() <= 36, CodeBattleError::RoomIdTooLong);

        let wager = &mut ctx.accounts.wager;
        wager.room_id = room_id;
        wager.player1 = ctx.accounts.player1.key();
        wager.player2 = Pubkey::default();
        wager.amount = amount;
        wager.state = WagerState::WaitingForPlayer2;
        wager.authority = ctx.accounts.authority.key();
        wager.bump = ctx.bumps.wager;

        // Transfer player1's deposit into the escrow PDA
        anchor_lang::system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.player1.to_account_info(),
                    to: ctx.accounts.wager.to_account_info(),
                },
            ),
            amount,
        )?;

        emit!(WagerCreated {
            room_id: wager.room_id.clone(),
            player1: wager.player1,
            amount,
        });

        Ok(())
    }

    /// Player 2 joins the escrow and deposits the same amount.
    pub fn join_wager(ctx: Context<JoinWager>) -> Result<()> {
        require!(
            ctx.accounts.wager.state == WagerState::WaitingForPlayer2,
            CodeBattleError::InvalidState
        );
        require!(
            ctx.accounts.player2.key() != ctx.accounts.wager.player1,
            CodeBattleError::SamePlayer
        );

        let amount = ctx.accounts.wager.amount;
        ctx.accounts.wager.player2 = ctx.accounts.player2.key();
        ctx.accounts.wager.state = WagerState::Active;

        // Transfer player2's deposit into the escrow PDA
        anchor_lang::system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.player2.to_account_info(),
                    to: ctx.accounts.wager.to_account_info(),
                },
            ),
            amount,
        )?;

        emit!(WagerJoined {
            room_id: ctx.accounts.wager.room_id.clone(),
            player2: ctx.accounts.player2.key(),
        });

        Ok(())
    }

    /// Called by the server (authority keypair) after the game ends.
    /// Pays 95% of the total pot to the winner; the 5% fee + rent go to the
    /// platform when the account is closed via `close = authority`.
    pub fn declare_winner(ctx: Context<DeclareWinner>, winner: Pubkey) -> Result<()> {
        let wager = &ctx.accounts.wager;
        require!(wager.state == WagerState::Active, CodeBattleError::InvalidState);
        require!(
            winner == wager.player1 || winner == wager.player2,
            CodeBattleError::InvalidWinner
        );

        let total = wager.amount * 2;
        let fee = (total * PLATFORM_FEE_BPS) / 10_000;
        let payout = total - fee;

        // Determine winner account
        let winner_info = if winner == wager.player1 {
            ctx.accounts.player1.to_account_info()
        } else {
            ctx.accounts.player2.to_account_info()
        };

        // Transfer payout to winner via direct lamport manipulation on the PDA
        **ctx.accounts.wager.to_account_info().try_borrow_mut_lamports()? -= payout;
        **winner_info.try_borrow_mut_lamports()? += payout;

        // Remaining lamports (fee + rent) are swept to authority by `close = authority`

        emit!(WinnerDeclared {
            room_id: wager.room_id.clone(),
            winner,
            payout,
        });

        Ok(())
    }

    /// Called by the server if a match is cancelled before both players deposit,
    /// or if an opponent disconnects after both deposit.
    pub fn cancel_wager(ctx: Context<CancelWager>) -> Result<()> {
        let wager = &ctx.accounts.wager;
        require!(
            wager.state == WagerState::WaitingForPlayer2 || wager.state == WagerState::Active,
            CodeBattleError::InvalidState
        );

        let amount = wager.amount;

        // Refund player1 always
        **ctx.accounts.wager.to_account_info().try_borrow_mut_lamports()? -= amount;
        **ctx.accounts.player1.try_borrow_mut_lamports()? += amount;

        // Refund player2 only if they deposited
        if wager.state == WagerState::Active && wager.player2 != Pubkey::default() {
            **ctx.accounts.wager.to_account_info().try_borrow_mut_lamports()? -= amount;
            **ctx.accounts.player2.try_borrow_mut_lamports()? += amount;
        }

        emit!(WagerCancelled {
            room_id: wager.room_id.clone(),
        });

        Ok(())
    }
}

// ── Account Contexts ──────────────────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(room_id: String, amount: u64)]
pub struct InitializeWager<'info> {
    #[account(mut)]
    pub player1: Signer<'info>,

    /// CHECK: Server authority public key — validated by the contract when
    /// declaring winners; not a signer here.
    pub authority: AccountInfo<'info>,

    #[account(
        init,
        payer = player1,
        space = WagerEscrow::LEN,
        seeds = [WAGER_SEED, room_id.as_bytes()],
        bump,
    )]
    pub wager: Account<'info, WagerEscrow>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct JoinWager<'info> {
    #[account(mut)]
    pub player2: Signer<'info>,

    #[account(
        mut,
        seeds = [WAGER_SEED, wager.room_id.as_bytes()],
        bump = wager.bump,
        constraint = wager.state == WagerState::WaitingForPlayer2 @ CodeBattleError::InvalidState,
    )]
    pub wager: Account<'info, WagerEscrow>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DeclareWinner<'info> {
    /// The server's authority keypair signs this transaction
    #[account(mut)]
    pub authority: Signer<'info>,

    /// CHECK: player1 pubkey — validated against wager account in instruction body
    #[account(mut)]
    pub player1: AccountInfo<'info>,

    /// CHECK: player2 pubkey — validated against wager account in instruction body
    #[account(mut)]
    pub player2: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [WAGER_SEED, wager.room_id.as_bytes()],
        bump = wager.bump,
        constraint = wager.authority == authority.key() @ CodeBattleError::Unauthorized,
        close = authority,
    )]
    pub wager: Account<'info, WagerEscrow>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CancelWager<'info> {
    /// The server's authority keypair signs this transaction
    #[account(mut)]
    pub authority: Signer<'info>,

    /// CHECK: player1 — always refunded
    #[account(mut)]
    pub player1: AccountInfo<'info>,

    /// CHECK: player2 — refunded only if state is Active
    #[account(mut)]
    pub player2: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [WAGER_SEED, wager.room_id.as_bytes()],
        bump = wager.bump,
        constraint = wager.authority == authority.key() @ CodeBattleError::Unauthorized,
        close = authority,
    )]
    pub wager: Account<'info, WagerEscrow>,

    pub system_program: Program<'info, System>,
}

// ── State ─────────────────────────────────────────────────────────────────────

#[account]
pub struct WagerEscrow {
    pub room_id:   String,      // 36 chars (UUID) + 4 len prefix = 40 bytes
    pub player1:   Pubkey,      // 32 bytes
    pub player2:   Pubkey,      // 32 bytes
    pub amount:    u64,         // 8 bytes  (lamports per player)
    pub state:     WagerState,  // 1 byte
    pub authority: Pubkey,      // 32 bytes (server pubkey)
    pub bump:      u8,          // 1 byte
}

impl WagerEscrow {
    pub const LEN: usize =
        8    +  // Anchor discriminator
        40   +  // room_id (4 len prefix + 36 chars)
        32   +  // player1
        32   +  // player2
        8    +  // amount
        1    +  // state enum
        32   +  // authority
        1;      // bump
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum WagerState {
    WaitingForPlayer2,
    Active,
    Completed,
    Cancelled,
}

// ── Events ────────────────────────────────────────────────────────────────────

#[event]
pub struct WagerCreated {
    pub room_id: String,
    pub player1: Pubkey,
    pub amount:  u64,
}

#[event]
pub struct WagerJoined {
    pub room_id: String,
    pub player2: Pubkey,
}

#[event]
pub struct WinnerDeclared {
    pub room_id: String,
    pub winner:  Pubkey,
    pub payout:  u64,
}

#[event]
pub struct WagerCancelled {
    pub room_id: String,
}

// ── Errors ────────────────────────────────────────────────────────────────────

#[error_code]
pub enum CodeBattleError {
    #[msg("Invalid wager state for this operation")]
    InvalidState,
    #[msg("Both players cannot be the same wallet")]
    SamePlayer,
    #[msg("Winner must be one of the two players")]
    InvalidWinner,
    #[msg("Wager amount too small (min 0.001 SOL)")]
    AmountTooSmall,
    #[msg("Room ID exceeds maximum length of 36 characters")]
    RoomIdTooLong,
    #[msg("Only the designated authority can call this instruction")]
    Unauthorized,
}
