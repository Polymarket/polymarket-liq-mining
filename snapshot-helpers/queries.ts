import { gql, DocumentNode } from "@apollo/client";

export const getAllUsersQuery = gql`
    query allAccounts($lastId: String!, $timestamp: BigInt!){
        accounts(
            where: {id_gt: $lastId, creationTimestamp_lt: $timestamp}
            first: 1000
        ){
            id
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
query allTransactions($lastTxnId: String!, $lastFundingTxnId: String!, $user: String!){
    transactions(
        where: {id_gt: $lastTxnId, user: $user}
        first: 1000
    ){
        id
    }
    fpmmFundingAdditions(
        where: {funder: $user, id_gt: $lastFundingTxnId}
        first:1) {
        id
    }
}
`;