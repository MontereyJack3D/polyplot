import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

const NFT_CONTRACT =
  (process.env.NFT_CONTRACT_ADDRESS as `0x${string}` | undefined) ||
  '0xbad6186e92002e312078b5a1dafd5ddf63d3f731';

const ERC721_ABI = [
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const client = createPublicClient({
  chain: mainnet,
  transport: http(
    process.env.NEXT_PUBLIC_ALCHEMY_ID
      ? `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_ID}`
      : undefined
  ),
});

export async function checkNFTOwnership(walletAddress: string): Promise<boolean> {
  try {
    const balance = await client.readContract({
      address: NFT_CONTRACT,
      abi: ERC721_ABI,
      functionName: 'balanceOf',
      args: [walletAddress.toLowerCase() as `0x${string}`],
    });

    return balance > 0n;
  } catch (error) {
    console.error('NFT gate check error:', error);
    return false;
  }
}
