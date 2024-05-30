import { Inject, OnModuleInit, forwardRef } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { ChainId, Token, Fetcher, WETH, Percent, Route } from '@uniswap/sdk'
import { ethers, Contract, Wallet, Signer, FixedNumber } from 'ethers';
import { routerABI } from 'src/abi/router';
import { factoryABI } from 'src/abi/factory';
import { standardABI } from 'src/abi/standard';
import { chartPrice, daiAddress, factoryAddress, routerAddress, tokenListForSwap, tradeAddress, tradeApprove, wethAddress } from 'src/abi/constants';
import { TelegramService } from 'src/telegram/telegram.service';
import { LogService } from 'src/log/log.service';
import axios from 'axios';
import { gns_tradeABI } from 'src/abi/gns_trade';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TradeDocument } from './trade.schema';
import { NotifyService } from 'src/webnotify/notify.service';


@Injectable()
export class TradeService implements OnModuleInit {

    public provider: any;
    public traders: [string];

    constructor(
        @InjectModel('trade') private readonly model: Model<TradeDocument>,
        @Inject(forwardRef(() => TelegramService)) private telegramService: TelegramService,
        @Inject(forwardRef(() => UserService)) private userService: UserService,
        @Inject(forwardRef(() => LogService)) private logService: LogService,
        @Inject(forwardRef(() => NotifyService)) private notifyService: NotifyService,
    ) { }

    async onModuleInit() {
        console.log(">>>trade module init")
        this.provider = new ethers.providers.EtherscanProvider("arbitrum", 'D2WD46KVN4SWHY7U4HGSBF5GYMI46P4RKN')

        // this.test(); 
        // this.testListen1()
        // this.testListen2()
        // this.testListen3()
    }


    // async testListen1() {
    //     console.log(">>>listen event...")

    //     try {
    //         const t_address = '0x298a695906e16aeA0a184A2815A76eAd1a0b7522';   
    //         const provider = new ethers.providers.EtherscanProvider("arbitrum", 'D2WD46KVN4SWHY7U4HGSBF5GYMI46P4RKN')
    //         const tContract = new ethers.Contract(t_address, testABI, provider); 
    //         tContract.on("BorrowingFeeCharged", async (trader) => {
    //             console.log(">>>>TRD2", trader);
    //             // console.log(">>>>value2", value.toString())
    //         })     
    //     } catch (e) {
    //         console.log(">>>>HIHI eer")
    //     }  
    // }

    // async testListen2() {  
    //     try {
    //         const t_address = '0x298a695906e16aeA0a184A2815A76eAd1a0b7522';  
    //         const provider = new ethers.providers.EtherscanProvider("arbitrum", 'K8U2SNES65Y6DJGZCG5RN63C365AKH28JR')
    //         const tContract = new ethers.Contract(t_address, testABI, provider);  
    //         tContract.on("SssFeeCharged", async (trader, value) => {
    //             console.log(">>>>TRD21,,,", trader);

    //         })  
    //     } catch (e) {
    //         console.log(">>>>HIHI eer")
    //     }  
    // }

    // async testListen3() {  
    //     try {
    //         const t_address = '0x298a695906e16aeA0a184A2815A76eAd1a0b7522';   
    //         const provider = new ethers.providers.EtherscanProvider("arbitrum", 'TRCZDT7UX18NZ8CKQNA3FMM1WZJ3MHVWGQ')
    //         const tContract = new ethers.Contract(t_address, testABI, provider);   
    //         tContract.on("MarketExecuted", async (trader) => {
    //             console.log(">>>>TRD333", trader);
    //         })   

    //     } catch (e) {
    //         console.log(">>>>HIHI eer")
    //     }  
    // }


    async listenTrade() {
        try {
            const tradeContract = new ethers.Contract(tradeAddress, gns_tradeABI, this.provider);
            tradeContract.on("OpenLimitCanceled", async (trader, pairIndex, index) => {
                const ts = this.traders;
                if (ts.includes(trader)) {
                    this.updateTrader(trader, false);
                    this.tradeCloseWork(trader, pairIndex, index);
                }
            })
        } catch (e) {
            console.log(">>>err")
        }
    }

    // orderType = 0; spreadReductionId = 1
    async openTrade(pairindex: number, leverage: number, slippage: number, loss: number, profit: number, positionSize: number, longOrShort: boolean, privatekey: string, widx: number, userId: string, panel: number) {
        try {
            const openPrice = await this.getPrice(pairindex);
            const tProfit = openPrice + (0.01 * openPrice * (profit / leverage))

            const orderType = 0;
            const spreadReductionId = 0;
            const wallet = new ethers.Wallet(privatekey, this.provider);
            const size = ethers.utils.parseUnits(positionSize.toString(), 18);
            const slippageP = ethers.utils.parseUnits(slippage.toString(), 10);
            const referrer = '0x846acec8f5bca91aEb97548C95dE7fd1db6e3402'
            const t = [wallet.address, pairindex, 0, 0, size.toString(), openPrice * 10 ** 10, longOrShort, leverage, Math.floor(tProfit * 10 ** 10), 0]

            const tokenContract = new ethers.Contract(daiAddress, standardABI, wallet);

            const am = await tokenContract.allowance(wallet.address, tradeApprove);
            const allow_amount = Number(ethers.utils.formatUnits(am, 18))
            if (positionSize > allow_amount) {
                const tx_apr = await tokenContract.approve(tradeApprove, size.toString());
                const res_apr = await tx_apr.wait();
            }

            const custom_gas = 1;
            const gp = await this.provider.getGasPrice();
            const gasPrice = Number(ethers.utils.formatUnits(gp, "gwei")) * 1;

            const tradeContract = new ethers.Contract(tradeAddress, gns_tradeABI, wallet);
            const tx = await tradeContract.openTrade(
                t,
                orderType,
                spreadReductionId,
                slippageP,
                referrer
            );
            const res = await tx.wait();

            if (res.status) {
                if (panel == 0) {
                    this.telegramService.sendNotification(userId, "Position is opened successfully");
                }
                const startprice = await this.getPrice(pairindex);
                await this.model.create({
                    owner: userId,
                    address: widx,
                    pairIndex: pairindex,
                    index: 0,
                    leverage: leverage,
                    slippage: slippage,
                    stoploss: loss,
                    profit: profit,
                    size: positionSize,
                    longshort: longOrShort,
                    startprice,
                    endprice: 0,
                    end: false,
                    trader: wallet.address,
                    created: Date.now()
                })
                return true
            } else {
                if (panel == 0) {
                    this.telegramService.sendNotification(userId, "Failed to open trade.");
                }
                return false
            }
        } catch (e) {
            console.log(">>error", e)
            if (panel == 0) {
                this.telegramService.sendNotification(userId, "Error occured. Insufficient funds for gas.")
            }
            return false
        }
    }

    async closeTrade(pairIndex: number, index: number, widx: number, id: string, userId: string, panel: number) {
        try {
            const user = await this.userService.findOne(userId);
            const privatekey = user.wallet[widx - 1].key;
            const wallet = new ethers.Wallet(privatekey, this.provider);
            const tradeContract = new ethers.Contract(tradeAddress, gns_tradeABI, wallet);
            const tx = await tradeContract.closeTradeMarket(pairIndex, index);
            const res = await tx.wait();
            if (res.status) {
                await this.model.findByIdAndDelete(id);
                if (panel == 0) {
                    this.telegramService.sendNotification(userId, "Position is closed successfully")
                } else {
                    return true
                }
            } else {
                if (panel == 0) {
                    this.telegramService.sendNotification(userId, "Failed to close trade.");
                } else {
                    return false
                }
            }
        } catch (e) {
            if (panel == 0) {
                this.telegramService.sendNotification(userId, "Error occured.")
            } else {
                return false
            }
        }
    }

    async getOpenTrade(address: string, pairIndex: number, index: number) {
        try {
            const tradeContract = new ethers.Contract(tradeAddress, gns_tradeABI, this.provider);
            const t_res = await tradeContract.openTrades(address, pairIndex, index);
            return { status: true, res: t_res }
        } catch (e) {
            return { status: false, res: {} }
        }
    }

    async getSupply(tokenAddress: string) {
        try {
            const tokenContract = new ethers.Contract(tokenAddress, standardABI, this.provider);
            const supply = await tokenContract.totalSupply();
            return supply;
        } catch (e) {

        }
    }

    async getBalanceOfWallet(wallet: string) {
        const b = await this.provider.getBalance(wallet);
        const balance = ethers.utils.formatEther(b)
        return (+balance).toFixed(4);
    }

    async getTradeForUser(userId: string) {
        return await this.model.find({ owner: userId }).exec();
    }

    async getTraderOne(id: string) {
        return await this.model.findById(id).exec();
    }

    async getPrice(idx: number) {
        const p = await axios.get(chartPrice);
        const pairs = p.data.opens;
        return pairs[idx];
    }

    async updateTrader(trader: string, mode: boolean) {
        if (mode) {
            var ts = this.traders;
            ts.push(trader);
            this.traders = ts;
        } else {
            var ts = this.traders;
            const idx = ts.indexOf(trader);
            ts.splice(idx);
            this.traders = ts;
        }
    }

    async tradeCloseWork(trader: string, pairIdx: number, index: number) {
        try {
            const trd = await this.model.findOne({ trader, pairIndex: pairIdx, index }).exec();
            const userid = trd.owner;
            const user = await this.userService.findOne(userid);
            const endprice = await this.getPrice(pairIdx)
            const tr = await this.model.findOneAndUpdate({ owner: user.id, pairIndex: pairIdx, index: index, trader, end: false }, { end: true, endprice }).exec()

            // const tr = await this.model.findOneAndUpdate({ owner: user.id, pairIndex: pairIdx, index: index, trader }, {  endprice }).exec()
           
            if (user.panel == 0) {
                // telegram user
                this.telegramService.sendPnLMessage(userid, tr)
            } else { 
                await this.notifyService.create({
                    id: user.id,
                    type: 'gTrade',
                    data: JSON.stringify(tr),
                    created: Date.now(),
                    other: "",
                    read: false
                })
            }
        } catch (e) {

        }
    }

    test() {
        this.tradeCloseWork('0x68B56BE6B52E85EA426e418524D64055C2e37516', 2, 0)
    }

}


// https://medium.com/clearmatics/how-i-made-a-uniswap-interface-from-scratch-b51e1027ca87