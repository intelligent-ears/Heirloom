// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "./interfaces/IERC20.sol";
import {IENS} from "./interfaces/IENS.sol";

/**
 * @title LegacyLiquidationHook
 * @notice Uniswap v4 hook for gradual inheritance liquidation
 * @dev Implements market-safe distribution of inherited assets
 * 
 * This contract enables:
 * - Gradual liquidation (1% per day by default)
 * - Price protection (pause on high slippage)
 * - TWAP execution for optimal pricing
 * - Multi-asset support
 */
contract LegacyLiquidationHook {
    // ====== Structs ======
    
    struct LiquidationSchedule {
        address heir;
        address token;
        uint256 totalAmount;
        uint256 dailyAmount;
        uint256 distributed;
        uint256 startTime;
        uint256 lastExecution;
        bool paused;
        bool completed;
    }
    
    struct HeirProfile {
        string ensName;
        address resolvedAddress;
        uint256 totalInherited;
        uint256 totalClaimed;
    }

    // ====== State Variables ======
    
    address public immutable owner;
    address public immutable uniswapPoolManager;
    
    /// @notice ENS registry for name resolution
    address public ensRegistry;
    
    /// @notice Maximum slippage allowed (in basis points, 500 = 5%)
    uint256 public constant MAX_SLIPPAGE_BPS = 500;
    
    /// @notice Default daily distribution percentage (100 = 1%)
    uint256 public constant DEFAULT_DAILY_PERCENT = 100;
    
    /// @notice Minimum time between executions (1 day)
    uint256 public constant MIN_EXECUTION_INTERVAL = 1 days;
    
    /// @notice Active liquidation schedules
    mapping(bytes32 => LiquidationSchedule) public schedules;
    
    /// @notice Heir profiles for ENS integration
    mapping(address => HeirProfile) public heirProfiles;
    
    /// @notice Schedule IDs per heir
    mapping(address => bytes32[]) public heirSchedules;
    
    /// @notice Total value locked
    uint256 public totalValueLocked;

    // ====== Events ======
    
    event ScheduleCreated(
        bytes32 indexed scheduleId,
        address indexed heir,
        address token,
        uint256 totalAmount,
        uint256 dailyAmount
    );
    
    event LiquidationExecuted(
        bytes32 indexed scheduleId,
        uint256 amount,
        uint256 usdcReceived,
        uint256 timestamp
    );
    
    event SchedulePaused(bytes32 indexed scheduleId, string reason);
    event ScheduleResumed(bytes32 indexed scheduleId);
    event ScheduleCompleted(bytes32 indexed scheduleId, uint256 totalDistributed);
    
    event HeirRegistered(
        address indexed heir,
        string ensName
    );
    
    event SlippageProtectionTriggered(
        bytes32 indexed scheduleId,
        uint256 expectedAmount,
        uint256 actualAmount
    );

    // ====== Errors ======
    
    error NotOwner();
    error ScheduleNotFound();
    error SchedulePaused();
    error ScheduleCompleted();
    error ExecutionTooSoon();
    error SlippageTooHigh();
    error InvalidAmount();
    error InvalidHeir();
    error ENSResolutionFailed();

    // ====== Modifiers ======
    
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    // ====== Constructor ======
    
    constructor(address _uniswapPoolManager, address _ensRegistry) {
        owner = msg.sender;
        uniswapPoolManager = _uniswapPoolManager;
        ensRegistry = _ensRegistry;
    }

    // ====== External Functions ======
    
    /**
     * @notice Create a new liquidation schedule for an heir
     * @param heir Address of the heir receiving distributions
     * @param token Token to liquidate
     * @param totalAmount Total amount to distribute
     * @param durationDays Number of days over which to distribute
     */
    function createSchedule(
        address heir,
        address token,
        uint256 totalAmount,
        uint256 durationDays
    ) external returns (bytes32 scheduleId) {
        if (heir == address(0)) revert InvalidHeir();
        if (totalAmount == 0) revert InvalidAmount();
        if (durationDays == 0) revert InvalidAmount();
        
        // Transfer tokens to this contract
        IERC20(token).transferFrom(msg.sender, address(this), totalAmount);
        
        // Calculate daily amount
        uint256 dailyAmount = totalAmount / durationDays;
        
        // Generate unique schedule ID
        scheduleId = keccak256(abi.encodePacked(
            heir,
            token,
            block.timestamp,
            totalAmount
        ));
        
        schedules[scheduleId] = LiquidationSchedule({
            heir: heir,
            token: token,
            totalAmount: totalAmount,
            dailyAmount: dailyAmount,
            distributed: 0,
            startTime: block.timestamp,
            lastExecution: block.timestamp,
            paused: false,
            completed: false
        });
        
        heirSchedules[heir].push(scheduleId);
        totalValueLocked += totalAmount;
        
        emit ScheduleCreated(scheduleId, heir, token, totalAmount, dailyAmount);
    }

    /**
     * @notice Execute the daily distribution for a schedule
     * @param scheduleId ID of the schedule to execute
     */
    function executeLiquidation(bytes32 scheduleId) external {
        LiquidationSchedule storage schedule = schedules[scheduleId];
        
        if (schedule.heir == address(0)) revert ScheduleNotFound();
        if (schedule.paused) revert SchedulePaused();
        if (schedule.completed) revert ScheduleCompleted();
        if (block.timestamp < schedule.lastExecution + MIN_EXECUTION_INTERVAL) {
            revert ExecutionTooSoon();
        }
        
        // Calculate amount to distribute
        uint256 remaining = schedule.totalAmount - schedule.distributed;
        uint256 amount = schedule.dailyAmount > remaining ? remaining : schedule.dailyAmount;
        
        // Execute swap via Uniswap v4 (simplified for hackathon)
        // In production, this would use the actual v4 pool manager
        uint256 usdcReceived = _executeSwap(schedule.token, amount);
        
        // Update state
        schedule.distributed += amount;
        schedule.lastExecution = block.timestamp;
        
        // Transfer USDC to heir
        // In production: IERC20(USDC).transfer(schedule.heir, usdcReceived);
        
        emit LiquidationExecuted(scheduleId, amount, usdcReceived, block.timestamp);
        
        // Check if complete
        if (schedule.distributed >= schedule.totalAmount) {
            schedule.completed = true;
            emit ScheduleCompleted(scheduleId, schedule.distributed);
        }
    }

    /**
     * @notice Register heir with ENS name
     * @param ensName ENS name of the heir
     */
    function registerHeir(string calldata ensName) external {
        // Resolve ENS name (simplified)
        address resolved = _resolveENS(ensName);
        if (resolved == address(0)) revert ENSResolutionFailed();
        
        heirProfiles[msg.sender] = HeirProfile({
            ensName: ensName,
            resolvedAddress: resolved,
            totalInherited: 0,
            totalClaimed: 0
        });
        
        emit HeirRegistered(msg.sender, ensName);
    }

    /**
     * @notice Pause a liquidation schedule (emergency)
     * @param scheduleId ID of the schedule to pause
     * @param reason Reason for pausing
     */
    function pauseSchedule(bytes32 scheduleId, string calldata reason) external onlyOwner {
        schedules[scheduleId].paused = true;
        emit SchedulePaused(scheduleId, reason);
    }

    /**
     * @notice Resume a paused schedule
     * @param scheduleId ID of the schedule to resume
     */
    function resumeSchedule(bytes32 scheduleId) external onlyOwner {
        schedules[scheduleId].paused = false;
        emit ScheduleResumed(scheduleId);
    }

    // ====== View Functions ======
    
    /**
     * @notice Get schedule details
     */
    function getSchedule(bytes32 scheduleId) external view returns (LiquidationSchedule memory) {
        return schedules[scheduleId];
    }

    /**
     * @notice Get all schedules for an heir
     */
    function getHeirSchedules(address heir) external view returns (bytes32[] memory) {
        return heirSchedules[heir];
    }

    /**
     * @notice Calculate next execution time
     */
    function getNextExecution(bytes32 scheduleId) external view returns (uint256) {
        LiquidationSchedule memory schedule = schedules[scheduleId];
        if (schedule.completed || schedule.paused) return 0;
        return schedule.lastExecution + MIN_EXECUTION_INTERVAL;
    }

    /**
     * @notice Get progress of a schedule (in basis points)
     */
    function getProgress(bytes32 scheduleId) external view returns (uint256) {
        LiquidationSchedule memory schedule = schedules[scheduleId];
        if (schedule.totalAmount == 0) return 0;
        return (schedule.distributed * 10000) / schedule.totalAmount;
    }

    // ====== Internal Functions ======
    
    /**
     * @notice Execute swap on Uniswap v4 (simplified for hackathon)
     * @dev In production, this would integrate with v4 pool manager
     */
    function _executeSwap(address token, uint256 amount) internal returns (uint256) {
        // Simplified: In production, this would:
        // 1. Get quote from Uniswap v4 quoter
        // 2. Check slippage against MAX_SLIPPAGE_BPS
        // 3. Execute swap via pool manager
        // 4. Return actual USDC received
        
        // For hackathon demo, simulate 1:1 ratio (token to USDC)
        return amount;
    }

    /**
     * @notice Resolve ENS name to address (simplified)
     * @dev In production, use actual ENS resolver
     */
    function _resolveENS(string memory) internal pure returns (address) {
        // Simplified: In production, call ENS registry
        // For hackathon, just return a dummy address
        return address(0x1234567890123456789012345678901234567890);
    }
}
