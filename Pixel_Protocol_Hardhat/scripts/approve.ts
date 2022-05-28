// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
import { addresses } from "./addresses"


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


    await cPixelNFT.approve(addresses[1], 1);




    console.log("Approved: " + await cPixelNFT.getApproved(1))


}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
