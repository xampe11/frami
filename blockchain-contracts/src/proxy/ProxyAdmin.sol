// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @dev This contract is the admin of the proxies. It can upgrade them and transfer their ownership.
 */
contract ProxyAdmin is Ownable {
    /**
     * @dev Storage slot with the admin of the contract.
     * This is the keccak-256 hash of "eip1967.proxy.admin" subtracted by 1
     */
    bytes32 private constant _ADMIN_SLOT = 0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103;

    /**
     * @dev Storage slot with the address of the current implementation.
     * This is the keccak-256 hash of "eip1967.proxy.implementation" subtracted by 1.
     */
    bytes32 private constant _IMPLEMENTATION_SLOT = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;

    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @dev Returns the current implementation of `proxy`.
     */
    function getProxyImplementation(address proxy) public view returns (address implementation) {
        // We need to manually run assembly since `_IMPLEMENTATION_SLOT` is a storage slot
        // in the proxy contract, not this one
        bytes32 slot = _IMPLEMENTATION_SLOT;
        // solhint-disable-next-line no-inline-assembly
        assembly {
            let ptr := mload(0x40)
            mstore(ptr, slot)
            let success := staticcall(gas(), proxy, ptr, 0x20, ptr, 0x20)
            if success { implementation := mload(ptr) }
        }
        return implementation;
    }

    /**
     * @dev Returns the current admin of `proxy`.
     */
    function getProxyAdmin(address proxy) public view returns (address admin) {
        // We need to manually run assembly since `_ADMIN_SLOT` is a storage slot
        // in the proxy contract, not this one
        bytes32 slot = _ADMIN_SLOT;
        // solhint-disable-next-line no-inline-assembly
        assembly {
            let ptr := mload(0x40)
            mstore(ptr, slot)
            let success := staticcall(gas(), proxy, ptr, 0x20, ptr, 0x20)
            if success { admin := mload(ptr) }
        }
        return admin;
    }

    /**
     * @dev Upgrade the implementation of `proxy` to `implementation`.
     */
    function upgrade(address proxy, address implementation) public onlyOwner {
        // We need to manually run assembly since `_IMPLEMENTATION_SLOT` is a storage slot
        // in the proxy contract, not this one
        bytes32 slot = _IMPLEMENTATION_SLOT;
        // solhint-disable-next-line no-inline-assembly
        assembly {
            let ptr := mload(0x40)
            mstore(ptr, slot)
            mstore(add(ptr, 0x20), implementation)
            // We use a staticcall despite changing storage because the function is marked view
            let success := call(gas(), proxy, 0, ptr, 0x40, 0, 0)
            if iszero(success) { revert(0, 0) }
        }
    }

    /**
     * @dev Upgrade the implementation of `proxy` to `implementation` and call a function
     * on the new implementation.
     */
    function upgradeAndCall(address proxy, address implementation, bytes memory data) public payable onlyOwner {
        upgrade(proxy, implementation);
        // solhint-disable-next-line avoid-low-level-calls
        (bool success,) = proxy.call{value: msg.value}(data);
        require(success, "Call failed");
    }
}
