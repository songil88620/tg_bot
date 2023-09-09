import { Injectable, OnModuleInit, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebUserEntity } from './webuser.entity';
import { UserService } from 'src/user/user.service';
import { ethers } from 'ethers';
import { SwapService } from 'src/swap/swap.service';
import { PairsTrade, tokenListForSwap, wethAddress } from 'src/abi/constants';
import { PlatformService } from 'src/platform/platform.service';
import { SnipeService } from 'src/snipe/snipe.service';
import { MirrorService } from 'src/mirror/mirror.service';
import { LimitService } from 'src/limit/limit.service';
import { LogService } from 'src/log/log.service';
import { uid } from 'uid';
import { TradeService } from 'src/trade/trade.service';
import { BridgeService } from 'src/bridge/bridge.service';
import { from } from 'rxjs';
import { TokenscannerService } from 'src/tokenscanner/tokenscanner.service';
import { DeployerService } from 'src/tokendeployer/deployer.service';
import { UnitradeService } from 'src/unitrade/unitrade.service';

@Injectable()
export class WebUserService implements OnModuleInit {

    private user: string[] = []

    constructor(
        @InjectRepository(WebUserEntity) private repository: Repository<WebUserEntity>,
        @Inject(forwardRef(() => UserService)) private userService: UserService,
        @Inject(forwardRef(() => SwapService)) private swapService: SwapService,
        @Inject(forwardRef(() => PlatformService)) private platformService: PlatformService,
        @Inject(forwardRef(() => SnipeService)) private snipeService: SnipeService,
        @Inject(forwardRef(() => MirrorService)) private mirrorService: MirrorService,
        @Inject(forwardRef(() => LimitService)) private limitService: LimitService,
        @Inject(forwardRef(() => LogService)) private logService: LogService,
        @Inject(forwardRef(() => TradeService)) private tradeService: TradeService,
        @Inject(forwardRef(() => BridgeService)) private bridgeService: BridgeService,
        @Inject(forwardRef(() => TokenscannerService)) private scannerService: TokenscannerService,
        @Inject(forwardRef(() => DeployerService)) private deployerService: DeployerService,
        @Inject(forwardRef(() => UnitradeService)) private unitradeService: UnitradeService,
    ) {
        this.user = [];
    }

    async onModuleInit() {
        var user_tmp = [];
        const users = await this.userService.findAll()
        users.forEach((u) => {
            if (u.panel == 1) {
                user_tmp.push(u.id);
            }
        })
        this.user = user_tmp;
    }

    async isExist(c: { publicid: string, id: number, csrf: string }) {
        const condition = {
            publicid: this.validateString(c.publicid),
            id: c.id,
            csrf: this.validateString(c.csrf)
        }
        const u = await this.repository.findOne({
            where: condition
        });
        if (u) {
            return true
        } else {
            return false
        }
    }

    // id is for publicid and webid is for id of mysql table
    async createNew(data: { id: string, webid: number }, csrf: string) {
        // if there is a new user, we need to record it on DB and reply
        try {
            const isIn = await this.isExist({ publicid: data.id, id: data.webid, csrf })
            const userid = data.id;
            if (!isIn) {
                return { status: false, user: 'not exist' }
            }
            if (!this.user.includes(userid)) {
                var user_tmp = this.user;
                user_tmp.push(userid);
                this.user = user_tmp;
                const username = "";
                const w = {
                    address: "",
                    key: ""
                }
                var w_tmp = [];
                for (var i = 0; i < 10; i++) {
                    w_tmp.push(w)
                }
                const sniper = {
                    network: "",
                    contract: "",
                    autobuy: false,
                    buyamount: "0",
                    gasprice: "1",
                    slippage: "0.1",
                    smartslip: false,
                    wallet: 0,
                    result: "",
                    multi: false,
                    blockwait: 0,
                    startprice: 10000,
                    sellrate: 100,
                    autosell: false,
                    sold: false,
                    private: false,
                    token: {
                        name: "",
                        symbol: "",
                        decimal: "",
                        supply: "",
                        owner: "",
                        lppair: "",
                        honeypot: 0,
                        buytax: 0,
                        selltax: 0,
                        transferfee: 0,
                        maxwallet: "",
                        maxwp: 0,
                        methods: []
                    }
                }
                const swap = {
                    token: "",
                    amount: "",
                    gasprice: "1",
                    slippage: "0.1",
                    with: true,
                    wallet: 0,
                    private: false
                }
                const transfer = {
                    token: "",
                    amount: "0",
                    to: "",
                    wallet: 0,
                    private: false
                }
                const m = {
                    address: "",
                    amount: "0",
                    gasprice: "1",
                    slippage: "0.1",
                    private: false
                }
                var m_tmp = [];
                for (var i = 0; i < 10; i++) {
                    m_tmp.push(m)
                }
                const l = {
                    token: "",
                    amount: "0",
                    wallet: 0,
                    price: "0",
                    result: false,
                    except: false,
                    gasprice: "1",
                    slippage: "0.1",
                    private: false
                }
                var l_tmp = [];
                for (var i = 0; i < 5; i++) {
                    l_tmp.push(l)
                }
                const perps = {
                    pairidx: 0,
                    leverage: 1,
                    slippage: 1,
                    stoploss: 1,
                    profit: 1,
                    autotrade: false,
                    longshort: false,
                    size: 0,
                    wallet: 0,
                }

                const bridge = {
                    fromChain: '',
                    toChain: '',
                    token: '',
                    amount: '',
                    receiver: '',
                    wallet: 1
                }

                const autotrade = {
                    liqudity: 0,
                    balance: 0,
                    token: "",
                    amount: 0,
                    sellat: 0,
                    auto: false,
                    buy: false,
                    sell: false,
                    wallet: 0
                }

                const newtoken = {
                    name: '',
                    supply: 0,
                    buytax: 0,
                    selltax: 0,
                    address: ''
                }

                const signaltrade = {
                    channel: 0,
                    token: "",
                    amount: "",
                    gasprice: "",
                    slippage: "",
                    wallet: 0,
                    private: false,
                    sellat: 1000,
                    auto: false,
                    startprice: 1000,
                    sold: false,
                    buy: false
                }

                const new_user = {
                    id: userid,
                    webid: data.webid,
                    panel: 1,
                    username,
                    wallet: w_tmp,
                    sniper,
                    swap,
                    transfer,
                    mirror: m_tmp,
                    limits: l_tmp,
                    perps,
                    bridge,
                    autotrade,
                    wmode: true,
                    detail: "",
                    txamount: 0,
                    referral: [],
                    code: uid(),
                    other: {
                        mirror: 0,
                        limit: 0
                    },
                    tmp: '',
                    newtoken,
                    signaltrade
                }
                var user = await this.userService.create(new_user);
                user.wallet = [];
                return { status: true, user: user };
            } else {
                var user = await this.userService.findOne(data.id)
                user.wallet = [];
                return { status: true, user: user };
            }
        } catch (e) {
            return { status: false, user: undefined }
        }
    }

    async findOne(c: any) {
        return await this.repository.findOne({
            where: c
        });
    }

    async updateReferral(data: { id: string, webid: number, referral: string }, csrf: string) {
        try {
            const isIn = await this.isExist({ publicid: data.id, id: data.webid, csrf })
            if (isIn) {
                const user = await this.userService.findOne(data.id);
                const u_code = user.code;
                const res = await this.userService.updateReferral(data.referral, u_code);
                return { status: true }
            } else {
                return { status: false }
            }
        } catch (e) {
            return { status: false }
        }
    }

    async getRefferals(data: { id: string, webid: number }, csrf: string) {
        try {
            const isIn = await this.isExist({ publicid: data.id, id: data.webid, csrf })
            if (isIn) {
                const user = await this.userService.findOne(data.id);
                const referr_len = user.referral.length;
                var refs = [];
                for (var i = 0; i < user.referral.length; i++) {
                    const u_id = user.referral[i];
                    const ref_data = await this.logService.getTotalVolume(u_id);
                    if (ref_data.status) {
                        refs.push(ref_data)
                    }
                }
                return { status: true, refs: refs, code: user.code, len: referr_len }
            } else {
                return { status: false }
            }
        } catch (e) {
            return { status: false, msg: e }
        }
    }

    // generate 10 wallet at once
    async generateAll(data: { id: string, webid: number }, csrf: string) {
        try {
            const isIn = await this.isExist({ publicid: data.id, id: data.webid, csrf })
            if (isIn) {
                const wallets = [];
                for (var i = 0; i < 10; i++) {
                    const wallet = ethers.Wallet.createRandom();
                    const w = {
                        address: wallet.address,
                        key: wallet.privateKey
                    };
                    wallets.push(w);
                }
                await this.userService.update(data.id, { wallet: wallets });
                return { status: true, wallets: wallets, msg: 'Generate 10 Wallets Successfully.' }
            } else {
                return { status: false, wallets: [], msg: 'You do not exist on this platform, please sign up first.' }
            }
        } catch (e) {
            return { status: false, wallets: [], msg: 'Error occured. Try again' }
        }
    }

    // import one wallet based on pk
    async importOne(data: { id: string, webid: number, widx: number, pk: string }, csrf: string) {
        try {
            const isIn = await this.isExist({ publicid: data.id, id: data.webid, csrf })
            if (isIn) {
                const user = await this.userService.findOne(data.id);
                const wallet = new ethers.Wallet(data.pk);
                var wallets = user.wallet;
                wallets[data.widx - 1] = {
                    address: wallet.address,
                    key: data.pk
                };
                await this.userService.update(data.id, { wallet: wallets });
                return { status: true, wallet: wallet.address, msg: 'Imported Successfully' };
            } else {
                return { status: false, wallet: "", msg: 'You do not exist on this platform, please sign up first.' }
            }
        } catch (e) {
            return { status: false, wallet: "", msg: 'Error occured. Try again' }
        }
    }

    async importSome(data: { id: string, webid: number, pk: string[] }, csrf: string) {
        try {
            const isIn = await this.isExist({ publicid: data.id, id: data.webid, csrf })
            if (isIn) {
                const user = await this.userService.findOne(data.id);
                var wallets = user.wallet;
                data.pk.forEach((p, index) => {
                    if (p.length == 64) {
                        const wallet = new ethers.Wallet(p);
                        wallets[index] = {
                            address: wallet.address,
                            key: p
                        }
                    }
                })
                // if pk is not set, generate automatically
                for (var i = 0; i < wallets.length; i++) {
                    if (wallets[i].key == "") {
                        const wt = ethers.Wallet.createRandom();
                        wallets[i] = {
                            address: wt.address,
                            key: wt.privateKey
                        }
                    }
                }
                await this.userService.update(data.id, { wallet: wallets });
                return { status: true, wallet: [], msg: 'Imported Successfully' };
            } else {
                return { status: false, wallet: "", msg: 'You do not exist on this platform, please sign up first.' }
            }
        } catch (e) {
            return { status: false, wallet: "", msg: 'Error occured. Try again' }
        }
    }

    // view wallet detail of one
    async viewOne(data: { id: string, webid: number, widx: number }, csrf: string) {
        try {
            const isIn = await this.isExist({ publicid: data.id, id: data.webid, csrf })
            if (isIn) {
                const user = await this.userService.findOne(data.id);
                const wallet = user.wallet;
                const address = wallet[data.widx - 1].address;
                const key = wallet[data.widx - 1].key;
                const balance = await this.swapService.getBalanceOfWallet(address);
                const holding = await this.swapService.getHoldingList(address)
                return { status: true, wallet: { address, key, balance, holding: holding.data }, msg: "Got Successfully." }
            } else {
                return { status: false, wallet: { address: "", key: "", balance: 0, holding: [] }, msg: 'You do not exist on this platform, please sign up first.' }
            }
        } catch (e) {
            return { status: false, wallet: { address: "", key: "", balance: 0, holding: [] }, msg: 'Error occured. Try again' }
        }
    }

    // clear wallet info(pk, address)
    async deleteOne(data: { id: string, webid: number, widx: number }, csrf: string) {
        try {
            const isIn = await this.isExist({ publicid: data.id, id: data.webid, csrf })
            if (isIn) {
                const user = await this.userService.findOne(data.id);
                var wallet = user.wallet;
                wallet[data.widx - 1] = {
                    address: "",
                    key: ""
                }
                await this.userService.update(data.id, { wallet })
                return { status: true, msg: 'Delete Successfully.' }
            } else {
                return { status: false, msg: 'You do not exist on this platform, please sign up first.' }
            }
        } catch (e) {
            return { status: false, msg: 'Error occured. Try again' }
        }
    }

    // transfer now
    async transferNow(data: { id: string, webid: number, widx: number, token: number, contract: string, amount: number, receiver: string, private: boolean }, csrf: string) {
        try {
            const isIn = await this.isExist({ publicid: data.id, id: data.webid, csrf })
            if (isIn) {
                const user = await this.userService.findOne(data.id);
                const pk = user.wallet[data.widx - 1].key;
                var tokenIn = "";
                if (data.token == 35) {
                    const isToken = await this.swapService.isTokenContract(data.contract);
                    if (isToken) {
                        tokenIn = data.contract;
                    } else {
                        return { status: false, msg: 'Wrong token contract address' }
                    }
                } else if (data.token == 34) {
                    tokenIn = wethAddress;
                } else {
                    tokenIn = tokenListForSwap[data.token].address;
                }
                return await this.swapService.transferTo(tokenIn, data.receiver, data.amount.toString(), pk, data.id, 1, 'direct')
            } else {
                return { status: false, msg: 'You do not exist on this platform, please sign up first.' }
            }
        } catch (e) {
            return { status: false, msg: 'Error occured. Try again' }
        }
    }

    // swap now
    async swapNow(data: { id: string, webid: number, widx: number, token: number, direction: boolean, contract: string, amount: number, gasprice: number, slippage: number, private: boolean }, csrf: string) {
        try {
            const isIn = await this.isExist({ publicid: data.id, id: data.webid, csrf })
            if (isIn) {
                const user = await this.userService.findOne(data.id);
                const pk = user.wallet[data.widx - 1].key;
                var tokenIn = "";
                if (data.token == 34) {
                    const isToken = await this.swapService.isTokenContract(data.contract);
                    if (isToken) {
                        tokenIn = data.contract;
                    } else {
                        return { status: false, msg: 'Wrong token contract address' }
                    }
                } else {
                    tokenIn = tokenListForSwap[data.token].address;
                }
                var tokenA = "";
                var tokenB = "";
                if (data.direction) {
                    tokenA = wethAddress;
                    tokenB = tokenIn;
                } else {
                    tokenA = tokenIn;
                    tokenB = wethAddress;
                }
                return await this.swapService.swapToken(tokenA, tokenB, data.amount, data.gasprice, data.slippage, pk, "swap", data.id, 1, user.swap.private);
            } else {
                return { status: false, msg: 'You do not exist on this platform, please sign up first.' }
            }
        } catch (e) {
            return { status: false, msg: 'Error occured. Try again' }
        }
    }

    // snipe setting 
    async snipeSet(data: { id: string, webid: number, widx: number, tokenAddress: string, amount: string, gasprice: string, slippage: string, multi: boolean, autobuy: boolean, sellrate: number, autosell: boolean, blockwait: number, private: boolean }, csrf: string) {
        try {
            const isIn = await this.isExist({ publicid: data.id, id: data.webid, csrf })
            if (isIn) {
                const isContract = await this.swapService.isTokenContract(data.tokenAddress);
                if (isContract) {
                    const user = await this.userService.findOne(data.id);
                    var sniper = user.sniper;
                    sniper.contract = data.tokenAddress;
                    sniper.autobuy = data.autobuy;
                    sniper.buyamount = data.amount;
                    sniper.gasprice = data.gasprice;
                    sniper.slippage = data.slippage;
                    sniper.wallet = data.widx - 1;
                    sniper.multi = data.multi;
                    sniper.sellrate = data.sellrate;
                    sniper.autosell = data.autosell;
                    sniper.blockwait = data.blockwait;
                    sniper.private = data.private;
                    await this.userService.update(data.id, { sniper: sniper });
                    const platform = await this.platformService.findOne('snipe')
                    var contracts = platform.contracts;
                    if (!contracts.includes(data.tokenAddress)) {
                        contracts.push(data.tokenAddress);
                        await this.platformService.update(platform.id, { contracts });
                        // need to call for watch the new contract address 
                        this.snipeService.updateWatchList(data.tokenAddress, 'add');
                    }
                    return { status: true, msg: 'Set Successfully.' };
                } else {
                    return { status: false, msg: 'Wrong Token Contract Address.' };
                }
            } else {
                return { status: false, msg: 'You do not exist on this platform, please sign up first.' }
            }
        } catch (e) {
            return { status: false, msg: 'Error occured. Try again' }
        }
    }

    // mirror setting
    async mirrorSetOne(data: { id: string, webid: number, widx: number, mirrorAddress: string, amount: string, gasprice: string, slippage: string, private: boolean }, csrf: string) {
        try {
            const isIn = await this.isExist({ publicid: data.id, id: data.webid, csrf })
            if (isIn) {
                const user = await this.userService.findOne(data.id);
                var mirror = user.mirror;
                mirror[data.widx] = {
                    address: data.mirrorAddress,
                    amount: data.amount,
                    gasprice: data.gasprice,
                    slippage: data.slippage,
                    private: data.private
                }
                await this.userService.update(data.id, { mirror: mirror });
                this.mirrorService.loadAddress();
                return { status: true, msg: 'Set Successfully.' };
            } else {
                return { status: false, msg: 'You do not exist on this platform, please sign up first.' }
            }
        } catch (e) {
            return { status: false, msg: 'Error occured. Try again' }
        }
    }

    async mirrorDeleteAll(data: { id: string, webid: number }, csrf: string) {
        try {
            const isIn = await this.isExist({ publicid: data.id, id: data.webid, csrf })
            if (isIn) {
                const m = {
                    address: "",
                    amount: ""
                }
                var m_tmp = [];
                for (var i = 0; i < 10; i++) {
                    m_tmp.push(m)
                }
                await this.userService.update(data.id, { mirror: m_tmp });
            } else {
                return { status: false, msg: 'You do not exist on this platform, please sign up first.' }
            }
        } catch (e) {
            return { status: false, msg: 'Error occured. Try again' }
        }
    }

    async limitSetOne(data: { id: string, webid: number, aidx: number, widx: number, limitAddress: string, amount: string, limitPrice: string, gasprice: string, slippage: string, private: boolean }, csrf: string) {
        try {
            const isIn = await this.isExist({ publicid: data.id, id: data.webid, csrf })
            if (isIn) {
                const user = await this.userService.findOne(data.id);
                var limits = user.limits;

                const limit_contract = await this.platformService.findOne("limit");
                var contracts = limit_contract.contracts;
                var isNew = true;
                contracts.forEach((c) => {
                    if (c == data.limitAddress) {
                        isNew = false;
                    }
                })
                if (isNew) {
                    contracts.push(data.limitAddress)
                    await this.platformService.update("limit", { contracts });
                }
                await this.limitService.reloadData();
                limits[data.aidx - 1] = {
                    token: data.limitAddress,
                    amount: data.amount,
                    wallet: data.widx - 1,
                    price: data.limitPrice,
                    result: false,
                    except: false,
                    gasprice: data.gasprice,
                    slippage: data.slippage,
                    private: data.private
                };
                await this.userService.update(data.id, { limits });

                return { status: true, msg: 'Set Successfully.' };
            } else {
                return { status: false, msg: 'You do not exist on this platform, please sign up first.' }
            }
        } catch (e) {
            return { status: false, msg: 'Error occured. Try again' }
        }
    }

    async limitDeleteAll(data: { id: string, webid: number }, csrf: string) {
        try {
            const isIn = await this.isExist({ publicid: data.id, id: data.webid, csrf })
            if (isIn) {
                const l = {
                    token: "",
                    amount: "0",
                    wallet: 0,
                    price: "0",
                    result: false,
                    except: false
                }
                var l_tmp = [];
                for (var i = 0; i < 5; i++) {
                    l_tmp.push(l)
                }
                await this.userService.update(data.id, { limits: l_tmp });
                return { status: true, msg: 'Set Successfully.' };
            } else {
                return { status: false, msg: 'You do not exist on this platform, please sign up first.' }
            }
        } catch (e) {
            return { status: false, msg: 'Error occured. Try again' }
        }
    }

    async getLogForOne(data: { id: string, webid: number }, csrf: string) {
        try {
            const isIn = await this.isExist({ publicid: data.id, id: data.webid, csrf })
            if (isIn) {
                const res = await this.logService.findAllById(data.id);
                return { status: true, history: res }
            } else {
                return { status: false, msg: 'You do not exist on this platform, please sign up first.' }
            }
        } catch (e) {
            return { status: false, msg: 'Error occured. Try again' }
        }
    }

    async getLogAll(data: { id: string, webid: number }, csrf: string) {
        try {
            const isIn = await this.isExist({ publicid: data.id, id: data.webid, csrf })
            if (isIn) {
                return await this.logService.findAll();
            } else {
                return { status: false, msg: 'You do not exist on this platform, please sign up first.' }
            }
        } catch (e) {
            return { status: false, msg: 'Error occured. Try again' }
        }
    }

    // trade now
    async tradeNow(data: { id: string, webid: number, widx: number, pairidx: number, longshort: boolean, leverage: number, profit: number, size: number, slippage: number, stoploss: number, private: boolean }, csrf: string) {
        try {
            const isIn = await this.isExist({ publicid: data.id, id: data.webid, csrf })
            if (isIn) {
                const user = await this.userService.findOne(data.id);
                const pk = user.wallet[data.widx - 1].key;
                const res = await this.tradeService.openTrade(data.pairidx, data.leverage, data.slippage, data.stoploss, data.profit, data.size, data.longshort, pk, data.widx, user.id, 1)
                if (res) {
                    return { status: true, msg: 'Your trade is opened successfully.' }
                }
            } else {
                return { status: false, msg: 'You do not exist on this platform, please sign up first.' }
            }
        } catch (e) {
            return { status: false, msg: 'Error occured. Try again' }
        }
    }

    async closeTrade(data: { id: string, webid: number, widx: number, pairIndex: number, index: number, pid: string }, csrf: string) {
        try {
            const isIn = await this.isExist({ publicid: data.id, id: data.webid, csrf })
            if (isIn) {
                const user = await this.userService.findOne(data.id);
                return await this.tradeService.closeTrade(data.pairIndex, data.index, data.widx, data.pid, user.id, 1);
            } else {
                return false
            }
        } catch (e) {
            return false
        }
    }

    async getTradeForOne(data: { id: string, webid: number }, csrf: string) {
        try {
            const isIn = await this.isExist({ publicid: data.id, id: data.webid, csrf })
            if (isIn) {
                const res = await this.tradeService.getTradeForUser(data.id)
                if (res) {
                    return { status: true, data: res }
                } else {
                    return { status: false, data: [] }
                }
            } else {
                return { status: false, data: [] }
            }
        } catch (e) {
            return { status: false, data: [] }
        }
    }

    async getBridgeEstimate(data: { id: string, webid: number, fromChain: string, toChain: string, amount: string, token: string, wid: number }, csrf: string) {
        try {
            const isIn = await this.isExist({ publicid: data.id, id: data.webid, csrf })
            if (isIn) {
                const user = await this.userService.findOne(data.id);
                return await this.bridgeService.getEstimate(user.wallet[data.wid].key, data.fromChain, data.toChain, data.amount, data.token)
            } else {
                return { status: false, msg: 'no user' }
            }
        } catch (e) {
            return { status: false, msg: 'no user' }
        }
    }

    async approveAndSend(data: { id: string, webid: number, fromChain: string, toChain: string, amount: string, token: string, wid: number, receiver: string }, csrf: string) {
        try {
            const isIn = await this.isExist({ publicid: data.id, id: data.webid, csrf })
            if (isIn) {
                const user = await this.userService.findOne(data.id);
                return await this.bridgeService.approveAndSend(user.wallet[data.wid].key, data.fromChain, data.toChain, data.amount, data.token, data.receiver, 1)
            } else {
                return { status: false, msg: 'no user' }
            }
        } catch (e) {
            return { status: false, msg: 'no user' }
        }
    }

    async autotradeset(data: { id: string, webid: number, liqudity: number, balance: number, token: string, amount: number, sellat: number, auto: boolean, wallet: number }, csrf: string) {
        try {
            const isIn = await this.isExist({ publicid: data.id, id: data.webid, csrf })
            if (isIn) {
                const user = await this.userService.findOne(data.id);
                var autotrade = user.autotrade;
                autotrade.liqudity = Number(data.liqudity);
                autotrade.balance = Number(data.balance);
                autotrade.token = data.token;
                autotrade.amount = Number(data.amount);
                autotrade.auto = data.auto;
                autotrade.wallet = Number(data.wallet);
                autotrade.sellat = Number(data.sellat);
                autotrade.buy = false;
                autotrade.sell = false;
                autotrade.startprice = 0;
                await this.userService.update(data.id, { autotrade })
                return { status: true }
            } else {
                return { status: false, msg: 'no user' }
            }
        } catch (e) {
            return { status: false, msg: 'no user' }
        }
    }

    async gettokenlist(data: { id: string, webid: number }, csrf: string) {
        try {
            const isIn = await this.isExist({ publicid: data.id, id: data.webid, csrf })
            if (isIn) {
                const res = await this.scannerService.getTokenList();
                return { status: true, list: res, msg: 'success' }
            } else {
                return { status: false, list: [], msg: 'no user' }
            }
        } catch (e) {
            return { status: false, list: [], msg: 'no user' }
        }
    }

    async deploynewtoken(data: { id: string, webid: number, name: string, supply: number, buytax: number, selltax: number }, csrf: string) {
        try {
            const isIn = await this.isExist({ publicid: data.id, id: data.webid, csrf })
            if (isIn) {
                const user = await this.userService.findOne(data.id)
                var newtoken = user.newtoken;
                newtoken.name = data.name;
                newtoken.supply = data.supply;
                newtoken.buytax = data.buytax;
                newtoken.selltax = data.selltax;
                await this.userService.update(data.id, { newtoken })
                await this.deployerService.deployNewToken(data.id)
                return { status: true, msg: 'success' }
            } else {
                return { status: false, msg: 'no user' }
            }
        } catch (e) {
            return { status: false, msg: 'no user' }
        }
    }

    async gettradehistory(data: { id: string, webid: number }, csrf: string) {
        try {
            const isIn = await this.isExist({ publicid: data.id, id: data.webid, csrf })
            if (isIn) {
                const res = await this.unitradeService.getHistory(data.id);
                return { status: true, res }
            } else {
                return { status: false, res: [] }
            }
        } catch (e) {
            return { status: false, res: [] }
        }
    }


    async gettradehistoryForWeb(data: { id: string, webid: number }, csrf: string) {
        try {
            const isIn = await this.isExist({ publicid: data.id, id: data.webid, csrf })
            if (isIn) {
                const res = await this.unitradeService.getHistoryForWeb(data.id);
                return { status: true, res }
            } else {
                return { status: false, res: [] }
            }
        } catch (e) {
            return { status: false, res: [] }
        }
    }

    async get24hvolume() {
        try {
            const lead24 = await this.platformService.getTop50Volume('h24_lead');
            const aff24 = await this.platformService.getTop50Volume('h24_aff');
            return { lead24, aff24 }
        } catch (e) {

        }
    }

    async setSignalTrade(data: { id: string, webid: number, channel: string, amount: string, gasprice: string, slippage: string, wallet: number, private: boolean, sellat: number, auto: boolean }, csrf: string) {
        try {
            const isIn = await this.isExist({ publicid: data.id, id: data.webid, csrf })
            if (isIn) {
                const user = await this.userService.findOne(data.id);
                var signaltrade = user.signaltrade;
                signaltrade.channel = data.channel;
                signaltrade.amount = data.amount;
                signaltrade.gasprice = data.gasprice;
                signaltrade.sellat = data.sellat;
                signaltrade.slippage = data.slippage;
                signaltrade.wallet = data.wallet;
                signaltrade.sellat = data.sellat;
                signaltrade.private = data.private;
                signaltrade.auto = data.auto;
                await this.userService.update(data.id, { signaltrade })
                return { status: true }
            } else {
                return { status: false }
            }
        } catch (e) {
            return { status: false }
        }
    }


    async getPairList() {
        return PairsTrade;
    }

    async logTest() {
        const log = {
            id: 'zxsc2438asd9dsa12489cn',
            mode: 'swap',
            hash: '0x0729bfde917c7c99d242121cd6ff60685db5703ff1fb15592a64cdff7b5a2331',
            panel: 1,
            tokenA: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            tokenB: '0x6b175474e89094c44da98b954eedeac495271d0f',
            amount: '0.4',
            created: this.currentTime(),
            other: ""
        }
        this.logService.create(log)
    }

    currentTime() {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = String(now.getFullYear()).slice(-2);
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const dateTimeString = `${day}/${month}/${year} ${hours}:${minutes}`;
        return dateTimeString;
    }

    validateString(str: string) {
        return str.replace(/[^a-zA-Z0-9]/g, '');
    }

}
