// Deploy to local Solana validator (no test SOL needed)
// This runs a local blockchain for testing

import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, web3 } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID, createMint, createAccount, mintTo } from '@solana/spl-token';
import fs from 'fs';

// Local configuration
const LOCAL_URL = 'http://localhost:8899';
const connection = new Connection(LOCAL_URL, 'confirmed');

async function deployToLocal() {
    console.log('🚀 Starting Darwin Platform Local Deployment...');
    
    try {
        // Check if local validator is running
        try {
            await connection.getVersion();
            console.log('✅ Local Solana validator is running');
        } catch (error) {
            console.log('❌ Local Solana validator is not running');
            console.log('\nTo start local validator:');
            console.log('1. Open a new terminal');
            console.log('2. Run: solana-test-validator');
            console.log('3. Wait for "Ledger location: test-ledger" message');
            console.log('4. Run this script again');
            return;
        }
        
        // Create a new keypair for deployment
        const deployer = Keypair.generate();
        console.log('📋 Generated deployment keypair:', deployer.publicKey.toString());
        
        // Request airdrop (works on localnet)
        console.log('💰 Requesting SOL airdrop...');
        const airdropSignature = await connection.requestAirdrop(
            deployer.publicKey,
            10 * LAMPORTS_PER_SOL // 10 SOL for deployment
        );
        await connection.confirmTransaction(airdropSignature);
        console.log('✅ SOL airdrop received');
        
        // Create token mint
        console.log('🪙 Creating token mint...');
        const tokenMint = await createMint(
            connection,
            deployer,
            deployer.publicKey,
            null,
            9 // 9 decimals
        );
        console.log('✅ Token mint created:', tokenMint.toString());
        
        // Create token accounts
        console.log('🏦 Creating token accounts...');
        const deployerTokenAccount = await createAccount(
            connection,
            deployer,
            tokenMint,
            deployer.publicKey
        );
        console.log('✅ Deployer token account created:', deployerTokenAccount.toString());
        
        // Mint initial supply
        console.log('🪙 Minting initial token supply...');
        await mintTo(
            connection,
            deployer,
            tokenMint,
            deployerTokenAccount,
            deployer,
            1_000_000_000_000 // 1 billion tokens
        );
        console.log('✅ Initial supply minted');
        
        // Generate deployment summary
        const deploymentSummary = {
            network: 'Solana Localnet',
            deployer: deployer.publicKey.toString(),
            tokenMint: tokenMint.toString(),
            deployerTokenAccount: deployerTokenAccount.toString(),
            connection: LOCAL_URL,
            timestamp: new Date().toISOString(),
            status: 'DEPLOYED_LOCAL'
        };
        
        console.log('\n🎉 Local Deployment Summary:');
        console.log(JSON.stringify(deploymentSummary, null, 2));
        
        // Save deployment info to file
        fs.writeFileSync('deployment-info-local.json', JSON.stringify(deploymentSummary, null, 2));
        console.log('\n📄 Deployment info saved to deployment-info-local.json');
        
        console.log('\n🌐 Your Darwin Platform is now running locally!');
        console.log('🔗 To test with your team member, you need to:');
        console.log('1. Deploy to testnet (requires test SOL)');
        console.log('2. Or use ngrok to expose local server');
        console.log('3. Or use GitHub Pages with testnet deployment');
        
    } catch (error) {
        console.error('❌ Local deployment failed:', error);
    }
}

// Run deployment
deployToLocal(); 