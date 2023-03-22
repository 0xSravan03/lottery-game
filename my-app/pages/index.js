import Head from "next/head";
import styles from "@/styles/Home.module.css";
import { useState, useEffect, useRef } from "react";
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
    } catch (error) {
      console.log(error.message);
    }
  };

  const checkIfGameStarted = async () => {
    try {
      const signer = await connectWallet();
      const LotteryContract = new ethers.Contract(
        Lottery.address,
        Lottery.abi,
        signer
      );
      const _gameStarted = await LotteryContract.gameStarted();

      const _gameArray = await subgraphQuery(FETCH_CREATED_GAME());
      const _game = _gameArray.games[0];
      let _logs = [];

      if (_gameStarted) {
        _logs = [`Game has started with ID: ${_game.id}`];
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  const renderButton = () => {
    if (!walletConnected) {
      return (
        <button onClick={handleConnect} className={styles.button}>
          {!loading ? <span>Connect Wallet</span> : <span>Connecting..</span>}
        </button>
      );
    } else {
      return <p className={styles.description}>Wallet Connected</p>;
    }

    // if (loading) {
    //   return <button className={styles.button}>Loading...</button>;
    // }
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
        </div>
      </div>
      <footer className={styles.footer}>Made with &#10084; by Your Name</footer>
    </>
  );
}
