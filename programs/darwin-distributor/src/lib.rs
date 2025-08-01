use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("Distributor111111111111111111111111111111111111111");

#[program]
pub mod darwin_distributor {
    use super::*;

    pub fn initialize_distributor(
        ctx: Context<InitializeDistributor>,
        distribution_interval_blocks: u64,
        min_holding_tokens: u64,
    ) -> Result<()> {
        require!(distribution_interval_blocks > 0, DistributorError::InvalidInterval);
        require!(min_holding_tokens > 0, DistributorError::InvalidMinHolding);

        let distributor = &mut ctx.accounts.distributor;
        distributor.authority = ctx.accounts.authority.key();
        distributor.token_mint = ctx.accounts.token_mint.key();
        distributor.distribution_interval_blocks = distribution_interval_blocks;
        distributor.min_holding_tokens = min_holding_tokens;
        distributor.last_distribution_block = ctx.accounts.clock.slot;
        distributor.next_distribution_block = distributor.last_distribution_block + distribution_interval_blocks;
        distributor.total_distributed = 0;
        distributor.distribution_count = 0;
        distributor.is_initialized = true;

        Ok(())
    }

    pub fn collect_tax(
        ctx: Context<CollectTax>,
        amount: u64,
    ) -> Result<()> {
        let distributor = &mut ctx.accounts.distributor;
        require!(distributor.is_initialized, DistributorError::DistributorNotInitialized);
        require!(amount > 0, DistributorError::InvalidAmount);

        // Transfer tokens to distributor
        let cpi_accounts = Transfer {
            from: ctx.accounts.from.to_account_info(),
            to: ctx.accounts.distributor_token_account.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        emit!(TaxCollectedEvent {
            distributor: distributor.key(),
            amount,
            total_collected: distributor.total_collected + amount,
        });

        Ok(())
    }

    pub fn distribute_to_holders(
        ctx: Context<DistributeToHolders>,
    ) -> Result<()> {
        let distributor = &mut ctx.accounts.distributor;
        require!(distributor.is_initialized, DistributorError::DistributorNotInitialized);

        let current_block = ctx.accounts.clock.slot;
        require!(current_block >= distributor.next_distribution_block, DistributorError::DistributionNotDue);

        // Get distributor token balance
        let distributor_balance = ctx.accounts.distributor_token_account.amount;
        require!(distributor_balance > 0, DistributorError::NoTokensToDistribute);

        // In a real implementation, this would:
        // 1. Query all token holders above minimum threshold
        // 2. Calculate proportional distribution based on holdings
        // 3. Transfer tokens to each qualified holder
        
        // For demo purposes, we'll simulate distribution to a few holders
        let qualified_holders = get_qualified_holders(ctx.accounts.clock.slot);
        let total_qualified_holdings = qualified_holders.iter().map(|h| h.holdings).sum::<u64>();
        
        if total_qualified_holdings > 0 {
            for holder in qualified_holders {
                let proportional_amount = (distributor_balance * holder.holdings) / total_qualified_holdings;
                
                if proportional_amount > 0 {
                    // Transfer tokens to holder
                    let cpi_accounts = Transfer {
                        from: ctx.accounts.distributor_token_account.to_account_info(),
                        to: holder.token_account.to_account_info(),
                        authority: ctx.accounts.distributor.to_account_info(),
                    };
                    let cpi_program = ctx.accounts.token_program.to_account_info();
                    let cpi_ctx = CpiContext::new_with_signer(
                        cpi_program,
                        cpi_accounts,
                        &[&[b"distributor", distributor.token_mint.as_ref(), &[ctx.bumps.distributor]]],
                    );
                    token::transfer(cpi_ctx, proportional_amount)?;
                }
            }
        }

        // Update distributor state
        distributor.last_distribution_block = current_block;
        distributor.next_distribution_block = current_block + distributor.distribution_interval_blocks;
        distributor.total_distributed += distributor_balance;
        distributor.distribution_count += 1;

        emit!(DistributionEvent {
            distributor: distributor.key(),
            amount_distributed: distributor_balance,
            qualified_holders: qualified_holders.len() as u32,
            distribution_count: distributor.distribution_count,
        });

        Ok(())
    }

    pub fn update_distribution_interval(
        ctx: Context<UpdateDistributionInterval>,
        new_interval: u64,
    ) -> Result<()> {
        let distributor = &mut ctx.accounts.distributor;
        require!(distributor.is_initialized, DistributorError::DistributorNotInitialized);
        require!(new_interval > 0, DistributorError::InvalidInterval);
        require!(ctx.accounts.authority.key() == distributor.authority, DistributorError::Unauthorized);

        distributor.distribution_interval_blocks = new_interval;
        distributor.next_distribution_block = ctx.accounts.clock.slot + new_interval;

        emit!(IntervalUpdatedEvent {
            distributor: distributor.key(),
            new_interval,
            next_distribution: distributor.next_distribution_block,
        });

        Ok(())
    }

    pub fn update_min_holding(
        ctx: Context<UpdateMinHolding>,
        new_min_holding: u64,
    ) -> Result<()> {
        let distributor = &mut ctx.accounts.distributor;
        require!(distributor.is_initialized, DistributorError::DistributorNotInitialized);
        require!(new_min_holding > 0, DistributorError::InvalidMinHolding);
        require!(ctx.accounts.authority.key() == distributor.authority, DistributorError::Unauthorized);

        distributor.min_holding_tokens = new_min_holding;

        emit!(MinHoldingUpdatedEvent {
            distributor: distributor.key(),
            new_min_holding,
        });

        Ok(())
    }

    // Helper function to get qualified holders (simplified for demo)
    fn get_qualified_holders(current_block: u64) -> Vec<HolderInfo> {
        // In a real implementation, this would query the blockchain for all token holders
        // For demo purposes, return some mock holders
        vec![
            HolderInfo {
                address: Pubkey::default(), // Would be actual holder address
                holdings: 10000,
                token_account: AccountInfo::default(), // Would be actual token account
            },
            HolderInfo {
                address: Pubkey::default(),
                holdings: 5000,
                token_account: AccountInfo::default(),
            },
        ]
    }
}

#[derive(Accounts)]
pub struct InitializeDistributor<'info> {
    #[account(
        init,
        payer = authority,
        space = Distributor::LEN,
        seeds = [b"distributor", token_mint.key().as_ref()],
        bump
    )]
    pub distributor: Account<'info, Distributor>,
    
    pub token_mint: Account<'info, Mint>,
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
pub struct CollectTax<'info> {
    #[account(
        seeds = [b"distributor", token_mint.key().as_ref()],
        bump,
        constraint = distributor.is_initialized
    )]
    pub distributor: Account<'info, Distributor>,
    
    pub token_mint: Account<'info, Mint>,
    #[account(mut)]
    pub distributor_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub from: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct DistributeToHolders<'info> {
    #[account(
        mut,
        seeds = [b"distributor", token_mint.key().as_ref()],
        bump,
        constraint = distributor.is_initialized
    )]
    pub distributor: Account<'info, Distributor>,
    
    pub token_mint: Account<'info, Mint>,
    #[account(mut)]
    pub distributor_token_account: Account<'info, TokenAccount>,
    pub clock: Sysvar<'info, Clock>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct UpdateDistributionInterval<'info> {
    #[account(
        mut,
        seeds = [b"distributor", token_mint.key().as_ref()],
        bump,
        constraint = distributor.is_initialized
    )]
    pub distributor: Account<'info, Distributor>,
    
    pub token_mint: Account<'info, Mint>,
    pub authority: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
pub struct UpdateMinHolding<'info> {
    #[account(
        mut,
        seeds = [b"distributor", token_mint.key().as_ref()],
        bump,
        constraint = distributor.is_initialized
    )]
    pub distributor: Account<'info, Distributor>,
    
    pub token_mint: Account<'info, Mint>,
    pub authority: Signer<'info>,
}

#[account]
pub struct Distributor {
    pub authority: Pubkey,
    pub token_mint: Pubkey,
    pub distribution_interval_blocks: u64,
    pub min_holding_tokens: u64,
    pub last_distribution_block: u64,
    pub next_distribution_block: u64,
    pub total_collected: u64,
    pub total_distributed: u64,
    pub distribution_count: u32,
    pub is_initialized: bool,
}

impl Distributor {
    pub const LEN: usize = 8 + // discriminator
        32 + // authority
        32 + // token_mint
        8 + // distribution_interval_blocks
        8 + // min_holding_tokens
        8 + // last_distribution_block
        8 + // next_distribution_block
        8 + // total_collected
        8 + // total_distributed
        4 + // distribution_count
        1; // is_initialized
}

// Helper struct for holder information
struct HolderInfo {
    address: Pubkey,
    holdings: u64,
    token_account: AccountInfo,
}

#[event]
pub struct TaxCollectedEvent {
    pub distributor: Pubkey,
    pub amount: u64,
    pub total_collected: u64,
}

#[event]
pub struct DistributionEvent {
    pub distributor: Pubkey,
    pub amount_distributed: u64,
    pub qualified_holders: u32,
    pub distribution_count: u32,
}

#[event]
pub struct IntervalUpdatedEvent {
    pub distributor: Pubkey,
    pub new_interval: u64,
    pub next_distribution: u64,
}

#[event]
pub struct MinHoldingUpdatedEvent {
    pub distributor: Pubkey,
    pub new_min_holding: u64,
}

#[error_code]
pub enum DistributorError {
    #[msg("Invalid distribution interval")]
    InvalidInterval,
    #[msg("Invalid minimum holding")]
    InvalidMinHolding,
    #[msg("Distributor not initialized")]
    DistributorNotInitialized,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Distribution not due yet")]
    DistributionNotDue,
    #[msg("No tokens to distribute")]
    NoTokensToDistribute,
    #[msg("Unauthorized")]
    Unauthorized,
} 