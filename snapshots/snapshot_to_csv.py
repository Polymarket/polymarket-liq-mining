import sys
import json

def main():
    print("Converting snapshot to csv...");
    snapshot_file_path = sys.argv[1]
    with open(snapshot_file_path) as fh:
        snapshot = json.load(fh)

    snapshot_sorted = sorted([(d.get("proxyWallet"), d.get("magicWallet"), d.get("amount")) for d in snapshot],
    key=lambda x: x[2], reverse=True)

    with open("{}_csv.csv".format(snapshot_file_path), "w+") as fh:
        for tup in snapshot_sorted:
            fh.write("{},{},{}\n".format(tup[0], tup[1], tup[2]))

    print("Complete!")

main()