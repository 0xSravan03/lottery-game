import Head from "next/head";
import styles from "@/styles/Home.module.css";
import React, { useState, useEffect, useRef } from "react";
import Web3Modal from "web3modal";
import { ethers } from "ethers";
import Lottery from "../contract/contract.json";
import { FETCH_CREATED_GAME } from "@/queries";
import { subgraphQuery } from "@/utils";

export default function Home() {
  const [walletConnected, setWalletConnected] = useState(false);
  const web3modalRef = useRef();
  const [loading, setLoading] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [maxPlayers, setMaxPlayers] = useState(0);
  const [entryFee, setEntryFee] = useState("0");
  const [winner, setWinner] = useState("");
  const [logs, setLogs] = useState([]);
  const [players, setPlayers] = useState([]);
  const [isOwner, setIsOwner] = useState(false);

  const forceUpdate = React.useReducer(() => ({}), {})[1];

  const connectWallet = async () => {
    try {
      setLoading(true);
      const instance = await web3modalRef.current.connect();
      const provider = new ethers.providers.Web3Provider(instance);

      const { chainId } = await provider.getNetwork();
      if (chainId !== 80001) {
        window.alert("Change the network to Mumbai");
        throw new Error("Change network to Mumbai");
      }

      const signer = provider.getSigner();
      setLoading(false);
      return signer;
    } catch (error) {
      console.log(error.message);
    }
  };

  const handleConnect = async () => {
    try {
      const signer = await connectWallet();
      setWalletConnected(true);
      await checkIfGameStarted();
      await getOwner();
    } catch (error) {
      console.log(error.message);
    }
  };

  const getContract = async (signer) => {
    try {
      const LotteryContract = new ethers.Contract(
        Lottery.address,
        Lottery.abi,
        signer
      );
      return LotteryContract;
    } catch (error) {
      console.log(error.message);
    }
  };

  const checkIfGameStarted = async () => {
    try {
      const signer = await connectWallet();
      const LotteryContract = await getContract(signer);
      const _gameStarted = await LotteryContract.gameStarted();

      const _gameArray = await subgraphQuery(FETCH_CREATED_GAME());
      const _game = _gameArray.games[0];
      let _logs = [];

      if (_gameStarted) {
        _logs = [`Game has started with ID: ${_game.id}`];
        if (_game.players && _game.players.length > 0) {
          _logs.push(
            `${_game.players.length} / ${_game.maxPlayers} already joined 👀 `
          );
          _game.players.forEach((player) => {
            _logs.push(`${player} joined 🏃‍♂️`);
          });
        }
        setEntryFee(_game.entryFee.toString());
        setMaxPlayers(_game.maxPlayers.toString());
      } else if (!gameStarted && _game.winner) {
        _logs = [
          `Last game has ended with ID: ${_game.id}`,
          `Winner is: ${_game.winner} 🎉 `,
          `Waiting for host to start new game....`,
        ];

        setWinner(_game.winner.toString());
      }
      setLogs(_logs);
      setPlayers(_game.players);
      setGameStarted(_gameStarted);
      forceUpdate();
    } catch (error) {
      console.log(error.message);
    }
  };

  const getOwner = async () => {
    try {
      const signer = await connectWallet();
      const LotteryContract = await getContract(signer);
      const _owner = await LotteryContract.owner();
      const signerAddress = await signer.getAddress();
      if (signerAddress.toLowerCase() === _owner.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  const startGames = async () => {
    try {
      const signer = await connectWallet();
      const LotteryGame = await getContract(signer);
      setLoading(true);
      const tx = await LotteryGame.startGame(maxPlayers, entryFee);
      await tx.wait();
      setLoading(false);
    } catch (error) {
      console.log(error.message);
      setLoading(false);
    }
  };

  const joinGames = async () => {
    try {
      const signer = await connectWallet();
      const LotteryGame = await getContract(signer);
      setLoading(true);
      const tx = await LotteryGame.joinGame({ value: entryFee });
      await tx.wait();
      setLoading(false);
      checkIfGameStarted();
    } catch (error) {
      console.log(error.message);
      setLoading(false);
    }
  };

  const renderButton = () => {
    if (!walletConnected) {
      return (
        <button onClick={handleConnect} className={styles.button}>
          {!loading ? <span>Connect Wallet</span> : <span>Connecting..</span>}
        </button>
      );
    }

    if (loading) {
      return <button className={styles.button}>Loading...</button>;
    }

    if (gameStarted) {
      if (players.length === maxPlayers) {
        return (
          <button className={styles.button} disabled>
            Choosing winner...
          </button>
        );
      }
      return (
        <div>
          <button className={styles.button} onClick={joinGames}>
            Join Game 🚀
          </button>
        </div>
      );
    }

    if (isOwner && !gameStarted) {
      return (
        <div>
          <input
            type="number"
            className={styles.input}
            onChange={(e) => {
              setEntryFee(ethers.utils.parseEther(e.target.value.toString()));
            }}
            placeholder="Entry Fee (ETH)"
          />
          <input
            type="number"
            className={styles.input}
            onChange={(e) => {
              setMaxPlayers(e.target.value ?? 0);
            }}
            placeholder="Max Players"
          />
          <button className={styles.button} onClick={startGames}>
            Start Game 🚀
          </button>
        </div>
      );
    }
  };

  useEffect(() => {
    web3modalRef.current = new Web3Modal({
      network: "mumbai",
      providerOptions: {},
      disableInjectedProvider: false,
    });
  }, []);

  return (
    <>
      <Head>
        <title>LW3Punks</title>
        <meta name="description" content="LW3Punks-Dapp" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Lottery Game!</h1>
          <div className={styles.description}>
            It's a lottery game where a winner is chosen at random and wins the
            entire lottery pool
          </div>
          {renderButton()}
          {logs &&
            logs.map((log, index) => (
              <div className={styles.log} key={index}>
                {log}
              </div>
            ))}
        </div>
        <div>
          <img className={styles.image} src="./lottery.png" />
        </div>
      </div>
      <footer className={styles.footer}>Made with &#10084; by Your Name</footer>
    </>
  );
}
