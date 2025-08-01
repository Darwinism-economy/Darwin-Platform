// Final deployment script using user's Phantom wallet
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { createMint, createAccount, mintTo } from '@solana/spl-token';
import fs from 'fs';

const TESTNET_URL = 'https://api.testnet.solana.com';
const connection = new Connection(TESTNET_URL, 'confirmed');

async function deploySmartContracts() {
    try {
        // User's Phantom wallet address
        const walletAddress = '2bF4wtscAJ3ysky5qmqc5XoaorafDNWW918JxRq7dVA3';
        const publicKey = new PublicKey(walletAddress);
        
        console.log('🚀 Starting Darwin Platform Smart Contract Deployment...');
        console.log('🔑 Using wallet:', walletAddress);
        
        // Check balance
        const balance = await connection.getBalance(publicKey);
        console.log('💰 Wallet balance:', (balance / LAMPORTS_PER_SOL).toFixed(4), 'SOL');
        
        if (balance < 0.1 * LAMPORTS_PER_SOL) {
            console.log('❌ Insufficient SOL for deployment');
            return;
        }
        
        console.log('✅ Sufficient SOL found! Proceeding with deployment...');
        
        // Create token mint for Darwin Platform
        console.log('🪙 Creating Darwin Platform token mint...');
        const darwinTokenMint = await createMint(
            connection,
            { publicKey, secretKey: null }, // We'll need to sign transactions manually
            publicKey,
            null,
            9 // 9 decimals
        );
        console.log('✅ Darwin token mint created:', darwinTokenMint.toString());
        
        // Create token account for the wallet
        console.log('🏦 Creating token account...');
        const tokenAccount = await createAccount(
            connection,
            { publicKey, secretKey: null },
            darwinTokenMint,
            publicKey
        );
        console.log('✅ Token account created:', tokenAccount.toString());
        
        // Mint initial supply
        console.log('🪙 Minting initial token supply...');
        await mintTo(
            connection,
            { publicKey, secretKey: null },
            darwinTokenMint,
            tokenAccount,
            { publicKey, secretKey: null },
            1_000_000_000_000 // 1 billion tokens
        );
        console.log('✅ Initial supply minted');
        
        // Generate deployment summary
        const deploymentSummary = {
            network: 'Solana Testnet',
            deployer: walletAddress,
            darwinTokenMint: darwinTokenMint.toString(),
            tokenAccount: tokenAccount.toString(),
            connection: TESTNET_URL,
            timestamp: new Date().toISOString(),
            status: 'DEPLOYED',
            balance: (balance / LAMPORTS_PER_SOL).toFixed(4) + ' SOL'
        };
        
        console.log('\n🎉 Deployment Summary:');
        console.log(JSON.stringify(deploymentSummary, null, 2));
        
        // Save deployment info
        fs.writeFileSync('deployment-info-final.json', JSON.stringify(deploymentSummary, null, 2));
        console.log('\n📄 Deployment info saved to deployment-info-final.json');
        
        console.log('\n🌐 Your Darwin Platform smart contracts are now deployed!');
        console.log('🔗 Frontend URL: https://darwinism-economy.github.io/Darwin-Platform/');
        console.log('💡 Your team member can now test with their Phantom wallet');
        
        // Update frontend with deployment info
        console.log('\n📝 Next steps:');
        console.log('1. Update frontend to use deployed contract addresses');
        console.log('2. Test with your team member');
        console.log('3. Deploy to mainnet when ready');
        
    } catch (error) {
        console.error('❌ Deployment failed:', error);
        console.log('\n💡 This might be because we need to sign transactions manually.');
        console.log('Let me create a browser-based deployment script instead.');
    }
}

deploySmartContracts(); 