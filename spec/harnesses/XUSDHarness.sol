pragma solidity 0.5.11;
import "../../contracts/contracts/token/XUSD.sol";

contract XUSDHarness is XUSD {
	function Certora_maxSupply() external view returns (uint) { return MAX_SUPPLY; }
	function Certora_isNonRebasingAccount(address account) external returns (bool) { return _isNonRebasingAccount(account); }


	function init_state() external { 
		rebasingCreditsPerToken = 1e18; // TODO: Guarantee this is updated
	}
}
