import { Inject, OnModuleInit, forwardRef } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { ChainId, Token, Fetcher, WETH, Percent, } from '@uniswap/sdk'
import { ethers, Contract, Wallet, Signer, FixedNumber, } from 'ethers';
import { routerABI } from 'src/abi/router';
import { factoryABI } from 'src/abi/factory';
import { standardABI } from 'src/abi/standard';
import { factoryAddress, routerAddress, wethAddress } from 'src/abi/constants';
import { SwapService } from 'src/swap/swap.service';
import { PlatformService } from 'src/platform/platform.service';


@Injectable()
export class SnipeService implements OnModuleInit {

    private provider: any;
    private watchList: string[];

    constructor(
        @Inject(forwardRef(() => UserService)) private userService: UserService,
        @Inject(forwardRef(() => SwapService)) private swapService: SwapService,
        @Inject(forwardRef(() => PlatformService)) private platformService: PlatformService
    ) {
        this.watchList = [];
    }

    async onModuleInit() {
        try {
            console.log(">>>snipe module init")
            this.provider = this.swapService.provider;
            const platform = await this.platformService.findOne('snipe');
            const contracts = platform.contracts;
            for (var i = 0; i < contracts.length; i++) {
                // await this.watchContract(contracts[i]);
                this.updateWatchList(contracts[i])
            }
            this.watchContract();
        } catch (e) {
            console.log("Err", e)
        }

    }

    async watchContract() {
        console.log("watch....")
        try {
            const factoryContract = new ethers.Contract(factoryAddress, factoryABI, this.provider);
            factoryContract.on("PairCreated", async (tokenA, tokenB, pair, pairLength) => {
                const wl = this.watchList;
                for (var i = 0; i < wl.length; i++) {
                    const address = wl[i].toLowerCase();
                    if (tokenA.toLowerCase() == address || tokenB.toLowerCase() == address) {
                        // new watching token launched
                        const users = await this.userService.findUserBySniper(address);
                        setTimeout(() => {
                            users.forEach((user) => {
                                if (user.autobuy) {
                                    user.wallet.forEach((user_wallet: string) => {
                                        this.swapService.swapToken(wethAddress, address, user.buyamount, Number(user.gasprice) * 1, Number(user.slippage) * 1, user_wallet, "snipe", user.id)
                                    })
                                }
                            })
                        }, 5000)
                    }
                }
            })
        } catch (e) {
            console.log("err", e)
        }
    }

    async updateWatchList(address: string) {
        var wl = this.watchList;
        wl.push(address);
        this.watchList = wl;
    }

}


