use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

#[program]
pub mod darwin_token {
    use super::*;

    pub fn initialize_token(
        ctx: Context<InitializeToken>,
        name: String,
        symbol: String,
        decimals: u8,
        total_supply: u64,
        treasury_tax: u8,
        distributor_tax: u8,
        creator_tax: u8,
    ) -> Result<()> {
        require!(treasury_tax + distributor_tax + creator_tax == 10, ErrorCode::InvalidTaxConfiguration);
        require!(total_supply > 0, ErrorCode::InvalidSupply);
        require!(decimals <= 9, ErrorCode::InvalidDecimals);

        let token_info = &mut ctx.accounts.token_info;
        token_info.name = name;
        token_info.symbol = symbol;
        token_info.decimals = decimals;
        token_info.total_supply = total_supply;
        token_info.treasury_tax = treasury_tax;
        token_info.distributor_tax = distributor_tax;
        token_info.creator_tax = creator_tax;
        token_info.creator = ctx.accounts.creator.key();
        token_info.treasury = ctx.accounts.treasury.key();
        token_info.distributor = ctx.accounts.distributor.key();
        token_info.is_initialized = true;

        // Mint initial supply to creator
        let cpi_accounts = Transfer {
            from: ctx.accounts.creator_token_account.to_account_info(),
            to: ctx.accounts.creator_token_account.to_account_info(),
            authority: ctx.accounts.creator.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, total_supply)?;

        Ok(())
    }

    pub fn transfer_with_tax(
        ctx: Context<TransferWithTax>,
        amount: u64,
    ) -> Result<()> {
        let token_info = &ctx.accounts.token_info;
        require!(token_info.is_initialized, ErrorCode::TokenNotInitialized);

        let treasury_amount = (amount * token_info.treasury_tax as u64) / 100;
        let distributor_amount = (amount * token_info.distributor_tax as u64) / 100;
        let creator_amount = (amount * token_info.creator_tax as u64) / 100;
        let transfer_amount = amount - treasury_amount - distributor_amount - creator_amount;

        // Transfer main amount
        let cpi_accounts = Transfer {
            from: ctx.accounts.from.to_account_info(),
            to: ctx.accounts.to.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, transfer_amount)?;

        // Transfer treasury tax
        if treasury_amount > 0 {
            let cpi_accounts = Transfer {
                from: ctx.accounts.from.to_account_info(),
                to: ctx.accounts.treasury_account.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
            token::transfer(cpi_ctx, treasury_amount)?;
        }

        // Transfer distributor tax
        if distributor_amount > 0 {
            let cpi_accounts = Transfer {
                from: ctx.accounts.from.to_account_info(),
                to: ctx.accounts.distributor_account.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
            token::transfer(cpi_ctx, distributor_amount)?;
        }

        // Transfer creator tax
        if creator_amount > 0 {
            let cpi_accounts = Transfer {
                from: ctx.accounts.from.to_account_info(),
                to: ctx.accounts.creator_account.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
            token::transfer(cpi_ctx, creator_amount)?;
        }

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeToken<'info> {
    #[account(
        init,
        payer = creator,
        space = TokenInfo::LEN,
        seeds = [b"token_info", mint.key().as_ref()],
        bump
    )]
    pub token_info: Account<'info, TokenInfo>,
    
    pub mint: Account<'info, Mint>,
    pub creator_token_account: Account<'info, TokenAccount>,
    pub treasury: AccountInfo<'info>,
    pub distributor: AccountInfo<'info>,
    pub creator: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct TransferWithTax<'info> {
    #[account(
        seeds = [b"token_info", mint.key().as_ref()],
        bump,
        constraint = token_info.is_initialized
    )]
    pub token_info: Account<'info, TokenInfo>,
    
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub from: Account<'info, TokenAccount>,
    #[account(mut)]
    pub to: Account<'info, TokenAccount>,
    #[account(mut)]
    pub treasury_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub distributor_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub creator_account: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct TokenInfo {
    pub name: String,
    pub symbol: String,
    pub decimals: u8,
    pub total_supply: u64,
    pub treasury_tax: u8,
    pub distributor_tax: u8,
    pub creator_tax: u8,
    pub creator: Pubkey,
    pub treasury: Pubkey,
    pub distributor: Pubkey,
    pub is_initialized: bool,
}

impl TokenInfo {
    pub const LEN: usize = 8 + // discriminator
        4 + 50 + // name (max 50 chars)
        4 + 10 + // symbol (max 10 chars)
        1 + // decimals
        8 + // total_supply
        1 + // treasury_tax
        1 + // distributor_tax
        1 + // creator_tax
        32 + // creator
        32 + // treasury
        32 + // distributor
        1; // is_initialized
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid tax configuration - total must equal 10%")]
    InvalidTaxConfiguration,
    #[msg("Invalid supply amount")]
    InvalidSupply,
    #[msg("Invalid decimals - must be <= 9")]
    InvalidDecimals,
    #[msg("Token not initialized")]
    TokenNotInitialized,
} 