"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTradeVolumePerUserPerMarketQuery = exports.marketResolutionTxnQuery = exports.firstLiquidityAddedQuery = exports.getFixedProductMarketMakerQuery = exports.getUsersWhoPaidFeesInEpochQuery = exports.getFeesPaidPerUserQuery = exports.getTradeVolumePerUserQuery = exports.allTransactionsPerUserQuery = exports.allMarketsQuery = exports.userActivityQuery = exports.getAllUsersQuery = void 0;
const client_1 = require("@apollo/client");
exports.getAllUsersQuery = (0, client_1.gql) `
  query allAccounts(
    $lastId: String!
    $timestamp: BigInt!
    $excluded: [String]
  ) {
    accounts(
      where: {
        id_gt: $lastId
        creationTimestamp_lt: $timestamp
        id_not_in: $excluded
      }
      first: 1000
    ) {
      id
      transactions {
        id
      }
      fpmmPoolMemberships {
        id
      }
    }
  }
`;
exports.userActivityQuery = (0, client_1.gql) `
  query userActivity($user: String!, $timestamp: BigInt!) {
    transactions(where: { user: $user, timestamp_lte: $timestamp }, first: 1) {
      id
    }
    fpmmFundingAdditions(
      where: { funder: $user, timestamp_lte: $timestamp }
      first: 1
    ) {
      id
    }
  }
`;
exports.allMarketsQuery = (0, client_1.gql) `
  query allMarkets($lastId: String!, $timestamp: BigInt!) {
    fixedProductMarketMakers(
      where: { id_gt: $lastId, creationTimestamp_lte: $timestamp }
      first: 1000
    ) {
      id
      creationTransactionHash
    }
  }
`;
exports.allTransactionsPerUserQuery = (0, client_1.gql) `
  query allTransactions($user: String!) {
    transactions(where: { user: $user }, first: 100) {
      id
    }
    fpmmFundingAdditions(where: { funder: $user }, first: 100) {
      id
    }
  }
`;
exports.getTradeVolumePerUserQuery = (0, client_1.gql) `
  query totalTradeVolume(
    $lastId: String!
    $user: String!
    $timestamp: BigInt!
  ) {
    transactions(
      where: { user: $user, id_gt: $lastId, timestamp_lt: $timestamp }
      first: 1000
    ) {
      id
      tradeAmount
    }
  }
`;
exports.getFeesPaidPerUserQuery = (0, client_1.gql) `
  query totalTradeVolume(
    $lastId: String!
    $user: String!
    $startTimestamp: BigInt!
    $endTimestamp: BigInt!
  ) {
    transactions(
      where: {
        user: $user
        id_gt: $lastId
        timestamp_lt: $endTimestamp
        timestamp_gt: $startTimestamp
      }
      first: 1000
    ) {
      id
      feeAmount
    }
  }
`;
exports.getUsersWhoPaidFeesInEpochQuery = (0, client_1.gql) `
  query totalTradeVolume($startTimestamp: String!, $endTimestamp: String!, $lastId: String!) {
    transactions(
      where: {
		timestamp_gt: $startTimestamp
		timestamp_lt: $endTimestamp
        feeAmount_gt: 0
		id_gt: $lastId
      }
      first: 1000
    ) {
      id
      feeAmount
      user {
        id
      }
    }
  }
`;
exports.getFixedProductMarketMakerQuery = (0, client_1.gql) `
  query fpmm($market: String!, $block: Int!) {
    fixedProductMarketMaker(id: $market, block: { number: $block }) {
      id
      poolMembers {
        funder {
          id
        }
        amount
      }
      scaledLiquidityParameter
      outcomeTokenPrices
      outcomeTokenAmounts
      totalSupply
    }
  }
`;
exports.firstLiquidityAddedQuery = (0, client_1.gql) `
  query firstLiquidityAdded($market: String!) {
    fpmmFundingAdditions(
      first: 1
      where: { fpmm: $market }
      orderBy: timestamp
    ) {
      id
    }
  }
`;
exports.marketResolutionTxnQuery = (0, client_1.gql) `
  query marketResolution($market: String!) {
    fixedProductMarketMaker(id: $market) {
      conditions {
        resolutionHash
      }
    }
  }
`;
exports.getTradeVolumePerUserPerMarketQuery = (0, client_1.gql) `
  query totalTradeVolume(
    $lastId: String!
    $user: String!
    $timestamp: BigInt!
    $market: String!
  ) {
    transactions(
      where: {
        user: $user
        id_gt: $lastId
        timestamp_lt: $timestamp
        market: $market
      }
      first: 1000
    ) {
      id
      tradeAmount
    }
  }
`;
