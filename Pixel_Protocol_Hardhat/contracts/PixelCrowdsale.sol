// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./PixelNFT.sol";

contract PixelCrowdsale is IERC721Receiver {
    event PixelSpaceSold {
        uint256 indexed id,
        address owner
    } 

    bool started = false;
    bool ended = false;

    uint256 private baseValue = 100 * 10**18;
    PixelNFT private immutable nftContract;
    uint256 private numMinted;
    uint256 private fundsRaised;
    mapping(uint256 => bool) isSoldAtId;

    modifier onlyBaseContract() {
        require(msg.sender==address(nftContract));
        _;
    }

    constructor(address _nftContract) {
        nftContract = PixelNFT(_nftContract);
    }

    function getFairValue() public returns (uint256) {
        if (numMinted < 2500) {
            return baseValue;
        } else if (numMinted < 7500) {
            return baseValue / 100 * 125;
        } else {
            return baseValue / 100 * 150;
        }
    }
    function getNumMinted() public returns (uint256 numMinted) {}
    function getFundsRaised() public returns (uint256 fundsRaised) {}

    function start() public onlyBaseContract {
        started = true;
    }

    function stop() public onlyBaseContract {
        started = false;
    }

    function end() public onlyBaseContract {
        started = false;
        selfdestruct(msg.sender);
    }

    function buy(uint256 _id, bytes1[100] _colorList) external payable {
        require(!(msg.value<getFairValue()), "Insufficient funds");
        require(!isSoldAtId[_id], "Pixel Space is already sold");
        (uint256 _x, uint256 _y) = mapIdToStartCoordinates(_id);
        nftContract.crowdsaleMint(msg.sender, _x,_y, _colorList);
        emit PixelSpaceSold(_id, msg.sender);

        fundsRaised += msg.value;
        numMinted += 1;
    }


    function mapIdToStartCoordinates(uint256 _id) public returns (uint256,uint256) { 
        uint256 y = _id / 100;
        uint256 x = (_id - y * 100 - 1) * 10;
        return (x,y);
    }
}
