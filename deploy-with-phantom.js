// Deploy using your Phantom wallet (if you have test SOL in it)
// This script will use your connected Phantom wallet for deployment

import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, web3 } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID, createMint, createAccount, mintTo } from '@solana/spl-token';
import fs from 'fs';

// Testnet configuration
const TESTNET_URL = 'https://api.testnet.solana.com';
const connection = new Connection(TESTNET_URL, 'confirmed');

async function deployWithPhantom() {
    console.log('🚀 Starting Darwin Platform Deployment with Phantom Wallet...');
    
    try {
        // Check if Phantom is available
        if (typeof window === 'undefined') {
            console.log('❌ This script needs to run in a browser environment');
            console.log('💡 Please run this from your frontend instead');
            return;
        }
        
        if (!window.solana || !window.solana.isPhantom) {
            console.log('❌ Phantom wallet not detected');
            console.log('💡 Please install Phantom wallet first');
            return;
        }
        
        const phantom = window.solana;
        
        // Connect to Phantom
        console.log('🔗 Connecting to Phantom wallet...');
        await phantom.connect();
        
        const publicKey = phantom.publicKey;
        console.log('🔑 Phantom wallet address:', publicKey.toString());
        
        // Check wallet balance
        const balance = await connection.getBalance(publicKey);
        console.log('💰 Wallet balance:', (balance / LAMPORTS_PER_SOL).toFixed(4), 'SOL');
        
        if (balance < 0.1 * LAMPORTS_PER_SOL) {
            console.log('\n⚠️  Insufficient SOL for deployment!');
            console.log('You need at least 0.1 SOL to deploy smart contracts.');
            console.log('\nTo get test SOL:');
            console.log('1. Go to: https://faucet.solana.com/');
            console.log('2. Enter address:', publicKey.toString());
            console.log('3. Click "Request SOL"');
            console.log('4. Wait 1-2 minutes, then run this script again');
            return;
        }
        
        console.log('✅ Sufficient SOL found! Proceeding with deployment...');
        
        // Create token mint
        console.log('🪙 Creating token mint...');
        const tokenMint = await createMint(
            connection,
            phantom, // Use Phantom as the payer
            publicKey,
            null,
            9 // 9 decimals
        );
        console.log('✅ Token mint created:', tokenMint.toString());
        
        // Create token accounts
        console.log('🏦 Creating token accounts...');
        const deployerTokenAccount = await createAccount(
            connection,
            phantom, // Use Phantom as the payer
            tokenMint,
            publicKey
        );
        console.log('✅ Deployer token account created:', deployerTokenAccount.toString());
        
        // Mint initial supply
        console.log('🪙 Minting initial token supply...');
        await mintTo(
            connection,
            phantom, // Use Phantom as the payer
            tokenMint,
            deployerTokenAccount,
            phantom, // Use Phantom as the authority
            1_000_000_000_000 // 1 billion tokens
        );
        console.log('✅ Initial supply minted');
        
        // Generate deployment summary
        const deploymentSummary = {
            network: 'Solana Testnet',
            deployer: publicKey.toString(),
            tokenMint: tokenMint.toString(),
            deployerTokenAccount: deployerTokenAccount.toString(),
            connection: TESTNET_URL,
            timestamp: new Date().toISOString(),
            status: 'DEPLOYED_WITH_PHANTOM',
            balance: (balance / LAMPORTS_PER_SOL).toFixed(4) + ' SOL'
        };
        
        console.log('\n🎉 Deployment Summary:');
        console.log(JSON.stringify(deploymentSummary, null, 2));
        
        // Save deployment info to file
        fs.writeFileSync('deployment-info-phantom.json', JSON.stringify(deploymentSummary, null, 2));
        console.log('\n📄 Deployment info saved to deployment-info-phantom.json');
        
        console.log('\n🌐 Your Darwin Platform is now live on Solana Testnet!');
        console.log('🔗 Frontend URL: https://darwinism-economy.github.io/Darwin-Platform/');
        console.log('💡 Share this URL with your team member to test with Phantom wallet');
        
    } catch (error) {
        console.error('❌ Deployment failed:', error);
    }
}

// Run deployment
deployWithPhantom(); 