// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IENS
 * @notice Interface for ENS Registry and Resolver
 */
interface IENS {
    function owner(bytes32 node) external view returns (address);
    function resolver(bytes32 node) external view returns (address);
    function ttl(bytes32 node) external view returns (uint64);
    function recordExists(bytes32 node) external view returns (bool);
}

interface IENSResolver {
    function addr(bytes32 node) external view returns (address);
    function text(bytes32 node, string calldata key) external view returns (string memory);
    function contenthash(bytes32 node) external view returns (bytes memory);
}
