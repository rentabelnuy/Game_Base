// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title BattleArenaBadgesBaseV2
 * @dev Safer ERC-1155 badges contract with EIP-712 signed claims for Base.
 */
contract BattleArenaBadgesBaseV2 is ERC1155, Ownable, EIP712, ReentrancyGuard, Pausable {
    using Strings for uint256;

    error InvalidSigner();
    error AuthorizationExpired();
    error AuthorizationAlreadyUsed();
    error InvalidAuthorization();
    error BadgeAlreadyExists();
    error BadgeDoesNotExist();
    error BadgeAlreadyMinted();
    error MaxSupplyReached();
    error LengthMismatch();
    error EmptyBatch();
    error BatchTooLarge();

    uint256 public constant MAX_BATCH_MINT = 20;

    bytes32 public constant MINT_TYPEHASH =
        keccak256(
            "MintAuthorization(address account,uint256 badgeId,bytes32 requestId,uint256 deadline)"
        );

    struct BadgeInfo {
        string name;
        string description;
        bool exists;
        uint256 maxSupply;
        uint256 currentSupply;
    }

    mapping(uint256 => BadgeInfo) public badges;
    mapping(address => mapping(uint256 => bool)) public hasMinted;
    mapping(bytes32 => bool) public usedAuthorizations;

    address public authorizedSigner;
    string private _baseMetadataURI;

    event BadgeMinted(address indexed to, uint256 indexed badgeId, uint256 amount);
    event BadgeRegistered(uint256 indexed badgeId, string name);
    event AuthorizedSignerUpdated(address indexed newSigner);
    event ContractPaused(address indexed by);
    event ContractUnpaused(address indexed by);

    constructor(string memory baseURI, address signer)
        ERC1155(baseURI)
        Ownable(msg.sender)
        EIP712("BattleArenaBadgesBaseV2", "1")
    {
        if (signer == address(0)) revert InvalidSigner();
        _baseMetadataURI = baseURI;
        authorizedSigner = signer;

        _registerBadge(1, "Rookie Fighter", "Score at least 5 points in a game", 0);
        _registerBadge(2, "Skilled Fighter", "Score at least 25 points in a game", 0);
        _registerBadge(3, "Battle Champion", "Score at least 100 points in a game", 0);
        _registerBadge(4, "Legendary Warrior", "Score at least 200 points in a game", 0);
        _registerBadge(5, "First Victory", "Win your first game", 0);
        _registerBadge(6, "Hot Streak", "Win 3 games in a row", 0);
        _registerBadge(7, "Survivor", "Win a game without being eliminated", 0);
        _registerBadge(8, "Veteran", "Play 10 games", 0);
    }

    function pause() external onlyOwner {
        _pause();
        emit ContractPaused(msg.sender);
    }

    function unpause() external onlyOwner {
        _unpause();
        emit ContractUnpaused(msg.sender);
    }

    function registerBadge(
        uint256 badgeId,
        string memory name,
        string memory description,
        uint256 maxSupply
    ) external onlyOwner {
        _registerBadge(badgeId, name, description, maxSupply);
    }

    function _registerBadge(
        uint256 badgeId,
        string memory name,
        string memory description,
        uint256 maxSupply
    ) internal {
        if (badges[badgeId].exists) revert BadgeAlreadyExists();
        badges[badgeId] = BadgeInfo({
            name: name,
            description: description,
            exists: true,
            maxSupply: maxSupply,
            currentSupply: 0
        });
        emit BadgeRegistered(badgeId, name);
    }

    function setAuthorizedSigner(address signer) external onlyOwner {
        if (signer == address(0)) revert InvalidSigner();
        authorizedSigner = signer;
        emit AuthorizedSignerUpdated(signer);
    }

    function mintBadge(
        uint256 badgeId,
        bytes32 requestId,
        uint256 deadline,
        bytes calldata signature
    ) external nonReentrant whenNotPaused {
        _validateAndConsumeAuthorization(msg.sender, badgeId, requestId, deadline, signature);
        _mintBadge(msg.sender, badgeId);
    }

    function mintBadges(
        uint256[] calldata badgeIds,
        bytes32[] calldata requestIds,
        uint256[] calldata deadlines,
        bytes[] calldata signatures
    ) external nonReentrant whenNotPaused {
        uint256 length = badgeIds.length;
        if (length == 0) revert EmptyBatch();
        if (length > MAX_BATCH_MINT) revert BatchTooLarge();
        if (length != requestIds.length || length != deadlines.length || length != signatures.length) {
            revert LengthMismatch();
        }

        for (uint256 i = 0; i < length; i++) {
            _validateAndConsumeAuthorization(
                msg.sender,
                badgeIds[i],
                requestIds[i],
                deadlines[i],
                signatures[i]
            );
            _mintBadge(msg.sender, badgeIds[i]);
        }
    }

    function _validateAndConsumeAuthorization(
        address account,
        uint256 badgeId,
        bytes32 requestId,
        uint256 deadline,
        bytes calldata signature
    ) internal {
        if (block.timestamp > deadline) revert AuthorizationExpired();

        bytes32 structHash = keccak256(
            abi.encode(MINT_TYPEHASH, account, badgeId, requestId, deadline)
        );
        bytes32 digest = _hashTypedDataV4(structHash);

        if (usedAuthorizations[digest]) revert AuthorizationAlreadyUsed();
        address recoveredSigner = ECDSA.recover(digest, signature);
        if (recoveredSigner != authorizedSigner) revert InvalidAuthorization();

        usedAuthorizations[digest] = true;
    }

    function _mintBadge(address to, uint256 badgeId) internal {
        BadgeInfo storage badge = badges[badgeId];
        if (!badge.exists) revert BadgeDoesNotExist();
        if (hasMinted[to][badgeId]) revert BadgeAlreadyMinted();

        if (badge.maxSupply > 0 && badge.currentSupply >= badge.maxSupply) {
            revert MaxSupplyReached();
        }

        hasMinted[to][badgeId] = true;
        badge.currentSupply += 1;

        _mint(to, badgeId, 1, "");
        emit BadgeMinted(to, badgeId, 1);
    }

    function hasUserMinted(address user, uint256 badgeId) external view returns (bool) {
        return hasMinted[user][badgeId];
    }

    function getBadgeInfo(uint256 badgeId) external view returns (BadgeInfo memory) {
        return badges[badgeId];
    }

    function getUserBadges(address user) external view returns (uint256[] memory) {
        uint256[] memory userBadges = new uint256[](8);
        uint256 count = 0;

        for (uint256 i = 1; i <= 8; i++) {
            if (hasMinted[user][i]) {
                userBadges[count] = i;
                count++;
            }
        }

        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = userBadges[i];
        }

        return result;
    }

    function setBaseURI(string memory newBaseURI) external onlyOwner {
        _baseMetadataURI = newBaseURI;
        _setURI(newBaseURI);
    }

    function uri(uint256 tokenId) public view override returns (string memory) {
        return string(abi.encodePacked(_baseMetadataURI, tokenId.toString(), ".json"));
    }
}
