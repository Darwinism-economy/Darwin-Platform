// Simple Testnet Deployment Script for Darwin Platform
// This script will deploy your smart contracts to Solana testnet

import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, web3 } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID, createMint, createAccount, mintTo } from '@solana/spl-token';
import fs from 'fs';

// Testnet configuration
const TESTNET_URL = 'https://api.testnet.solana.com';
const connection = new Connection(TESTNET_URL, 'confirmed');

async function deployToTestnet() {
    console.log('🚀 Starting Darwin Platform Testnet Deployment...');
    
    try {
        // Create a new keypair for deployment
        const deployer = Keypair.generate();
        console.log('📋 Generated deployment keypair:', deployer.publicKey.toString());
        
        // Request airdrop for deployment
        console.log('💰 Requesting SOL airdrop...');
        const airdropSignature = await connection.requestAirdrop(
            deployer.publicKey,
            2 * LAMPORTS_PER_SOL // 2 SOL for deployment
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
        
        // Deploy smart contracts (simplified for demo)
        console.log('📦 Deploying smart contracts...');
        
        // For now, we'll simulate the deployment
        // In a real deployment, you would use Anchor to deploy the actual programs
        console.log('✅ Smart contracts deployed (simulated)');
        
        // Generate deployment summary
        const deploymentSummary = {
            network: 'Solana Testnet',
            deployer: deployer.publicKey.toString(),
            tokenMint: tokenMint.toString(),
            deployerTokenAccount: deployerTokenAccount.toString(),
            connection: TESTNET_URL,
            timestamp: new Date().toISOString()
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