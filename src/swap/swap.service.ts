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
        const token_balance = await tokenContract.balanceOf(walletAddress)
        const eth_balance = await this.provider.getBalance(walletAddress)
    }


    // target: swap=>general swap mode, snipe=>snipe mode, limit=>limit mode, 
    async swapToken(tokenInA: string, tokenInB: string, amount: number, gas = 1, slippage = 0.1, privatekey: string, target: string, userId: string, panel: number) {
        console.log(">>>>AAA swap", tokenInA, tokenInB)
        try {
            const gp = await this.provider.getGasPrice();
            const gasPrice = Number(ethers.utils.formatUnits(gp, "gwei")) * 1 + gas;

            const tokenA = ethers.utils.getAddress(tokenInA)
            const tokenB = ethers.utils.getAddress(tokenInB)
            var decimal = 18;
            if (tokenA != wethAddress) {
                const token: Token = await Fetcher.fetchTokenData(1, tokenA)
                decimal = token.decimals;
            }

            const wallet = new ethers.Wallet(privatekey, this.provider);
            const routerContract = new ethers.Contract(routerAddress, routerABI, wallet);
            const factoryContract = new ethers.Contract(factoryAddress, factoryABI, wallet);
            const time = Math.floor(Date.now() / 1000) + 200000;
            const deadline = BigInt(time);

            const amountIn = ethers.utils.parseUnits(amount.toString(), decimal);
            const amountOut = await routerContract.getAmountsOut(amountIn, [tokenA, tokenB])
            const amountOutMin = BigInt(Math.floor(parseInt(ethers.utils.formatUnits(amountOut[1])) * (1 - (slippage / 100))))
            const tokenAContract = new ethers.Contract(tokenA, standardABI, wallet);

            let tokenA_balance
            if (tokenA == wethAddress) {
                tokenA_balance = await this.provider.getBalance(wallet.address)
            } else {
                tokenA_balance = await tokenAContract.balanceOf(wallet.address);
            }

            if (tokenA_balance.gt(amountIn)) {
                const approve_tr = await tokenAContract.approve(routerAddress, amountIn);
                const approve_res = await approve_tr.wait();

                if (approve_res.status) {
                    if (tokenA == wethAddress) {
                        const swap_tr = await routerContract.swapExactETHForTokens(
                            amountOutMin,
                            [tokenA, tokenB],
                            wallet.address,
                            deadline,
                            {
                                value: amountIn,
                                gasPrice: ethers.utils.parseUnits(gasPrice.toString(), 'gwei')
                            }
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
                        if (panel == 0) {

                        } else {

                        }
                        this.telegramService.sendNotification(userId, "Swap success(" + target + ")");
                        return { status: swap_res.status, msg: 'Swap success' };
                    } else if (tokenB == wethAddress) {
                        const swap_tr = await routerContract.swapExactTokensForETH(
                            amountIn,
                            amountOutMin,
                            [tokenA, tokenB],
                            wallet.address,
                            deadline,
                            { gasPrice: ethers.utils.parseUnits(gasPrice.toString(), 'gwei') }
                        )
                        const swap_res = await swap_tr.wait();
                        this.telegramService.sendNotification(userId, "Swap success(" + target + ")");
                        return { status: swap_res.status, msg: 'Swap success' };
                    } else {
                        const swap_tr = await routerContract.swapExactTokensForTokens(
                            amountIn,
                            amountOutMin,
                            [tokenA, tokenB],
                            wallet.address,
                            deadline,
                            { gasPrice: ethers.utils.parseUnits(gasPrice.toString(), 'gwei') }
                        )
                        const swap_res = await swap_tr.wait();
                        this.telegramService.sendNotification(userId, "Swap success(" + target + ")");
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
                this.telegramService.sendNotification(userId, "Your balance is not enough(" + target + ")");
                return { status: false, msg: 'Your balance is not enough.' };
            }
        } catch (e) {
            if (target == 'limit') {
                const t = tokenListForSwap.filter((tk) => tk.address == tokenInB);
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
            this.telegramService.sendNotification(userId, "Error happened while transaction, maybe not enough fund or low slippage(" + target + ")");
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
            return false;
        }
    }

    async getBalanceOfWallet(wallet: string) {
        const b = await this.provider.getBalance(wallet);
        const balance = ethers.utils.formatEther(b)
        return (+balance).toFixed(4);
    }
}


// https://medium.com/clearmatics/how-i-made-a-uniswap-interface-from-scratch-b51e1027ca87