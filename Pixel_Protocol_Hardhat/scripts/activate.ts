// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { addresses } from "./addresses"
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

    const PixelNFT = await ethers.getContractFactory("PixelNFT");
    const cPixelNFT = await PixelNFT.attach(addresses[0])

    const PixelMainframe = await ethers.getContractFactory("PixelMainframe");
    const cPixelMainframe = await PixelMainframe.attach(addresses[1])

    const ownerAddress = await cPixelNFT.getContractOwner();
    console.log("Owner address: ", ownerAddress);

    await cPixelNFT.enableMinting();

    const mintingEnabled = await cPixelNFT.isMintingEnabled();
    console.log("Minting Enabled")
    console.log(mintingEnabled)

    await cPixelMainframe.setStatus(1);
    console.log("Active Status")
    console.log(await cPixelMainframe.getStatus())


}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
