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
    const fee = await cPixelNFT["getFee(uint256)"](1)

    await (cPixelMainframe.connect(addr1).battle(1, "0xababab", { value: fee }))
    console.log("battle success")


}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
