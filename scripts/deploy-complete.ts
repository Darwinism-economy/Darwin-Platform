import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { DarwinToken } from "../target/types/darwin_token";
import { DarwinTreasury } from "../target/types/darwin_treasury";
import { DarwinDistributor } from "../target/types/darwin_distributor";
import { PublicKey, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createMint, createAccount, mintTo, getAccount } from "@solana/spl-token";
import * as fs from "fs";

async function main() {
    console.log("🚀 Starting Darwin Platform Deployment...");

    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const darwinTokenProgram = anchor.workspace.DarwinToken as Program<DarwinToken>;
    const darwinTreasuryProgram = anchor.workspace.DarwinTreasury as Program<DarwinTreasury>;
    const darwinDistributorProgram = anchor.workspace.DarwinDistributor as Program<DarwinDistributor>;

    // Generate deployment keypair
    const deployer = Keypair.generate();
    console.log(`📋 Deployer Public Key: ${deployer.publicKey.toString()}`);

    // Airdrop SOL to deployer
    console.log("💰 Requesting SOL airdrop...");
    const airdropSignature = await provider.connection.requestAirdrop(
        deployer.publicKey,
        10 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSignature);
    console.log("✅ SOL airdrop received");

    // Create token mint
    console.log("🪙 Creating token mint...");
    const tokenMint = await createMint(
        provider.connection,
        deployer,
        deployer.publicKey,
        null,
        9 // 9 decimals
    );
    console.log(`✅ Token mint created: ${tokenMint.toString()}`);

    // Create token accounts
    console.log("🏦 Creating token accounts...");
    const deployerTokenAccount = await createAccount(
        provider.connection,
        deployer,
        tokenMint,
        deployer.publicKey
    );
    console.log(`✅ Deployer token account: ${deployerTokenAccount.toString()}`);

    const treasuryTokenAccount = await createAccount(
        provider.connection,
        deployer,
        tokenMint,
        deployer.publicKey
    );
    console.log(`✅ Treasury token account: ${treasuryTokenAccount.toString()}`);

    const distributorTokenAccount = await createAccount(
        provider.connection,
        deployer,
        tokenMint,
        deployer.publicKey
    );
    console.log(`✅ Distributor token account: ${distributorTokenAccount.toString()}`);

    // Mint initial supply
    console.log("💎 Minting initial token supply...");
    const initialSupply = 1000000000000; // 1 billion tokens
    await mintTo(
        provider.connection,
        deployer,
        tokenMint,
        deployerTokenAccount,
        deployer,
        initialSupply
    );
    console.log(`✅ Initial supply minted: ${initialSupply} tokens`);

    // Find PDAs
    console.log("🔍 Finding Program Derived Addresses...");
    const [tokenInfoPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("token_info"), tokenMint.toBuffer()],
        darwinTokenProgram.programId
    );
    console.log(`✅ Token Info PDA: ${tokenInfoPda.toString()}`);

    const [treasuryPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("treasury"), tokenMint.toBuffer()],
        darwinTreasuryProgram.programId
    );
    console.log(`✅ Treasury PDA: ${treasuryPda.toString()}`);

    const [distributorPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("distributor"), tokenMint.toBuffer()],
        darwinDistributorProgram.programId
    );
    console.log(`✅ Distributor PDA: ${distributorPda.toString()}`);

    // Initialize Token Contract
    console.log("🎯 Initializing Token Contract...");
    const tokenName = "Darwin Platform Token";
    const tokenSymbol = "WIN";
    const decimals = 9;
    const treasuryTax = 3; // 3%
    const distributorTax = 4; // 4%
    const creatorTax = 2; // 2%

    try {
        await darwinTokenProgram.methods
            .initializeToken(
                tokenName,
                tokenSymbol,
                decimals,
                new anchor.BN(initialSupply),
                treasuryTax,
                distributorTax,
                creatorTax
            )
            .accounts({
                tokenInfo: tokenInfoPda,
                mint: tokenMint,
                creatorTokenAccount: deployerTokenAccount,
                treasury: treasuryPda,
                distributor: distributorPda,
                creator: deployer.publicKey,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
                rent: SYSVAR_RENT_PUBKEY,
            })
            .signers([deployer])
            .rpc();

        console.log("✅ Token contract initialized successfully");
    } catch (error) {
        console.error("❌ Token contract initialization failed:", error);
        throw error;
    }

    // Initialize Treasury Contract
    console.log("🏦 Initializing Treasury Contract...");
    const minBid = new anchor.BN(1 * anchor.web3.LAMPORTS_PER_SOL); // 1 SOL
    const auctionTimerBlocks = new anchor.BN(216000); // ~24 hours
    const minHoldingTokens = new anchor.BN(1000);

    try {
        await darwinTreasuryProgram.methods
            .initializeTreasury(minBid, auctionTimerBlocks, minHoldingTokens)
            .accounts({
                treasury: treasuryPda,
                tokenMint: tokenMint,
                authority: deployer.publicKey,
                systemProgram: SystemProgram.programId,
                clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
            })
            .signers([deployer])
            .rpc();

        console.log("✅ Treasury contract initialized successfully");
    } catch (error) {
        console.error("❌ Treasury contract initialization failed:", error);
        throw error;
    }

    // Initialize Distributor Contract
    console.log("📊 Initializing Distributor Contract...");
    const distributionIntervalBlocks = new anchor.BN(216000); // ~24 hours
    const distributorMinHolding = new anchor.BN(1000);

    try {
        await darwinDistributorProgram.methods
            .initializeDistributor(distributionIntervalBlocks, distributorMinHolding)
            .accounts({
                distributor: distributorPda,
                tokenMint: tokenMint,
                authority: deployer.publicKey,
                systemProgram: SystemProgram.programId,
                clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
            })
            .signers([deployer])
            .rpc();

        console.log("✅ Distributor contract initialized successfully");
    } catch (error) {
        console.error("❌ Distributor contract initialization failed:", error);
        throw error;
    }

    // Verify deployment
    console.log("🔍 Verifying deployment...");
    try {
        const tokenInfo = await darwinTokenProgram.account.tokenInfo.fetch(tokenInfoPda);
        const treasury = await darwinTreasuryProgram.account.treasury.fetch(treasuryPda);
        const distributor = await darwinDistributorProgram.account.distributor.fetch(distributorPda);

        console.log("✅ Token Info Verification:");
        console.log(`   Name: ${tokenInfo.name}`);
        console.log(`   Symbol: ${tokenInfo.symbol}`);
        console.log(`   Total Supply: ${tokenInfo.totalSupply.toString()}`);
        console.log(`   Treasury Tax: ${tokenInfo.treasuryTax}%`);
        console.log(`   Distributor Tax: ${tokenInfo.distributorTax}%`);
        console.log(`   Creator Tax: ${tokenInfo.creatorTax}%`);

        console.log("✅ Treasury Verification:");
        console.log(`   Min Bid: ${treasury.minBid.toString()} lamports`);
        console.log(`   Auction Timer: ${treasury.auctionTimerBlocks.toString()} blocks`);
        console.log(`   Fundraising Active: ${treasury.isFundraisingActive}`);
        console.log(`   Auction Active: ${treasury.isAuctionActive}`);

        console.log("✅ Distributor Verification:");
        console.log(`   Distribution Interval: ${distributor.distributionIntervalBlocks.toString()} blocks`);
        console.log(`   Min Holding: ${distributor.minHoldingTokens.toString()} tokens`);
        console.log(`   Total Distributed: ${distributor.totalDistributed.toString()}`);

    } catch (error) {
        console.error("❌ Deployment verification failed:", error);
        throw error;
    }

    // Save deployment info
    const deploymentInfo = {
        network: "testnet",
        timestamp: new Date().toISOString(),
        deployer: deployer.publicKey.toString(),
        tokenMint: tokenMint.toString(),
        tokenInfoPda: tokenInfoPda.toString(),
        treasuryPda: treasuryPda.toString(),
        distributorPda: distributorPda.toString(),
        deployerTokenAccount: deployerTokenAccount.toString(),
        treasuryTokenAccount: treasuryTokenAccount.toString(),
        distributorTokenAccount: distributorTokenAccount.toString(),
        tokenName,
        tokenSymbol,
        initialSupply,
        treasuryTax,
        distributorTax,
        creatorTax,
        minBid: minBid.toString(),
        auctionTimerBlocks: auctionTimerBlocks.toString(),
        minHoldingTokens: minHoldingTokens.toString(),
        distributionIntervalBlocks: distributionIntervalBlocks.toString(),
        programs: {
            darwinToken: darwinTokenProgram.programId.toString(),
            darwinTreasury: darwinTreasuryProgram.programId.toString(),
            darwinDistributor: darwinDistributorProgram.programId.toString(),
        }
    };

    fs.writeFileSync("deployment-info.json", JSON.stringify(deploymentInfo, null, 2));
    console.log("📄 Deployment info saved to deployment-info.json");

    // Generate frontend configuration
    const frontendConfig = {
        tokenMint: tokenMint.toString(),
        tokenInfoPda: tokenInfoPda.toString(),
        treasuryPda: treasuryPda.toString(),
        distributorPda: distributorPda.toString(),
        tokenName,
        tokenSymbol,
        initialSupply,
        network: "testnet"
    };

    fs.writeFileSync("frontend-config.json", JSON.stringify(frontendConfig, null, 2));
    console.log("🌐 Frontend configuration saved to frontend-config.json");

    console.log("\n🎉 Darwin Platform Deployment Complete!");
    console.log("\n📋 Deployment Summary:");
    console.log(`   Network: ${deploymentInfo.network}`);
    console.log(`   Token: ${tokenSymbol} (${tokenMint.toString()})`);
    console.log(`   Total Supply: ${initialSupply.toLocaleString()} tokens`);
    console.log(`   Treasury: ${treasuryPda.toString()}`);
    console.log(`   Distributor: ${distributorPda.toString()}`);
    console.log(`   Deployer: ${deployer.publicKey.toString()}`);

    console.log("\n🔗 Next Steps:");
    console.log("   1. Test the contracts using the test suite");
    console.log("   2. Update frontend with the new contract addresses");
    console.log("   3. Conduct security audit before mainnet deployment");
    console.log("   4. Set up monitoring and alerting systems");

    console.log("\n⚠️  Security Notes:");
    console.log("   - Keep the deployer private key secure");
    console.log("   - Conduct thorough testing before mainnet");
    console.log("   - Consider multi-signature governance");
    console.log("   - Monitor contract activity regularly");

    return deploymentInfo;
}

main()
    .then((deploymentInfo) => {
        console.log("\n✅ Deployment script completed successfully");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ Deployment script failed:", error);
        process.exit(1);
    }); 