require("@nomicfoundation/hardhat-toolbox")
require("dotenv").config()

const POLYGON_RPC_URL = process.env.POLYGON_RPC_URL
const PRIVATE_KEY = process.env.ACCOUNT_PRIVATE_KEY
const POLYGONSCAN_API = process.env.POLYGONSCAN_API_KEY

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    networks: {
        mumbai: {
            url: POLYGON_RPC_URL,
            accounts: [PRIVATE_KEY],
        },
    },
    etherscan: {
        apiKey: POLYGONSCAN_API,
    },
    solidity: "0.8.18",
}
