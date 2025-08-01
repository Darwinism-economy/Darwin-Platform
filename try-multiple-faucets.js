// Try multiple faucets to get test SOL
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

const TESTNET_URL = 'https://api.testnet.solana.com';
const connection = new Connection(TESTNET_URL, 'confirmed');

async function tryMultipleFaucets() {
    const walletAddress = '2bF4wtscAJ3ysky5qmqc5XoaorafDNWW918JxRq7dVA3';
    const publicKey = new PublicKey(walletAddress);
    
    console.log('🔑 Trying to get test SOL for wallet:', walletAddress);
    
    // Check current balance
    const currentBalance = await connection.getBalance(publicKey);
    console.log('💰 Current balance:', (currentBalance / LAMPORTS_PER_SOL).toFixed(4), 'SOL');
    
    if (currentBalance > 0.1 * LAMPORTS_PER_SOL) {
        console.log('✅ Already have sufficient SOL!');
        return;
    }
    
    console.log('\n🪙 The Solana faucet is rate-limited. Here are your options:');
    console.log('\n1. **SolFaucet (Recommended)**');
    console.log('   - Go to: https://solfaucet.com/');
    console.log('   - Connect your Phantom wallet');
    console.log('   - Click "Request SOL"');
    
    console.log('\n2. **QuickNode Faucet**');
    console.log('   - Go to: https://faucet.quicknode.com/solana/testnet');
    console.log('   - Enter your address:', walletAddress);
    console.log('   - Click "Request SOL"');
    
    console.log('\n3. **Manual Solana Faucet**');
    console.log('   - Go to: https://faucet.solana.com/');
    console.log('   - Enter your address:', walletAddress);
    console.log('   - Try without GitHub (sometimes works)');
    
    console.log('\n💡 Once you get test SOL, run: node deploy-with-phantom.js');
}

tryMultipleFaucets(); 