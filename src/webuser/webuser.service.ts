import { Injectable, OnModuleInit, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebUserEntity } from './webuser.entity';
import { UserService } from 'src/user/user.service';
import { ethers } from 'ethers';
import { SwapService } from 'src/swap/swap.service';
import { tokenListForSwap, wethAddress } from 'src/abi/constants';
import { PlatformService } from 'src/platform/platform.service';
import { SnipeService } from 'src/snipe/snipe.service';
import { MirrorService } from 'src/mirror/mirror.service';
import { LimitService } from 'src/limit/limit.service';
import { LogService } from 'src/log/log.service';

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
                return { status: false, user: undefined }
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
                    startprice: 10000,
                    sellrate: 100,
                    autosell: false,
                    sold: false
                }
                const swap = {
                    token: "",
                    amount: "",
                    gasprice: "1",
                    slippage: "0.1",
                    with: true,
                    wallet: 0,
                }
                const transfer = {
                    token: "",
                    amount: "0",
                    to: "",
                    wallet: 0,
                }
                const m = {
                    address: "",
                    amount: "0",
                    gasprice: "1",
                    slippage: "0.1"
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
                    slippage: "0.1"
                }
                var l_tmp = [];
                for (var i = 0; i < 5; i++) {
                    l_tmp.push(l)
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
                    wmode: true,
                    detail: "",
                    other: {
                        mirror: 0,
                        limit: 0
                    },
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
                return { status: true, wallet: { address, key, balance }, msg: "Got Successfully." }
            } else {
                return { status: false, wallet: { address: "", key: "", balance: 0 }, msg: 'You do not exist on this platform, please sign up first.' }
            }
        } catch (e) {
            return { status: false, wallet: { address: "", key: "", balance: 0 }, msg: 'Error occured. Try again' }
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


    // swap now
    async swapNow(data: { id: string, webid: number, widx: number, token: number, direction: boolean, contract: string, amount: number, gasprice: number, slippage: number }, csrf: string) {
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
                return await this.swapService.swapToken(tokenA, tokenB, data.amount, data.gasprice, data.slippage, pk, "swap", data.id, 1);
            } else {
                return { status: false, msg: 'You do not exist on this platform, please sign up first.' }
            }
        } catch (e) {
            return { status: false, msg: 'Error occured. Try again' }
        }
    }

    // snipe setting 
    async snipeSet(data: { id: string, webid: number, widx: number, tokenAddress: string, amount: string, gasprice: string, slippage: string, multi: boolean, autobuy: boolean }, csrf: string) {
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
    async mirrorSetOne(data: { id: string, webid: number, widx: number, mirrorAddress: string, amount: string }, csrf: string) {
        try {
            const isIn = await this.isExist({ publicid: data.id, id: data.webid, csrf })
            if (isIn) {
                const user = await this.userService.findOne(data.id);
                var mirror = user.mirror;
                mirror[data.widx] = {
                    address: data.mirrorAddress,
                    amount: data.amount,
                    gasprice: "3",
                    slippage: "0.1"
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

    async limitSetOne(data: { id: string, webid: number, aidx: number, widx: number, limitAddress: string, amount: string, limitPrice: string }, csrf: string) {
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
                    gasprice: "3",
                    slippage: "0.1"
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
