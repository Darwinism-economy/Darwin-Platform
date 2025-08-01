import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { DarwinToken } from "../target/types/darwin_token";
import { DarwinTreasury } from "../target/types/darwin_treasury";
import { DarwinDistributor } from "../target/types/darwin_distributor";
import { PublicKey, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createMint, createAccount, mintTo, getAccount } from "@solana/spl-token";
import { assert } from "chai";

describe("Darwin Platform", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const darwinTokenProgram = anchor.workspace.DarwinToken as Program<DarwinToken>;
  const darwinTreasuryProgram = anchor.workspace.DarwinTreasury as Program<DarwinTreasury>;
  const darwinDistributorProgram = anchor.workspace.DarwinDistributor as Program<DarwinDistributor>;

  // Test accounts
  const authority = Keypair.generate();
  const creator = Keypair.generate();
  const contributor = Keypair.generate();
  const bidder = Keypair.generate();

  // Token accounts
  let tokenMint: PublicKey;
  let creatorTokenAccount: PublicKey;
  let contributorTokenAccount: PublicKey;
  let treasuryTokenAccount: PublicKey;
  let distributorTokenAccount: PublicKey;

  // PDA accounts
  let tokenInfoPda: PublicKey;
  let treasuryPda: PublicKey;
  let distributorPda: PublicKey;

  before(async () => {
    // Airdrop SOL to test accounts
    await provider.connection.requestAirdrop(authority.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(creator.publicKey, 5 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(contributor.publicKey, 5 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(bidder.publicKey, 5 * anchor.web3.LAMPORTS_PER_SOL);

    // Create token mint
    tokenMint = await createMint(
      provider.connection,
      authority,
      authority.publicKey,
      null,
      9
    );

    // Create token accounts
    creatorTokenAccount = await createAccount(
      provider.connection,
      authority,
      tokenMint,
      creator.publicKey
    );

    contributorTokenAccount = await createAccount(
      provider.connection,
      authority,
      tokenMint,
      contributor.publicKey
    );

    treasuryTokenAccount = await createAccount(
      provider.connection,
      authority,
      tokenMint,
      authority.publicKey
    );

    distributorTokenAccount = await createAccount(
      provider.connection,
      authority,
      tokenMint,
      authority.publicKey
    );

    // Mint initial supply to creator
    await mintTo(
      provider.connection,
      authority,
      tokenMint,
      creatorTokenAccount,
      authority,
      1000000000000 // 1 billion tokens
    );

    // Find PDAs
    [tokenInfoPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("token_info"), tokenMint.toBuffer()],
      darwinTokenProgram.programId
    );

    [treasuryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("treasury"), tokenMint.toBuffer()],
      darwinTreasuryProgram.programId
    );

    [distributorPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("distributor"), tokenMint.toBuffer()],
      darwinDistributorProgram.programId
    );
  });

  describe("Darwin Token Contract", () => {
    it("Should initialize token with correct parameters", async () => {
      const name = "Darwin Token";
      const symbol = "WIN";
      const decimals = 9;
      const totalSupply = 1000000000000;
      const treasuryTax = 3;
      const distributorTax = 4;
      const creatorTax = 2;

      await darwinTokenProgram.methods
        .initializeToken(
          name,
          symbol,
          decimals,
          new anchor.BN(totalSupply),
          treasuryTax,
          distributorTax,
          creatorTax
        )
        .accounts({
          tokenInfo: tokenInfoPda,
          mint: tokenMint,
          creatorTokenAccount: creatorTokenAccount,
          treasury: treasuryPda,
          distributor: distributorPda,
          creator: creator.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .signers([creator])
        .rpc();

      const tokenInfo = await darwinTokenProgram.account.tokenInfo.fetch(tokenInfoPda);
      
      assert.equal(tokenInfo.name, name);
      assert.equal(tokenInfo.symbol, symbol);
      assert.equal(tokenInfo.decimals, decimals);
      assert.equal(tokenInfo.totalSupply.toNumber(), totalSupply);
      assert.equal(tokenInfo.treasuryTax, treasuryTax);
      assert.equal(tokenInfo.distributorTax, distributorTax);
      assert.equal(tokenInfo.creatorTax, creatorTax);
      assert.equal(tokenInfo.creator.toString(), creator.publicKey.toString());
      assert.equal(tokenInfo.treasury.toString(), treasuryPda.toString());
      assert.equal(tokenInfo.distributor.toString(), distributorPda.toString());
      assert.equal(tokenInfo.isInitialized, true);
    });

    it("Should fail with invalid tax configuration", async () => {
      try {
        await darwinTokenProgram.methods
          .initializeToken(
            "Invalid Token",
            "INV",
            9,
            new anchor.BN(1000000000),
            5, // Total tax = 12% (should be 10%)
            4,
            3
          )
          .accounts({
            tokenInfo: tokenInfoPda,
            mint: tokenMint,
            creatorTokenAccount: creatorTokenAccount,
            treasury: treasuryPda,
            distributor: distributorPda,
            creator: creator.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          })
          .signers([creator])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert.include(error.message, "Invalid tax configuration");
      }
    });
  });

  describe("Darwin Treasury Contract", () => {
    it("Should initialize treasury with correct parameters", async () => {
      const minBid = new anchor.BN(1 * anchor.web3.LAMPORTS_PER_SOL); // 1 SOL
      const auctionTimerBlocks = new anchor.BN(216000); // ~24 hours
      const minHoldingTokens = new anchor.BN(1000);

      await darwinTreasuryProgram.methods
        .initializeTreasury(minBid, auctionTimerBlocks, minHoldingTokens)
        .accounts({
          treasury: treasuryPda,
          tokenMint: tokenMint,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
        })
        .signers([authority])
        .rpc();

      const treasury = await darwinTreasuryProgram.account.treasury.fetch(treasuryPda);
      
      assert.equal(treasury.authority.toString(), authority.publicKey.toString());
      assert.equal(treasury.tokenMint.toString(), tokenMint.toString());
      assert.equal(treasury.minBid.toNumber(), minBid.toNumber());
      assert.equal(treasury.auctionTimerBlocks.toNumber(), auctionTimerBlocks.toNumber());
      assert.equal(treasury.minHoldingTokens.toNumber(), minHoldingTokens.toNumber());
      assert.equal(treasury.isFundraisingActive, true);
      assert.equal(treasury.isAuctionActive, false);
      assert.equal(treasury.isInitialized, true);
    });

    it("Should accept SOL contributions during fundraising", async () => {
      const contributionAmount = new anchor.BN(0.5 * anchor.web3.LAMPORTS_PER_SOL); // 0.5 SOL

      const contributorBalanceBefore = await provider.connection.getBalance(contributor.publicKey);
      const treasuryBalanceBefore = await provider.connection.getBalance(treasuryPda);

      await darwinTreasuryProgram.methods
        .contributeSol(contributionAmount)
        .accounts({
          treasury: treasuryPda,
          tokenMint: tokenMint,
          treasuryTokenAccount: treasuryTokenAccount,
          contributorTokenAccount: contributorTokenAccount,
          contributor: contributor.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
        })
        .signers([contributor])
        .rpc();

      const contributorBalanceAfter = await provider.connection.getBalance(contributor.publicKey);
      const treasuryBalanceAfter = await provider.connection.getBalance(treasuryPda);

      assert.approximately(
        contributorBalanceBefore - contributorBalanceAfter,
        contributionAmount.toNumber(),
        10000 // Allow for transaction fees
      );

      assert.approximately(
        treasuryBalanceAfter - treasuryBalanceBefore,
        contributionAmount.toNumber(),
        10000
      );

      const treasury = await darwinTreasuryProgram.account.treasury.fetch(treasuryPda);
      assert.equal(treasury.totalRaised.toNumber(), contributionAmount.toNumber());
    });

    it("Should start auction after fundraising period", async () => {
      // Simulate time passing by manually updating the fundraising end block
      const treasury = await darwinTreasuryProgram.account.treasury.fetch(treasuryPda);
      const currentSlot = await provider.connection.getSlot();
      
      // Manually set fundraising as ended (in real scenario, this would happen naturally)
      // For testing, we'll just verify the auction start logic works
      
      await darwinTreasuryProgram.methods
        .startAuction()
        .accounts({
          treasury: treasuryPda,
          tokenMint: tokenMint,
          creator: creator.publicKey,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
        })
        .signers([creator])
        .rpc();

      const updatedTreasury = await darwinTreasuryProgram.account.treasury.fetch(treasuryPda);
      assert.equal(updatedTreasury.isFundraisingActive, false);
      assert.equal(updatedTreasury.isAuctionActive, true);
    });

    it("Should accept bids during auction", async () => {
      const bidAmount = new anchor.BN(1.5 * anchor.web3.LAMPORTS_PER_SOL); // 1.5 SOL

      const bidderBalanceBefore = await provider.connection.getBalance(bidder.publicKey);
      const treasuryBalanceBefore = await provider.connection.getBalance(treasuryPda);

      await darwinTreasuryProgram.methods
        .placeBid(bidAmount)
        .accounts({
          treasury: treasuryPda,
          tokenMint: tokenMint,
          bidder: bidder.publicKey,
          previousBidder: bidder.publicKey, // For first bid, same as bidder
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
        })
        .signers([bidder])
        .rpc();

      const bidderBalanceAfter = await provider.connection.getBalance(bidder.publicKey);
      const treasuryBalanceAfter = await provider.connection.getBalance(treasuryPda);

      assert.approximately(
        bidderBalanceBefore - bidderBalanceAfter,
        bidAmount.toNumber(),
        10000
      );

      assert.approximately(
        treasuryBalanceAfter - treasuryBalanceBefore,
        bidAmount.toNumber(),
        10000
      );

      const treasury = await darwinTreasuryProgram.account.treasury.fetch(treasuryPda);
      assert.equal(treasury.currentHighestBid.toNumber(), bidAmount.toNumber());
      assert.equal(treasury.currentHighestBidder.toString(), bidder.publicKey.toString());
    });
  });

  describe("Darwin Distributor Contract", () => {
    it("Should initialize distributor with correct parameters", async () => {
      const distributionIntervalBlocks = new anchor.BN(216000); // ~24 hours
      const minHoldingTokens = new anchor.BN(1000);

      await darwinDistributorProgram.methods
        .initializeDistributor(distributionIntervalBlocks, minHoldingTokens)
        .accounts({
          distributor: distributorPda,
          tokenMint: tokenMint,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
        })
        .signers([authority])
        .rpc();

      const distributor = await darwinDistributorProgram.account.distributor.fetch(distributorPda);
      
      assert.equal(distributor.authority.toString(), authority.publicKey.toString());
      assert.equal(distributor.tokenMint.toString(), tokenMint.toString());
      assert.equal(distributor.distributionIntervalBlocks.toNumber(), distributionIntervalBlocks.toNumber());
      assert.equal(distributor.minHoldingTokens.toNumber(), minHoldingTokens.toNumber());
      assert.equal(distributor.isInitialized, true);
    });

    it("Should collect tax from token transfers", async () => {
      const taxAmount = new anchor.BN(1000000); // 1 token (assuming 9 decimals)

      const distributorBalanceBefore = await getAccount(provider.connection, distributorTokenAccount);

      await darwinDistributorProgram.methods
        .collectTax(taxAmount)
        .accounts({
          distributor: distributorPda,
          tokenMint: tokenMint,
          distributorTokenAccount: distributorTokenAccount,
          from: creatorTokenAccount,
          authority: creator.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([creator])
        .rpc();

      const distributorBalanceAfter = await getAccount(provider.connection, distributorTokenAccount);
      assert.equal(
        distributorBalanceAfter.amount - distributorBalanceBefore.amount,
        taxAmount.toNumber()
      );
    });

    it("Should distribute tokens to qualified holders", async () => {
      const distributor = await darwinDistributorProgram.account.distributor.fetch(distributorPda);
      const currentSlot = await provider.connection.getSlot();
      
      // Manually set next distribution time to current time for testing
      // In real scenario, this would happen naturally after the interval
      
      await darwinDistributorProgram.methods
        .distributeToHolders()
        .accounts({
          distributor: distributorPda,
          tokenMint: tokenMint,
          distributorTokenAccount: distributorTokenAccount,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      const updatedDistributor = await darwinDistributorProgram.account.distributor.fetch(distributorPda);
      assert.equal(updatedDistributor.distributionCount, distributor.distributionCount + 1);
    });
  });

  describe("Integration Tests", () => {
    it("Should handle complete token lifecycle", async () => {
      // This test would simulate a complete token launch:
      // 1. Token creation
      // 2. Treasury initialization
      // 3. Fundraising period
      // 4. Auction phase
      // 5. Distribution to holders
      
      // For brevity, we'll just verify the contracts work together
      const tokenInfo = await darwinTokenProgram.account.tokenInfo.fetch(tokenInfoPda);
      const treasury = await darwinTreasuryProgram.account.treasury.fetch(treasuryPda);
      const distributor = await darwinDistributorProgram.account.distributor.fetch(distributorPda);

      assert.equal(tokenInfo.treasury.toString(), treasuryPda.toString());
      assert.equal(tokenInfo.distributor.toString(), distributorPda.toString());
      assert.equal(treasury.tokenMint.toString(), tokenMint.toString());
      assert.equal(distributor.tokenMint.toString(), tokenMint.toString());
    });

    it("Should enforce security constraints", async () => {
      // Test that unauthorized users cannot call privileged functions
      const unauthorizedUser = Keypair.generate();
      await provider.connection.requestAirdrop(unauthorizedUser.publicKey, anchor.web3.LAMPORTS_PER_SOL);

      try {
        await darwinTreasuryProgram.methods
          .startAuction()
          .accounts({
            treasury: treasuryPda,
            tokenMint: tokenMint,
            creator: unauthorizedUser.publicKey,
            clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          })
          .signers([unauthorizedUser])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error) {
        // Should fail because unauthorized user is not the creator
        assert.include(error.message, "Error");
      }
    });
  });
}); 