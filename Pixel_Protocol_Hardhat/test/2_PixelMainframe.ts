import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, waffle } from "hardhat";
import { PixelNFT, PixelNFT__factory, PixelMainframe, PixelMainframe__factory } from "../typechain";

const provider = waffle.provider;

describe("PixelMainframe", function () {


    let PixelNFT: PixelNFT__factory;
    let cPixelNFT: PixelNFT;
    let PixelMainframe: PixelMainframe__factory;
    let cPixelMainframe: PixelMainframe;
    let owner: SignerWithAddress;
    let addr1: SignerWithAddress;
    let addr2: SignerWithAddress;
    let addrs: SignerWithAddress[];

    before(async function () {
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();


        PixelNFT = await ethers.getContractFactory("PixelNFT");
        cPixelNFT = await PixelNFT.deploy(
            "PixelNFT",
            "PIXEL",
            "http://localhost:3000/api/metadata/",
            BigInt('10000000000000000'),
            BigInt('50000000000')
        )
        await cPixelNFT.deployed();


        await cPixelNFT.enableMinting();

        //Mint 1 token at (0,0)
        await cPixelNFT.mintNFT(0, 0, '0x121212', { value: ethers.utils.parseEther("0.01") });


        PixelMainframe = await ethers.getContractFactory("PixelMainframe");
        cPixelMainframe = await PixelMainframe.deploy(
            cPixelNFT.address,
            "0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed",
            1,
            "0xd4bb89654db74673a187bd804519e65e3f71a52bc55f11da7601a13dcf505314",
            13
        )
        await cPixelMainframe.deployed();
    })

    describe("Deployment", function () {
        it("Should set contract owner correctly", async function () {
            expect(await cPixelMainframe.getContractOwner()).to.equal(owner.address);
        })

        it("Should be inactive", async function () {
            expect(await cPixelMainframe.getStatus()).to.equal("inactive");
        })
    })

    describe("Stake", function () {

        it("Should not allow token staking if caller is not owner", async function () {
            let txn = cPixelMainframe.connect(addr1).stakePixel(1);
            expect(txn).to.be.revertedWith("");
        })
        it("Should not allow token staking if contract is inactive", async function () {
            let txn = cPixelMainframe.stakePixel(1);
            expect(txn).to.be.revertedWith("");
        })
        it("Should allow token staking if caller is owner", async function () {
            await cPixelMainframe.setStatus(1);
            await cPixelNFT.approve(cPixelMainframe.address, 1);
            await cPixelMainframe.stakePixel(1);

            expect(await cPixelMainframe.isStaked(1)).to.equal(true);
        })

        it("Should update token ownership correctly after staking", async function () {
            expect(await cPixelNFT.getPrevOwner(1)).to.equal(owner.address);
            expect(await cPixelNFT.ownerOf(1)).to.equal(cPixelMainframe.address);
        })


        it("Should not allow token staking if already listed", async function () {
            let txn = cPixelMainframe.stakePixel(1);
            expect(txn).to.be.revertedWith("");

        })
    })

    describe("Unstake", function () {
        it("Should not allow token unstaking if not listed", async function () {
            let txn = cPixelMainframe.unstakePixel(2);
            expect(txn).to.be.revertedWith("");
        })
        it("Should not allow token unstaking if caller is not previous owner", async function () {
            let txn = cPixelMainframe.connect(addr1).unstakePixel(1);
            expect(txn).to.be.revertedWith("");
        })
        it("Should allow token unstaking if caller is previous owner", async function () {
            await cPixelMainframe.unstakePixel(1);
            expect(await cPixelMainframe.isStaked(1)).to.equal(false);

        })
        it("Should update token ownership correctly after unstaking", async function () {
            expect(await cPixelNFT.getPrevOwner(1)).to.equal(cPixelMainframe.address);
            expect(await cPixelNFT.ownerOf(1)).to.equal(owner.address);
        })
    })


});
