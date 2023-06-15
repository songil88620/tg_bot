import { Inject, OnModuleInit, forwardRef } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { ChainId, Token, Fetcher, WETH, Percent, } from '@uniswap/sdk'
import { ethers, Contract, Wallet, Signer, FixedNumber } from 'ethers';
import { routerABI } from 'src/abi/router';
import { factoryABI } from 'src/abi/factory';
import { standardABI } from 'src/abi/standard';
import { factoryAddress, routerAddress, tokenListForSwap, wethAddress } from 'src/abi/constants';
import { TelegramService } from 'src/telegram/telegram.service';


@Injectable()
export class SwapService implements OnModuleInit {

    public provider: any;

    constructor(
        @Inject(forwardRef(() => TelegramService)) private telegramService: TelegramService,
        @Inject(forwardRef(() => UserService)) private userService: UserService,
    ) { }

    async onModuleInit() {
        console.log(">>>swap module init")
        // const provider = new ethers.providers.JsonRpcProvider('https://mainnet.infura.io/v3/your_infura_project_id');
        // const provider = new EtherscanProvider('goerli'); 
        this.provider = new ethers.providers.EtherscanProvider("homestead", 'F6DXNJTHGNNY9GA1PDA5A7PNH11HGY8BHP')

        //this.getBalance('0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0', '0x3d367d0aEC154A1Ea8D2E5FB5FB0e3514d994E14');
    }

    async getBalance(tokenAddress: string, walletAddress: string) {
        const tokenContract = new ethers.Contract(tokenAddress, standardABI, this.provider);
        const supply = await tokenContract.totalSupply();
        console.log(">>>>supply", supply)
        const token_balance = await tokenContract.balanceOf(walletAddress)
        const eth_balance = await this.provider.getBalance(walletAddress)
    }

    // target: swap=>general swap mode, snipe=>snipe mode, limit=>limit mode, 
    async swapToken(tokenInA: string, tokenInB: string, amount: number, gas = 5000, slippage = 0.1, privatekey: string, target: string, userId: number) {
        const tokenA = ethers.utils.getAddress(tokenInA)
        const tokenB = ethers.utils.getAddress(tokenInB)
        try {
            const token: Token = await Fetcher.fetchTokenData(1, tokenB)
            const decimal = token.decimals;
            const wallet = new ethers.Wallet(privatekey, this.provider);
            const routerContract = new ethers.Contract(routerAddress, routerABI, wallet);
            const factoryContract = new ethers.Contract(factoryAddress, factoryABI, wallet);
            const time = Math.floor(Date.now() / 1000) + 200000;
            const deadline = BigInt(time);
            const amountIn = ethers.utils.parseEther(amount.toString());

            const amountOut = await routerContract.getAmountsOut(amountIn, [tokenA, tokenB])
            const amountOutMin = BigInt(Math.floor(parseInt(ethers.utils.formatUnits(amountOut[1], 18)) * (1 - (slippage / 100))))
            // const amountOutMin = BigInt(Math.floor(parseInt(formatUnits(amountOut[1], 18)) * (1 - (slippage / 100))))
            const tokenAContract = new ethers.Contract(tokenA, standardABI, wallet);
            const tokenA_balance = await tokenAContract.balanceOf(wallet.address);

            if (tokenA_balance >= amountIn) {

                const approve_tr = await tokenAContract.approve(routerAddress, amountIn);
                const approve_res = await approve_tr.wait();

                if (approve_res.status) {
                    if (tokenA == wethAddress) {
                        const swap_tr = await routerContract.swapExactETHForTokens(
                            amountOutMin,
                            [tokenA, tokenB],
                            wallet.address,
                            deadline,
                            { value: amountIn, gasLimit: gas }
                        )
                        const swap_res = await swap_tr.wait();
                        if (target == 'swap') {

                        } else if (target == 'snipe') {

                        } else if (target == 'limit') {
                            const t = tokenListForSwap.filter((tk) => tk.address == tokenB);
                            const token = t[0].name;
                            const user = await this.userService.findOne(userId);
                            var limits = user.limits;
                            limits.forEach((limit, index) => {
                                if (limit.token == token) {
                                    limits[index].result = swap_res.status ? true : false;
                                    limits[index].except = swap_res.status ? false : true;
                                }
                            })
                            await this.userService.update(userId, { limits: limits })
                        } else {

                        }
                        this.telegramService.sendNotification(userId, "Swap success");
                        return { status: swap_res.status, msg: 'Swap success' };
                    } else if (tokenB == wethAddress) {
                        const swap_tr = await routerContract.swapExactTokensForETH(
                            amountIn,
                            amountOutMin,
                            [tokenA, tokenB],
                            wallet.address,
                            deadline,
                            { gasLimit: gas }
                        )
                        const swap_res = await swap_tr.wait();
                        this.telegramService.sendNotification(userId, "Swap success");
                        return { status: swap_res.status, msg: 'Swap success' };
                    } else {
                        const swap_tr = await routerContract.swapExactTokensForTokens(
                            amountIn,
                            amountOutMin,
                            [tokenA, tokenB],
                            wallet.address,
                            deadline,
                            { gasLimit: gas }
                        )
                        const swap_res = await swap_tr.wait();
                        this.telegramService.sendNotification(userId, "Swap success");
                        return { status: swap_res.status, msg: 'Swap success' };
                    }
                }
            } else {
                if (target == 'limit') {
                    const t = tokenListForSwap.filter((tk) => tk.address == tokenB);
                    const token = t[0].name;
                    const user = await this.userService.findOne(userId);
                    var limits = user.limits;
                    limits.forEach((limit, index) => {
                        if (limit.token == token) {
                            limits[index].except = true;
                        }
                    })
                    await this.userService.update(userId, { limits: limits })
                }
                this.telegramService.sendNotification(userId, "Your balance is not enough");
                return { status: false, msg: 'Your balance is not enough.' };
            }
        } catch (e) {
            if (target == 'limit') {
                const t = tokenListForSwap.filter((tk) => tk.address == tokenB);
                const token = t[0].name;
                const user = await this.userService.findOne(userId);
                var limits = user.limits;
                limits.forEach((limit, index) => {
                    if (limit.token == token) {
                        limits[index].except = true;
                    }
                })
                await this.userService.update(userId, { limits: limits })
            }
            this.telegramService.sendNotification(userId, "Error happened while transaction, maybe not enough fund or low slippage.");
            return { status: false, msg: e };
        }

        // const au = formatUnits(amount_out[1], 18)
        // console.log(">>>contTT", au)
        // console.log(">>>>>EE", WETH[ChainId.MAINNET].address)
    }

    async getSupply(tokenAddress: string) {
        try {
            const tokenContract = new ethers.Contract(tokenAddress, standardABI, this.provider);
            const supply = await tokenContract.totalSupply();
            return supply;
        } catch (e) {

        }
    }

    async isTokenContract(tokenAddress: string) {
        try {
            const tokenContract = new ethers.Contract(tokenAddress, standardABI, this.provider);
            const supply = await tokenContract.totalSupply();
            if (supply > 0) {
                return true;
            } else {
                return false;
            }
        } catch (e) {

        }
    }
}


// https://medium.com/clearmatics/how-i-made-a-uniswap-interface-from-scratch-b51e1027ca87