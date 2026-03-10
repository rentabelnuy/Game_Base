const hre = require("hardhat");

async function main() {
  console.log("Deploying BattleArenaBadgesBaseV2 contract...");

  const baseURI = process.env.BADGE_BASE_URI || "https://battle-arena.xyz/api/badges/";
  const signer = process.env.BADGE_AUTHORIZED_SIGNER;

  if (!signer) {
    throw new Error("BADGE_AUTHORIZED_SIGNER is required");
  }

  const BattleArenaBadgesBaseV2 = await hre.ethers.getContractFactory("BattleArenaBadgesBaseV2");
  const contract = await BattleArenaBadgesBaseV2.deploy(baseURI, signer);

  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log("BattleArenaBadgesBaseV2 deployed to:", address);
  console.log("\nSave this address to your .env file:");
  console.log(`BADGE_CONTRACT_ADDRESS=${address}`);

  if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
    console.log("\nWaiting for block confirmations...");
    await contract.deploymentTransaction().wait(5);

    console.log("Verifying contract on explorer...");
    try {
      await hre.run("verify:verify", {
        address,
        constructorArguments: [baseURI, signer],
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
