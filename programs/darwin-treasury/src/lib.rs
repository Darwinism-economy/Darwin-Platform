use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use anchor_spl::associated_token::AssociatedToken;

declare_id!("Treasury111111111111111111111111111111111111111");

#[program]
pub mod darwin_treasury {
    use super::*;

    pub fn initialize_treasury(
        ctx: Context<InitializeTreasury>,
        min_bid: u64,
        auction_timer_blocks: u64,
        min_holding_tokens: u64,
    ) -> Result<()> {
        require!(min_bid > 0, TreasuryError::InvalidMinBid);
        require!(auction_timer_blocks > 0, TreasuryError::InvalidTimer);
        require!(min_holding_tokens > 0, TreasuryError::InvalidMinHolding);

        let treasury = &mut ctx.accounts.treasury;
        treasury.authority = ctx.accounts.authority.key();
        treasury.token_mint = ctx.accounts.token_mint.key();
        treasury.min_bid = min_bid;
        treasury.auction_timer_blocks = auction_timer_blocks;
        treasury.min_holding_tokens = min_holding_tokens;
        treasury.fundraising_start_block = ctx.accounts.clock.slot;
        treasury.fundraising_end_block = treasury.fundraising_start_block + 200_000; // ~24 hours
        treasury.total_raised = 0;
        treasury.is_fundraising_active = true;
        treasury.is_auction_active = false;
        treasury.current_highest_bid = 0;
        treasury.current_highest_bidder = Pubkey::default();
        treasury.last_bid_block = 0;
        treasury.is_initialized = true;

        Ok(())
    }

    pub fn contribute_sol(
        ctx: Context<ContributeSol>,
        amount: u64,
    ) -> Result<()> {
        let treasury = &mut ctx.accounts.treasury;
        require!(treasury.is_initialized, TreasuryError::TreasuryNotInitialized);
        require!(treasury.is_fundraising_active, TreasuryError::FundraisingNotActive);
        require!(amount > 0, TreasuryError::InvalidAmount);

        // Check if fundraising period is still active
        let current_block = ctx.accounts.clock.slot;
        require!(current_block < treasury.fundraising_end_block, TreasuryError::FundraisingEnded);

        // Transfer SOL to treasury
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.contributor.key(),
            &treasury.key(),
            amount,
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.contributor.to_account_info(),
                ctx.accounts.treasury.to_account_info(),
            ],
        )?;

        // Update treasury state
        treasury.total_raised += amount;

        // Calculate token allocation based on bonding curve
        let tokens_allocated = calculate_token_allocation(amount, treasury.total_raised);
        
        // Transfer tokens to contributor
        let cpi_accounts = Transfer {
            from: ctx.accounts.treasury_token_account.to_account_info(),
            to: ctx.accounts.contributor_token_account.to_account_info(),
            authority: ctx.accounts.treasury.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(
            cpi_program,
            cpi_accounts,
            &[&[b"treasury", treasury.token_mint.as_ref(), &[ctx.bumps.treasury]]],
        );
        token::transfer(cpi_ctx, tokens_allocated)?;

        emit!(ContributionEvent {
            contributor: ctx.accounts.contributor.key(),
            amount,
            tokens_allocated,
            total_raised: treasury.total_raised,
        });

        Ok(())
    }

    pub fn start_auction(
        ctx: Context<StartAuction>,
    ) -> Result<()> {
        let treasury = &mut ctx.accounts.treasury;
        require!(treasury.is_initialized, TreasuryError::TreasuryNotInitialized);
        require!(treasury.is_fundraising_active, TreasuryError::FundraisingNotActive);

        let current_block = ctx.accounts.clock.slot;
        require!(current_block >= treasury.fundraising_end_block, TreasuryError::FundraisingNotEnded);

        // End fundraising
        treasury.is_fundraising_active = false;
        treasury.is_auction_active = true;
        treasury.auction_start_block = current_block;
        treasury.last_bid_block = current_block;

        // Create LP with 10% of SOL and 10% of tokens
        let lp_sol_amount = treasury.total_raised / 10;
        let lp_token_amount = treasury.total_raised / 10; // Simplified for demo

        // Transfer 3% to creator
        let creator_amount = treasury.total_raised * 3 / 100;
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &treasury.key(),
            &ctx.accounts.creator.key(),
            creator_amount,
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.treasury.to_account_info(),
                ctx.accounts.creator.to_account_info(),
            ],
        )?;

        emit!(AuctionStartedEvent {
            treasury: treasury.key(),
            total_raised: treasury.total_raised,
            lp_sol_amount,
            lp_token_amount,
            creator_amount,
        });

        Ok(())
    }

    pub fn place_bid(
        ctx: Context<PlaceBid>,
        bid_amount: u64,
    ) -> Result<()> {
        let treasury = &mut ctx.accounts.treasury;
        require!(treasury.is_initialized, TreasuryError::TreasuryNotInitialized);
        require!(treasury.is_auction_active, TreasuryError::AuctionNotActive);
        require!(bid_amount >= treasury.min_bid, TreasuryError::BidTooLow);
        require!(bid_amount > treasury.current_highest_bid, TreasuryError::BidNotHigher);

        let current_block = ctx.accounts.clock.slot;

        // Transfer SOL from bidder to treasury
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.bidder.key(),
            &treasury.key(),
            bid_amount,
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.bidder.to_account_info(),
                ctx.accounts.treasury.to_account_info(),
            ],
        )?;

        // Return previous highest bid to previous bidder
        if treasury.current_highest_bid > 0 {
            let ix = anchor_lang::solana_program::system_instruction::transfer(
                &treasury.key(),
                &treasury.current_highest_bidder,
                treasury.current_highest_bid,
            );
            anchor_lang::solana_program::program::invoke(
                &ix,
                &[
                    ctx.accounts.treasury.to_account_info(),
                    ctx.accounts.previous_bidder.to_account_info(),
                ],
            )?;
        }

        // Update treasury state
        treasury.current_highest_bid = bid_amount;
        treasury.current_highest_bidder = ctx.accounts.bidder.key();
        treasury.last_bid_block = current_block;

        emit!(BidPlacedEvent {
            bidder: ctx.accounts.bidder.key(),
            bid_amount,
            current_highest_bid: treasury.current_highest_bid,
            last_bid_block: treasury.last_bid_block,
        });

        Ok(())
    }

    pub fn finalize_auction(
        ctx: Context<FinalizeAuction>,
    ) -> Result<()> {
        let treasury = &mut ctx.accounts.treasury;
        require!(treasury.is_initialized, TreasuryError::TreasuryNotInitialized);
        require!(treasury.is_auction_active, TreasuryError::AuctionNotActive);

        let current_block = ctx.accounts.clock.slot;
        let blocks_since_last_bid = current_block - treasury.last_bid_block;

        require!(blocks_since_last_bid >= treasury.auction_timer_blocks, TreasuryError::AuctionNotExpired);

        // Check if there's a winner
        if treasury.current_highest_bid > 0 {
            // Transfer treasury to winner
            let treasury_balance = ctx.accounts.treasury.lamports();
            let ix = anchor_lang::solana_program::system_instruction::transfer(
                &treasury.key(),
                &treasury.current_highest_bidder,
                treasury_balance,
            );
            anchor_lang::solana_program::program::invoke(
                &ix,
                &[
                    ctx.accounts.treasury.to_account_info(),
                    ctx.accounts.winner.to_account_info(),
                ],
            )?;

            emit!(AuctionWonEvent {
                winner: treasury.current_highest_bidder,
                winning_bid: treasury.current_highest_bid,
                treasury_amount: treasury_balance,
            });
        } else {
            // No winner - distribute to token holders
            distribute_to_holders(ctx)?;

            emit!(AuctionNoWinnerEvent {
                treasury: treasury.key(),
                total_raised: treasury.total_raised,
            });
        }

        treasury.is_auction_active = false;

        Ok(())
    }

    fn calculate_token_allocation(sol_amount: u64, total_raised: u64) -> u64 {
        // Bonding curve: each additional SOL makes future contributions more expensive
        // For demo purposes, using a simple linear relationship
        let base_rate = 1000; // tokens per SOL
        let bonding_factor = (total_raised as f64 / 1000.0).min(10.0); // Max 10x increase
        let adjusted_rate = (base_rate as f64 * bonding_factor) as u64;
        
        sol_amount * adjusted_rate
    }

    fn distribute_to_holders(ctx: Context<FinalizeAuction>) -> Result<()> {
        // In a real implementation, this would:
        // 1. Query all token holders above minimum threshold
        // 2. Calculate proportional distribution
        // 3. Transfer SOL to each qualified holder
        
        // For demo purposes, just emit an event
        emit!(DistributionEvent {
            treasury: ctx.accounts.treasury.key(),
            total_distributed: ctx.accounts.treasury.lamports(),
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeTreasury<'info> {
    #[account(
        init,
        payer = authority,
        space = Treasury::LEN,
        seeds = [b"treasury", token_mint.key().as_ref()],
        bump
    )]
    pub treasury: Account<'info, Treasury>,
    
    pub token_mint: Account<'info, Mint>,
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
pub struct ContributeSol<'info> {
    #[account(
        seeds = [b"treasury", token_mint.key().as_ref()],
        bump,
        constraint = treasury.is_initialized
    )]
    pub treasury: Account<'info, Treasury>,
    
    pub token_mint: Account<'info, Mint>,
    #[account(mut)]
    pub treasury_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub contributor_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub contributor: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
pub struct StartAuction<'info> {
    #[account(
        mut,
        seeds = [b"treasury", token_mint.key().as_ref()],
        bump,
        constraint = treasury.is_initialized
    )]
    pub treasury: Account<'info, Treasury>,
    
    pub token_mint: Account<'info, Mint>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
pub struct PlaceBid<'info> {
    #[account(
        mut,
        seeds = [b"treasury", token_mint.key().as_ref()],
        bump,
        constraint = treasury.is_initialized
    )]
    pub treasury: Account<'info, Treasury>,
    
    pub token_mint: Account<'info, Mint>,
    #[account(mut)]
    pub bidder: Signer<'info>,
    #[account(mut)]
    pub previous_bidder: AccountInfo<'info>,
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
pub struct FinalizeAuction<'info> {
    #[account(
        mut,
        seeds = [b"treasury", token_mint.key().as_ref()],
        bump,
        constraint = treasury.is_initialized
    )]
    pub treasury: Account<'info, Treasury>,
    
    pub token_mint: Account<'info, Mint>,
    #[account(mut)]
    pub winner: AccountInfo<'info>,
    pub clock: Sysvar<'info, Clock>,
}

#[account]
pub struct Treasury {
    pub authority: Pubkey,
    pub token_mint: Pubkey,
    pub min_bid: u64,
    pub auction_timer_blocks: u64,
    pub min_holding_tokens: u64,
    pub fundraising_start_block: u64,
    pub fundraising_end_block: u64,
    pub total_raised: u64,
    pub is_fundraising_active: bool,
    pub is_auction_active: bool,
    pub current_highest_bid: u64,
    pub current_highest_bidder: Pubkey,
    pub last_bid_block: u64,
    pub auction_start_block: u64,
    pub is_initialized: bool,
}

impl Treasury {
    pub const LEN: usize = 8 + // discriminator
        32 + // authority
        32 + // token_mint
        8 + // min_bid
        8 + // auction_timer_blocks
        8 + // min_holding_tokens
        8 + // fundraising_start_block
        8 + // fundraising_end_block
        8 + // total_raised
        1 + // is_fundraising_active
        1 + // is_auction_active
        8 + // current_highest_bid
        32 + // current_highest_bidder
        8 + // last_bid_block
        8 + // auction_start_block
        1; // is_initialized
}

#[event]
pub struct ContributionEvent {
    pub contributor: Pubkey,
    pub amount: u64,
    pub tokens_allocated: u64,
    pub total_raised: u64,
}

#[event]
pub struct AuctionStartedEvent {
    pub treasury: Pubkey,
    pub total_raised: u64,
    pub lp_sol_amount: u64,
    pub lp_token_amount: u64,
    pub creator_amount: u64,
}

#[event]
pub struct BidPlacedEvent {
    pub bidder: Pubkey,
    pub bid_amount: u64,
    pub current_highest_bid: u64,
    pub last_bid_block: u64,
}

#[event]
pub struct AuctionWonEvent {
    pub winner: Pubkey,
    pub winning_bid: u64,
    pub treasury_amount: u64,
}

#[event]
pub struct AuctionNoWinnerEvent {
    pub treasury: Pubkey,
    pub total_raised: u64,
}

#[event]
pub struct DistributionEvent {
    pub treasury: Pubkey,
    pub total_distributed: u64,
}

#[error_code]
pub enum TreasuryError {
    #[msg("Invalid minimum bid")]
    InvalidMinBid,
    #[msg("Invalid timer blocks")]
    InvalidTimer,
    #[msg("Invalid minimum holding")]
    InvalidMinHolding,
    #[msg("Treasury not initialized")]
    TreasuryNotInitialized,
    #[msg("Fundraising not active")]
    FundraisingNotActive,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Fundraising ended")]
    FundraisingEnded,
    #[msg("Auction not active")]
    AuctionNotActive,
    #[msg("Bid too low")]
    BidTooLow,
    #[msg("Bid not higher than current")]
    BidNotHigher,
    #[msg("Fundraising not ended")]
    FundraisingNotEnded,
    #[msg("Auction not expired")]
    AuctionNotExpired,
} 