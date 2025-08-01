// Get test SOL for user's Phantom wallet
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

const TESTNET_URL = 'https://api.testnet.solana.com';
const connection = new Connection(TESTNET_URL, 'confirmed');

async function getTestSOL() {
    try {
        // User's Phantom wallet address
        const walletAddress = '2bF4wtscAJ3ysky5qmqc5XoaorafDNWW918JxRq7dVA3';
        const publicKey = new PublicKey(walletAddress);
        
        console.log('🔑 Requesting test SOL for wallet:', walletAddress);
        
        // Check current balance
        const currentBalance = await connection.getBalance(publicKey);
        console.log('💰 Current balance:', (currentBalance / LAMPORTS_PER_SOL).toFixed(4), 'SOL');
        
        // Request airdrop
        console.log('🪙 Requesting 2 SOL airdrop...');
        const airdropSignature = await connection.requestAirdrop(
            publicKey,
            2 * LAMPORTS_PER_SOL // 2 SOL
        );
        
        console.log('⏳ Waiting for confirmation...');
        await connection.confirmTransaction(airdropSignature);
        
        // Check new balance
        const newBalance = await connection.getBalance(publicKey);
        console.log('💰 New balance:', (newBalance / LAMPORTS_PER_SOL).toFixed(4), 'SOL');
        
        console.log('✅ Test SOL received successfully!');
        console.log('🚀 Ready to deploy smart contracts');
        
    } catch (error) {
        console.error('❌ Error getting test SOL:', error.message);
        
        if (error.message.includes('429')) {
            console.log('\n💡 The faucet is rate-limited. Try these alternatives:');
            console.log('1. https://solfaucet.com/');
            console.log('2. https://faucet.quicknode.com/solana/testnet');
        }
    }
}

getTestSOL(); 