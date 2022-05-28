// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy

  const [deployer, addr1, addr2] = await ethers.getSigners();

  const vrfCoordinator = "0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed"

  //1000 gwei
  const keyHash = "0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f"

  const subscriptionId = 276



  const PixelNFT = await ethers.getContractFactory("PixelNFT");
  const cPixelNFT = await PixelNFT.deploy(
    "PixelNFT",
    "PIXEL",
    "http://localhost:3000/api/metadata/",
    BigInt('10000000000000000'),
    BigInt('75000000000')

  )
  await cPixelNFT.deployed();

  console.log("cPixelNFT deployed to:", cPixelNFT.address);

  let PixelMainframe = await ethers.getContractFactory("PixelMainframe");
  let cPixelMainframe = await PixelMainframe.deploy(
    cPixelNFT.address,
    vrfCoordinator,
    subscriptionId,
    keyHash,
    BigInt("2")
  )
  await cPixelMainframe.deployed();
  console.log("cPixelMainframe deployed to:", cPixelMainframe.address);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
