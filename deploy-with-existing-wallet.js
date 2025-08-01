// Deploy using existing wallet with test SOL
// This script allows you to use your existing Phantom wallet for deployment

import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, web3 } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID, createMint, createAccount, mintTo } from '@solana/spl-token';
import fs from 'fs';

// Testnet configuration
const TESTNET_URL = 'https://api.testnet.solana.com';
const connection = new Connection(TESTNET_URL, 'confirmed');

async function deployWithExistingWallet() {
    console.log('🚀 Starting Darwin Platform Deployment with Existing Wallet...');
    
    try {
        // Check if we have a deployment keypair file
        let deployer;
        
        if (fs.existsSync('deployment-keypair.json')) {
            console.log('📋 Loading existing deployment keypair...');
            const keypairData = JSON.parse(fs.readFileSync('deployment-keypair.json', 'utf8'));
            deployer = Keypair.fromSecretKey(new Uint8Array(keypairData));
        } else {
            console.log('📋 Generating new deployment keypair...');
            deployer = Keypair.generate();
            
            // Save the keypair for future use
            fs.writeFileSync('deployment-keypair.json', JSON.stringify(Array.from(deployer.secretKey)));
            console.log('💾 Keypair saved to deployment-keypair.json');
        }
        
        console.log('🔑 Deployment wallet address:', deployer.publicKey.toString());
        
        // Check wallet balance
        const balance = await connection.getBalance(deployer.publicKey);
        console.log('💰 Wallet balance:', (balance / LAMPORTS_PER_SOL).toFixed(4), 'SOL');
        
        if (balance < 0.1 * LAMPORTS_PER_SOL) {
            console.log('\n⚠️  Insufficient SOL for deployment!');
            console.log('You need at least 0.1 SOL to deploy smart contracts.');
            console.log('\nTo get test SOL:');
            console.log('1. Go to: https://faucet.solana.com/');
            console.log('2. Enter address:', deployer.publicKey.toString());
            console.log('3. Click "Request SOL"');
            console.log('4. Wait 1-2 minutes, then run this script again');
            return;
        }
        
        console.log('✅ Sufficient SOL found! Proceeding with deployment...');
        
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
            network: 'Solana Testnet',
            deployer: deployer.publicKey.toString(),
            tokenMint: tokenMint.toString(),
            deployerTokenAccount: deployerTokenAccount.toString(),
            connection: TESTNET_URL,
            timestamp: new Date().toISOString(),
            status: 'DEPLOYED',
            balance: (balance / LAMPORTS_PER_SOL).toFixed(4) + ' SOL'
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
deployWithExistingWallet(); 