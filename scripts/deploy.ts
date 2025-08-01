import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, LAMPORTS_PER_SOL, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createMint, createAccount, mintTo } from "@solana/spl-token";
import { DarwinToken } from "../target/types/darwin_token";
import { DarwinTreasury } from "../target/types/darwin_treasury";
import { DarwinDistributor } from "../target/types/darwin_distributor";

async function main() {
  console.log("🚀 Starting Darwin Platform Deployment...");

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const darwinToken = anchor.workspace.DarwinToken as Program<DarwinToken>;
  const darwinTreasury = anchor.workspace.DarwinTreasury as Program<DarwinTreasury>;
  const darwinDistributor = anchor.workspace.DarwinDistributor as Program<DarwinDistributor>;

  // Create deployment keypairs
  const authority = Keypair.generate();
  const creator = Keypair.generate();
  const treasuryWallet = Keypair.generate();
  const distributorWallet = Keypair.generate();

  console.log("📋 Generated deployment keypairs:");
  console.log(`Authority: ${authority.publicKey.toString()}`);
  console.log(`Creator: ${creator.publicKey.toString()}`);
  console.log(`Treasury: ${treasuryWallet.publicKey.toString()}`);
  console.log(`Distributor: ${distributorWallet.publicKey.toString()}`);

  // Airdrop SOL to authority for deployment
  console.log("💰 Requesting SOL airdrop for deployment...");
  const airdropSig = await provider.connection.requestAirdrop(
    authority.publicKey,
    10 * LAMPORTS_PER_SOL
  );
  await provider.connection.confirmTransaction(airdropSig);
  console.log("✅ SOL airdrop received");

  // Create token mint
  console.log("🪙 Creating token mint...");
  const tokenMint = await createMint(
    provider.connection,
    authority,
    authority.publicKey,
    null,
    9 // 9 decimals
  );
  console.log(`✅ Token mint created: ${tokenMint.toString()}`);

  // Create token accounts
  console.log("🏦 Creating token accounts...");
  const authorityTokenAccount = await createAccount(
    provider.connection,
    authority,
    tokenMint,
    authority.publicKey
  );

  const creatorTokenAccount = await createAccount(
    provider.connection,
    authority,
    tokenMint,
    creator.publicKey
  );

  const treasuryTokenAccount = await createAccount(
    provider.connection,
    authority,
    tokenMint,
    treasuryWallet.publicKey
  );

  const distributorTokenAccount = await createAccount(
    provider.connection,
    authority,
    tokenMint,
    distributorWallet.publicKey
  );

  console.log("✅ Token accounts created");

  // Mint initial supply
  console.log("🪙 Minting initial token supply...");
  await mintTo(
    provider.connection,
    authority,
    tokenMint,
    authorityTokenAccount,
    authority,
    1_000_000_000_000 // 1 billion tokens
  );
  console.log("✅ Initial supply minted");

  // Derive state account addresses
  const [tokenState] = PublicKey.findProgramAddressSync(
    [Buffer.from("token_state"), tokenMint.toBuffer()],
    darwinToken.programId
  );

  const [treasuryState] = PublicKey.findProgramAddressSync(
    [Buffer.from("treasury_state"), tokenMint.toBuffer()],
    darwinTreasury.programId
  );

  const [distributorState] = PublicKey.findProgramAddressSync(
    [Buffer.from("distributor_state"), tokenMint.toBuffer()],
    darwinDistributor.programId
  );

  console.log("📊 State account addresses:");
  console.log(`Token State: ${tokenState.toString()}`);
  console.log(`Treasury State: ${treasuryState.toString()}`);
  console.log(`Distributor State: ${distributorState.toString()}`);

  // Deploy Token Contract
  console.log("🔧 Deploying Token Contract...");
  try {
    await darwinToken.methods
      .initializeToken(
        "Darwin Token",
        "DARWIN",
        new anchor.BN(1_000_000_000_000),
        5, // 5% treasury tax
        3, // 3% distributor tax
        2, // 2% creator tax
      )
      .accounts({
        tokenState: tokenState,
        mint: tokenMint,
        authority: authority.publicKey,
        authorityTokenAccount: authorityTokenAccount,
        creatorTokenAccount: creatorTokenAccount,
        treasury: treasuryTokenAccount,
        distributor: distributorTokenAccount,
        creator: creatorTokenAccount,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([authority])
      .rpc();

    console.log("✅ Token Contract deployed successfully");
  } catch (error) {
    console.error("❌ Token Contract deployment failed:", error);
    throw error;
  }

  // Deploy Treasury Contract
  console.log("🏛️ Deploying Treasury Contract...");
  try {
    await darwinTreasury.methods
      .initializeTreasury(
        new anchor.BN(1 * LAMPORTS_PER_SOL), // 1 SOL minimum bid
        new anchor.BN(1000), // 1000 blocks timer duration
        new anchor.BN(1_000_000_000), // 1B tokens minimum holding
      )
      .accounts({
        treasuryState: treasuryState,
        tokenMint: tokenMint,
        authority: authority.publicKey,
        treasuryWallet: treasuryWallet.publicKey,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([authority])
      .rpc();

    console.log("✅ Treasury Contract deployed successfully");
  } catch (error) {
    console.error("❌ Treasury Contract deployment failed:", error);
    throw error;
  }

  // Deploy Distributor Contract
  console.log("📦 Deploying Distributor Contract...");
  try {
    await darwinDistributor.methods
      .initializeDistributor(
        new anchor.BN(216_000), // 24 hours in blocks
        new anchor.BN(1_000_000_000), // 1B tokens minimum holding
      )
      .accounts({
        distributorState: distributorState,
        tokenMint: tokenMint,
        authority: authority.publicKey,
        distributorWallet: distributorWallet.publicKey,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([authority])
      .rpc();

    console.log("✅ Distributor Contract deployed successfully");
  } catch (error) {
    console.error("❌ Distributor Contract deployment failed:", error);
    throw error;
  }

  // Verify deployment
  console.log("🔍 Verifying deployment...");
  try {
    const tokenStateData = await darwinToken.account.tokenState.fetch(tokenState);
    const treasuryStateData = await darwinTreasury.account.treasuryState.fetch(treasuryState);
    const distributorStateData = await darwinDistributor.account.distributorState.fetch(distributorState);

    console.log("✅ Deployment verification successful:");
    console.log(`Token Name: ${tokenStateData.name}`);
    console.log(`Token Symbol: ${tokenStateData.symbol}`);
    console.log(`Treasury Active: ${treasuryStateData.isFundraisingActive}`);
    console.log(`Distributor Active: ${distributorStateData.isActive}`);
  } catch (error) {
    console.error("❌ Deployment verification failed:", error);
    throw error;
  }

  // Save deployment info
  const deploymentInfo = {
    network: provider.connection.rpcEndpoint,
    tokenMint: tokenMint.toString(),
    tokenState: tokenState.toString(),
    treasuryState: treasuryState.toString(),
    distributorState: distributorState.toString(),
    authority: authority.publicKey.toString(),
    creator: creator.publicKey.toString(),
    treasuryWallet: treasuryWallet.publicKey.toString(),
    distributorWallet: distributorWallet.publicKey.toString(),
    authorityTokenAccount: authorityTokenAccount.toString(),
    creatorTokenAccount: creatorTokenAccount.toString(),
    treasuryTokenAccount: treasuryTokenAccount.toString(),
    distributorTokenAccount: distributorTokenAccount.toString(),
    deploymentTime: new Date().toISOString(),
  };

  console.log("📄 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Save to file
  const fs = require('fs');
  fs.writeFileSync(
    'deployment-info.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("💾 Deployment info saved to deployment-info.json");

  console.log("🎉 Darwin Platform deployment completed successfully!");
  console.log("🔗 Next steps:");
  console.log("1. Update frontend configuration with new addresses");
  console.log("2. Run integration tests");
  console.log("3. Conduct security audit");
  console.log("4. Deploy to mainnet-beta");
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exit(1);
}); 