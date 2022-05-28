import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, waffle } from "hardhat";
import { PixelNFT, PixelNFT__factory } from "../typechain";

const provider = waffle.provider;

describe("PixelNFT", function () {

  let PixelNFT: PixelNFT__factory;
  let cPixelNFT: PixelNFT;
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
      BigInt('50000000000'),
    )
    await cPixelNFT.deployed();
  })

  describe("Deployment", function () {
    it("Should set contract owner correctly", async function () {
      expect(await cPixelNFT.getContractOwner()).to.equal(owner.address);
    })

    it("Should set baseFee correctly", async function () {
      expect(await cPixelNFT.getBaseFee()).to.equal(BigInt('10000000000000000'));
    })

    it("Should set feeIncrement correctly", async function () {
      expect(await cPixelNFT.getFeeIncrement()).to.equal(BigInt('50000000000'));
    })

    it("Should not have minting enabled", async function () {
      expect(await cPixelNFT.isMintingEnabled()).to.equal(false);
    })


  })

  describe("Minting", function () {
    it("Should not mint token with out of range cordinates", async function () {
      let txn = cPixelNFT.mintNFT(1000, 1000, "0x121212");
      expect(txn).to.be.revertedWith("");
    })

    it("Should not mint token without enabling minting", async function () {
      let txn = cPixelNFT.mintNFT(0, 0, '0x121212');

      expect(txn).to.be.revertedWith("");

    })
    it("Should not enable minting if caller is not contract owner", async function () {
      let txn = cPixelNFT.connect(addr1).enableMinting();
      expect(txn).to.be.revertedWith("");

    })
    it("Should enable minting if caller is  contract owner", async function () {
      await cPixelNFT.enableMinting();

      expect(await cPixelNFT.isMintingEnabled()).to.equal(true);

    })

    it("Should not mint token with insufficient balance", async function () {
      let txn = cPixelNFT.mintNFT(0, 0, '0x121212');

      expect(txn).to.be.revertedWith("");

    })

    it("Should mint token with sufficient balance", async function () {
      await cPixelNFT.mintNFT(0, 0, '0x121212', { value: ethers.utils.parseEther("0.01") });
      expect(await cPixelNFT.ownerOf(1)).to.equal(owner.address);

    })

    it("Should not mint existing token", async function () {
      let txn = cPixelNFT.connect(addr1).mintNFT(0, 0, '0x232323');
      expect(txn).to.be.revertedWith("");

    })

  })

  describe("Post Minting", function () {

    it("Should show mint status of token correctly", async function () {
      expect(await cPixelNFT["getIsMinted(uint256)"](1)).to.equal(true);
      expect(await cPixelNFT["getIsMinted(uint256,uint256)"](0, 0)).to.equal(true);

      let txn1 = cPixelNFT["getIsMinted(uint256,uint256)"](0, 1)
      let txn2 = cPixelNFT["getIsMinted(uint256)"](2);
      expect(txn1).to.be.revertedWith("");
      expect(txn2).to.be.revertedWith("");

    })



    it("Should show correct token fee", async function () {
      expect(await cPixelNFT["getFee(uint256)"](1)).to.equal(ethers.utils.parseEther("0.01"));
      expect(await cPixelNFT["getFee(uint256,uint256)"](0, 0)).to.equal(ethers.utils.parseEther("0.01"));
      let txn1 = cPixelNFT["getFee(uint256,uint256)"](1000, 1000);
      let txn2 = cPixelNFT["getFee(uint256)"](2);
      expect(txn1).to.be.revertedWith("");
      expect(txn2).to.be.revertedWith("");

    })

    it("Should show correct tokenURI", async function () {
      expect(await cPixelNFT.tokenURI(1)).to.be.equal("http://localhost:3000/api/metadata/1-0-0-0x121212");
    })

    it("Should show first row of canvas", async function () {
      let arr = await cPixelNFT.getCanvasRow(0);
      expect(arr[0]).to.be.equal('0x121212');
    })

  })

  describe("Admin Functions", function () {

    it("Should show contract balance correctly", async function () {
      expect(await provider.getBalance(cPixelNFT.address)).to.equal(ethers.utils.parseEther("0.01"));
    })
    it("Should not allow withdrawal if caller is not owner", async function () {
      let txn = cPixelNFT.connect(addr1).withdraw();
      expect(txn).to.be.revertedWith("");
      expect(await provider.getBalance(cPixelNFT.address)).to.equal(ethers.utils.parseEther("0.01"));

    })
    it("Should allow withdrawal if caller is owner", async function () {
      await cPixelNFT.withdraw();
      expect(await provider.getBalance(cPixelNFT.address)).to.equal(0);

    })

    it("Should allow owner to change baseURI", async function () {

      await cPixelNFT.setBaseURI("http://localhost:3001/api/metadata/");
      expect(await cPixelNFT.tokenURI(1)).to.be.equal("http://localhost:3001/api/metadata/1-0-0-0x121212");
    })

    it("Should not allow non-owner to change baseURI", async function () {

      let txn = cPixelNFT.connect(addr1).setBaseURI("http://localhost:3001/api/metadata/");
      expect(txn).to.be.revertedWith("");
    })

  })


});
