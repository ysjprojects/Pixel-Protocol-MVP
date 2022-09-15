// SPDX-License-Identifier: MIT


import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./PixelCrowdsale";

pragma solidity ^0.8.4;

contract PixelNFT is ERC721Enumerable {
    using Strings for uint256;

    struct Coordinates {
        uint256 x;
        uint256 y;
    }

    PixelCrowdsale private immutable crowdsaleContract;

    bool private mintingEnabled;
    string private baseURI;

    uint256 private immutable baseValue;
    address private immutable owner;

    mapping(uint256 => mapping(uint256 => bytes1)) private colorAtXY;
    mapping(uint256 => bool) private isMinted;

    mapping(uint256 => mapping(uint256 => uint256)) private tokenIdAtXY;
    mapping(uint256 => Coordinates) private XYAtTokenId;

    // Track the immediate previous owner of a token to account for the identity of stakers
    mapping(uint256 => address) private prevOwner;

    event TokenMint(
        address indexed owner,
        uint256 indexed tokenId,
        uint256 x,
        uint256 y
    );

    event ColorChange(
        uint256 indexed tokenId,
        uint256 indexed x,
        uint256 indexed y,
        bytes1 newColor
    );

    modifier rejectIfMinted(uint256 _x, uint256 _y) {
        require(!getIsMinted(_x,_y), "Token is already minted");
        _;
    }

    modifier validCoords(uint256 _x, uint256 _y) {
        require(
            !(_x < 0 || _x > 999 || _y < 0 || _y > 999),
            "Invalid coordinates"
        );
        _;
    }

    modifier onlyContractOwner() {
        require(_msgSender() == owner, "Caller is not contract owner");
        _;
    }

    modifier onlyTokenOwner(uint256 _tokenId) {
        require(_msgSender() == ownerOf(_tokenId), "Caller is not token owner");
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _intialBaseURI,
        uint256 _baseValue,
    ) ERC721(_name, _symbol) {
        require(_baseValue > 0, "Base fee cannot be <= to 0");
        owner = _msgSender();
        baseURI = _intialBaseURI;
        baseValue = _baseValue;
        crowdsaleContract = new PixelCrowdsale(address(this));
    }

    // getters

    function getContractOwner() public view returns (address) {
        return owner;
    }

    function getColor(uint256 _tokenId) public view returns (bytes1) {
        require(isMinted[_tokenId], "Token does not exist");
        Coordinates memory c = XYAtTokenId[_tokenId];
        return getColor(c.x, c.y);
    }

    function getColor(uint256 _x, uint256 _y) public view returns (bytes1) {
        return colorAtXY[_x][_y];
    }

    function getIsMinted(uint256 _tokenId) public view returns (bool) {
        return isMinted[_tokenId];
    }

    function getIsMinted(uint256 _x, uint256 _y) public view returns (bool) {
        return getIsMinted(tokenIdAtXY[_x][_y]);
    }

    function getTokenIdAtXY(uint256 _x, uint256 _y)
        public
        view
        returns (uint256)
    {
        return tokenIdAtXY[_x][_y];
    }

    function getXYAtTokenId(uint256 _tokenId)
        public
        view
        returns (uint256, uint256)
    {
        require(isMinted[_tokenId], "Token does not exist");

        Coordinates memory c = XYAtTokenId[_tokenId];
        return (c.x, c.y);
    }

    function getbaseValue() public view returns (uint256) {
        return baseValue;
    }


    function getPrevOwner(uint256 _tokenId) public view returns (address) {
        return prevOwner[_tokenId];
    }

    function isMintingEnabled() public view returns (bool) {
        return mintingEnabled;
    }

    function getFairValue(uint256 _tokenId) public view returns (uint256) {
        require(isMinted[_tokenId], "Token does not exist");

        Coordinates memory c = XYAtTokenId[_tokenId];
        return getFairValue(c.x, c.y);
    }

    // 1. Price of minting each token is determined by its proximity from the center of the canvas
    // 2. Fee increases by a fixed amount the closer a coordinate is to the center

    function getFairValue(uint256 _x, uint256 _y)
        public
        view
        validCoords(_x, _y)
        returns (uint256)
    {
        return baseValue + getWeight(_x,_y) * baseValue / 249001 /*499 * 499*/;
    }

    // 1. Formula for calculating fee weight for a pixel at position (x,y)

    function getWeight(uint256 _x, uint256 _y)
        internal
        pure
        returns (uint256)
    {
        bool furtherRight = _x > 999 - _x;
        bool furtherDown = _y > 999 - _y;

        if (furtherRight && furtherDown) {
            return (999 - _x) * (999 - _y);
        } else if (furtherRight) {
            return (999 - _x) * _y;
        } else if (furtherDown) {
            return _x * (999 - _y);
        } else {
            return _x * _y;
        }
    }

    function getCanvasRow(uint256 _row)
        public
        view
        returns (bytes1[1000] memory)
    {
        bytes1[1000] memory cv;
        for (uint256 i = 0; i < 1000; i++) {
            cv[i] = colorAtXY[_row][i];
        }
        return cv;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }

    function tokenURI(uint256 _tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        require(isMinted[_tokenId], "Token does not exist");

        string memory base = _baseURI();
        Coordinates memory c = XYAtTokenId[_tokenId];
        bytes1 colorCode = getColor(_tokenId);

        return
            bytes(base).length > 0
                ? string(
                    abi.encodePacked(
                        baseURI,
                        _tokenId.toString(),
                        "-",
                        c.x.toString(),
                        "-",
                        c.y.toString(),
                        "-",
                        (uint256(uint24(colorCode))).toHexString()
                    )
                )
                : "";
    }


    // setters

    function setTokenColor(uint256 _tokenId, bytes1 _colorCode)
        public
        onlyTokenOwner(_tokenId)
    {
        (uint256 x, uint256 y) = getXYAtTokenId(_tokenId);

        colorAtXY[x][y] = _colorCode;
        emit ColorChange(_tokenId, x, y, _colorCode);
    }

    function enableMinting() public onlyContractOwner {
        require(!mintingEnabled, "Minting is already enabled");
        mintingEnabled = true;
    }

    function setBaseURI(string memory _newBaseURI) public onlyContractOwner {
        baseURI = _newBaseURI;
    }



    // 1. User mints a new Pixel at coordinates (x,y)
    // 2. Transaction will revert if a Pixel has already been minted at the coordinates

    function mintNFT(
        uint256 _x,
        uint256 _y,
        bytes1 _colorCode
    ) external payable {
        require(mintingEnabled, "Minting is not enabled");
        require(
            !(msg.value < getFairValue(_x, _y)),
            "Insufficient balance for minting"
        );
        _mintNFT(_x, _y, _colorCode);
    }

    function CrowdsaleMint(address _buyer, uint256 _startX, uint256 _startY, bytes1[100] _colorList) public {
        require(msg.sender == address(crowdsaleContract), "Only crowdsale contract allowed");
        for(uint i = _startX;i < _startX+10;i++) {
            for(uint j = _startY;j < _startY + 10;j++) {
                bytes1 _color = _colorList[i-_StartX + (j - startY)*10];
                _mintNFTTo(_buyer,i,j,color);
            }
        }

    }

    function _mintNFTTo(address _receiver, uint256 _x, uint256 _y, bytes1 _colorCode) internal {
        uint256 id = totalSupply() + 1;

        _safeMint(_receiver, id);

        colorAtXY[_x][_y] = _colorCode;
        isMinted[id] = true;
        tokenIdAtXY[_x][_y] = id;
        XYAtTokenId[id] = Coordinates(_x, _y);
        emit ColorChange(id, _x, _y, _colorCode);
        emit TokenMint(_msgSender(), _x, _y, id);
    }

    function _mintNFT(
        uint256 _x,
        uint256 _y,
        bytes1 _colorCode
    ) internal validCoords(_x, _y) rejectIfMinted(_x, _y) {
        uint256 id = totalSupply() + 1;

        _safeMint(_msgSender(), id);

        colorAtXY[_x][_y] = _colorCode;
        isMinted[id] = true;
        tokenIdAtXY[_x][_y] = id;
        XYAtTokenId[id] = Coordinates(_x, _y);
        emit ColorChange(id, _x, _y, _colorCode);
        emit TokenMint(_msgSender(), _x, _y, id);
    }

    function startCrowdsale() public onlyContractOwner {
        crowdsaleContract.start();
    }

    function stopCrowdsale() public onlyContractOwner {
        crowdsaleContract.stop();
    }

    function endCrowdsale() public onlyContractOwner {
        crowdsaleContract.end();
    }

    function withdraw() public onlyContractOwner {
        payable(_msgSender()).transfer(address(this).balance);
    }

    function _transfer(
        address _from,
        address _to,
        uint256 _tokenId
    ) internal virtual override {
        super._transfer(_from, _to, _tokenId);
        prevOwner[_tokenId] = _from;
    }
}
