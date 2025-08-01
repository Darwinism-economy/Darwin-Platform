use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use anchor_spl::associated_token::AssociatedToken;

declare_id!("Treasury111111111111111111111111111111111111");

#[program]
pub mod darwin_treasury {
    use super::*;

    /// Initialize treasury for fundraising
    pub fn initialize_treasury(
        ctx: Context<InitializeTreasury>,
        min_bid: u64,
        timer_duration: u64,
        min_holding_for_airdrop: u64,
    ) -> Result<()> {
        let treasury_state = &mut ctx.accounts.treasury_state;
        treasury_state.authority = ctx.accounts.authority.key();
        treasury_state.token_mint = ctx.accounts.token_mint.key();
        treasury_state.treasury_wallet = ctx.accounts.treasury_wallet.key();
        treasury_state.min_bid = min_bid;
        treasury_state.timer_duration = timer_duration;
        treasury_state.min_holding_for_airdrop = min_holding_for_airdrop;
        treasury_state.fundraising_start_block = Clock::get()?.slot;
        treasury_state.fundraising_end_block = Clock::get()?.slot + 200_000; // ~24 hours
        treasury_state.is_fundraising_active = true;
        treasury_state.is_auction_active = false;
        treasury_state.total_raised = 0;
        treasury_state.current_bid = 0;
        treasury_state.last_bidder = Pubkey::default();
        treasury_state.last_bid_block = 0;
        
        emit!(TreasuryInitialized {
            treasury: ctx.accounts.treasury_wallet.key(),
            min_bid,
            timer_duration,
            fundraising_end_block: treasury_state.fundraising_end_block,
        });
        
        Ok(())
    }

    /// Contribute SOL during fundraising period
    pub fn contribute_sol(
        ctx: Context<ContributeSol>,
        amount: u64,
    ) -> Result<()> {
        let treasury_state = &mut ctx.accounts.treasury_state;
        require!(treasury_state.is_fundraising_active, DarwinError::FundraisingNotActive);
        require!(amount > 0, DarwinError::InvalidAmount);
        
        let current_block = Clock::get()?.slot;
        require!(current_block < treasury_state.fundraising_end_block, DarwinError::FundraisingEnded);
        
        // Calculate token amount based on bonding curve (0.315% increase per SOL)
        let token_amount = calculate_token_amount(amount, treasury_state.total_raised);
        
        // Transfer SOL to treasury
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.contributor.key(),
            &ctx.accounts.treasury_wallet.key(),
            amount,
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.contributor.to_account_info(),
                ctx.accounts.treasury_wallet.to_account_info(),
            ],
        )?;
        
        // Transfer tokens to contributor
        let cpi_accounts = Transfer {
            from: ctx.accounts.authority_token_account.to_account_info(),
            to: ctx.accounts.contributor_token_account.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, token_amount)?;
        
        treasury_state.total_raised += amount;
        
        emit!(ContributionMade {
            contributor: ctx.accounts.contributor.key(),
            amount,
            token_amount,
            total_raised: treasury_state.total_raised,
        });
        
        Ok(())
    }

    /// End fundraising and start auction
    pub fn end_fundraising(
        ctx: Context<EndFundraising>,
    ) -> Result<()> {
        let treasury_state = &mut ctx.accounts.treasury_state;
        require!(treasury_state.is_fundraising_active, DarwinError::FundraisingNotActive);
        
        let current_block = Clock::get()?.slot;
        require!(current_block >= treasury_state.fundraising_end_block, DarwinError::FundraisingNotEnded);
        
        treasury_state.is_fundraising_active = false;
        treasury_state.is_auction_active = true;
        treasury_state.auction_start_block = current_block;
        
        // Send 3% to creator
        let creator_amount = (treasury_state.total_raised * 3) / 100;
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.treasury_wallet.key(),
            &ctx.accounts.creator_wallet.key(),
            creator_amount,
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.treasury_wallet.to_account_info(),
                ctx.accounts.creator_wallet.to_account_info(),
            ],
        )?;
        
        emit!(FundraisingEnded {
            total_raised: treasury_state.total_raised,
            creator_amount,
            auction_start_block: current_block,
        });
        
        Ok(())
    }

    /// Place bid in Last Man Standing auction
    pub fn place_bid(
        ctx: Context<PlaceBid>,
        bid_amount: u64,
    ) -> Result<()> {
        let treasury_state = &mut ctx.accounts.treasury_state;
        require!(treasury_state.is_auction_active, DarwinError::AuctionNotActive);
        require!(bid_amount >= treasury_state.min_bid, DarwinError::BidTooLow);
        require!(bid_amount > treasury_state.current_bid, DarwinError::BidNotHigher);
        
        // Check if bidder has minimum token holdings
        let bidder_balance = ctx.accounts.bidder_token_account.amount;
        require!(bidder_balance >= treasury_state.min_holding_for_airdrop, DarwinError::InsufficientTokens);
        
        let current_block = Clock::get()?.slot;
        
        // Transfer SOL from bidder to treasury
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.bidder.key(),
            &ctx.accounts.treasury_wallet.key(),
            bid_amount,
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.bidder.to_account_info(),
                ctx.accounts.treasury_wallet.to_account_info(),
            ],
        )?;
        
        // Update auction state
        treasury_state.current_bid = bid_amount;
        treasury_state.last_bidder = ctx.accounts.bidder.key();
        treasury_state.last_bid_block = current_block;
        
        emit!(BidPlaced {
            bidder: ctx.accounts.bidder.key(),
            amount: bid_amount,
            block: current_block,
        });
        
        Ok(())
    }

    /// End auction and distribute treasury
    pub fn end_auction(
        ctx: Context<EndAuction>,
    ) -> Result<()> {
        let treasury_state = &mut ctx.accounts.treasury_state;
        require!(treasury_state.is_auction_active, DarwinError::AuctionNotActive);
        
        let current_block = Clock::get()?.slot;
        let blocks_since_last_bid = current_block - treasury_state.last_bid_block;
        
        require!(blocks_since_last_bid >= treasury_state.timer_duration, DarwinError::AuctionNotExpired);
        
        treasury_state.is_auction_active = false;
        
        if treasury_state.current_bid > 0 {
            // Send treasury to last bidder
            let ix = anchor_lang::solana_program::system_instruction::transfer(
                &ctx.accounts.treasury_wallet.key(),
                &treasury_state.last_bidder,
                treasury_state.total_raised - (treasury_state.total_raised * 3 / 100), // Subtract creator amount
            );
            anchor_lang::solana_program::program::invoke(
                &ix,
                &[
                    ctx.accounts.treasury_wallet.to_account_info(),
                    ctx.accounts.last_bidder.to_account_info(),
                ],
            )?;
            
            emit!(AuctionWon {
                winner: treasury_state.last_bidder,
                amount: treasury_state.total_raised - (treasury_state.total_raised * 3 / 100),
            });
        } else {
            // Distribute proportionally to token holders (simplified - would need more complex logic)
            emit!(AuctionExpired {
                message: "No bids placed, treasury remains locked".to_string(),
            });
        }
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeTreasury<'info> {
    #[account(
        init,
        payer = authority,
        space = TreasuryState::LEN,
        seeds = [b"treasury_state", token_mint.key().as_ref()],
        bump
    )]
    pub treasury_state: Account<'info, TreasuryState>,
    
    pub token_mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(mut)]
    pub treasury_wallet: SystemAccount<'info>,
    
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct ContributeSol<'info> {
    #[account(
        seeds = [b"treasury_state", token_mint.key().as_ref()],
        bump,
        constraint = treasury_state.is_fundraising_active
    )]
    pub treasury_state: Account<'info, TreasuryState>,
    
    pub token_mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub contributor: Signer<'info>,
    
    #[account(mut)]
    pub treasury_wallet: SystemAccount<'info>,
    
    #[account(mut)]
    pub authority_token_account: Account<'info, TokenAccount>,
    
    #[account(
        init_if_needed,
        payer = contributor,
        associated_token::mint = token_mint,
        associated_token::authority = contributor
    )]
    pub contributor_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct EndFundraising<'info> {
    #[account(
        seeds = [b"treasury_state", token_mint.key().as_ref()],
        bump,
        constraint = treasury_state.is_fundraising_active
    )]
    pub treasury_state: Account<'info, TreasuryState>,
    
    pub token_mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub treasury_wallet: SystemAccount<'info>,
    
    #[account(mut)]
    pub creator_wallet: SystemAccount<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PlaceBid<'info> {
    #[account(
        seeds = [b"treasury_state", token_mint.key().as_ref()],
        bump,
        constraint = treasury_state.is_auction_active
    )]
    pub treasury_state: Account<'info, TreasuryState>,
    
    pub token_mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub bidder: Signer<'info>,
    
    #[account(mut)]
    pub treasury_wallet: SystemAccount<'info>,
    
    #[account(
        constraint = bidder_token_account.owner == bidder.key()
    )]
    pub bidder_token_account: Account<'info, TokenAccount>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct EndAuction<'info> {
    #[account(
        seeds = [b"treasury_state", token_mint.key().as_ref()],
        bump,
        constraint = treasury_state.is_auction_active
    )]
    pub treasury_state: Account<'info, TreasuryState>,
    
    pub token_mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub treasury_wallet: SystemAccount<'info>,
    
    #[account(mut)]
    pub last_bidder: SystemAccount<'info>,
    
    pub system_program: Program<'info, System>,
}

#[account]
pub struct TreasuryState {
    pub authority: Pubkey,
    pub token_mint: Pubkey,
    pub treasury_wallet: Pubkey,
    pub min_bid: u64,
    pub timer_duration: u64,
    pub min_holding_for_airdrop: u64,
    pub fundraising_start_block: u64,
    pub fundraising_end_block: u64,
    pub auction_start_block: u64,
    pub is_fundraising_active: bool,
    pub is_auction_active: bool,
    pub total_raised: u64,
    pub current_bid: u64,
    pub last_bidder: Pubkey,
    pub last_bid_block: u64,
}

impl TreasuryState {
    pub const LEN: usize = 8 + 32 + 32 + 32 + 8 + 8 + 8 + 8 + 8 + 8 + 1 + 1 + 8 + 8 + 32 + 8;
}

fn calculate_token_amount(sol_amount: u64, total_raised: u64) -> u64 {
    // Bonding curve: 0.315% increase per SOL
    let base_rate = 1000; // Base tokens per SOL
    let increase_rate = 315; // 0.315% as integer
    let total_increase = (total_raised * increase_rate) / 1_000_000;
    let current_rate = base_rate + total_increase;
    (sol_amount * current_rate) / 1_000_000
}

#[event]
pub struct TreasuryInitialized {
    pub treasury: Pubkey,
    pub min_bid: u64,
    pub timer_duration: u64,
    pub fundraising_end_block: u64,
}

#[event]
pub struct ContributionMade {
    pub contributor: Pubkey,
    pub amount: u64,
    pub token_amount: u64,
    pub total_raised: u64,
}

#[event]
pub struct FundraisingEnded {
    pub total_raised: u64,
    pub creator_amount: u64,
    pub auction_start_block: u64,
}

#[event]
pub struct BidPlaced {
    pub bidder: Pubkey,
    pub amount: u64,
    pub block: u64,
}

#[event]
pub struct AuctionWon {
    pub winner: Pubkey,
    pub amount: u64,
}

#[event]
pub struct AuctionExpired {
    pub message: String,
}

#[error_code]
pub enum DarwinError {
    #[msg("Fundraising not active")]
    FundraisingNotActive,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Fundraising ended")]
    FundraisingEnded,
    #[msg("Fundraising not ended")]
    FundraisingNotEnded,
    #[msg("Auction not active")]
    AuctionNotActive,
    #[msg("Bid too low")]
    BidTooLow,
    #[msg("Bid not higher than current")]
    BidNotHigher,
    #[msg("Insufficient tokens")]
    InsufficientTokens,
    #[msg("Auction not expired")]
    AuctionNotExpired,
} 