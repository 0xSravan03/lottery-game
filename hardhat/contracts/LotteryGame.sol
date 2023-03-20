// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";

contract LotteryGame is Ownable, VRFConsumerBase {
    // Chainlink Varibales
    uint256 public fee; // Link token amount
    bytes32 public keyHash;

    address[] public players;
    uint256 public maxPlayers; // Total players in one game
    bool public gameStarted;
    uint256 public entryFee;
    uint256 public gameId;

    // Events
    event GameStarted(
        uint256 indexed gameId,
        uint256 maxPlayers,
        uint256 entryFee
    );
    event PlayerJoined(uint256 indexed gameId, address indexed player);
    event GameEnded(
        uint256 indexed gameId,
        address indexed winner,
        bytes32 requestId
    );

    constructor(
        address vrfCoordinator,
        address linkToken,
        bytes32 vrfKeyHash,
        uint256 vrfFee
    ) VRFConsumerBase(vrfCoordinator, linkToken) {
        keyHash = vrfKeyHash;
        fee = vrfFee;
        gameStarted = false;
    }

    // Start Game Function (only owner can start the game)
    function startGame(
        uint256 _maxPlayers,
        uint256 _entryFee
    ) public onlyOwner {
        require(!gameStarted, "Game is currently running");
        delete players; // emptying array
        maxPlayers = _maxPlayers;
        entryFee = _entryFee;
        gameStarted = true;
        gameId++;
        emit GameStarted(gameId, maxPlayers, entryFee);
    }

    // Join Game
    function joinGame() public payable {
        require(gameStarted, "Game has not begin yet.");
        require(msg.value == entryFee, "Not enough ETH to join game");
        require(players.length < maxPlayers, "Game Full");
        players.push(msg.sender);
        emit PlayerJoined(gameId, msg.sender);

        if (players.length == maxPlayers) {
            getRandomWinner();
        }
    }

    function getRandomWinner() internal returns (bytes32 requestId) {
        require(LINK.balanceOf(address(this)) >= fee, "Not enough LINK");
        return requestRandomness(keyHash, fee);
    }

    function fulfillRandomness(
        bytes32 requestId,
        uint256 randomness
    ) internal virtual override {
        uint256 winnerIndex = randomness % players.length;
        address winner = players[winnerIndex];
        (bool sent, ) = payable(winner).call{value: address(this).balance}("");
        require(sent, "Transaction Failed");
        emit GameEnded(gameId, winner, requestId);
        gameStarted = false;
    }

    receive() external payable {}

    fallback() external payable {}
}
