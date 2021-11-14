const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

describe("Greeter", function () {
  it("Should return the new greeting once it's changed", async function () {
    const Greeter = await ethers.getContractFactory("Greeter");
    const greeter = await Greeter.deploy("Hello, world!");
    await greeter.deployed();

    expect(await greeter.greet()).to.equal("Hello, world!");

    const setGreetingTx = await greeter.setGreeting("Hola, mundo!");

    // wait until the transaction is mined
    await setGreetingTx.wait();

    expect(await greeter.greet()).to.equal("Hola, mundo!");
  });
});
describe("KBMarket", function () {
  it("Should mint and trade NFT", async function () {
    const Market = await ethers.getContractFactory('KBMarket')
    const market = await Market.deploy()
    await market.deployed()
    const marketAddress = market.address

    const NFT = await ethers.getContractFactory('NFT')
    const nft = await NFT.deploy(marketAddress)
    await nft.deployed()
    const nftContractAddress = nft.address

    let listingPrice = await market.getListingPrice()
    listingPrice = listingPrice.toString()
    expect(listingPrice).to.equal((45e15).toString())

    const auctionPrice = ethers.utils.parseUnits('100', 'ether')

    // test for minting
    await nft.mintToken('https-t1')
    await nft.mintToken('https-t2')

    await market.makeMarketItem(nftContractAddress, 1, auctionPrice, {value: listingPrice})
    await market.makeMarketItem(nftContractAddress, 2, auctionPrice, {value: listingPrice})

    // test for different addresses for different users - test accounts
    // return an array of however many addresses
    const [_, buyerAddress] = await ethers.getSigners()

    let items = await market.fetchMarketTokens()
    assert.equal(items.length, 2, 'market should list 2 items')

    // create a market sale with address, id and price
    await market.connect(buyerAddress).createMarketSale(nftContractAddress, 1, {
      value: auctionPrice
    })

    items = await market.fetchMarketTokens()
    assert.equal(items.length, 1, 'market should list 1 items after one was sold')

    // test all the items

    // console.log('items: ', items)
    items = await Promise.all(items.map(async i => {
      // get uri of the value
      const tokenUri = await nft.tokenURI(i.tokenId)
      let item = {
        price: i.price.toString(),
        tokenId: i.tokenId.toString(),
        seller: i.seller,
        owner: i.owner,
        tokenUri
      }
      return item
    }))
    console.log('items improved: ', items)
  })
})
