import { Contract, JsonRpcProvider, Wallet } from "ethers";

const DEFAULT_ABI = ["function verifyUser(address user) external"]; 

export class ChainService {
  private readonly disabled = process.env.CHAIN_VERIFY_DISABLED === "true";

  async verifyUser(walletAddress: string) {
    if (this.disabled) {
      return;
    }

    const rpcUrl = process.env.CHAIN_RPC_URL ?? "";
    const privateKey = process.env.CHAIN_PRIVATE_KEY ?? "";
    const contractAddress = process.env.CHAIN_CONTRACT_ADDRESS ?? "";

    if (!rpcUrl || !privateKey || !contractAddress) {
      throw new Error("Chain configuration missing for allowlisting");
    }

    const abi = process.env.CHAIN_CONTRACT_ABI
      ? JSON.parse(process.env.CHAIN_CONTRACT_ABI)
      : DEFAULT_ABI;

    const provider = new JsonRpcProvider(rpcUrl);
    const signer = new Wallet(privateKey, provider);
    const contract = new Contract(contractAddress, abi, signer);

    const tx = await contract.verifyUser(walletAddress);
    await tx.wait();
  }
}
