// Robust Testnet Deployment Script for Darwin Platform
// This script handles airdrop failures and provides better error handling

import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, web3 } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID, createMint, createAccount, mintTo } from '@solana/spl-token';
import fs from 'fs';

// Testnet configuration
const TESTNET_URL = 'https://api.testnet.solana.com';
const connection = new Connection(TESTNET_URL, 'confirmed');

async function requestAirdropWithRetry(publicKey, amount, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            console.log(`💰 Attempting airdrop ${i + 1}/${maxRetries}...`);
            const signature = await connection.requestAirdrop(publicKey, amount);
            await connection.confirmTransaction(signature);
            console.log('✅ Airdrop successful!');
            return true;
        } catch (error) {
            console.log(`❌ Airdrop attempt ${i + 1} failed:`, error.message);
            if (i < maxRetries - 1) {
                console.log('⏳ Waiting 5 seconds before retry...');
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }
    return false;
}

async function deployToTestnet() {
    console.log('🚀 Starting Darwin Platform Testnet Deployment...');
    
    try {
        // Create a new keypair for deployment
        const deployer = Keypair.generate();
        console.log('📋 Generated deployment keypair:', deployer.publicKey.toString());
        
        // Try to get SOL via airdrop
        const airdropSuccess = await requestAirdropWithRetry(
            deployer.publicKey,
            2 * LAMPORTS_PER_SOL
        );
        
        if (!airdropSuccess) {
            console.log('\n⚠️  Airdrop failed. You have two options:');
            console.log('1. Get test SOL manually:');
            console.log('   - Go to: https://faucet.solana.com/');
            console.log('   - Enter your address:', deployer.publicKey.toString());
            console.log('   - Click "Request SOL"');
            console.log('\n2. Use an existing wallet with SOL:');
            console.log('   - Import your Phantom wallet keypair');
            console.log('   - Make sure it has test SOL');
            
            console.log('\n📝 For now, we\'ll simulate the deployment...');
            
            // Generate deployment summary with simulated data
            const deploymentSummary = {
                network: 'Solana Testnet',
                deployer: deployer.publicKey.toString(),
                tokenMint: 'SIMULATED_TOKEN_MINT_ADDRESS',
                deployerTokenAccount: 'SIMULATED_TOKEN_ACCOUNT_ADDRESS',
                connection: TESTNET_URL,
                timestamp: new Date().toISOString(),
                status: 'SIMULATED - Need real SOL for actual deployment'
            };
            
            console.log('\n🎉 Simulated Deployment Summary:');
            console.log(JSON.stringify(deploymentSummary, null, 2));
            
            // Save deployment info to file
            fs.writeFileSync('deployment-info.json', JSON.stringify(deploymentSummary, null, 2));
            console.log('\n📄 Deployment info saved to deployment-info.json');
            
            console.log('\n🌐 Your Darwin Platform frontend is ready!');
            console.log('🔗 Frontend URL: https://darwinism-economy.github.io/Darwin-Platform/');
            console.log('💡 The frontend will work with Phantom wallet connection');
            console.log('🔧 Smart contracts need real SOL to deploy');
            
            return;
        }
        
        // Continue with actual deployment if airdrop succeeded
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
            network: 'Solana Testnet',
            deployer: deployer.publicKey.toString(),
            tokenMint: tokenMint.toString(),
            deployerTokenAccount: deployerTokenAccount.toString(),
            connection: TESTNET_URL,
            timestamp: new Date().toISOString(),
            status: 'DEPLOYED'
        };
        
        console.log('\n🎉 Deployment Summary:');
        console.log(JSON.stringify(deploymentSummary, null, 2));
        
        // Save deployment info to file
        fs.writeFileSync('deployment-info.json', JSON.stringify(deploymentSummary, null, 2));
        console.log('\n📄 Deployment info saved to deployment-info.json');
        
        console.log('\n🌐 Your Darwin Platform is now live on Solana Testnet!');
        console.log('🔗 Frontend URL: https://darwinism-economy.github.io/Darwin-Platform/');
        console.log('💡 Share this URL with your team member to test with Phantom wallet');
        
    } catch (error) {
        console.error('❌ Deployment failed:', error);
    }
}

// Run deployment
deployToTestnet(); 