import { initial } from "./initial"
import { addresses } from "./addresses";
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



    const PixelNFT = await ethers.getContractFactory("PixelNFT");
    const cPixelNFT = await PixelNFT.attach(addresses[0]);
    console.log(initial.x.length)
    const end = initial.x.length
    let round = 80
    /*while (25 * round + 24 <= end) {
        let lower = 25 * round
        let upper = lower + 24
        if (upper > end) {
            upper = end
        }
        try {
            await cPixelNFT.adminMint(initial.x.slice(lower, upper + 1),
                initial.y.slice(lower, upper + 1),
                initial.c.slice(lower, upper + 1))
            round += 1
        }
        catch (err) {
            console.log(err)
            round += 1
            continue;
        }
    }*/


    /*await cPixelNFT.adminMint(initial.x.slice(2475, initial.x.length),
        initial.y.slice(2475, initial.y.length),
        initial.c.slice(2475, initial.c.length))*/


    /*const xArray = [498, 499, 500, 499, 498, 499, 500, 501]
    const yArray = [498, 498, 498, 499, 500, 500, 500, 500]
    const colors = Array(8).fill("0xffffff")

    await cPixelNFT.adminMint(xArray,
        yArray,
        colors)*/


    const range = [317, 317]
    const ids = []
    for (let i = range[0]; i <= range[1]; i++) {
        ids.push(i)
    }
    ids.forEach(async (id) => {
        const tx = await cPixelNFT.setTokenColor(id, "0x375bd2")
        await tx.wait()


    })







}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
