export const gns_tradeABI = [
    {
        "inputs": [
            {
                "internalType": "contract StorageInterfaceV5",
                "name": "_storageT",
                "type": "address"
            },
            {
                "internalType": "contract NftRewardsInterfaceV6_3_1",
                "name": "_nftRewards",
                "type": "address"
            },
            {
                "internalType": "contract GNSPairInfosInterfaceV6",
                "name": "_pairInfos",
                "type": "address"
            },
            {
                "internalType": "contract GNSReferralsInterfaceV6_2",
                "name": "_referrals",
                "type": "address"
            },
            {
                "internalType": "contract GNSBorrowingFeesInterfaceV6_4",
                "name": "_borrowingFees",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "_maxPosDai",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_marketOrdersTimeout",
                "type": "uint256"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            },
            {
                "components": [
                    {
                        "components": [
                            {
                                "internalType": "address",
                                "name": "trader",
                                "type": "address"
                            },
                            {
                                "internalType": "uint256",
                                "name": "pairIndex",
                                "type": "uint256"
                            },
                            {
                                "internalType": "uint256",
                                "name": "index",
                                "type": "uint256"
                            },
                            {
                                "internalType": "uint256",
                                "name": "initialPosToken",
                                "type": "uint256"
                            },
                            {
                                "internalType": "uint256",
                                "name": "positionSizeDai",
                                "type": "uint256"
                            },
                            {
                                "internalType": "uint256",
                                "name": "openPrice",
                                "type": "uint256"
                            },
                            {
                                "internalType": "bool",
                                "name": "buy",
                                "type": "bool"
                            },
                            {
                                "internalType": "uint256",
                                "name": "leverage",
                                "type": "uint256"
                            },
                            {
                                "internalType": "uint256",
                                "name": "tp",
                                "type": "uint256"
                            },
                            {
                                "internalType": "uint256",
                                "name": "sl",
                                "type": "uint256"
                            }
                        ],
                        "internalType": "struct StorageInterfaceV5.Trade",
                        "name": "trade",
                        "type": "tuple"
                    },
                    {
                        "internalType": "uint256",
                        "name": "block",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "wantedPrice",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "slippageP",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "spreadReductionP",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "tokenId",
                        "type": "uint256"
                    }
                ],
                "indexed": false,
                "internalType": "struct StorageInterfaceV5.PendingMarketOrder",
                "name": "order",
                "type": "tuple"
            }
        ],
        "name": "ChainlinkCallbackTimeout",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "trader",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "pairIndex",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "index",
                "type": "uint256"
            }
        ],
        "name": "CouldNotCloseTrade",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "bool",
                "name": "done",
                "type": "bool"
            }
        ],
        "name": "Done",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "trader",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "pairIndex",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "bool",
                "name": "open",
                "type": "bool"
            }
        ],
        "name": "MarketOrderInitiated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "nftHolder",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "trader",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "pairIndex",
                "type": "uint256"
            }
        ],
        "name": "NftOrderInitiated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "nftHolder",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "trader",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "pairIndex",
                "type": "uint256"
            }
        ],
        "name": "NftOrderSameBlock",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "string",
                "name": "name",
                "type": "string"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "NumberUpdated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "trader",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "pairIndex",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "index",
                "type": "uint256"
            }
        ],
        "name": "OpenLimitCanceled",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "trader",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "pairIndex",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "index",
                "type": "uint256"
            }
        ],
        "name": "OpenLimitPlaced",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "trader",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "pairIndex",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "index",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "newPrice",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "newTp",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "newSl",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "maxSlippageP",
                "type": "uint256"
            }
        ],
        "name": "OpenLimitUpdated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "bool",
                "name": "paused",
                "type": "bool"
            }
        ],
        "name": "Paused",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "trader",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "pairIndex",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "index",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "newSl",
                "type": "uint256"
            }
        ],
        "name": "SlUpdated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "trader",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "pairIndex",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "index",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "newTp",
                "type": "uint256"
            }
        ],
        "name": "TpUpdated",
        "type": "event"
    },
    {
        "inputs": [],
        "name": "_msgSender",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "borrowingFees",
        "outputs": [
            {
                "internalType": "contract GNSBorrowingFeesInterfaceV6_4",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "pairIndex",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "index",
                "type": "uint256"
            }
        ],
        "name": "cancelOpenLimitOrder",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "pairIndex",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "index",
                "type": "uint256"
            }
        ],
        "name": "closeTradeMarket",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_order",
                "type": "uint256"
            }
        ],
        "name": "closeTradeMarketTimeout",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "trader",
                "type": "address"
            },
            {
                "internalType": "bytes",
                "name": "call_data",
                "type": "bytes"
            }
        ],
        "name": "delegatedAction",
        "outputs": [
            {
                "internalType": "bytes",
                "name": "",
                "type": "bytes"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "name": "delegations",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "done",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "packed",
                "type": "uint256"
            }
        ],
        "name": "executeNftOrder",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "isDone",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "isPaused",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "marketOrdersTimeout",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "maxPosDai",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "nftRewards",
        "outputs": [
            {
                "internalType": "contract NftRewardsInterfaceV6_3_1",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "components": [
                    {
                        "internalType": "address",
                        "name": "trader",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "pairIndex",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "index",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "initialPosToken",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "positionSizeDai",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "openPrice",
                        "type": "uint256"
                    },
                    {
                        "internalType": "bool",
                        "name": "buy",
                        "type": "bool"
                    },
                    {
                        "internalType": "uint256",
                        "name": "leverage",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "tp",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "sl",
                        "type": "uint256"
                    }
                ],
                "internalType": "struct StorageInterfaceV5.Trade",
                "name": "t",
                "type": "tuple"
            },
            {
                "internalType": "enum NftRewardsInterfaceV6_3_1.OpenLimitOrderType",
                "name": "orderType",
                "type": "uint8"
            },
            {
                "internalType": "uint256",
                "name": "spreadReductionId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "slippageP",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "referrer",
                "type": "address"
            }
        ],
        "name": "openTrade",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_order",
                "type": "uint256"
            }
        ],
        "name": "openTradeMarketTimeout",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "pairInfos",
        "outputs": [
            {
                "internalType": "contract GNSPairInfosInterfaceV6",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "pause",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "referrals",
        "outputs": [
            {
                "internalType": "contract GNSReferralsInterfaceV6_2",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "removeDelegate",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "delegate",
                "type": "address"
            }
        ],
        "name": "setDelegate",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "setMarketOrdersTimeout",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "setMaxPosDai",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "storageT",
        "outputs": [
            {
                "internalType": "contract StorageInterfaceV5",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "pairIndex",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "index",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "price",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "tp",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "sl",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "maxSlippageP",
                "type": "uint256"
            }
        ],
        "name": "updateOpenLimitOrder",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "pairIndex",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "index",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "newSl",
                "type": "uint256"
            }
        ],
        "name": "updateSl",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "pairIndex",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "index",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "newTp",
                "type": "uint256"
            }
        ],
        "name": "updateTp",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
]