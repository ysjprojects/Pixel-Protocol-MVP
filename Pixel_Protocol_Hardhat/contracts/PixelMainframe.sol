// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./PixelNFT.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

contract PixelMainframe is VRFConsumerBaseV2, IERC721Receiver {
    enum State {
        Inactive,
        Active,
        Stopped
    }

    State private state;

    PixelNFT private immutable nftContract;
    VRFCoordinatorV2Interface private immutable vrfCoordinator;

    bytes32 private immutable keyHash;
    uint256 private immutable factor;
    uint64 private immutable subscriptionId;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;
    uint32 private constant CALLBACK_GAS_LIMIT = 500000;

    address private immutable owner;
    mapping(uint256 => bool) private staked;

    mapping(uint256 => uint256) private requestIdToTokenId;
    mapping(uint256 => bool) private requestIdHasColorChange;
    mapping(uint256 => bytes3) private requestIdToNewColor;
    mapping(uint256 => address) private battlePlayer;

    mapping(address => uint256) private totalReward;
    mapping(address => mapping(uint256 => uint256)) private pixelReward;

    event Staked(address indexed sender, uint256 indexed tokenId);
    event Unstaked(address indexed receiver, uint256 indexed tokenId);
    event InitiateBattle(address indexed caller, uint256 indexed tokenId);

    event BattleWon(
        address indexed prevOwner,
        address indexed newOwner,
        uint256 indexed tokenId
    );
    event BattleLost(
        address indexed prevOwner,
        address indexed newOwner,
        uint256 indexed tokenId
    );

    event Rewarded(
        address indexed prevOwner,
        uint256 indexed tokenId,
        uint256 reward
    );

    modifier requiresActive() {
        require(state == State.Active, "Contract is inactive or stopped");
        _;
    }

    modifier onlyContractOwner() {
        require(msg.sender == owner, "Caller is not contract owner");
        _;
    }

    constructor(
        address _nftContract,
        address _vrfCoordinator,
        uint64 _subscriptionId,
        bytes32 _keyHash,
        uint256 _factor
    ) VRFConsumerBaseV2(_vrfCoordinator) {
        nftContract = PixelNFT(_nftContract);
        vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinator);
        subscriptionId = _subscriptionId;
        keyHash = _keyHash;
        factor = _factor;
        owner = msg.sender;
    }

    // getters

    function isOngoing(uint256 _tokenId) public view returns (bool) {
        return battlePlayer[_tokenId] != address(0);
    }

    function getFactor() public view returns (uint256) {
        return factor;
    }

    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function getContractOwner() public view returns (address) {
        return owner;
    }

    function isStaked(uint256 _tokenId) public view returns (bool) {
        return
            staked[_tokenId] &&
            (nftContract.ownerOf(_tokenId) == address(this));
    }

    function getStatus() public view returns (string memory) {
        if (state == State.Active) {
            return "active";
        } else if (state == State.Inactive) {
            return "inactive";
        } else {
            return "stopped";
        }
    }

    function getTotalReward(address _account) public view returns (uint256) {
        return totalReward[_account];
    }

    function getPixelReward(address _account, uint256 _tokenId)
        public
        view
        returns (uint256)
    {
        return pixelReward[_account][_tokenId];
    }

    // setters

    function setStatus(uint256 _status)
        public
        onlyContractOwner
        returns (bool)
    {
        require(state != State.Stopped, "Contract has stopped");

        if (_status == 0) {
            state = State.Inactive;
            return true;
        } else if (_status == 1) {
            state = State.Active;
            return true;
        }
        return false;
    }

    // 1. User approve contract address to spend Pixel
    // 2. Pixel is transferred to the contract
    function stakePixel(uint256 _tokenId) external requiresActive {
        require(!staked[_tokenId], "Pixel is already staked");
        nftContract.safeTransferFrom(msg.sender, address(this), _tokenId);
        staked[_tokenId] = true;
        emit Staked(msg.sender, _tokenId);
    }

    function unstakePixel(uint256 _tokenId) external requiresActive {
        require(staked[_tokenId], "Pixel is not staled");

        require(
            nftContract.getPrevOwner(_tokenId) == msg.sender,
            "Caller is not prev owner"
        );

        nftContract.safeTransferFrom(address(this), msg.sender, _tokenId);
        staked[_tokenId] = false;
        emit Unstaked(msg.sender, _tokenId);
    }

    function battle(uint256 _tokenId, bytes3 _colorCode)
        external
        payable
        requiresActive
        returns (uint256)
    {
        require(staked[_tokenId], "Pixel is not staked");
        require(battlePlayer[_tokenId] == address(0), "Ongoing battle");

        require(
            !(msg.value < nftContract.getFee(_tokenId)),
            "Insufficient balance for battle"
        );

        battlePlayer[_tokenId] = msg.sender;

        uint256 requestId = vrfCoordinator.requestRandomWords(
            keyHash,
            subscriptionId,
            REQUEST_CONFIRMATIONS,
            CALLBACK_GAS_LIMIT,
            NUM_WORDS
        );

        requestIdToTokenId[requestId] = _tokenId;
        if (!(_colorCode == nftContract.getColor(_tokenId))) {
            requestIdHasColorChange[requestId] = true;
            requestIdToNewColor[requestId] = _colorCode;
        }
        emit InitiateBattle(msg.sender, _tokenId);

        return requestId;
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords)
        internal
        override
    {
        // transform the result to a number between 1 and 999,999 inclusive
        uint256 random = (randomWords[0] % 999999) + 1;

        uint256 tokenId = requestIdToTokenId[requestId];

        address player = battlePlayer[tokenId];

        address prevOwner = nftContract.getPrevOwner(tokenId);

        uint256 fee = nftContract.getFee(tokenId);
        uint256 tax = nftContract.getFee(tokenId) / 5; //20% tax for keeping the contract running (funding LINK)
        uint256 toPrevOwner = fee - tax;

        bytes3 newColorCode = requestIdToNewColor[requestId];

        bool hasColorChange = requestIdHasColorChange[requestId];

        // reset variables
        battlePlayer[tokenId] = address(0);
        requestIdToTokenId[requestId] = 0;
        requestIdHasColorChange[requestId] = false;
        requestIdToNewColor[requestId] = "";

        if (random % factor == 0) {
            staked[tokenId] = false;
            if (hasColorChange) {
                nftContract.setTokenColor(tokenId, newColorCode);
            }

            //transfer Pixel to winner
            nftContract.transferFrom(address(this), player, tokenId);
            emit BattleWon(prevOwner, player, tokenId);
        } else {
            //transfer rewards to prev owner
            totalReward[prevOwner] += toPrevOwner;
            pixelReward[prevOwner][tokenId] += toPrevOwner;
            payable(prevOwner).transfer(toPrevOwner);

            emit BattleLost(prevOwner, player, tokenId);
            emit Rewarded(prevOwner, toPrevOwner, tokenId);
        }
    }

    function withdraw() public onlyContractOwner {
        payable(msg.sender).transfer(address(this).balance);
    }

    /**
     * Always returns `IERC721Receiver.onERC721Received.selector`.
     */
    function onERC721Received(
        address,
        address,
        uint256,
        bytes memory
    ) public virtual override returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
