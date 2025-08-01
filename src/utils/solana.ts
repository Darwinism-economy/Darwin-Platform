import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Keypair,
  sendAndConfirmTransaction,
} from '@solana/web3.js'
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  transfer,
  getAccount,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token'

// Testnet connection
export const connection = new Connection(
  'https://api.testnet.solana.com',
  'confirmed'
)

// Helper function to create a new token mint
export async function createTokenMint(
  payer: Keypair,
  mintAuthority: PublicKey,
  freezeAuthority: PublicKey | null,
  decimals: number
): Promise<PublicKey> {
  const mint = await createMint(
    connection,
    payer,
    mintAuthority,
    freezeAuthority,
    decimals,
    undefined,
    undefined,
    TOKEN_PROGRAM_ID
  )
  
  console.log('Token mint created:', mint.toBase58())
  return mint
}

// Helper function to create token account
export async function createTokenAccount(
  payer: Keypair,
  mint: PublicKey,
  owner: PublicKey
): Promise<PublicKey> {
  const tokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    owner,
    undefined,
    undefined,
    undefined,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  )
  
  console.log('Token account created:', tokenAccount.address.toBase58())
  return tokenAccount.address
}

// Helper function to mint tokens
export async function mintTokens(
  payer: Keypair,
  mint: PublicKey,
  destination: PublicKey,
  authority: Keypair,
  amount: number
): Promise<string> {
  const signature = await mintTo(
    connection,
    payer,
    mint,
    destination,
    authority,
    amount
  )
  
  console.log('Tokens minted:', signature)
  return signature
}

// Helper function to transfer tokens
export async function transferTokens(
  payer: Keypair,
  source: PublicKey,
  destination: PublicKey,
  owner: Keypair,
  amount: number
): Promise<string> {
  const signature = await transfer(
    connection,
    payer,
    source,
    destination,
    owner,
    amount
  )
  
  console.log('Tokens transferred:', signature)
  return signature
}

// Helper function to get token balance
export async function getTokenBalance(
  tokenAccount: PublicKey
): Promise<number> {
  const account = await getAccount(connection, tokenAccount)
  return Number(account.amount)
}

// Helper function to get SOL balance
export async function getSolBalance(
  publicKey: PublicKey
): Promise<number> {
  const balance = await connection.getBalance(publicKey)
  return balance / LAMPORTS_PER_SOL
}

// Helper function to send SOL
export async function sendSol(
  from: Keypair,
  to: PublicKey,
  amount: number
): Promise<string> {
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: from.publicKey,
      toPubkey: to,
      lamports: amount * LAMPORTS_PER_SOL,
    })
  )
  
  const signature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [from]
  )
  
  console.log('SOL sent:', signature)
  return signature
}

// Helper function to request airdrop (for testing)
export async function requestAirdrop(
  publicKey: PublicKey,
  amount: number = 1
): Promise<string> {
  const signature = await connection.requestAirdrop(
    publicKey,
    amount * LAMPORTS_PER_SOL
  )
  
  await connection.confirmTransaction(signature)
  console.log('Airdrop received:', signature)
  return signature
}

// Helper function to format public key for display
export function formatPublicKey(publicKey: string | PublicKey): string {
  const key = typeof publicKey === 'string' ? publicKey : publicKey.toBase58()
  return `${key.slice(0, 4)}...${key.slice(-4)}`
}

// Helper function to validate public key
export function isValidPublicKey(key: string): boolean {
  try {
    new PublicKey(key)
    return true
  } catch {
    return false
  }
} 