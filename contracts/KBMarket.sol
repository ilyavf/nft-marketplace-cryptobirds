//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import '@openzeppelin/contracts/utils/Counters.sol';
// security against transactions for multiple requests
import 'hardhat/console.sol';

contract KBMarket is ReentrancyGuard {
  using Counters for Counters.Counter;

  /* number of items minting, number of transactions, tokens that have not been sold
   keep track of token total number - tokenId
   solidity arrays need to know the length - help to keep track for arrays */

  Counters.Counter private _tokenIds;
  Counters.Counter private _tokensSold;

  // determine who is the owner of the contract
  // charge a listing fee so the owner makes a commission

  address payable owner;

  // we are deploying to matic the API is the same so we can use ether the same way as matic
  // they both have 18 decimals
  // 0.045 is in the cent
  uint256 listingPrice = 0.045 ether;

  constructor() {
    // set the owner
    owner = payable(msg.sender);
  }

  // lets create an object to keep track of market tokens (e.g. tokenId, seller, owner, price of the token, whether its been sold)
  // structs can act like objects

  struct MarketToken {
    uint itemId;
    address nftContract;
    uint256 tokenId;
    address payable seller;
    address payable owner;
    uint256 price;
    bool sold;
  }

  // we want by tokenId to return which marketToken it is - fetch which one it is
  // in solidity mapping creates a hashtable like a database
  mapping(uint256 => MarketToken) private idToMarketToken;

  // listen to events from front-end application
  event MarketTokenMinted(
    uint indexed itemId,
    address indexed nftContract,
    uint256 indexed tokenId,
    address seller,
    address owner,
    uint256 price,
    bool sold
  );

  // function to show the listing price
  function getListingPrice() public view returns (uint256) {
    return listingPrice;
  }

  // two functions to interact with contract:
  // - create a market item to put it up for sale
  // - create a market sale for buying and selling between parties

  function MintMarketItem(
    address nftContract,
    uint256 tokenId,
    uint256 price
  )
  public payable nonReentrant {
    // nonReentrant is a modifier to prevent reentry attack
    require(price > 0, 'Price must be at least one wei');
    require(msg.value == listingPrice, 'Price must be equal to the listing price');

    _tokenIds.increment();
    uint itemId = _tokenIds.current();

    // putting it up for sale
    idToMarketToken[itemId] = MarketToken(
      itemId,
      nftContract,
      tokenId,
      payable(msg.sender), // the sender is the seller
      payable(address(0)), // no owner yet
      price,
      false // not sold yet
    );

    // NFT transaction
    // since KBMarket is ReentrancyGuard and that one implements ERC721 interface we can use transfer fn:
    IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);

    emit MarketTokenMinted(
      itemId,
      nftContract,
      tokenId,
      msg.sender, // seller
      address(0), // no owner yet
      price,
      false
    );
  }

  // function to conduct transactions and market sales
  function createMarketSale(
    address nftContract,
    uint itemId
  ) public payable nonReentrant {
    uint price = idToMarketToken[itemId].price;
    uint tokenId = idToMarketToken[itemId].tokenId;

    require(msg.value == price, 'Please submit the asking price');

    // transfer amount to the seller
    idToMarketToken[itemId].seller.transfer(msg.value);

    // transfer NFT from the contract address to the buyer
    IERC721(nftContract).transferFrom(address(this), msg.sender, tokenId);

    // update token information with the new sale
    idToMarketToken[itemId].owner = payable(msg.sender);
    idToMarketToken[itemId].sold = true;
    _tokensSold.increment();

    payable(owner).transfer(listingPrice);
  }

  // function to fetch market items - minting, buying and selling
  // return the number of unsold items
  function fetchMarketTokens() public view returns(MarketToken[] memory) {
    uint itemCount = _tokenIds.current();
    uint unsoldItemCount = itemCount - _tokensSold.current();
    uint currentIndex = 0;

    // loop over the number of items created (if number have not been sold populate the array)
    MarketToken[] memory items = new MarketToken[](unsoldItemCount);
    for(uint i = 0; i < itemCount; i++) {
      if (idToMarketToken[i + 1].owner == address(0)) {
        uint currentId = i + 1;
        MarketToken storage currentItem = idToMarketToken[currentId];
        items[currentIndex] = currentItem;
        currentIndex += 1;
      }
    }
    return items;
  }

  // return nfts that the user has purchased
  function fetchMyNfts() public view returns(MarketToken[] memory) {
    // look through the items and filter for the same owner

    uint totalItemCount = _tokenIds.current();
    uint myItemsCount = 0;
    uint currentIndex = 0;

    for (uint i = 0; i < totalItemCount; i++) {
      if (idToMarketToken[i + 1].owner == msg.sender) {
        myItemsCount += 1;
      }
    }

    // loop over the number of items 
    MarketToken[] memory items = new MarketToken[](myItemsCount);
    for(uint i = 0; i < totalItemCount; i++) {
      if (idToMarketToken[i + 1].owner == msg.sender) {
        uint currentId = i + 1;
        MarketToken storage currentItem = idToMarketToken[currentId];
        items[currentIndex] = currentItem;
        currentIndex += 1;
      }
    }
    return items;
  }

}
