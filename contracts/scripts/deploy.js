const hre = require("hardhat");

async function main() {
  console.log("Deploying BattleArenaBadges contract...");
  
  // Base URI for metadata (update with your IPFS or server URL)
  const baseURI = process.env.BADGE_BASE_URI || "https://battle-arena.xyz/api/badges/";
  
  const BattleArenaBadges = await hre.ethers.getContractFactory("BattleArenaBadges");
  const contract = await BattleArenaBadges.deploy(baseURI);
  
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  
  console.log("BattleArenaBadges deployed to:", address);
  console.log("\nSave this address to your .env file:");
  console.log(`BADGE_CONTRACT_ADDRESS=${address}`);
  
  // Wait for a few block confirmations before verifying
  if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
    console.log("\nWaiting for block confirmations...");
    await contract.deploymentTransaction().wait(5);
    
    console.log("Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: address,
        constructorArguments: [baseURI],
      });
      console.log("Contract verified!");
    } catch (error) {
      console.log("Verification failed:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });




