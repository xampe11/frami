import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import fs from "fs-extra";
import path from "path";
import glob from "glob";
import yaml from "js-yaml";

interface DeploymentData {
  network: string;
  chainId: number;
  deploymentBlock: number;
  deploymentTimestamp: number;
  deployer: string;
  treasury: string;
  contracts: {
    platformRegistry: {
      implementation: string;
      proxy: string;
      abi: any[];
    };
    founderNFT: {
      implementation: string;
      proxy: string;
      abi: any[];
    };
  };
  configuration?: {
    platformFeePercentage: number;
    maxSupply: number;
    price: string;
    minimumStakingPeriod: number;
    salesActive: boolean;
    platformFeeDistributionPercentage: number;
    daoTokenAllocationPercentage: number;
  };
}

interface UpdateOptions {
  frontendDir: string;
  frontendOutputDir: string;
  backendDir: string;
  backendOutputDir: string;
  founderNftDeploymentFile?: string;
  network?: string;
}

class FrontAndBackendUpdater {
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
      const [deploymentData] = await this.loadfounderNftDeploymentData();
      console.log(`✓ Loaded deployment data for ${deploymentData.network}`);

      // Generate contract configuration
      await this.generateContractConfig(deploymentData);

      // Copy contract ABIs
      await this.copyContractABIs();

      // Generate TypeScript types
      await this.generateTypeScriptTypes(deploymentData);

      // Update subgraph configuration
      await this.updateSubgraphConfig(deploymentData);

      console.log("\n✅ Frontend update completed successfully!");
      console.log("\nGenerated files:");
      console.log(
        `📁 ${this.options.frontendDir}/${this.options.frontendOutputDir}/`
      );
      console.log("  ├── config.ts");
      console.log("  ├── contracts.json");
      console.log("  ├── addresses.ts");
      console.log("  ├── abis/");
      console.log("  │   ├── FounderNFT.json");
      console.log("  │   └── ERC1967Proxy.json");
      console.log("  └── types/");
      console.log("      └── contracts.ts");
      console.log("📊 Updated subgraph.yaml with new contract address");
    } catch (error) {
      console.error("❌ Error updating frontend:", error);
      throw error;
    }
  }

  private async loadfounderNftDeploymentData(): Promise<[DeploymentData]> {
    console.log("📄 Loading deployment data...");

    const deploymentFile = await this.findLatestDeployment("localhost");

    if (!fs.existsSync(deploymentFile)) {
      throw new Error(`Deployment file not found: ${deploymentFile}`);
    }

    console.log(`   deployment file: ${deploymentFile}`);

    const DeploymentContent = await fs.readJSON(deploymentFile);

    console.log("Converted deployment file to Json files successfully.");

    // Validate required fields
    if (!DeploymentContent.contracts.founderNFT?.proxy) {
      throw new Error("Invalid deployment file: missing founderNFT.proxy");
    }
    if (!DeploymentContent.contracts.platformRegistry?.proxy) {
      throw new Error(
        "Invalid deployment file: missing platformRegistry.proxy"
      );
    }

    console.log(DeploymentContent.blockNumber);
    console.log(DeploymentContent.deploymentTimestamp);

    return [DeploymentContent] as [DeploymentData];
  }

  private async findLatestDeployment(network?: string): Promise<string> {
    const patterns = [`./deployments/phase1-${network || "*"}-latest.json`];

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
    const patterns = [`./deployments/phase1-${network || "*"}-latest.json`];

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
    deploymentData: DeploymentData
  ): Promise<void> {
    console.log("⚙️  Generating contract configuration...");

    const chainId = this.getChainId(deploymentData.network);

    // Load ABIs
    const founderNFTABI = await this.loadContractABI("FounderNFT");
    const platformRegistryABI = await this.loadContractABI(
      "PlatformRegistry"
    ).catch(() => []);

    const config: DeploymentData = {
      network: deploymentData.network,
      chainId,
      deploymentBlock: deploymentData.deploymentBlock,
      deploymentTimestamp: deploymentData.deploymentTimestamp,
      contracts: {
        founderNFT: {
          proxy: deploymentData.contracts.founderNFT.proxy,
          implementation: deploymentData.contracts.founderNFT.implementation,
          abi: founderNFTABI,
        },
        platformRegistry: {
          implementation:
            deploymentData.contracts.platformRegistry.implementation || "",
          proxy: deploymentData.contracts.platformRegistry.proxy,
          abi: platformRegistryABI,
        },
      },
      deployer: "",
      treasury: "",
    };

    const outputPath = path.join(
      this.options.frontendDir,
      this.options.frontendOutputDir
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

    const backendAbiOutputPath = path.join(
      this.options.backendDir,
      this.options.backendOutputDir
    );
    await fs.ensureDir(backendAbiOutputPath);

    const frontendAbiOutputPath = path.join(
      this.options.frontendDir,
      this.options.frontendOutputDir,
      "abis"
    );
    await fs.ensureDir(frontendAbiOutputPath);

    const contracts = ["FounderNFT", "ERC1967Proxy", "PlatformRegistry"];

    for (const contractName of contracts) {
      try {
        const abi = await this.loadContractABI(contractName);
        await fs.writeJSON(
          path.join(backendAbiOutputPath, `${contractName}.json`),
          abi,
          { spaces: 2 }
        );
        console.log(`   ✓ Copied ${contractName}.json to backend`);
        await fs.writeJSON(
          path.join(frontendAbiOutputPath, `${contractName}.json`),
          abi,
          { spaces: 2 }
        );
        console.log(`   ✓ Copied ${contractName}.json to frontend`);
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

  private async updateSubgraphConfig(
    deploymentData: DeploymentData
  ): Promise<void> {
    console.log("📊 Updating subgraph configuration...");

    const subgraphPath = path.join(process.cwd(), "../graphql/subgraph.yaml");

    try {
      // Check if subgraph.yaml exists
      if (!fs.existsSync(subgraphPath)) {
        console.log("   ⚠️  subgraph.yaml not found, skipping subgraph update");
        return;
      }

      // Read the current subgraph.yaml
      const subgraphContent = await fs.readFile(subgraphPath, "utf-8");

      // Parse YAML
      const subgraphConfig = yaml.load(subgraphContent) as any;

      // Update the address in dataSources
      if (subgraphConfig.dataSources) {
        for (const dataSource of subgraphConfig.dataSources) {
          if (dataSource.source) {
            const oldAddress = dataSource.source.address;
            const oldBlock = dataSource.source.startBlock;
            dataSource.source.address =
              deploymentData.contracts.founderNFT.proxy;
            dataSource.source.startBlock = deploymentData.deploymentBlock;
            console.log(
              `   ✓ Updated dataSource address from ${oldAddress} to ${deploymentData.contracts.founderNFT.proxy}`
            );
            console.log(
              `   ✓ Updated dataSource startingBlock from ${oldBlock} to ${dataSource.source.startBlock}`
            );
          }
          deploymentData.deploymentBlock;
        }
      } else {
        console.log("   ⚠️  No dataSources found in subgraph.yaml");
        return;
      }

      // Write back the updated YAML
      const updatedYaml = yaml.dump(subgraphConfig, {
        indent: 2,
        lineWidth: -1, // Disable line wrapping
        noRefs: true,
        sortKeys: false,
      });

      await fs.writeFile(subgraphPath, updatedYaml, "utf-8");
      console.log("   ✓ Updated subgraph.yaml successfully");
    } catch (error) {
      console.error("   ❌ Error updating subgraph.yaml:", error);
      // Don't throw here, just log the error so the rest of the process continues
    }
  }

  private async generateTypeScriptTypes(data: DeploymentData): Promise<void> {
    console.log("📝 Generating TypeScript types...");

    const typesOutputPath = path.join(
      this.options.frontendDir,
      this.options.frontendOutputDir,
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

  private generateJSConfig(config: DeploymentData): string {
    return `// Auto-generated contract configuration
// Generated at: ${new Date().toISOString()}
// Network: ${config.network}

export const contractConfig = ${JSON.stringify(config, null, 2)};

export const ADDRESSES = {
  FOUNDER_NFT: "${config.contracts.founderNFT.proxy}",
  FOUNDER_NFT_IMPLEMENTATION: "${config.contracts.founderNFT.implementation}",
  PLATFORM_REGISTRY: "${config.contracts.platformRegistry.proxy}"
};

export const CHAIN_ID = ${config.chainId};
export const NETWORK = "${config.network}";
`;
  }

  private generateAddressesTS(config: DeploymentData): string {
    return `// Auto-generated contract addresses
// Generated at: ${new Date().toISOString()}
// Network: ${config.network}

export const FOUNDER_NFT_ADDRESS = "${
      config.contracts.founderNFT.proxy
    }" as const;
export const FOUNDER_NFT_IMPLEMENTATION = "${
      config.contracts.founderNFT.implementation
    }" as const;
export const PLATFORM_REGISTRY_ADDRESS = "${
      config.contracts.platformRegistry.proxy
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
  private generateTypeScriptContent(data: DeploymentData): string {
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
  deploymentBlock: number;
  deploymentTimestamp: number;
}

export const NETWORK = "${data.network}" as const;
export const CHAIN_ID = ${this.getChainId(data.network)} as const;

export type SupportedNetwork = "${data.network}";
export type SupportedChainId = ${this.getChainId(data.network)};

export const CONTRACT_ADDRESSES: ContractAddresses = {
  FOUNDER_NFT: "${data.contracts.founderNFT.proxy}",
  FOUNDER_NFT_IMPLEMENTATION: "${data.contracts.founderNFT.implementation}",
  PLATFORM_REGISTRY: "${data.contracts.platformRegistry.proxy || ""}"
};

export const DEPLOYMENT_INFO: DeploymentInfo = {
  network: "${data.network}",
  chainId: ${this.getChainId(data.network)},
  deploymentBlock: ${data.deploymentBlock},
  deploymentTimestamp: ${data.deploymentTimestamp}
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
    "frontendOutputDir",
    "Output directory within frontend",
    "src/contracts"
  )
  .addOptionalParam(
    "founderNftDeploymentFile",
    "Specific deployment file to use"
  )
  .addOptionalParam("targetNetwork", "Network to find latest deployment for")
  .setAction(async (taskArgs, hre) => {
    const updater = new FrontAndBackendUpdater(hre, {
      frontendDir: taskArgs.frontendDir,
      frontendOutputDir: taskArgs.frontendOutputDir,
      backendDir: taskArgs.backendDir,
      backendOutputDir: taskArgs.backendOutputDir,
      founderNftDeploymentFile: taskArgs.founderNftDeploymentFile,
      network: taskArgs.targetNetwork,
    });

    await updater.run();
  });

// Script for direct execution
async function main() {
  const { network } = require("hardhat");

  const updater = new FrontAndBackendUpdater(require("hardhat"), {
    frontendDir: process.env.FRONTEND_DIR || "../frontend",
    frontendOutputDir: process.env.FRONTEND_OUTPUT_DIR || "src/contracts",
    backendDir: process.env.BACKEND_DIR || "../backend",
    backendOutputDir: process.env.BACKEND_OUTPUT_DIR || "abis",
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

export { FrontAndBackendUpdater };
