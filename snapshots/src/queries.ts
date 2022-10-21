import { gql } from "@apollo/client";

export const getAllUsersQuery = gql`
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

export const userActivityQuery = gql`
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

export const allMarketsQuery = gql`
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

export const allTransactionsPerUserQuery = gql`
  query allTransactions($user: String!) {
    transactions(where: { user: $user }, first: 100) {
      id
    }
    fpmmFundingAdditions(where: { funder: $user }, first: 100) {
      id
    }
  }
`;

export const getTradeVolumePerUserQuery = gql`
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

export const getFeesPaidPerUserQuery = gql`
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

export const getUsersWhoPaidFeesInEpochQuery = gql`
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


export const getFixedProductMarketMakerQuery = gql`
    query fpmm($market: String!, $block: Int!) {
        fixedProductMarketMaker(id: $market, block: { number: $block }) {
            id
            poolMembers(orderBy: amount, orderDirection: desc) {
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

export const firstLiquidityAddedQuery = gql`
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

export const marketResolutionTxnQuery = gql`
  query marketResolution($market: String!) {
    fixedProductMarketMaker(id: $market) {
      conditions {
        resolutionHash
      }
    }
  }
`;

export const getTradeVolumePerUserPerMarketQuery = gql`
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
