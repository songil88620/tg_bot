import { Inject, OnModuleInit, forwardRef } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { etherScanKey_2, tokenListForSwap, wethAddress } from 'src/abi/constants';
import { SwapService } from 'src/swap/swap.service';
import { PlatformService } from 'src/platform/platform.service';
import { ethers } from 'ethers'
import axios from 'axios';
import { BotService } from 'src/bot/bot.service';
import { TokenscannerDocument } from './tokenscanner.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { standardABI } from 'src/abi/standard';

const key1 = '9CBM8CK1EDUS1NR2TAKQI6MWNIEUJ13JZ9'
const key2 = 'UNWGU84VQUH6FFDSEVCG1P11UAU9BPSX76'
const key3 = 'J358GNR7YYX5Y93X7Q5MCUDXVTNGNWMN1Z'

@Injectable()
export class TokenscannerService implements OnModuleInit {

    private provider1: any;
    private provider2: any;
    private provider3: any;

    private provider: any;

    private tokenlist: string[];
    public cnt: number

    constructor(
        @InjectModel('tokenscanner') private readonly model: Model<TokenscannerDocument>,
        @Inject(forwardRef(() => UserService)) private userService: UserService,
        @Inject(forwardRef(() => SwapService)) private swapService: SwapService,
        @Inject(forwardRef(() => PlatformService)) private platformService: PlatformService,
        @Inject(forwardRef(() => BotService)) private botService: BotService,
    ) {
        this.cnt = 0;
    }

    async onModuleInit() {
        try {
            this.provider = this.swapService.provider;
            this.provider1 = new ethers.providers.EtherscanProvider("homestead", key1)
            this.provider2 = new ethers.providers.EtherscanProvider("homestead", key2)
            this.provider3 = new ethers.providers.EtherscanProvider("homestead", key3)
        } catch (e) {
            console.log("Err", e)
        }
    }

    async getTokenList() {
        return this.model.find().sort({ created: -1 });
    }

    @Cron(CronExpression.EVERY_10_HOURS, { name: 'scanner_001' })
    async scannerBot() {
        try {
            console.log(">>>>runing every 10 mins")
            const endblock = await this.provider.getBlockNumber();
            const startblock = endblock - 5;
            for (var i = startblock; i <= endblock; i++) {
                const blocks = await this.provider.getBlock(i);
                if (blocks != null) {
                    if (blocks.transactions != null && blocks.transactions.length != 0) {
                        var idx = 0;
                        const loops = () => {
                            if (idx < blocks.transactions.length) {
                                if (idx % 3 == 0) {
                                    this.getTranasctionDetail(blocks.transactions[idx], idx, key1)
                                } else if (idx % 3 == 1) {
                                    this.getTranasctionDetail(blocks.transactions[idx], idx, key2)
                                } else if (idx % 3 == 2) {
                                    this.getTranasctionDetail(blocks.transactions[idx], idx, key3)
                                }

                                idx++;
                                setTimeout(loops, 300)
                            }
                        }
                        loops();
                    }
                }
            }
        } catch (e) {
            console.log(">>>err", e.message)
        }
    }

    async getTranasctionDetail(tx: string, idx: number, key: string) {
        try {
            const provider = new ethers.providers.JsonRpcProvider('https://eth-mainnet.nodereal.io/v1/f3b37cc49d3948f5827621b8c2e0bdb3')
            const t = await provider.getTransaction(tx);
            if (!t.to) {
                const responsed = await axios.get('https://api.etherscan.io/api?module=proxy&action=eth_getTransactionReceipt&txhash=' + t.hash + '&apikey=' + key)
                const contract_address = responsed.data.result.contractAddress;
                if (responsed.data.result.contractAddress != "") {
                    var respdata = "";
                    respdata = (responsed.data.result.contractAddress);

                    const tokenContract = new ethers.Contract(respdata, standardABI, provider);
                    const contract = respdata;
                    const name = await tokenContract.name();
                    const symbol = await tokenContract.symbol();
                    const decimal = await tokenContract.decimals();

                    const data = {
                        contract,
                        name,
                        symbol,
                        decimal,
                        created: Date.now(),
                        verified: false,
                        detail: {
                            tg: '',
                            twitter: '',
                            discord: '',
                            medium: '',
                            website: '',
                            dexId: '',
                            priceUsd: '',
                            mcap: '',
                            liquidity: '',
                            h24: ''
                        }
                    }
                    await new this.model({ ...data }).save();
                    const old = await this.model.find().sort({ created: 1 }).exec();
                    if (old.length > 100) {
                        await this.model.findByIdAndDelete(old[0]._id)
                    }
                }
            }
        } catch (e) {
            console.log(">>err")
        }
    }

    @Cron(CronExpression.EVERY_MINUTE, { name: 'scan_detail_001' })
    async scanDetail() {
        try {
            const lists = await this.model.find();
            var idx = 0;
            const loops = () => {
                if (idx < lists.length) {
                    const list = lists[idx];
                    const contract = list.contract;
                    if (idx % 3 == 0) {
                        this.getTokenDetail(contract, list._id, key1, list.verified)
                    } else if (idx % 3 == 1) {
                        this.getTokenDetail(contract, list._id, key2, list.verified)
                    } else if (idx % 3 == 2) {
                        this.getTokenDetail(contract, list._id, key3, list.verified)
                    }
                    idx++;
                    setTimeout(loops, 300)
                }
            }
            loops();
        } catch (e) {
            console.log(">>>err")
        }
    }

    async getTokenDetail(contract: string, id: string, key: string, v: boolean) {
        try {
            const res = await axios.get('https://api.dexscreener.com/latest/dex/search?q=' + contract)
            if (res.data.pairs[0] != null) {
                const token_info = await this.model.findById(id).exec();
                var detail = token_info.detail;
                detail.dexId = res.data.pairs[0].dexId;
                detail.priceUsd = res.data.pairs[0].priceUsd;
                detail.mcap = res.data.pairs[0].fdv;
                detail.liquidity = res.data.pairs[0].liquidity.usd;
                detail.h24 = res.data.pairs[0].volume.h24;
                await this.model.findByIdAndUpdate(id, { detail })
            }
            if (!v) {
                const v_res = await axios.get('https://api.etherscan.io/api?module=contract&action=getsourcecode&address=' + contract + '&apikey=' + key);
                if (v_res.data.result[0].SourceCode != '' && v_res.data.result[0].SourceCode != null) {
                    const source = v_res.data.result[0].SourceCode;
                    const token_info = await this.model.findById(id).exec();
                    var detail = token_info.detail;
                    detail.tg = this.detectTg(source);
                    detail.twitter = this.detectTwitter(source);
                    detail.discord = this.detectDiscord(source);
                    detail.website = this.detectWebsite(source);
                    detail.medium = this.detectMedium(source);
                    await this.model.findByIdAndUpdate(id, { detail, verified: true })
                }
            }
        } catch (e) {
            console.log(">>>>error")
        }
    }

    detectTg(message: string) {
        var urlRegex = /(((https?:\/\/t\.me\/)|(www\.t\.me))[^\s]+)/g;
        const res: any = message.match(urlRegex);
        if (res != null && res.length > 0) {
            return res[0]
        } else {
            return ""
        }
    }
    detectTwitter(message: string) {
        var urlRegex = /(((https?:\/\/twitter\.com\/)|(www\.twitter\.com))[^\s]+)/g;
        const res: any = message.match(urlRegex);
        if (res != null && res.length > 0) {
            return res[0]
        } else {
            return ""
        }
    }
    detectDiscord(message: string) {
        var urlRegex = /(((https?:\/\/discord\.gg\/)|(www\.discord\.gg))[^\s]+)/g;
        const res: any = message.match(urlRegex);
        if (res != null && res.length > 0) {
            return res[0]
        } else {
            return ""
        }
    }
    detectMedium(message: string) {
        var urlRegex = /(((https?:\/\/medium\.com\/)|(www\.medium\.com))[^\s]+)/g;
        const res: any = message.match(urlRegex);
        if (res != null && res.length > 0) {
            return res[0]
        } else {
            return ""
        }
    }
    detectWebsite(message: string) {
        var urlRegex = /(((https?:\/\/)|(www\.))(?!t\.me|twitter\.com|hardhat\.org|github\.com|zeppelin\.solutions|openzeppelin\.com|smartcontracts\.tools|www\.smartcontracts\.tools|forum\.openzeppelin\.com|forum\.zeppelin\.solutions|medium\.com|discord\.com|eips.ethereum\.org|ethereum\.org|github\.io|soliditylang\.org|docs\.soliditylang\.org|eth\.wiki|ethers\.io|consensys\.net|readthedocs\.io|solidity\.readthedocs\.io|stackexchange\.com|diligence\.consensys\.net)[^\s]+)/g;
        const res: any = message.match(urlRegex);
        if (res != null && res.length > 0) {
            return res[0]
        } else {
            return ""
        }
    }


}