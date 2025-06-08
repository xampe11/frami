import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import fs from "fs-extra";
import path from "path";
import glob from "glob";
//import deployment from "../deployments/foundernft-mainnet.json";

interface founderNftDeploymentData {
  network: string;
  blockNumber: number;
  timestamp: number;
  founderNFT: {
    proxy: string;
    implementation: string;
    extensionType: string;
  };
  platformRegistry?: string;
}
interface platformRegistryDeploymentData {
  network: string;
  blockNumber: number;
  timestamp: number;
  PlatformRegistry: {
    proxy: string;
    implementation: string;
  };
}

interface ContractConfig {
  network: string;
  chainId: number;
  blockNumber: number;
  timestamp: number;
  contracts: {
    FounderNFT: {
      address: string;
      implementation: string;
      abi?: any[];
    };
    PlatformRegistry: {
      address: string;
      abi?: any[];
    };
  };
  constants: {
    FOUNDER_NFT_EXTENSION: string;
  };
}

interface UpdateOptions {
  frontendDir: string;
  outputDir: string;
  founderNftDeploymentFile?: string;
  network?: string;
}

class FrontendUpdater {
  private hre: HardhatRuntimeEnvironment;
  private options: UpdateOptions;

  constructor(hre: HardhatRuntimeEnvironment, options: UpdateOptions) {
    this.hre = hre;
    this.options = options;
  }

  async run(): Promise<void> {
    console.log("🚀 Starting frontend update process...\n");

    try {
      // Load deployment data
      const [founderNftDeploymentData, platformRegistryDeploymentData] =
        await this.loadfounderNftDeploymentData();
      console.log(
        `✓ Loaded deployment data for ${founderNftDeploymentData.network}`
      );

      // Generate contract configuration
      await this.generateContractConfig(
        founderNftDeploymentData,
        platformRegistryDeploymentData
      );

      // Copy contract ABIs
      await this.copyContractABIs();

      // Generate TypeScript types
      await this.generateTypeScriptTypes(founderNftDeploymentData);

      console.log("\n✅ Frontend update completed successfully!");
      console.log("\nGenerated files:");
      console.log(`📁 ${this.options.frontendDir}/${this.options.outputDir}/`);
      console.log("  ├── config.ts");
      console.log("  ├── contracts.json");
      console.log("  ├── addresses.ts");
      console.log("  ├── abis/");
      console.log("  │   ├── FounderNFT.json");
      console.log("  │   └── ERC1967Proxy.json");
      console.log("  └── types/");
      console.log("      └── contracts.ts");
    } catch (error) {
      console.error("❌ Error updating frontend:", error);
      throw error;
    }
  }

  private async loadfounderNftDeploymentData(): Promise<
    [founderNftDeploymentData, platformRegistryDeploymentData]
  > {
    console.log("📄 Loading deployment data...");

    let founderNftDeploymentFile: string;
    let platformRegisrtyDeploymentFile: string;

    founderNftDeploymentFile = await this.findLatestDeployment();
    platformRegisrtyDeploymentFile =
      await this.findLatestPlatformRegistryDeployment();

    if (!fs.existsSync(founderNftDeploymentFile)) {
      throw new Error(`Deployment file not found: ${founderNftDeploymentFile}`);
    }

    console.log(
      `   Using FounderNFTdeployment file: ${founderNftDeploymentFile}`
    );
    console.log(
      `   Using PlatformRegistrydeployment file: ${platformRegisrtyDeploymentFile}`
    );

    const foundeNftDeploymentContent = await fs.readJSON(
      founderNftDeploymentFile
    );

    console.log("Converted founder to Json files successfully.");

    const platformRegistryDeploymentContent = await fs.readJSON(
      platformRegisrtyDeploymentFile
    );

    console.log("Converted platform to Json files successfully.");

    // Validate required fields
    if (!foundeNftDeploymentContent.founderNFT?.proxy) {
      throw new Error("Invalid deployment file: missing founderNFT.proxy");
    }
    if (!platformRegistryDeploymentContent.PlatformRegistry?.proxy) {
      throw new Error(
        "Invalid deployment file: missing platformRegistry.proxy"
      );
    }

    return [foundeNftDeploymentContent, platformRegistryDeploymentContent] as [
      founderNftDeploymentData,
      platformRegistryDeploymentData
    ];
  }

  private async findLatestDeployment(network?: string): Promise<string> {
    const patterns = [
      `deployments/foundernft-${network || "*"}.json`,
      `broadcast/**/foundernft-${network || "*"}-*.json`,
      `deployments/**/foundernft-${network || "*"}.json`,
    ];

    for (const pattern of patterns) {
      const files = glob.sync(pattern);
      if (files.length > 0) {
        // Return the most recent file
        const sortedFiles = files
          .map((file) => ({
            path: file,
            mtime: fs.statSync(file).mtime,
          }))
          .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

        return sortedFiles[0].path;
      }
    }

    throw new Error(
      `No deployment files found for network: ${network || "any"}`
    );
  }

  private async findLatestPlatformRegistryDeployment(
    network?: string
  ): Promise<string> {
    const patterns = [
      `deployments/platformregistry-${network || "*"}.json`,
      `broadcast/**/platformregistry-${network || "*"}-*.json`,
      `deployments/**/platformregistry-${network || "*"}.json`,
    ];

    for (const pattern of patterns) {
      const files = glob.sync(pattern);
      if (files.length > 0) {
        // Return the most recent file
        const sortedFiles = files
          .map((file) => ({
            path: file,
            mtime: fs.statSync(file).mtime,
          }))
          .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

        return sortedFiles[0].path;
      }
    }

    throw new Error(
      `No deployment files found for network: ${network || "any"}`
    );
  }

  private async generateContractConfig(
    founderData: founderNftDeploymentData,
    platformRegistryData: platformRegistryDeploymentData
  ): Promise<void> {
    console.log("⚙️  Generating contract configuration...");

    const chainId = this.getChainId(founderData.network);

    // Load ABIs
    const founderNFTABI = await this.loadContractABI("FounderNFT");
    const platformRegistryABI = await this.loadContractABI(
      "PlatformRegistry"
    ).catch(() => []);

    const config: ContractConfig = {
      network: founderData.network,
      chainId,
      blockNumber: founderData.blockNumber,
      timestamp: founderData.timestamp,
      contracts: {
        FounderNFT: {
          address: founderData.founderNFT.proxy,
          implementation: founderData.founderNFT.implementation,
          abi: founderNFTABI,
        },
        PlatformRegistry: {
          address: platformRegistryData.PlatformRegistry.implementation || "",
          abi: platformRegistryABI,
        },
      },
      constants: {
        FOUNDER_NFT_EXTENSION: founderData.founderNFT.extensionType,
      },
    };

    const outputPath = path.join(
      this.options.frontendDir,
      this.options.outputDir
    );
    await fs.ensureDir(outputPath);

    // Generate TyepeScript config
    const TsConfig = this.generateJSConfig(config);
    await fs.writeFile(path.join(outputPath, "config.ts"), TsConfig);
    console.log("   ✓ Generated TyepeScript config");

    // Generate JSON config
    await fs.writeJSON(path.join(outputPath, "contracts.json"), config, {
      spaces: 2,
    });
    console.log("   ✓ Generated JSON config");

    // Generate TypeScript addresses file
    const addressesTS = this.generateAddressesTS(config);
    await fs.writeFile(path.join(outputPath, "addresses.ts"), addressesTS);
    console.log("   ✓ Generated addresses TypeScript file");
  }

  private async copyContractABIs(): Promise<void> {
    console.log("📋 Copying contract ABIs...");

    const abiOutputPath = path.join(
      this.options.frontendDir,
      this.options.outputDir,
      "abis"
    );
    await fs.ensureDir(abiOutputPath);

    const contracts = [
      "FounderNFT",
      "ERC1967Proxy",
      "PlatformRegistry",
      "IERC20",
    ];

    for (const contractName of contracts) {
      try {
        const abi = await this.loadContractABI(contractName);
        await fs.writeJSON(
          path.join(abiOutputPath, `${contractName}.json`),
          abi,
          { spaces: 2 }
        );
        console.log(`   ✓ Copied ${contractName}.json`);
      } catch (error) {
        console.log(`   ⚠️  ${contractName} ABI not found`);
      }
    }
  }

  private async loadContractABI(contractName: string): Promise<any[]> {
    // Try different paths where ABIs might be located
    const possiblePaths = [
      `artifacts/contracts/${contractName}.sol/${contractName}.json`,
      `artifacts/contracts/**/${contractName}.sol/${contractName}.json`,
      `artifacts/@openzeppelin/contracts/**/${contractName}.json`,
      `artifacts/@openzeppelin/contracts-upgradeable/**/${contractName}.json`,
      `out/${contractName}.sol/${contractName}.json`, // Foundry output
      `cache/solidity-files-cache.json`, // Try to extract from cache
    ];

    for (const possiblePath of possiblePaths) {
      try {
        if (possiblePath.includes("**")) {
          const files = glob.sync(possiblePath);
          if (files.length > 0) {
            const artifact = await fs.readJSON(files[0]);
            return artifact.abi;
          }
        } else {
          const artifact = await fs.readJSON(possiblePath);
          return artifact.abi;
        }
      } catch (error) {
        // Continue to next path
      }
    }

    throw new Error(`ABI not found for contract: ${contractName}`);
  }

  private async generateTypeScriptTypes(
    data: founderNftDeploymentData
  ): Promise<void> {
    console.log("📝 Generating TypeScript types...");

    const typesOutputPath = path.join(
      this.options.frontendDir,
      this.options.outputDir,
      "types"
    );
    await fs.ensureDir(typesOutputPath);

    const typesContent = this.generateTypeScriptContent(data);
    await fs.writeFile(
      path.join(typesOutputPath, "contracts.ts"),
      typesContent
    );
    console.log("   ✓ Generated TypeScript types");
  }

  private generateJSConfig(config: ContractConfig): string {
    return `// Auto-generated contract configuration
// Generated at: ${new Date().toISOString()}
// Network: ${config.network}

export const contractConfig = ${JSON.stringify(config, null, 2)};

export const ADDRESSES = {
  FOUNDER_NFT: "${config.contracts.FounderNFT.address}",
  FOUNDER_NFT_IMPLEMENTATION: "${config.contracts.FounderNFT.implementation}",
  PLATFORM_REGISTRY: "${config.contracts.PlatformRegistry.address}"
};

export const CHAIN_ID = ${config.chainId};
export const NETWORK = "${config.network}";
`;
  }

  private generateAddressesTS(config: ContractConfig): string {
    return `// Auto-generated contract addresses
// Generated at: ${new Date().toISOString()}
// Network: ${config.network}

export const FOUNDER_NFT_ADDRESS = "${
      config.contracts.FounderNFT.address
    }" as const;
export const FOUNDER_NFT_IMPLEMENTATION = "${
      config.contracts.FounderNFT.implementation
    }" as const;
export const PLATFORM_REGISTRY_ADDRESS = "${
      config.contracts.PlatformRegistry.address
    }" as const;

export const CONTRACT_ADDRESSES = {
  FOUNDER_NFT: FOUNDER_NFT_ADDRESS,
  FOUNDER_NFT_IMPLEMENTATION: FOUNDER_NFT_IMPLEMENTATION,
  PLATFORM_REGISTRY: PLATFORM_REGISTRY_ADDRESS,
} as const;

export const NETWORK = "${config.network}" as const;
export const CHAIN_ID = ${config.chainId} as const;

export type ContractAddresses = typeof CONTRACT_ADDRESSES;
export type SupportedNetwork = typeof NETWORK;
export type SupportedChainId = typeof CHAIN_ID;
`;
  }

  private generateEnvContent(data: founderNftDeploymentData): string {
    return `# Contract Addresses - Auto-generated
# Generated at: ${new Date().toISOString()}
# Network: ${data.network}

NEXT_PUBLIC_FOUNDER_NFT_ADDRESS=${data.founderNFT.proxy}
NEXT_PUBLIC_FOUNDER_NFT_IMPLEMENTATION=${data.founderNFT.implementation}
NEXT_PUBLIC_PLATFORM_REGISTRY_ADDRESS=${data.platformRegistry || ""}
NEXT_PUBLIC_NETWORK=${data.network}
NEXT_PUBLIC_CHAIN_ID=${this.getChainId(data.network)}
NEXT_PUBLIC_BLOCK_NUMBER=${data.blockNumber}
`;
  }

  private generateTypeScriptContent(data: founderNftDeploymentData): string {
    return `// Auto-generated contract types
// Generated at: ${new Date().toISOString()}
// Network: ${data.network}

export interface ContractAddresses {
  FOUNDER_NFT: string;
  FOUNDER_NFT_IMPLEMENTATION: string;
  PLATFORM_REGISTRY: string;
}

export interface DeploymentInfo {
  network: string;
  chainId: number;
  blockNumber: number;
  timestamp: number;
}

export const NETWORK = "${data.network}" as const;
export const CHAIN_ID = ${this.getChainId(data.network)} as const;

export type SupportedNetwork = "${data.network}";
export type SupportedChainId = ${this.getChainId(data.network)};

export const CONTRACT_ADDRESSES: ContractAddresses = {
  FOUNDER_NFT: "${data.founderNFT.proxy}",
  FOUNDER_NFT_IMPLEMENTATION: "${data.founderNFT.implementation}",
  PLATFORM_REGISTRY: "${data.platformRegistry || ""}"
};

export const DEPLOYMENT_INFO: DeploymentInfo = {
  network: "${data.network}",
  chainId: ${this.getChainId(data.network)},
  blockNumber: ${data.blockNumber},
  timestamp: ${data.timestamp}
};
`;
  }

  private getChainId(network: string): number {
    const chainIds: Record<string, number> = {
      mainnet: 1,
      sepolia: 11155111,
      holesky: 17000,
      polygon: 137,
      optimism: 10,
      arbitrum: 42161,
      base: 8453,
      localhost: 31337,
      hardhat: 31337,
    };

    return chainIds[network] || 1;
  }
}

// Hardhat task definition
task(
  "update-frontend",
  "Update frontend with deployed contract addresses and ABIs"
)
  .addOptionalParam("frontendDir", "Frontend directory path", "../frontend")
  .addOptionalParam(
    "outputDir",
    "Output directory within frontend",
    "src/contracts"
  )
  .addOptionalParam(
    "founderNftDeploymentFile",
    "Specific deployment file to use"
  )
  .addOptionalParam("targetNetwork", "Network to find latest deployment for")
  .setAction(async (taskArgs, hre) => {
    const updater = new FrontendUpdater(hre, {
      frontendDir: taskArgs.frontendDir,
      outputDir: taskArgs.outputDir,
      founderNftDeploymentFile: taskArgs.founderNftDeploymentFile,
      network: taskArgs.targetNetwork,
    });

    await updater.run();
  });

// Script for direct execution
async function main() {
  const { network } = require("hardhat");

  const updater = new FrontendUpdater(require("hardhat"), {
    frontendDir: process.env.FRONTEND_DIR || "../frontend",
    outputDir: process.env.OUTPUT_DIR || "src/contracts",
    founderNftDeploymentFile: process.env.DEPLOYMENT_FILE,
    network: process.env.NETWORK || network.name,
  });

  await updater.run();
}

// Run if called directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { FrontendUpdater };
