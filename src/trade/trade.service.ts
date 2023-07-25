import { Inject, OnModuleInit, forwardRef } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { ChainId, Token, Fetcher, WETH, Percent, Route } from '@uniswap/sdk'
import { ethers, Contract, Wallet, Signer, FixedNumber } from 'ethers';
import { routerABI } from 'src/abi/router';
import { factoryABI } from 'src/abi/factory';
import { standardABI } from 'src/abi/standard';
import { factoryAddress, routerAddress, tokenListForSwap, tradeAddress, wethAddress } from 'src/abi/constants';
import { TelegramService } from 'src/telegram/telegram.service';
import { LogService } from 'src/log/log.service';
import axios from 'axios';
import { gns_tradeABI } from 'src/abi/gns_trade';


@Injectable()
export class TradeService implements OnModuleInit {

    public provider: any;

    constructor(
        @Inject(forwardRef(() => TelegramService)) private telegramService: TelegramService,
        @Inject(forwardRef(() => UserService)) private userService: UserService,
        @Inject(forwardRef(() => LogService)) private logService: LogService,
    ) { }

    async onModuleInit() {
        console.log(">>>trade module init")
        this.provider = new ethers.providers.EtherscanProvider("arbitrum", 'YR4KM7P6WDY42XMY66GD17DZ4Z2AG4ZFQF')
    }

    async openTrade(pairindex: number, orderType: number, spreadReductionId: number, slippageP: number, referrer: string, privatekey: string) {
        try {
            // const wallet = new ethers.Wallet(privatekey, this.provider);

            // const t = [
            //     wallet.address,
            //     pairindex,
            //     0,
            //     0,

            // ]

            // const tradeContract = new ethers.Contract(tradeAddress, gns_tradeABI, wallet);
            // const tx = await tradeContract.openTrade(t, orderType, spreadReductionId, slippageP, referrer);
            // const res = await tx.wait();
            // if (res.status) {

            // } else {

            // }
        } catch (e) {

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



}


// https://medium.com/clearmatics/how-i-made-a-uniswap-interface-from-scratch-b51e1027ca87