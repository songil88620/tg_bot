import { Inject, OnModuleInit, forwardRef } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { ChainId, Token, Fetcher, WETH, Percent, Route } from '@uniswap/sdk'
import { ethers, Contract, Wallet, Signer, FixedNumber } from 'ethers';
import { routerABI } from 'src/abi/router';
import { factoryABI } from 'src/abi/factory';
import { standardABI } from 'src/abi/standard';
import { factoryAddress, routerAddress, tokenListForSwap, tradeAddress, tradeApprove, wethAddress } from 'src/abi/constants';
import { TelegramService } from 'src/telegram/telegram.service';
import { LogService } from 'src/log/log.service';
import axios from 'axios';
import { gns_tradeABI } from 'src/abi/gns_trade';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TradeDocument } from './trade.schema';

@Injectable()
export class TradeService implements OnModuleInit {

    public provider: any;

    constructor(
        @InjectModel('trade') private readonly model: Model<TradeDocument>,
        @Inject(forwardRef(() => TelegramService)) private telegramService: TelegramService,
        @Inject(forwardRef(() => UserService)) private userService: UserService,
        @Inject(forwardRef(() => LogService)) private logService: LogService,
    ) { }

    async onModuleInit() {
        console.log(">>>trade module init")
        this.provider = new ethers.providers.EtherscanProvider("arbitrum", 'YR4KM7P6WDY42XMY66GD17DZ4Z2AG4ZFQF')
    }

    async getPiarPrice(pairIdx: number) {
        const res = await axios.get('https://backend-pricing.eu.gains.trade/charts')
        const gainPrices = res.data.opens;

        return gainPrices[pairIdx]
    }

    // orderType = 0; spreadReductionId = 1
    async openTrade(pairindex: number, leverage: number, slippage: number, loss: number, profit: number, positionSize: number, longOrShort: boolean, privatekey: string, widx: number, userId: string, panel: number) {
        try {
            const openPrice = await this.getPiarPrice(pairindex);
            console.log(">>>>OPEN PRICE", openPrice)
            const tProfit = openPrice + (0.01 * openPrice * (profit / leverage))

            const orderType = 0;
            const spreadReductionId = 0;
            const wallet = new ethers.Wallet(privatekey, this.provider);
            const size = ethers.utils.parseUnits(positionSize.toString(), 18);
            const slippageP = ethers.utils.parseUnits(slippage.toString(), 10);
            const referrer = '0x846acec8f5bca91aEb97548C95dE7fd1db6e3402'
            const t = [wallet.address, pairindex, 0, 0, size.toString(), openPrice * 10 ** 10, longOrShort, leverage, Math.floor(tProfit * 10 ** 10), 0]

            //console.log(">>>T", t)
            //console.log(">>>", orderType, spreadReductionId, slippageP, referrer)

            const DAI_Address = '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1';
            const tokenContract = new ethers.Contract(DAI_Address, standardABI, wallet);
            const tx_apr = await tokenContract.approve(tradeApprove, size.toString());
            const res_apr = await tx_apr.wait();           

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
             console.log(">>Trade", res)

            if (res.status) {
                if (panel == 0) {
                    this.telegramService.sendNotification(userId, "Position is opened successfully");
                }
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
                    longshort: longOrShort
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
                this.telegramService.sendNotification(userId, "Error occured.")
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
            console.log(">>>>>TTT", t_res)
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



}


// https://medium.com/clearmatics/how-i-made-a-uniswap-interface-from-scratch-b51e1027ca87