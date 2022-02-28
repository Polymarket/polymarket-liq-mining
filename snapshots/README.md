# Polymarket liq mining snapshot scripts

This repo contains scripts and tools used to calculate retroactive snapshots for Polymarket's liquidity mining program

Please set your `.env` based off the `.env.example`

`yarn run liq-mining-snapshot` will start a walkthrough to decide which epoch you'd like to calculate fee rewards and liquidity rewards.

### Reset Local Script

`yarn reset-local`

> **Note:** This is to be used on local only. Must allow PUBLIC role to have access to `find` endpoint in strapi admin permissions dashboard.

This command will provide interactive options to delete from three collections: Reward Users, Reward Markets, and Reward Epochs.

This requires local permissions for these three collections to include the `/count` endpoint on each to be publicly accessible.
