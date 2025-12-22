// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title BattleArenaBadges
 * @dev ERC-1155 contract for Battle Arena game badges
 * Users can mint badges they've earned in the game
 */
contract BattleArenaBadges is ERC1155, Ownable {
    using Strings for uint256;

    // Badge IDs mapping
    mapping(uint256 => BadgeInfo) public badges;
    mapping(address => mapping(uint256 => bool)) public hasMinted;
    
    // Base URI for metadata
    string private _baseURI;
    
    // Badge info structure
    struct BadgeInfo {
        string name;
        string description;
        bool exists;
        uint256 maxSupply; // 0 = unlimited
        uint256 currentSupply;
    }
    
    // Events
    event BadgeMinted(address indexed to, uint256 indexed badgeId, uint256 amount);
    event BadgeRegistered(uint256 indexed badgeId, string name);
    
    constructor(string memory baseURI) ERC1155(baseURI) Ownable(msg.sender) {
        _baseURI = baseURI;
        
        // Register default badges
        _registerBadge(1, "Rookie Fighter", "Score at least 5 points in a game", 0);
        _registerBadge(2, "Skilled Fighter", "Score at least 25 points in a game", 0);
        _registerBadge(3, "Battle Champion", "Score at least 100 points in a game", 0);
        _registerBadge(4, "Legendary Warrior", "Score at least 200 points in a game", 0);
        _registerBadge(5, "First Victory", "Win your first game", 0);
        _registerBadge(6, "Hot Streak", "Win 3 games in a row", 0);
        _registerBadge(7, "Survivor", "Win a game without being eliminated", 0);
        _registerBadge(8, "Veteran", "Play 10 games", 0);
    }
    
    /**
     * @dev Register a new badge type (only owner)
     */
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
        require(!badges[badgeId].exists, "Badge already exists");
        badges[badgeId] = BadgeInfo({
            name: name,
            description: description,
            exists: true,
            maxSupply: maxSupply,
            currentSupply: 0
        });
        emit BadgeRegistered(badgeId, name);
    }
    
    /**
     * @dev Mint a badge to user (public - users call this)
     * Backend should verify eligibility before user calls this
     */
    function mintBadge(uint256 badgeId) external {
        require(badges[badgeId].exists, "Badge does not exist");
        require(!hasMinted[msg.sender][badgeId], "Badge already minted");
        
        BadgeInfo storage badge = badges[badgeId];
        if (badge.maxSupply > 0) {
            require(badge.currentSupply < badge.maxSupply, "Max supply reached");
        }
        
        hasMinted[msg.sender][badgeId] = true;
        badge.currentSupply += 1;
        
        _mint(msg.sender, badgeId, 1, "");
        emit BadgeMinted(msg.sender, badgeId, 1);
    }
    
    /**
     * @dev Batch mint multiple badges
     */
    function mintBadges(uint256[] calldata badgeIds) external {
        for (uint256 i = 0; i < badgeIds.length; i++) {
            uint256 badgeId = badgeIds[i];
            if (!hasMinted[msg.sender][badgeId] && badges[badgeId].exists) {
                BadgeInfo storage badge = badges[badgeId];
                if (badge.maxSupply == 0 || badge.currentSupply < badge.maxSupply) {
                    hasMinted[msg.sender][badgeId] = true;
                    badge.currentSupply += 1;
                    _mint(msg.sender, badgeId, 1, "");
                    emit BadgeMinted(msg.sender, badgeId, 1);
                }
            }
        }
    }
    
    /**
     * @dev Check if user has minted a badge
     */
    function hasUserMinted(address user, uint256 badgeId) external view returns (bool) {
        return hasMinted[user][badgeId];
    }
    
    /**
     * @dev Get badge info
     */
    function getBadgeInfo(uint256 badgeId) external view returns (BadgeInfo memory) {
        return badges[badgeId];
    }
    
    /**
     * @dev Get user's minted badges
     */
    function getUserBadges(address user) external view returns (uint256[] memory) {
        uint256[] memory userBadges = new uint256[](8);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= 8; i++) {
            if (hasMinted[user][i]) {
                userBadges[count] = i;
                count++;
            }
        }
        
        // Resize array
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = userBadges[i];
        }
        
        return result;
    }
    
    /**
     * @dev Update base URI (only owner)
     */
    function setBaseURI(string memory newBaseURI) external onlyOwner {
        _baseURI = newBaseURI;
        _setURI(newBaseURI);
    }
    
    /**
     * @dev Override URI function for metadata
     */
    function uri(uint256 tokenId) public view override returns (string memory) {
        return string(abi.encodePacked(_baseURI, tokenId.toString(), ".json"));
    }
}




