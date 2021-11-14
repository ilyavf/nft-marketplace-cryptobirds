import { ethers } from 'ethers'
import { useState, useRouter } from 'react'
import Web3Modal from 'web3modal'

import { nftaddress, nftmarketaddress } from '../config'
import NFT from '../artifacts/contracts/NFT.sol/NFT.json'
import KBMarket from '../artifacts/contracts/KBMarket.sol/KBMarket.json'

import {create as ipfsHttpClient} from 'ipfs-http-client'

// in this component we set ipfs up to host our nft data of file storage

const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0/')

export default function MintItem() {
  const [fileUrl, setFileUrl] = useState(null)
  const [formInput, updateFormInput] = useState({price: '', name: '', description: ''})
  const router = useRouter()

  // set up a functino to fireoff when we update files in our form - we can add our NFT images - IPFS

  async function onChange(e) {
    const file = e.target.files[0]
    try {
      const added = await client.add(
        file, {
          progress: (prog) => console.log(`received: ${prog}`)
        }
      )
      const url = `https://ipfs.infura.io:5001/api/v0/${added.path}`
      setFileUrl(url)
    } catch (e) {
      console.log('Error uploading file', e)
    }
  }

  async function createMarket() {
    const {name, description, price} = formInput
    if (!name || !description || !price || !fileUrl) {
      return
    }
    // upload to IPFS
    const data = JSON.stringify({
      name, description, image: fileUrl
    })
    try {
      const added = await client.add(data)
      const url = `https://ipfs.infura.io:5001/api/v0/${added.path}`
      // run a function that creates sale and passes in the url
      createSale(url)
    } catch (e) {
      console.log('Error uploading file', e)
    }
  }

  // Video 30.
  async function createSale(url) {
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()

    // we want to create the token
    let contract = new ethers.Contract(nftaddress, NFT.abi, signer)
    let transaction = await contract.createToken(url)
    let tx = await transaction.wait()
    let event = tx.events[0]
    let value = event.args[2]
    let tokenId = value.toNumber()
    const price = ethers.utils.parseUnits(formatInput.price, 'ether')

    // list the item for sale on the marketplace
    contract = new ethers.Contract(nftmarketaddress, KBMarket.abi, signer)
    let listingPrice = await contract.getListingPrice()
    listingPrice = listingPrice.toString()

    transaction = await contract.makeMarketItem(nftaddress, tokenId, price, {
      value: listingPrice
    })
    await transaction.wait()

    router.push('./')
  }
}