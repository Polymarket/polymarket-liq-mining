import * as yargs from "yargs";
import * as dotenv from "dotenv";
import { generateVolumeSnapshot,  } from "./volume-snapshot";

const DEFAULT_TOKEN_SUPPLY = 1000000;
const DEFAULT_SNAPSHOT_FILE_PATH = "./snapshots/volume-weighted-";

dotenv.config();

const args = yargs.options({
    'timestamp': { type: 'number', demandOption: false, default: Date.now()},
    'supply': { type: 'string', demandOption: false, default: DEFAULT_TOKEN_SUPPLY},
    'snapshotFilePath': { type: 'string', demandOption: false, default: DEFAULT_SNAPSHOT_FILE_PATH}
  }).argv;

  
generateVolumeSnapshot(args);