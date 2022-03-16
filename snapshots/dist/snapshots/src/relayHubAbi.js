"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TxnRelayedEventAbiFragment = void 0;
exports.TxnRelayedEventAbiFragment = [{ anonymous: false,
        inputs: [
            { indexed: true, name: "relay", type: "address" },
            { indexed: true, name: "from", type: "address" },
            { indexed: true, name: "to", type: "address" },
            { indexed: false, name: "selector", type: "bytes4" },
            { indexed: false, name: "status", type: "uint8" },
            { indexed: false, name: "charge", type: "uint256" },
        ],
        name: "TransactionRelayed",
        type: "event",
    }];
