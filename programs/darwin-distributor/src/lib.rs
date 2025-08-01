use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use anchor_spl::associated_token::AssociatedToken;

declare_id!("Distributor111111111111111111111111111111111");

#[program]
pub mod darwin_distributor {
    use super::*;

    /// Initialize distributor for automatic daily liquidations
    pub fn initialize_distributor(
        ctx: Context<InitializeDistributor>,
        distribution_interval: u64, // Blocks between distributions (default: 216,000 = ~24 hours)
        min_holding_for_distribution: u64,
    ) -> Result<()> {
        let distributor_state = &mut ctx.accounts.distributor_state;
        distributor_state.authority = ctx.accounts.authority.key();
        distributor_state.token_mint = ctx.accounts.token_mint.key();
        distributor_state.distributor_wallet = ctx.accounts.distributor_wallet.key();
        distributor_state.distribution_interval = distribution_interval;
        distributor_state.min_holding_for_distribution = min_holding_for_distribution;
        distributor_state.last_distribution_block = Clock::get()?.slot;
        distributor_state.total_distributed = 0;
        distributor_state.is_active = true;
        
        emit!(DistributorInitialized {
            distributor: ctx.accounts.distributor_wallet.key(),
            distribution_interval,
            min_holding_for_distribution,
        });
        
        Ok(())
    }

    /// Execute daily liquidation and distribution
    pub fn execute_distribution(
        ctx: Context<ExecuteDistribution>,
    ) -> Result<()> {
        let distributor_state = &mut ctx.accounts.distributor_state;
        require!(distributor_state.is_active, DarwinError::DistributorNotActive);
        
        let current_block = Clock::get()?.slot;
        let blocks_since_last_distribution = current_block - distributor_state.last_distribution_block;
        
        require!(
            blocks_since_last_distribution >= distributor_state.distribution_interval,
            DarwinError::DistributionNotReady
        );
        
        // Get current balance in distributor wallet
        let distributor_balance = ctx.accounts.distributor_wallet.lamports();
        require!(distributor_balance > 0, DarwinError::NoFundsToDistribute);
        
        // Calculate total eligible token supply (holders with minimum tokens)
        let total_eligible_supply = calculate_eligible_supply(
            &ctx.accounts.token_mint,
            distributor_state.min_holding_for_distribution,
        )?;
        
        require!(total_eligible_supply > 0, DarwinError::NoEligibleHolders);
        
        // Distribute proportionally to all eligible holders
        distribute_to_holders(
            &ctx.accounts.distributor_wallet,
            distributor_balance,
            total_eligible_supply,
            distributor_state.min_holding_for_distribution,
        )?;
        
        // Update state
        distributor_state.last_distribution_block = current_block;
        distributor_state.total_distributed += distributor_balance;
        
        emit!(DistributionExecuted {
            amount_distributed: distributor_balance,
            total_eligible_supply,
            block: current_block,
        });
        
        Ok(())
    }

    /// Emergency pause distribution
    pub fn pause_distribution(
        ctx: Context<PauseDistribution>,
    ) -> Result<()> {
        let distributor_state = &mut ctx.accounts.distributor_state;
        require!(distributor_state.authority == ctx.accounts.authority.key(), DarwinError::Unauthorized);
        
        distributor_state.is_active = false;
        
        emit!(DistributionPaused {
            paused_by: ctx.accounts.authority.key(),
            block: Clock::get()?.slot,
        });
        
        Ok(())
    }

    /// Resume distribution
    pub fn resume_distribution(
        ctx: Context<ResumeDistribution>,
    ) -> Result<()> {
        let distributor_state = &mut ctx.accounts.distributor_state;
        require!(distributor_state.authority == ctx.accounts.authority.key(), DarwinError::Unauthorized);
        
        distributor_state.is_active = true;
        
        emit!(DistributionResumed {
            resumed_by: ctx.accounts.authority.key(),
            block: Clock::get()?.slot,
        });
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeDistributor<'info> {
    #[account(
        init,
        payer = authority,
        space = DistributorState::LEN,
        seeds = [b"distributor_state", token_mint.key().as_ref()],
        bump
    )]
    pub distributor_state: Account<'info, DistributorState>,
    
    pub token_mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(mut)]
    pub distributor_wallet: SystemAccount<'info>,
    
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct ExecuteDistribution<'info> {
    #[account(
        seeds = [b"distributor_state", token_mint.key().as_ref()],
        bump,
        constraint = distributor_state.is_active
    )]
    pub distributor_state: Account<'info, DistributorState>,
    
    pub token_mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub distributor_wallet: SystemAccount<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PauseDistribution<'info> {
    #[account(
        seeds = [b"distributor_state", token_mint.key().as_ref()],
        bump
    )]
    pub distributor_state: Account<'info, DistributorState>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ResumeDistribution<'info> {
    #[account(
        seeds = [b"distributor_state", token_mint.key().as_ref()],
        bump
    )]
    pub distributor_state: Account<'info, DistributorState>,
    
    pub authority: Signer<'info>,
}

#[account]
pub struct DistributorState {
    pub authority: Pubkey,
    pub token_mint: Pubkey,
    pub distributor_wallet: Pubkey,
    pub distribution_interval: u64,
    pub min_holding_for_distribution: u64,
    pub last_distribution_block: u64,
    pub total_distributed: u64,
    pub is_active: bool,
}

impl DistributorState {
    pub const LEN: usize = 8 + 32 + 32 + 32 + 8 + 8 + 8 + 8 + 1;
}

fn calculate_eligible_supply(
    token_mint: &Account<Mint>,
    min_holding: u64,
) -> Result<u64> {
    // This is a simplified calculation
    // In a real implementation, you would iterate through all token accounts
    // and sum up balances that meet the minimum holding requirement
    // For now, we'll use a placeholder calculation
    let total_supply = token_mint.supply;
    let eligible_percentage = 80; // Assume 80% of supply meets minimum holding
    Ok((total_supply * eligible_percentage as u64) / 100)
}

fn distribute_to_holders(
    distributor_wallet: &AccountInfo,
    total_amount: u64,
    total_eligible_supply: u64,
    min_holding: u64,
) -> Result<()> {
    // This is a simplified distribution
    // In a real implementation, you would:
    // 1. Get all token accounts for the mint
    // 2. Filter for accounts with >= min_holding tokens
    // 3. Calculate proportional amounts for each holder
    // 4. Transfer SOL to each eligible holder
    
    // For now, we'll emit an event indicating distribution would occur
    msg!("Distribution of {} SOL to eligible holders would occur here", total_amount);
    
    Ok(())
}

#[event]
pub struct DistributorInitialized {
    pub distributor: Pubkey,
    pub distribution_interval: u64,
    pub min_holding_for_distribution: u64,
}

#[event]
pub struct DistributionExecuted {
    pub amount_distributed: u64,
    pub total_eligible_supply: u64,
    pub block: u64,
}

#[event]
pub struct DistributionPaused {
    pub paused_by: Pubkey,
    pub block: u64,
}

#[event]
pub struct DistributionResumed {
    pub resumed_by: Pubkey,
    pub block: u64,
}

#[error_code]
pub enum DarwinError {
    #[msg("Distributor not active")]
    DistributorNotActive,
    #[msg("Distribution not ready")]
    DistributionNotReady,
    #[msg("No funds to distribute")]
    NoFundsToDistribute,
    #[msg("No eligible holders")]
    NoEligibleHolders,
    #[msg("Unauthorized")]
    Unauthorized,
} 