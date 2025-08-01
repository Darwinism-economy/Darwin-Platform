// Check balance of deployment wallet
import { Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import fs from 'fs';

const TESTNET_URL = 'https://api.testnet.solana.com';
const connection = new Connection(TESTNET_URL, 'confirmed');

async function checkBalance() {
    try {
        if (fs.existsSync('deployment-keypair.json')) {
            const keypairData = JSON.parse(fs.readFileSync('deployment-keypair.json', 'utf8'));
            const { Keypair } = await import('@solana/web3.js');
            const deployer = Keypair.fromSecretKey(new Uint8Array(keypairData));
            
            console.log('🔑 Deployment wallet address:', deployer.publicKey.toString());
            
            const balance = await connection.getBalance(deployer.publicKey);
            console.log('💰 Wallet balance:', (balance / LAMPORTS_PER_SOL).toFixed(4), 'SOL');
            
            if (balance >= 0.1 * LAMPORTS_PER_SOL) {
                console.log('✅ Sufficient SOL for deployment!');
                console.log('🚀 Ready to deploy smart contracts');
            } else {
                console.log('❌ Insufficient SOL for deployment');
                console.log('💡 Get test SOL from: https://faucet.solana.com/');
            }
        } else {
            console.log('❌ No deployment keypair found');
        }
    } catch (error) {
        console.error('❌ Error checking balance:', error);
    }
}

checkBalance(); 