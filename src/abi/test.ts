export const testABI = [
    {
        "inputs": [],
        "name": "Forbidden",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "WrongParams",
        "type": "error"
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
                "indexed": false,
                "internalType": "uint256",
                "name": "tradeValueDai",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "feeValueDai",
                "type": "uint256"
            }
        ],
        "name": "BorrowingFeeCharged",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "newValue",
                "type": "uint256"
            }
        ],
        "name": "CanExecuteTimeoutUpdated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "daiVaultFeeP",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "lpFeeP",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "sssFeeP",
                "type": "uint256"
            }
        ],
        "name": "ClosingFeeSharesPUpdated",
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
                "indexed": false,
                "internalType": "uint256",
                "name": "valueDai",
                "type": "uint256"
            }
        ],
        "name": "DaiVaultFeeCharged",
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
                "indexed": false,
                "internalType": "uint256",
                "name": "valueDai",
                "type": "uint256"
            }
        ],
        "name": "DevGovFeeCharged",
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
                "indexed": false,
                "internalType": "uint8",
                "name": "version",
                "type": "uint8"
            }
        ],
        "name": "Initialized",
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
                "indexed": false,
                "internalType": "uint256",
                "name": "limitIndex",
                "type": "uint256"
            },
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
                "indexed": false,
                "internalType": "struct StorageInterfaceV5.Trade",
                "name": "t",
                "type": "tuple"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "nftHolder",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "enum StorageInterfaceV5.LimitOrder",
                "name": "orderType",
                "type": "uint8"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "price",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "priceImpactP",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "positionSizeDai",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "int256",
                "name": "percentProfit",
                "type": "int256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "daiSentToTrader",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "bool",
                "name": "exactExecution",
                "type": "bool"
            }
        ],
        "name": "LimitExecuted",
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
                "internalType": "uint256",
                "name": "index",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "enum GNSTradingCallbacksV6_4.CancelReason",
                "name": "cancelReason",
                "type": "uint8"
            }
        ],
        "name": "MarketCloseCanceled",
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
                "indexed": false,
                "internalType": "struct StorageInterfaceV5.Trade",
                "name": "t",
                "type": "tuple"
            },
            {
                "indexed": false,
                "internalType": "bool",
                "name": "open",
                "type": "bool"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "price",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "priceImpactP",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "positionSizeDai",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "int256",
                "name": "percentProfit",
                "type": "int256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "daiSentToTrader",
                "type": "uint256"
            }
        ],
        "name": "MarketExecuted",
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
                "internalType": "enum GNSTradingCallbacksV6_4.CancelReason",
                "name": "cancelReason",
                "type": "uint8"
            }
        ],
        "name": "MarketOpenCanceled",
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
                "indexed": false,
                "internalType": "uint256",
                "name": "valueDai",
                "type": "uint256"
            }
        ],
        "name": "NftBotFeeCharged",
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
                "name": "nftHolder",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "enum StorageInterfaceV5.LimitOrder",
                "name": "orderType",
                "type": "uint8"
            },
            {
                "indexed": false,
                "internalType": "enum GNSTradingCallbacksV6_4.CancelReason",
                "name": "cancelReason",
                "type": "uint8"
            }
        ],
        "name": "NftOrderCanceled",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "pairIndex",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "maxLeverage",
                "type": "uint256"
            }
        ],
        "name": "PairMaxLeverageUpdated",
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
        "name": "Pause",
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
                "indexed": false,
                "internalType": "uint256",
                "name": "valueDai",
                "type": "uint256"
            }
        ],
        "name": "ReferralFeeCharged",
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
                "indexed": false,
                "internalType": "uint256",
                "name": "valueDai",
                "type": "uint256"
            }
        ],
        "name": "SssFeeCharged",
        "type": "event"
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
        "inputs": [],
        "name": "canExecuteTimeout",
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
        "inputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "orderId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "price",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "spreadP",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "open",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "high",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "low",
                        "type": "uint256"
                    }
                ],
                "internalType": "struct GNSTradingCallbacksV6_4.AggregatorAnswer",
                "name": "a",
                "type": "tuple"
            }
        ],
        "name": "closeTradeMarketCallback",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "daiVaultFeeP",
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
        "name": "done",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "orderId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "price",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "spreadP",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "open",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "high",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "low",
                        "type": "uint256"
                    }
                ],
                "internalType": "struct GNSTradingCallbacksV6_4.AggregatorAnswer",
                "name": "a",
                "type": "tuple"
            }
        ],
        "name": "executeNftCloseOrderCallback",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "orderId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "price",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "spreadP",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "open",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "high",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "low",
                        "type": "uint256"
                    }
                ],
                "internalType": "struct GNSTradingCallbacksV6_4.AggregatorAnswer",
                "name": "a",
                "type": "tuple"
            }
        ],
        "name": "executeNftOpenOrderCallback",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getAllPairsMaxLeverage",
        "outputs": [
            {
                "internalType": "uint256[]",
                "name": "",
                "type": "uint256[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
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
                "internalType": "contract GNSStakingInterfaceV6_2",
                "name": "_staking",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "vaultToApprove",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "_daiVaultFeeP",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_lpFeeP",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_sssFeeP",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_canExecuteTimeout",
                "type": "uint256"
            }
        ],
        "name": "initialize",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "contract GNSBorrowingFeesInterfaceV6_4",
                "name": "_borrowingFees",
                "type": "address"
            }
        ],
        "name": "initializeV2",
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
        "name": "lpFeeP",
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
                        "internalType": "uint256",
                        "name": "orderId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "price",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "spreadP",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "open",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "high",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "low",
                        "type": "uint256"
                    }
                ],
                "internalType": "struct GNSTradingCallbacksV6_4.AggregatorAnswer",
                "name": "a",
                "type": "tuple"
            }
        ],
        "name": "openTradeMarketCallback",
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
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "pairMaxLeverage",
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
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_canExecuteTimeout",
                "type": "uint256"
            }
        ],
        "name": "setCanExecuteTimeout",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_daiVaultFeeP",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_lpFeeP",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_sssFeeP",
                "type": "uint256"
            }
        ],
        "name": "setClosingFeeSharesP",
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
                "name": "maxLeverage",
                "type": "uint256"
            }
        ],
        "name": "setPairMaxLeverage",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256[]",
                "name": "indices",
                "type": "uint256[]"
            },
            {
                "internalType": "uint256[]",
                "name": "values",
                "type": "uint256[]"
            }
        ],
        "name": "setPairMaxLeverageArray",
        "outputs": [],
        "stateMutability": "nonpayable",
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
                        "internalType": "enum GNSTradingCallbacksV6_4.TradeType",
                        "name": "tradeType",
                        "type": "uint8"
                    }
                ],
                "internalType": "struct GNSTradingCallbacksV6_4.SimplifiedTradeId",
                "name": "_id",
                "type": "tuple"
            },
            {
                "components": [
                    {
                        "internalType": "uint40",
                        "name": "maxSlippageP",
                        "type": "uint40"
                    },
                    {
                        "internalType": "uint216",
                        "name": "_placeholder",
                        "type": "uint216"
                    }
                ],
                "internalType": "struct GNSTradingCallbacksV6_4.TradeData",
                "name": "_tradeData",
                "type": "tuple"
            }
        ],
        "name": "setTradeData",
        "outputs": [],
        "stateMutability": "nonpayable",
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
                        "internalType": "enum GNSTradingCallbacksV6_4.TradeType",
                        "name": "tradeType",
                        "type": "uint8"
                    }
                ],
                "internalType": "struct GNSTradingCallbacksV6_4.SimplifiedTradeId",
                "name": "_id",
                "type": "tuple"
            },
            {
                "components": [
                    {
                        "internalType": "uint32",
                        "name": "tp",
                        "type": "uint32"
                    },
                    {
                        "internalType": "uint32",
                        "name": "sl",
                        "type": "uint32"
                    },
                    {
                        "internalType": "uint32",
                        "name": "limit",
                        "type": "uint32"
                    },
                    {
                        "internalType": "uint32",
                        "name": "created",
                        "type": "uint32"
                    }
                ],
                "internalType": "struct GNSTradingCallbacksV6_4.LastUpdated",
                "name": "_lastUpdated",
                "type": "tuple"
            }
        ],
        "name": "setTradeLastUpdated",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "sssFeeP",
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
        "name": "staking",
        "outputs": [
            {
                "internalType": "contract GNSStakingInterfaceV6_2",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
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
                "internalType": "address",
                "name": "",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            },
            {
                "internalType": "enum GNSTradingCallbacksV6_4.TradeType",
                "name": "",
                "type": "uint8"
            }
        ],
        "name": "tradeData",
        "outputs": [
            {
                "internalType": "uint40",
                "name": "maxSlippageP",
                "type": "uint40"
            },
            {
                "internalType": "uint216",
                "name": "_placeholder",
                "type": "uint216"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            },
            {
                "internalType": "enum GNSTradingCallbacksV6_4.TradeType",
                "name": "",
                "type": "uint8"
            }
        ],
        "name": "tradeLastUpdated",
        "outputs": [
            {
                "internalType": "uint32",
                "name": "tp",
                "type": "uint32"
            },
            {
                "internalType": "uint32",
                "name": "sl",
                "type": "uint32"
            },
            {
                "internalType": "uint32",
                "name": "limit",
                "type": "uint32"
            },
            {
                "internalType": "uint32",
                "name": "created",
                "type": "uint32"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
]