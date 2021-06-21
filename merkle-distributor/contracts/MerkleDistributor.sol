// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/cryptography/MerkleProof.sol";
import "./interfaces/IMerkleDistributor.sol";
import "./Ownable.sol";


contract MerkleDistributor is IMerkleDistributor, Ownable {
    address public immutable override token;
    bytes32 public override merkleRoot;
    uint32 public override week;
    bool public override frozen;

    // This is a packed array of booleans.
    mapping(uint256 => mapping(uint256 => uint256)) private claimedBitMap;

    string public constant NAME = "PolyMarket Distributor";

    // The EIP-712 typehash for the contract's domain
    bytes32 public constant DOMAIN_TYPEHASH = keccak256(
        "EIP712Domain(string name,uint256 chainId,address verifyingContract)"
    );

    // The EIP-712 typehash for the claim id struct
    bytes32 public constant CLAIM_TYPEHASH = keccak256(
        "Claim(address recipient,uint256 amount,uint32 week)"
    );

    constructor(address token_, bytes32 merkleRoot_) public {
        token = token_;
        merkleRoot = merkleRoot_;
        week = 0;
        frozen = false;
    }

    function claim(uint256 index, address account, uint256 amount, bytes32[] calldata merkleProof) external override {
        require(!frozen, "MerkleDistributor: Claiming is frozen.");
        require(!isClaimed(index), "MerkleDistributor: Drop already claimed.");

        _claim(index, account, account, amount, merkleProof);
    }

    function claimFrom(
        uint256 index,
        uint256 amount,
        bytes32[] calldata merkleProof,
        address recipient,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external override {
        require(!frozen, "MerkleDistributor: Claiming is frozen.");
        require(!isClaimed(index), "MerkleDistributor: Drop already claimed.");

        bytes32 domainSeparator = keccak256(abi.encode(
            DOMAIN_TYPEHASH,
            keccak256(bytes(NAME)),
            getChainIdInternal(),
            address(this)
        ));
        bytes32 structHash = keccak256(abi.encode(CLAIM_TYPEHASH, recipient, amount, week));
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
        address signatory = ecrecover(digest, v, r, s);
        require(signatory != address(0), "MerkleDistributor::claimFrom: invalid signature");

        _claim(index, signatory, recipient, amount, merkleProof);
    }

    function isClaimed(uint256 index) public view override returns (bool) {
        uint256 claimedWordIndex = index / 256;
        uint256 claimedBitIndex = index % 256;
        uint256 claimedWord = claimedBitMap[week][claimedWordIndex];
        uint256 mask = (1 << claimedBitIndex);
        return claimedWord & mask == mask;
    }

    function freeze() public override onlyOwner {
        frozen = true;
    }

    function unfreeze() public override onlyOwner {
        frozen = false;
    }

    function updateMerkleRoot(bytes32 _merkleRoot) public override onlyOwner {
        require(frozen, "MerkleDistributor: Contract not frozen.");

        // Increment the week (simulates the clearing of the claimedBitMap)
        week = week + 1;
        // Set the new merkle root
        merkleRoot = _merkleRoot;

        emit MerkleRootUpdated(merkleRoot, week);
    }

    function _claim(uint256 index, address airdropRecipient, address tokenReceiver, uint256 amount, bytes32[] calldata merkleProof) internal {
        // Verify the merkle proof.
        bytes32 node = keccak256(abi.encodePacked(index, airdropRecipient, amount));
        require(MerkleProof.verify(merkleProof, merkleRoot, node), "MerkleDistributor: Invalid proof.");

        // Mark it claimed and send the token.
        _setClaimed(index);
        require(IERC20(token).transfer(tokenReceiver, amount), "MerkleDistributor: Transfer failed.");

        emit Claimed(index, amount, airdropRecipient, tokenReceiver, week);
    }

    function getChainIdInternal() internal pure returns (uint) {
        uint chainId;
        assembly { chainId := chainid() }
        return chainId;
    }

    function _setClaimed(uint256 index) private {
        uint256 claimedWordIndex = index / 256;
        uint256 claimedBitIndex = index % 256;
        claimedBitMap[week][claimedWordIndex] = claimedBitMap[week][claimedWordIndex] | (1 << claimedBitIndex);
    }
}
