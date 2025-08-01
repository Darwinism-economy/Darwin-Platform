use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("Token111111111111111111111111111111111111111");

#[program]
pub mod darwin_token {
    use super::*;

    /// Initialize a new token with immutable supply and tax configuration
    pub fn initialize_token(
        ctx: Context<InitializeToken>,
        name: String,
        symbol: String,
        total_supply: u64,
        treasury_tax: u8,
        distributor_tax: u8,
        creator_tax: u8,
    ) -> Result<()> {
        require!(total_supply > 0, DarwinError::InvalidSupply);
        require!(treasury_tax + distributor_tax + creator_tax <= 25, DarwinError::TaxTooHigh);
        
        let token_state = &mut ctx.accounts.token_state;
        token_state.authority = ctx.accounts.authority.key();
        token_state.mint = ctx.accounts.mint.key();
        token_state.treasury = ctx.accounts.treasury.key();
        token_state.distributor = ctx.accounts.distributor.key();
        token_state.creator = ctx.accounts.creator.key();
        token_state.total_supply = total_supply;
        token_state.treasury_tax = treasury_tax;
        token_state.distributor_tax = distributor_tax;
        token_state.creator_tax = creator_tax;
        token_state.is_initialized = true;
        token_state.name = name;
        token_state.symbol = symbol;
        
        // Mint initial supply to creator
        let cpi_accounts = Transfer {
            from: ctx.accounts.authority_token_account.to_account_info(),
            to: ctx.accounts.creator_token_account.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, total_supply)?;
        
        emit!(TokenInitialized {
            mint: ctx.accounts.mint.key(),
            total_supply,
            treasury_tax,
            distributor_tax,
            creator_tax,
        });
        
        Ok(())
    }

    /// Transfer tokens with automatic tax collection
    pub fn transfer_with_tax(
        ctx: Context<TransferWithTax>,
        amount: u64,
    ) -> Result<()> {
        require!(amount > 0, DarwinError::InvalidAmount);
        
        let token_state = &ctx.accounts.token_state;
        require!(token_state.is_initialized, DarwinError::TokenNotInitialized);
        
        let total_tax_rate = token_state.treasury_tax + token_state.distributor_tax + token_state.creator_tax;
        let tax_amount = (amount * total_tax_rate as u64) / 100;
        let transfer_amount = amount - tax_amount;
        
        // Transfer main amount
        let cpi_accounts = Transfer {
            from: ctx.accounts.from.to_account_info(),
            to: ctx.accounts.to.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, transfer_amount)?;
        
        // Collect taxes
        if tax_amount > 0 {
            // Treasury tax
            if token_state.treasury_tax > 0 {
                let treasury_amount = (amount * token_state.treasury_tax as u64) / 100;
                let cpi_accounts = Transfer {
                    from: ctx.accounts.from.to_account_info(),
                    to: ctx.accounts.treasury.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                };
                let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
                token::transfer(cpi_ctx, treasury_amount)?;
            }
            
            // Distributor tax
            if token_state.distributor_tax > 0 {
                let distributor_amount = (amount * token_state.distributor_tax as u64) / 100;
                let cpi_accounts = Transfer {
                    from: ctx.accounts.from.to_account_info(),
                    to: ctx.accounts.distributor.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                };
                let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
                token::transfer(cpi_ctx, distributor_amount)?;
            }
            
            // Creator tax
            if token_state.creator_tax > 0 {
                let creator_amount = (amount * token_state.creator_tax as u64) / 100;
                let cpi_accounts = Transfer {
                    from: ctx.accounts.from.to_account_info(),
                    to: ctx.accounts.creator.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                };
                let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
                token::transfer(cpi_ctx, creator_amount)?;
            }
        }
        
        emit!(TransferWithTaxEvent {
            from: ctx.accounts.from.key(),
            to: ctx.accounts.to.key(),
            amount: transfer_amount,
            tax_amount,
        });
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeToken<'info> {
    #[account(
        init,
        payer = authority,
        space = TokenState::LEN,
        seeds = [b"token_state", mint.key().as_ref()],
        bump
    )]
    pub token_state: Account<'info, TokenState>,
    
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(mut)]
    pub authority_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub creator_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub treasury: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub distributor: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub creator: Account<'info, TokenAccount>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct TransferWithTax<'info> {
    #[account(
        seeds = [b"token_state", mint.key().as_ref()],
        bump,
        constraint = token_state.is_initialized
    )]
    pub token_state: Account<'info, TokenState>,
    
    pub mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub from: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub to: Account<'info, TokenAccount>,
    
    pub authority: Signer<'info>,
    
    #[account(mut)]
    pub treasury: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub distributor: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub creator: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct TokenState {
    pub authority: Pubkey,
    pub mint: Pubkey,
    pub treasury: Pubkey,
    pub distributor: Pubkey,
    pub creator: Pubkey,
    pub total_supply: u64,
    pub treasury_tax: u8,
    pub distributor_tax: u8,
    pub creator_tax: u8,
    pub is_initialized: bool,
    pub name: String,
    pub symbol: String,
}

impl TokenState {
    pub const LEN: usize = 8 + 32 + 32 + 32 + 32 + 32 + 8 + 1 + 1 + 1 + 1 + 64 + 16; // Adjust for strings
}

#[event]
pub struct TokenInitialized {
    pub mint: Pubkey,
    pub total_supply: u64,
    pub treasury_tax: u8,
    pub distributor_tax: u8,
    pub creator_tax: u8,
}

#[event]
pub struct TransferWithTaxEvent {
    pub from: Pubkey,
    pub to: Pubkey,
    pub amount: u64,
    pub tax_amount: u64,
}

#[error_code]
pub enum DarwinError {
    #[msg("Invalid token supply")]
    InvalidSupply,
    #[msg("Tax rate too high")]
    TaxTooHigh,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Token not initialized")]
    TokenNotInitialized,
} 