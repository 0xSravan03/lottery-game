const { ethers, run } = require("hardhat")

// Contract Address: 0x0A796Ce6d2B50Bd9bdD3718666aE607aDA818f12

const VRFCoordinatorAddress = "0x8C7382F9D8f56b33781fE506E897a4F1e2d17255"
const LINKToken = "0x326C977E6efc84E512bB9C30f76E30c160eD06FB"
const keyHash =
    "0x6e75b569a01ef56d18cab6a8e71e6600d6ce853834d4a5748b720d06f878b3a4"
const Fee = ethers.utils.parseEther("0.0001")

async function main() {
    const LotteryFactory = await ethers.getContractFactory("LotteryGame")
    console.log(`Deploying Contract`)
    const Lottery = await LotteryFactory.deploy(
        VRFCoordinatorAddress,
        LINKToken,
        keyHash,
        Fee
    )
    await Lottery.deployed()
    console.log(`Contract Deployed at : ${Lottery.address}`)

    console.log("Verifying Contract.....")
    await sleep(30000)

    await run("verify:verify", {
        address: Lottery.address,
        constructorArguments: [VRFCoordinatorAddress, LINKToken, keyHash, Fee],
    })
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error)
        process.exit(1)
    })
