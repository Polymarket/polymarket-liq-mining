# Polymarket retroactive snapshot scripts

This repo contains scripts and tools used to calculate retroactive snapshots
Volume weighted snapshot script

`yarn volume-snapshot --timestamp TIMESTAMP --supply SUPPLY`

LP Weighted snapshot script

`yarn lp-snapshot --timestamp TIMESTAMP --supply SUPPLY`


Fees Snapshot

`yarn fees-snapshot --startTimestamp START_TIMESTAMP --endTimestamp END_TIMESTAMP

### Reset Local Script

`yarn reset-local`
> **Note:** This is to be used on local only.

This command will provide interactive options to delete from three collections: Reward Users, Reward Markets, and Reward Epochs.

This requires local permissions for these three collections to include the `/count` endpoint on each to be publicly accessible.

Be sure to setup an admin user on local strapi and add the email and password to a `.env` file as seen in `.env.example`.

