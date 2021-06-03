import { gql, DocumentNode } from "@apollo/client";

export const getAllUsersQuery = gql`
    query allAccounts($lastId: String!, $timestamp: BigInt!){
        accounts(
            where: {id_gt: $lastId, creationTimestamp_lt: $timestamp}
            first: 1000
        ){
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

export const userActivityQuery : DocumentNode = gql`
query userActivity($user: String!, $timestamp: BigInt!) {
    transactions(
        where: {user: $user, timestamp_lte: $timestamp}
        first:1) {
        id
    }
    fpmmFundingAdditions(
        where: {funder: $user, timestamp_lte: $timestamp}
        first:1) {
        id
    }
}`;

export const allTransactionsPerUserQuery = gql`
query allTransactions($user: String!){
    transactions(
        where: {user: $user}
        first: 100
    ){
        id
    }
    fpmmFundingAdditions(
        where: {funder: $user}
        first:100) {
        id
    }
}
`;

export const getTradeVolumePerUserQuery = gql`
query totalTradeVolume($lastId: String!, $user: String!, $timestamp: BigInt!){
    transactions(
        where: {user: $user, id_gt: $lastId, timestamp_lt: $timestamp}
        first: 1000
    ){
        id
        tradeAmount
    }
}`;

export {};