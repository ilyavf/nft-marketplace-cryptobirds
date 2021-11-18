// We want to load user's NFTs

import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Web3Modal from 'web3modal'

import { nftaddress, nftmarketaddress } from '../config'
import NFT from '../artifacts/contracts/NFT.sol/NFT.json'
import KBMarket from '../artifacts/contracts/KBMarket.sol/KBMarket.json'

export default function MyAssets() {
  const [nfts, setNfts] = useState([])
  const [loading, setLoading] = useState('not-loaded')

  useEffect(() => {
    loadNFTs()
  }, [])

  // Section 4, video 27.
  async function loadNFTs() {
    // What we want to load:
    // provider, tokenContract, marketContract, data for our marketItems
    console.log('[loadNFTs]...')


    // Who the current caller is
    // We want to get the message sender hook up to the signer to display the owner nfts

    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    
    const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider)
    const marketContract = new ethers.Contract(nftmarketaddress, KBMarket.abi, provider)

    const data = await marketContract.fetchMyNfts()

    const items = await Promise.all(data.map(async i => {
      const tokenUri = await tokenContract.tokenURI(i.tokenId)
      // we want to get the token metadata - json
      const meta = await axios.get(tokenUri)
      let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
      let item = {
        price,
        tokenId: i.tokenId.toNumber(),
        seller: i.seller,
        owner: i.owner,
        image: meta.data.image,
        name: meta.data.name,
        description: meta.data.description
      }
      return item
    }))

    setNfts(items)
    setLoading('loaded')
    console.log(`- loaded ${items.length} items`)
  }

  if (loading == 'loaded' && !nfts.length) {
    return <h1 className='px-20 py-7 text-4xl'>You do not own any NFTs currently</h1>
  }

  return (
    <div className='flex justify-center mt-10'>
      <div className='px-4'>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4'>
          {
            nfts.map((nft, i) => (
              <div key={i} className='border shadow rounded-xl' style={{maxWidth: '260px'}}>
                <img src={nft.image} />
                <div className='p-4'>
                  <p style={{height: '64px'}} className='text-3xl font-semibold'>
                    {nft.name}
                  </p>
                  <div style={{height: '72px', overflow: 'hidden'}}>
                    <p className='text-gray-400'>{nft.description}</p>
                  </div>
                </div>
                <div className='p-4 bg-black'>
                  <p className='text-3xl mb-4 font-bold text-white'>
                    {nft.price} ETH
                  </p>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}
