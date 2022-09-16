import { promises as filesystem } from 'fs'
import * as path from 'path'
import { ethers } from 'ethers'
import dotenv from "dotenv";

dotenv.config()

async function deploy() {
	if (!process.env.RPC) throw Error("RPC is required")
	if (!process.env.DEPLOY_PK) throw Error("DEPLOY_PK is required")
	const rpcUrl = process.env.RPC
	console.log(`RPC URL: ${rpcUrl}`)
	const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
	const chainId = (await provider.getNetwork()).chainId
	console.log(`Chain ID: ${chainId}`)
	const filePath = path.join(__dirname, "..", "artifacts", `${chainId}`, "deployment.json")
	const deployment = JSON.parse((await filesystem.readFile(filePath)).toString())
	const address = deployment.address
	console.log(`Deployment Address: ${address}`)
	const gasCost = ethers.BigNumber.from(deployment.gasPrice).mul(ethers.BigNumber.from(deployment.gasLimit))
	console.log(`Gas Cost: ${gasCost}`)
	const signer = new ethers.Wallet(process.env.DEPLOY_PK, provider)
	const gasCostTransactionResponse = await signer.sendTransaction({
		to: deployment.signerAddress,
		value: gasCost,
	})
	const gasCostTxReceipt = await provider.waitForTransaction(gasCostTransactionResponse.hash, 1)
	console.log(`Gas Cost Transaction Hash: ${gasCostTxReceipt.transactionHash}`)
	const deploymentTransactionResponse = await provider.sendTransaction(deployment.transaction)
	const deploymentTxReceipt = await provider.waitForTransaction(deploymentTransactionResponse.hash, 1)
	console.log(`Deployment Transaction Hash: ${deploymentTxReceipt.transactionHash}`)
	console.log(`Contract Address: ${deploymentTxReceipt.contractAddress}`)
}

async function doStuff() {
	await deploy()
}

doStuff().then(() => {
	process.exit(0)
}).catch(error => {
	console.error(error)
	process.exit(1)
})