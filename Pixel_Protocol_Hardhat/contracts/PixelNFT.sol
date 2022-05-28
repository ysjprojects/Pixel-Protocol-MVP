// SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

pragma solidity ^0.8.4;

contract PixelNFT is ERC721Enumerable {
    using Strings for uint256;

    struct Coordinates {
        uint256 x;
        uint256 y;
    }

    bool private ownerCanMint = true;
    bool private mintingEnabled;
    string private baseURI;

    uint256 private immutable baseFee;
    uint256 private immutable feeIncrement;
    address private immutable owner;

    mapping(uint256 => mapping(uint256 => bytes3)) private colorAtXY;
    mapping(uint256 => mapping(uint256 => bool)) private isMintedAtXY;

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
        bytes3 newColor
    );

    modifier rejectIfMinted(uint256 _x, uint256 _y) {
        require(!isMintedAtXY[_x][_y], "Token is already minted");
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
        uint256 _baseFee,
        uint256 _feeIncrement
    ) ERC721(_name, _symbol) {
        require(_baseFee > 0, "Base fee cannot be <= to 0");
        owner = _msgSender();
        baseURI = _intialBaseURI;
        baseFee = _baseFee;
        feeIncrement = _feeIncrement;
    }

    // getters

    function getContractOwner() public view returns (address) {
        return owner;
    }

    function getColor(uint256 _tokenId) public view returns (bytes3) {
        require(isMinted[_tokenId], "Token does not exist");
        Coordinates memory c = XYAtTokenId[_tokenId];
        return getColor(c.x, c.y);
    }

    function getColor(uint256 _x, uint256 _y) public view returns (bytes3) {
        return colorAtXY[_x][_y];
    }

    function getIsMinted(uint256 _tokenId) public view returns (bool) {
        return isMinted[_tokenId];
    }

    function getIsMinted(uint256 _x, uint256 _y) public view returns (bool) {
        return isMintedAtXY[_x][_y];
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

    function getBaseFee() public view returns (uint256) {
        return baseFee;
    }

    function getFeeIncrement() public view returns (uint256) {
        return feeIncrement;
    }

    function getPrevOwner(uint256 _tokenId) public view returns (address) {
        return prevOwner[_tokenId];
    }

    function isMintingEnabled() public view returns (bool) {
        return mintingEnabled;
    }

    function getFee(uint256 _tokenId) public view returns (uint256) {
        require(isMinted[_tokenId], "Token does not exist");

        Coordinates memory c = XYAtTokenId[_tokenId];
        return getFee(c.x, c.y);
    }

    // 1. Price of minting each token is determined by its proximity from the center of the canvas
    // 2. Fee increases by a fixed amount the closer a coordinate is to the center

    function getFee(uint256 _x, uint256 _y)
        public
        view
        validCoords(_x, _y)
        returns (uint256)
    {
        return baseFee + feeIncrement * getFeeWeight(_x, _y);
    }

    // 1. Formula for calculating fee weight for a pixel at position (x,y)

    function getFeeWeight(uint256 _x, uint256 _y)
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
        returns (bytes3[1000] memory)
    {
        bytes3[1000] memory cv;
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
        bytes3 colorCode = getColor(_tokenId);

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

    function canOwnerMint() public view returns (bool) {
        return ownerCanMint;
    }

    // setters

    function setTokenColor(uint256 _tokenId, bytes3 _colorCode)
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

    function disableOwnerMint() public onlyContractOwner {
        ownerCanMint = false;
    }

    // 1. User mints a new Pixel at coordinates (x,y)
    // 2. Transaction will revert if a Pixel has already been minted at the coordinates

    function mintNFT(
        uint256 _x,
        uint256 _y,
        bytes3 _colorCode
    ) external payable {
        require(mintingEnabled, "Minting is not enabled");
        require(
            !(msg.value < getFee(_x, _y)),
            "Insufficient balance for minting"
        );
        _mintNFT(_x, _y, _colorCode);
    }

    function adminMint(
        uint256[] memory _X,
        uint256[] memory _Y,
        bytes3[] memory _C
    ) public onlyContractOwner {
        require(ownerCanMint, "Admin mint disabled");
        require(
            _X.length == _Y.length && _Y.length == _C.length,
            "Unequal length arrays"
        );
        for (uint256 i = 0; i < _X.length; i++) {
            _mintNFT(_X[i], _Y[i], _C[i]);
        }
    }

    function _mintNFT(
        uint256 _x,
        uint256 _y,
        bytes3 _colorCode
    ) internal validCoords(_x, _y) rejectIfMinted(_x, _y) {
        uint256 id = totalSupply() + 1;

        _safeMint(_msgSender(), id);

        colorAtXY[_x][_y] = _colorCode;
        isMintedAtXY[_x][_y] = true;
        isMinted[id] = true;
        tokenIdAtXY[_x][_y] = id;
        XYAtTokenId[id] = Coordinates(_x, _y);
        emit ColorChange(id, _x, _y, _colorCode);
        emit TokenMint(_msgSender(), _x, _y, id);
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
