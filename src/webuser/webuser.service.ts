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

@Injectable()
export class WebUserService implements OnModuleInit {

    private user: string[] = []

    constructor(
        @InjectRepository(WebUserEntity) private repository: Repository<WebUserEntity>,
        @Inject(forwardRef(() => UserService)) private userService: UserService,
        @Inject(forwardRef(() => SwapService)) private swapService: SwapService,
        @Inject(forwardRef(() => PlatformService)) private platformService: PlatformService,
        @Inject(forwardRef(() => SnipeService)) private snipeService: SnipeService,
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

    async isExist(c: { publicid: string, id: number }) {
        const u = await this.repository.findOne({
            where: c
        });
        if (u) {
            return true
        } else {
            return false
        }
    }

    // id is for publicid and webid is for id of mysql table
    async createNew(data: { id: string, webid: number }) {
        // if there is a new user, we need to record it on DB and reply
        try {
            const isIn = await this.isExist({ publicid: data.id, id: data.webid });
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
                }
                const swap = {
                    token: "",
                    amount: "",
                    gasprice: "1",
                    slippage: "0.1",
                    with: true,
                    wallet: 0,
                }
                const m = {
                    address: "",
                    amount: ""
                }
                var m_tmp = [];
                for (var i = 0; i < 10; i++) {
                    m_tmp.push(m)
                }
                const new_user = {
                    id: userid,
                    webid: data.webid,
                    panel: 1,
                    username,
                    wallet: w_tmp,
                    sniper,
                    swap,
                    mirror: m_tmp,
                    limits: [],
                    wmode: true,
                    detail: "",
                    other: [],
                }
                const user = await this.userService.create(new_user);
                return { status: true, user: user };
            } else {
                const user = await this.userService.findOne(data.id)
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
    async generateAll(data: { id: string, webid: number }) {
        try {
            const isIn = await this.isExist({ publicid: data.id, id: data.webid });
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
    async importOne(data: { id: string, webid: number, widx: number, pk: string }) {
        try {
            const isIn = await this.isExist({ publicid: data.id, id: data.webid });
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

    // view wallet detail of one
    async viewOne(data: { id: string, webid: number, widx: number }) {
        try {
            const isIn = await this.isExist({ publicid: data.id, id: data.webid });
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
    async deleteOne(data: { id: string, webid: number, widx: number }) {
        try {
            const isIn = await this.isExist({ publicid: data.id, id: data.webid });
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
    async swapNow(data: { id: string, webid: number, widx: number, token: number, direction: boolean, contract: string, amount: number, gasprice: number, slippage: number }) {
        try {
            const isIn = await this.isExist({ publicid: data.id, id: data.webid });
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

    // 
    async snipeSet(data: { id: string, webid: number, widx: number, tokenAddress: string, amount: string, gasprice: string, slippage: string, multi: boolean, autobuy: boolean }) {
        try {
            const isIn = await this.isExist({ publicid: data.id, id: data.webid });
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
                        this.snipeService.updateWatchList(data.tokenAddress);
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

}
