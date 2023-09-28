import { Inject, OnModuleInit, forwardRef } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import { TG_TOKEN } from 'src/constant';
import { UserService } from 'src/user/user.service';
import { ethers } from 'ethers';
import { PairsArbitrum, PairsTrade, channels, goplusApi, myName, networksBridge, tokenListForSwap, tokensBridge, wethAddress } from 'src/abi/constants';
import { SwapService } from 'src/swap/swap.service';
import { standardABI } from 'src/abi/standard';
import { PlatformService } from 'src/platform/platform.service';
import { SnipeService } from 'src/snipe/snipe.service';
import { LimitService } from 'src/limit/limit.service';
import { MirrorService } from 'src/mirror/mirror.service';
import axios from 'axios';
import { uid } from 'uid';
import { TradeService } from 'src/trade/trade.service';
import { LogService } from 'src/log/log.service';
import { BridgeService } from 'src/bridge/bridge.service';
import { TokenscannerService } from 'src/tokenscanner/tokenscanner.service';
import { DeployerService } from 'src/tokendeployer/deployer.service';
import { UnitradeService } from 'src/unitrade/unitrade.service';
import { BotService } from 'src/bot/bot.service';
import { dt_btn_list } from './telegram.constants';
import Jimp from "jimp";
import { Sniper_New } from './sample.data';
const fs = require('fs')
const path = require('path')

const TelegramBot = require('node-telegram-bot-api');

const Commands = [
    { command: 'init', description: 'Generate or Import wallet' },
    { command: 'start', description: 'Start the work' },
    { command: 'wallet', description: 'Get wallet info' },
    { command: 'help', description: 'Return help docs' },
];

@Injectable()
export class TelegramService implements OnModuleInit {

    private provider: any;
    private readonly bot: any
    private logger = new Logger(TelegramService.name)
    public user: string[] = []
    private lastMsg: number = 0;

    constructor(
        @Inject(forwardRef(() => UserService)) private userService: UserService,
        @Inject(forwardRef(() => SwapService)) private swapService: SwapService,
        @Inject(forwardRef(() => PlatformService)) private platformService: PlatformService,
        @Inject(forwardRef(() => SnipeService)) private snipeService: SnipeService,
        @Inject(forwardRef(() => LimitService)) private limitService: LimitService,
        @Inject(forwardRef(() => MirrorService)) private mirrorService: MirrorService,
        @Inject(forwardRef(() => TradeService)) private tradeService: TradeService,
        @Inject(forwardRef(() => LogService)) private logService: LogService,
        @Inject(forwardRef(() => BridgeService)) private bridgeService: BridgeService,
        @Inject(forwardRef(() => TokenscannerService)) private scannerService: TokenscannerService,
        @Inject(forwardRef(() => DeployerService)) private deployerService: DeployerService,
        @Inject(forwardRef(() => UnitradeService)) private unitradeService: UnitradeService,
        @Inject(forwardRef(() => BotService)) private botService: BotService,
    ) {
        this.bot = new TelegramBot(TG_TOKEN, { polling: true });
        this.bot.setMyCommands(Commands)
        this.bot.on("message", this.onReceiveMessage)
        this.bot.on('callback_query', this.onQueryMessage)
    }

    onModuleInit = async () => {
        //this.provider = new EtherscanProvider("homestead", 'F6DXNJTHGNNY9GA1PDA5A7PNH11HGY8BHP')
        this.provider = this.swapService.provider;
        var user_tmp = [];
        const users = await this.userService.findAll()
        users.forEach((u) => {
            if (u.panel == 0) {
                const id = u.id;
                user_tmp.push(id);
            }
        })
        this.user = user_tmp;
    }

    cleanrMessage = async (chatid: number, msgid: number) => {
        for (var i = 0; i <= 10; i++) {
            try {
                await this.bot.deleteMessage(chatid, msgid - i)
            } catch (e) { }
        }
    }

    onQueryMessage = async (query: any) => {
        try {
            const id = query.message.chat.id;
            const cmd = query.data;
            const msgid = query.message.message_id;

            // select and import private key 
            if (cmd.includes('import_w')) {
                const v = Number(cmd.substring(8, 10))
                const options = {
                    reply_markup: {
                        force_reply: true
                    },
                    parse_mode: "HTML"
                };
                this.bot.sendMessage(id, "<b>Please type your private key.</b>", { parse_mode: "HTML" });
                this.bot.sendMessage(id, "<b>Import Wallet" + v + "</b>", options);
            }

            //
            if (cmd == 'add_wallet') {
                await this.sendWalletSettingtOption(id);
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            //
            if (cmd == 's_tokendeploy') {
                await this.sendTokendeploySettingOption(id);
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            if (cmd == 's_signaltrade') {
                await this.sendSignaltradeSettingOption(id);
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            // import key command 
            if (cmd == 'import_key') {
                await this.sendImportWalletsOption(id);
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            // generate new 10 wallet command
            if (cmd == 'generate_new') {
                const user = await this.userService.findOne(id);
                const ws = user.wallet;
                const wallets = [];
                for (var i = 0; i < 10; i++) {
                    if (ws[i].address == "") {
                        const wallet = ethers.Wallet.createRandom();
                        const w = {
                            address: wallet.address,
                            key: wallet.privateKey
                        };
                        wallets.push(w);
                    } else {
                        const w = {
                            address: ws[i].address,
                            key: ws[i].key
                        };
                        wallets.push(w);
                    }
                }
                await this.userService.update(id, { wallet: wallets });
                const options = {
                    parse_mode: "HTML"
                };
                var w_msg = '';
                wallets.forEach((w, index) => {
                    const address = w.address;
                    const key = w.key;
                    const wi = index + 1;
                    w_msg = w_msg + "<b>💳 Wallet " + wi + "</b> \n <b>Address:</b> <code>" + address + "</code>\n  <b>Key:</b> <code>" + key + "</code>\n\n";
                })
                this.bot.sendMessage(id, "<b>🎉 New wallet is generated successfully.</b> \n\n" + w_msg, options);
            }

            if (cmd == 'w_list') {
                await this.sendWalletListSelection(id)
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            // wallet detail
            if (cmd.includes('v_wallet_')) {
                const v = Number(cmd.substring(9, 11))
                const user = await this.userService.findOne(id);
                const wallet = user.wallet;
                const options = {
                    parse_mode: "HTML"
                };
                const address = wallet[v - 1].address;
                const key = wallet[v - 1].key;
                const wi = v;
                if (address != "") {
                    this.bot.sendMessage(id, "<b>⌛ loading...</b>", { parse_mode: "HTML" });
                    const balance = await this.swapService.getBalanceOfWallet(address);
                    var w_msg = "<b>💳 Wallet " + wi + " Detail: </b> \n <b>Address:</b> <code>" + address + "</code>\n  <b>Key:</b> <code>" + key + "</code>\n<b>Balance:</b> <code>" + balance + " ETH</code>\n\n";
                    w_msg = w_msg + "<b>Token Holding:</b>\n"
                    // get the holding token detail from etherscan API
                    const holds = await this.swapService.getHoldingList(address);
                    if (holds.status) {
                        holds.data.forEach((hold) => {
                            const ta = hold.TokenAddress;
                            const tn = hold.TokenName;
                            const ts = hold.TokenSymbol;
                            const decimal = Number(hold.TokenDivisor);
                            const ba = Math.floor(Number(ethers.utils.parseUnits(hold.TokenQuantity, decimal)) * 1000) / 1000;
                            const dollar = hold.amount;
                            w_msg = w_msg + "<b>Name: " + tn + ":</b>\n <i>Address: " + ta + "</i>\n<i>Balance: " + ba + " " + ts + "($" + dollar + ")</i>\n\n";
                        })
                    } else {
                        w_msg = w_msg + "No tokens found."
                    }
                    await this.bot.sendMessage(id, w_msg, options);
                } else {
                    await this.bot.sendMessage(id, "<b>👷 Your wallet info is not set</b> \n\n", options);
                }
                await this.sendWalletListSelection(id)
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            // wallet delete
            if (cmd == 'w_delete') {
                await this.sendWalletListSelectionToDelete(id)
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            if (cmd.includes('r_wallet_')) {
                const v = Number(cmd.substring(9, 11))
                const user = await this.userService.findOne(id);
                var wallet = user.wallet;
                wallet[v - 1] = {
                    address: "",
                    key: ""
                }
                await this.userService.update(id, { wallet })
                await this.bot.sendMessage(id, "<b>👷 Your 💳wallet(" + v + ") is deleted.</b> \n\n", { parse_mode: "HTML" });
                await this.sendWalletListSelectionToDelete(id)
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            // wallet mode single or multi
            if (cmd == 'w_multi') {
                await this.sendMultiWalletSelection(id);
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            if (cmd == 'w_multi_yes') {
                await this.userService.update(id, { wmode: true });
                await this.bot.sendMessage(id, "<b>You have selected the multi wallet mode.</b>", { parse_mode: "HTML" });
                await this.sendWalletSettingtOption(id);
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            if (cmd == 'w_multi_not') {
                await this.userService.update(id, { wmode: false });
                await this.bot.sendMessage(id, "<b>You will use only one(1st) wallet for transaction.</b>", { parse_mode: "HTML" });
                await this.sendWalletSettingtOption(id);
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            // return snipe menu
            if (cmd == 's_snipes') {
                await this.sendSnipeLobbyOption(id);
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            if (cmd.includes('s_snipe_')) {
                const idx = cmd.substring(8, 9)
                await this.userService.update(id, { lobby: idx })
                await this.sendSnipeSettingOption(id);
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            if (cmd == 's_sniper_add') {
                const user = await this.userService.findOne(id);
                var snipers = user.snipers;
                snipers.push(Sniper_New)
                await this.userService.update(id, { lobby: snipers.length, snipers: snipers })
                await this.sendSnipeSettingOption(id);
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            if (cmd == 's_bridge') {
                await this.sendBridgeSettingOption(id);
                await this.cleanrMessage(query.message.chat.id, msgid)
            }



            // ----------------------------------



            if (cmd.includes("s_swap_")) {
                const mode = Number(cmd.substring(7, 8))
                const user = await this.userService.findOne(id);
                var swap = user.swap;
                swap.with = mode == 1 ? true : false;
                await this.userService.update(id, { swap, tmp: 'swap' });
                await this.sendSwapSettingOption(id);
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            // keep swap token to db
            for (var i = 0; i < tokenListForSwap.length; i++) {
                if (cmd == tokenListForSwap[i].name + "_sel") {
                    const user = await this.userService.findOne(id);
                    var swap = user.swap;
                    swap.token = tokenListForSwap[i].address;
                    await this.userService.update(id, { swap: swap });
                    await this.bot.sendMessage(id, "<b>✔ You selected " + tokenListForSwap[i].name + " to swap.</b> \n", { parse_mode: "HTML" });
                    await this.sendSwapSettingOption(id)
                    await this.cleanrMessage(query.message.chat.id, msgid)
                }

                if (cmd == tokenListForSwap[i].name + "_trns") {
                    const user = await this.userService.findOne(id);
                    var transfer = user.transfer;
                    transfer.token = tokenListForSwap[i].address;
                    await this.userService.update(id, { transfer: transfer });
                    await this.bot.sendMessage(id, "<b>✔ You selected " + tokenListForSwap[i].name + " to transfer.</b> \n", { parse_mode: "HTML" });
                    await this.sendTransferSettingOption(id)
                    await this.cleanrMessage(query.message.chat.id, msgid)
                }
            }

            if (cmd == "custom_token_sel") {
                const options = {
                    reply_markup: {
                        force_reply: true
                    },
                    parse_mode: "HTML"
                };
                await this.bot.sendMessage(id, "<b>Please enter the token contract address(It's pair should be in uniswap!)</b>", { parse_mode: "HTML" });
                await this.bot.sendMessage(id, "<b>Swap Token Contract</b>", options);
            }

            if (cmd == "custom_token_trns") {
                const options = {
                    reply_markup: {
                        force_reply: true
                    },
                    parse_mode: "HTML"
                };
                await this.bot.sendMessage(id, "<b>Please enter the token contract address to transfer</b>", { parse_mode: "HTML" });
                await this.bot.sendMessage(id, "<b>Transfer Token Contract</b>", options);
            }

            if (cmd == "transfer_private") {
                const user = await this.userService.findOne(id);
                var transfer = user.transfer;
                transfer.private = !transfer.private;
                await this.userService.update(id, { transfer: transfer });
                await this.userService.update(id, { mirror: mirror });
                if (transfer.private) {
                    await this.bot.sendMessage(id, "<b>✔ Private mode is started.</b> \n", { parse_mode: "HTML" });
                } else {
                    await this.bot.sendMessage(id, "<b>✔ Private mode is stopped.</b> \n", { parse_mode: "HTML" });
                }
                await this.sendTransferSettingOption(id)
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            // swap mode selection
            if (cmd == 'swap_d_1' || cmd == 'swap_d_2') {
                const user = await this.userService.findOne(id);
                var swap = user.swap;
                swap.with = cmd == 'swap_d_1' ? true : false;
                await this.userService.update(id, { swap: swap });
                await this.bot.sendMessage(id, "<b>✔Ok, you selected the swap mode.</b> \n", { parse_mode: "HTML" });
                await this.sendSwapSettingOption(id);
                await this.cleanrMessage(query.message.chat.id, msgid)
            }


            if (cmd == "swap_slip") {
                const options = {
                    reply_markup: {
                        force_reply: true
                    },
                    parse_mode: "HTML"
                };
                await this.bot.sendMessage(id, "<b>Please set the slippage percent for swap</b>", { parse_mode: "HTML" });
                await this.bot.sendMessage(id, "<b>Swap Slippage</b>", options);
            }

            if (cmd == "signal_slip") {
                const options = {
                    reply_markup: {
                        force_reply: true
                    },
                    parse_mode: "HTML"
                };
                await this.bot.sendMessage(id, "<b>Please set the slippage percent for swap</b>", { parse_mode: "HTML" });
                await this.bot.sendMessage(id, "<b>Signal Slippage</b>", options);
            }

            if (cmd == "swap_gas") {
                const options = {
                    reply_markup: {
                        force_reply: true
                    },
                    parse_mode: "HTML"
                };
                await this.bot.sendMessage(id, "<b>Please set the additional gas price(gwei) as default+(1~20)</b>", { parse_mode: "HTML" });
                await this.bot.sendMessage(id, "<b>Swap Gas Price</b>", options);
            }

            if (cmd == "signal_gas") {
                const options = {
                    reply_markup: {
                        force_reply: true
                    },
                    parse_mode: "HTML"
                };
                await this.bot.sendMessage(id, "<b>Please set the additional gas price(gwei) as default+(1~20)</b>", { parse_mode: "HTML" });
                await this.bot.sendMessage(id, "<b>Signal Gas Price</b>", options);
            }

            if (cmd.includes('swap_amount_')) {
                const v = cmd.substring(12, 14)
                var amount = '0.1';
                if (v == '01') {
                    amount = '0.1';
                } else if (v == '05') {
                    amount = '0.5';
                } else if (v == '10') {
                    amount = '1.0';
                } else if (v == '20') {
                    amount = '2.0';
                } else {
                    if (v == '00') {
                        const options = {
                            reply_markup: {
                                force_reply: true
                            },
                            parse_mode: "HTML"
                        };
                        await this.bot.sendMessage(id, "<b>Please input your amount to swap</b>", { parse_mode: "HTML" });
                        await this.bot.sendMessage(id, "<b>Swap Token Amount</b>", options);
                        return;
                    } else {
                        amount = '2.5';
                    }
                }
                const user = await this.userService.findOne(id);
                var swap = user.swap;
                swap.amount = amount;
                await this.userService.update(id, { swap: swap });
                await this.bot.sendMessage(id, "<b>✔ Swap amount is set successfully.</b>", { parse_mode: "HTML" });
                await this.sendSwapSettingOption(id)
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            //swap now
            if (cmd == "swap_now") {
                console.log(">>>swap process...")
                await this.bot.sendMessage(id, "<b>Swap processing...</b>", { parse_mode: "HTML" });
                const user = await this.userService.findOne(id);
                const swap = user.swap;
                const token = swap.token;
                const wallet = user.wallet[swap.wallet].key;
                const gas = Number(swap.gasprice) * 1;
                const slippage = Number(swap.slippage) * 1;
                const pv = swap.private;
                var res = { status: false, msg: '' }
                if (swap.with) {
                    res = await this.swapService.swapToken(wethAddress, token, Number(swap.amount), gas, slippage, wallet, "swap", id, user.panel, pv)
                } else {
                    const balance = await this.swapService.getTokenBalanceOfWallet(token, user.wallet[swap.wallet].address);
                    const decimal = await this.swapService.getDecimal(token);
                    const b = Number(ethers.utils.formatUnits(balance, decimal));
                    const a = Number(swap.amount);
                    var sell_amont = 0;
                    if (a == 0.1) {
                        sell_amont = b * (5 / 100);
                    } else if (a == 0.5) {
                        sell_amont = b * (10 / 100);
                    } else if (a == 1) {
                        sell_amont = b * (25 / 100);
                    } else if (a == 2) {
                        sell_amont = b * (50 / 100);
                    } else {
                        sell_amont = b;
                    }
                    res = await this.swapService.swapToken(token, wethAddress, sell_amont, gas, slippage, wallet, "swap", id, user.panel, pv)
                }
                if (res.status) {
                    await this.bot.sendMessage(id, "<b>" + res.msg + "</b>", { parse_mode: "HTML" });
                } else {
                    await this.bot.sendMessage(id, "<b>" + res.msg + "</b>", { parse_mode: "HTML" });
                }
            }

            // return transfer menu
            if (cmd == "s_transfer") {
                await this.sendTransferSettingOption(id)
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            if (cmd == "s_perps") {
                await this.sendPerpsSettingOption(id)
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            if (cmd == 's_referrals') {
                const user = await this.userService.findOne(id);
                const code = user.code;
                const referr_len = user.referral.length;
                var refs = [];
                for (var i = 0; i < user.referral.length; i++) {
                    const u_id = user.referral[i];
                    const ref_data = await this.logService.getTotalVolume(u_id);
                    if (ref_data.status) {
                        refs.push(ref_data)
                    }
                }
                var ref_msg = ""
                refs.forEach((r) => {
                    ref_msg = ref_msg + "<b>" + r.u + " : " + r.t + " ETH</b>\n"
                })

                await this.bot.sendMessage(id, "<b>Your referral link : </b><code>" + myName + "?start=_" + code + "</code>\n<b>Referral Users : " + referr_len + "</b>\n" + ref_msg, { parse_mode: "HTML" });
                await this.sendStartSelectOption(id);
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            if (cmd == "s_mytrade") {
                await this.sendUnitradeSettingOption(id);
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            if (cmd == "s_24h") {
                await this.send24hSettingOption(id);
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            if (cmd == 'perps_pair') {
                await this.sendTradePairSettingOption(id)
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            if (cmd == 'perps_positions') {
                await this.sendMyPositionList(id);
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            if (cmd.includes('perps_pair_')) {
                const pair_idx = Number(cmd.substring(11, 14));
                const user = await this.userService.findOne(id);
                var perps = user.perps;
                perps.pairidx = pair_idx;
                await this.userService.update(id, { perps });
                await this.bot.sendMessage(id, "<b>✔Pair is set successfully.</b>", { parse_mode: "HTML" });
                await this.sendPerpsSettingOption(id);
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            if (cmd == 'perps_leverage') {
                const options = {
                    reply_markup: {
                        force_reply: true
                    },
                    parse_mode: "HTML"
                };
                await this.bot.sendMessage(id, "<b>Please input leverage amount(e.g. for 10x leverage = 10).</b>", { parse_mode: "HTML" });
                await this.bot.sendMessage(id, "<b>Perps Leverage</b>", options);
            }

            if (cmd == 'perps_slippage') {
                const options = {
                    reply_markup: {
                        force_reply: true
                    },
                    parse_mode: "HTML"
                };
                await this.bot.sendMessage(id, "<b>Please input slippage(%) 1~100.</b>", { parse_mode: "HTML" });
                await this.bot.sendMessage(id, "<b>Perps Slippage</b>", options);
            }

            if (cmd == 'perps_stoploss') {
                const options = {
                    reply_markup: {
                        force_reply: true
                    },
                    parse_mode: "HTML"
                };
                await this.bot.sendMessage(id, "<b>Please input stoploss(%) 1~100.</b>", { parse_mode: "HTML" });
                await this.bot.sendMessage(id, "<b>Perps Stoploss</b>", options);
            }

            if (cmd == 'perps_profit') {
                const options = {
                    reply_markup: {
                        force_reply: true
                    },
                    parse_mode: "HTML"
                };
                await this.bot.sendMessage(id, "<b>Please input profit(%) 1~100.</b>", { parse_mode: "HTML" });
                await this.bot.sendMessage(id, "<b>Perps Profit</b>", options);
            }

            if (cmd == 'perps_size') {
                const options = {
                    reply_markup: {
                        force_reply: true
                    },
                    parse_mode: "HTML"
                };
                await this.bot.sendMessage(id, "<b>Please input position size(DAI).</b>", { parse_mode: "HTML" });
                await this.bot.sendMessage(id, "<b>Position Size</b>", options);
            }

            if (cmd == 'perps_open') {
                const user = await this.userService.findOne(id);
                var perps = user.perps;
                perps.autotrade = !perps.autotrade;
                perps.closed = false;
                await this.bot.sendMessage(id, "⌛ loading...")
                const res = await this.tradeService.openTrade(perps.pairidx, perps.leverage, perps.slippage, perps.stoploss, perps.profit, perps.size, perps.longshort, user.wallet[perps.wallet].key, perps.wallet, id, 0);
                if (res) {
                    await this.userService.update(id, { perps });
                    await this.bot.sendMessage(id, perps.autotrade ? "<b>✔Perps is opened.</b>" : "<b>✔Perps is closed.</b>", { parse_mode: "HTML" });
                    if (perps.autotrade) {
                        await this.tradeService.updateTrader(user.wallet[perps.wallet].address, true)
                    } else {
                        await this.tradeService.updateTrader(user.wallet[perps.wallet].address, false)
                    }
                }
                await this.sendPerpsSettingOption(id);
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            if (cmd == 'perps_longshort') {
                const user = await this.userService.findOne(id);
                var perps = user.perps;
                perps.longshort = !perps.longshort;
                await this.userService.update(id, { perps });
                await this.bot.sendMessage(id, perps.longshort ? "<b>✔Buy mode is set.</b>" : "<b>✔Sell mode is set.</b>", { parse_mode: "HTML" });
                await this.sendPerpsSettingOption(id);
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            if (cmd.includes('trns_amount_')) {
                const v = cmd.substring(12, 14)
                var amount = '0.1';
                if (v == '01') {
                    amount = '0.1';
                } else if (v == '05') {
                    amount = '0.5';
                } else if (v == '10') {
                    amount = '1.0';
                } else if (v == '20') {
                    amount = '2.0';
                } else {
                    await this.bot.sendMessage(id, "<b>Please enter the your desired amount for mirror.</b>", { parse_mode: "HTML" });
                    const options = {
                        reply_markup: {
                            force_reply: true
                        },
                        parse_mode: "HTML"
                    };
                    await this.bot.sendMessage(id, "<b>Transfer Amount</b>", options);
                    return;
                }
                const user = await this.userService.findOne(id);
                var transfer = user.transfer
                transfer.amount = amount;
                await this.userService.update(id, { transfer });
                await this.bot.sendMessage(id, "<b>✔ Transfer amount is set successfully.</b>", { parse_mode: "HTML" });
                await this.sendTransferSettingOption(id)
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            if (cmd == 'trns_receiver') {
                await this.bot.sendMessage(id, "<b>Please enter the receiver address.</b>", { parse_mode: "HTML" });
                const options = {
                    reply_markup: {
                        force_reply: true
                    },
                    parse_mode: "HTML"
                };
                await this.bot.sendMessage(id, "<b>Receiver Address</b>", options);
            }

            //tranfer now
            if (cmd == "trns_now") {
                console.log(">>>tranfer process...")
                await this.bot.sendMessage(id, "<b>Transfer processing...</b>", { parse_mode: "HTML" });
                const user = await this.userService.findOne(id);
                const token = user.transfer.token;
                const amount = user.transfer.amount;
                const pk = user.wallet[user.transfer.wallet].key;
                const to = user.transfer.to;
                if (token == wethAddress) {
                    const res = await this.swapService.transferTo(token, to, amount, pk, id, user.panel, 'direct');
                } else {
                    const balance = await this.swapService.getTokenBalanceOfWallet(token, user.wallet[user.transfer.wallet].address);
                    const decimal = await this.swapService.getDecimal(token);
                    const b = Number(ethers.utils.formatUnits(balance, decimal));
                    const a = Number(amount);
                    var sell_amont = 0;
                    if (a == 0.1) {
                        sell_amont = Math.floor(b * (5 / 100) * 1000) / 1000;
                    } else if (a == 0.5) {
                        sell_amont = Math.floor(b * (10 / 100) * 1000) / 1000;
                    } else if (a == 1) {
                        sell_amont = Math.floor(b * (25 / 100) * 1000) / 1000;
                    } else if (a == 2) {
                        sell_amont = Math.floor(b * (50 / 100) * 1000) / 1000;
                    } else {
                        sell_amont = b;
                    }
                    const res = await this.swapService.transferTo(token, to, sell_amont.toString(), pk, id, user.panel, 'direct');
                }
            }

            // ---------------------------------------

            // return mirror menu
            if (cmd == 's_mirror') {
                await this.sendMirrorSettingOption(id)
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            if (cmd.includes('m_wallet_')) {
                const v = cmd.substring(9, 11);
                const user = await this.userService.findOne(id);
                var other = user.other;
                other.mirror = v * 1 - 1;
                await this.userService.update(id, { other: other })
                await this.sendMirrorSettingOption(id)
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            if (cmd == 'miro_address') {
                const options = {
                    reply_markup: {
                        force_reply: true
                    },
                    parse_mode: "HTML"
                };
                this.bot.sendMessage(id, "<b>Please input wallet address to mirror.</b>", { parse_mode: "HTML" });
                this.bot.sendMessage(id, "<b>Mirror Wallet Address</b>", options);
            }

            if (cmd == 'mirror_private') {
                const user = await this.userService.findOne(id);
                const mr = user.other.mirror
                var mirror = user.mirror;
                mirror[mr].private = !mirror[mr].private;
                await this.userService.update(id, { mirror: mirror });
                if (mirror[mr].private) {
                    await this.bot.sendMessage(id, "<b>✔ Private mode is started.</b> \n", { parse_mode: "HTML" });
                } else {
                    await this.bot.sendMessage(id, "<b>✔ Private mode is stopped.</b> \n", { parse_mode: "HTML" });
                }
                await this.sendMirrorSettingOption(id)
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            if (cmd.includes('miro_amount_')) {
                const v = cmd.substring(12, 14)
                var amount = '0.1';
                if (v == '01') {
                    amount = '0.1';
                } else if (v == '05') {
                    amount = '0.5';
                } else if (v == '10') {
                    amount = '1.0';
                } else if (v == '20') {
                    amount = '2.0';
                } else {
                    await this.bot.sendMessage(id, "<b>Please enter the your desired amount for mirror.</b>", { parse_mode: "HTML" });
                    const options = {
                        reply_markup: {
                            force_reply: true
                        },
                        parse_mode: "HTML"
                    };
                    await this.bot.sendMessage(id, "<b>Mirror Amount</b>", options);
                    return;
                }
                const user = await this.userService.findOne(id);
                const mr = user.other.mirror
                var mirror = user.mirror;
                mirror[mr].amount = amount;
                await this.userService.update(id, { mirror: mirror });
                await this.mirrorService.loadAddress();
                await this.bot.sendMessage(id, "<b>✔ Mirror amount is set successfully.</b>", { parse_mode: "HTML" });
                await this.sendMirrorSettingOption(id)
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            if (cmd == "miro_slip") {
                const options = {
                    reply_markup: {
                        force_reply: true
                    },
                    parse_mode: "HTML"
                };
                await this.bot.sendMessage(id, "<b>Please set the slippage percent for mirror</b>", { parse_mode: "HTML" });
                await this.bot.sendMessage(id, "<b>Mirror Slippage</b>", options);
            }

            if (cmd == "miro_gas") {
                const options = {
                    reply_markup: {
                        force_reply: true
                    },
                    parse_mode: "HTML"
                };
                await this.bot.sendMessage(id, "<b>Please set the additional gas price(gwei) as default+(1~20)</b>", { parse_mode: "HTML" });
                await this.bot.sendMessage(id, "<b>Mirror Gas Price</b>", options);
            }

            // ---------------------------------------

            // return limit menu
            if (cmd == 's_limit') {
                await this.sendLimitSettingOption(id)
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            if (cmd == 's_autotrade') {
                await this.sendAutoTradeSettingOption(id)
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            if (cmd == 's_scanner') {
                await this.sendScannerSettingOption(id, 0)
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            if (cmd.includes('l_limit_')) {
                const v = cmd.substring(8, 9)
                const user = await this.userService.findOne(id);
                var other = user.other;
                other.limit = v * 1 - 1;
                await this.userService.update(id, { other: other })
                await this.bot.sendMessage(id, "<b>✔ You selected the limit option " + v + "</b>", { parse_mode: "HTML" });
                await this.sendLimitSettingOption(id)
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            if (cmd.includes('l_wallet_')) {
                const v = cmd.substring(9, 11)
                const user = await this.userService.findOne(id);
                const lm = user.other.limit;
                var limits = user.limits
                limits[lm].wallet = v * 1 - 1;
                await this.userService.update(id, { limits: limits })
                await this.bot.sendMessage(id, "<b>✔ You selected the wallet " + v + "</b>", { parse_mode: "HTML" });
                await this.sendLimitSettingOption(id)
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            if (cmd.includes('limt_amount_')) {
                const v = cmd.substring(12, 14)
                var amount = '0.1';
                if (v == '01') {
                    amount = '0.1';
                } else if (v == '05') {
                    amount = '0.5';
                } else if (v == '10') {
                    amount = '1.0';
                } else if (v == '20') {
                    amount = '2.0';
                } else {
                    await this.bot.sendMessage(id, "<b>Please enter the your desired amount limit.</b>", { parse_mode: "HTML" });
                    const options = {
                        reply_markup: {
                            force_reply: true
                        },
                        parse_mode: "HTML"
                    };
                    await this.bot.sendMessage(id, "<b>Limit Amount</b>", options);
                    return;
                }
                const user = await this.userService.findOne(id);
                const lm = user.other.limit
                var limits = user.limits;
                limits[lm].amount = amount;
                await this.userService.update(id, { limits: limits });
                await this.mirrorService.loadAddress();
                await this.bot.sendMessage(id, "<b>✔ Amount is set successfully.</b> \n", { parse_mode: "HTML" });
                await this.sendLimitSettingOption(id)
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            if (cmd == 'limit_private') {
                const user = await this.userService.findOne(id);
                const lm = user.other.limit
                var limits = user.limits;
                limits[lm].private = !limits[lm].private;
                await this.userService.update(id, { limits: limits });
                if (limits[lm].private) {
                    await this.bot.sendMessage(id, "<b>✔ Private mode is started.</b> \n", { parse_mode: "HTML" });
                } else {
                    await this.bot.sendMessage(id, "<b>✔ Private mode is stopped.</b> \n", { parse_mode: "HTML" });
                }
                await this.sendLimitSettingOption(id)
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            if (cmd == 'limt_address') {
                const options = {
                    reply_markup: {
                        force_reply: true
                    },
                    parse_mode: "HTML"
                };
                this.bot.sendMessage(id, "<b>Please input token address to limit buy order.</b>", { parse_mode: "HTML" });
                this.bot.sendMessage(id, "<b>Limit Buy Token</b>", options);
            }

            if (cmd == 'limt_price') {
                const options = {
                    reply_markup: {
                        force_reply: true
                    },
                    parse_mode: "HTML"
                };
                await this.bot.sendMessage(id, "<b>Please input token price to limit buy order</b>", { parse_mode: "HTML" });
                await this.bot.sendMessage(id, "<b>Limit Price</b>", options);
            }

            if (cmd == "limt_slip") {
                const options = {
                    reply_markup: {
                        force_reply: true
                    },
                    parse_mode: "HTML"
                };
                await this.bot.sendMessage(id, "<b>Please set the slippage percent for limit</b>", { parse_mode: "HTML" });
                await this.bot.sendMessage(id, "<b>Limit Slippage</b>", options);
            }

            if (cmd == "limt_gas") {
                const options = {
                    reply_markup: {
                        force_reply: true
                    },
                    parse_mode: "HTML"
                };
                await this.bot.sendMessage(id, "<b>Please set the additional gas price(gwei) as default+(1~20)</b>", { parse_mode: "HTML" });
                await this.bot.sendMessage(id, "<b>Limit Gas Price</b>", options);
            }

            // ---------------------------------------

            // network selection
            if (cmd == 'sel_bsc' || cmd == 'sel_eth') {
                const user = await this.userService.findOne(id);
                const lobby = user.lobby;
                var sniper = user.snipers[lobby - 1];
                const network = cmd == 'sel_bsc' ? 'BSC' : 'ETH';
                sniper.network = network;
                await this.userService.update(id, { sniper: sniper });
                await this.bot.sendMessage(id, "<b>✔ Network set as " + network + ".</b> \n", { parse_mode: "HTML" });
                await this.sendSnipeSettingOption(id);
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            //select token address
            if (cmd == 'sel_token') {
                const options = {
                    reply_markup: {
                        force_reply: true
                    },
                    parse_mode: "HTML"
                };
                await this.bot.sendMessage(id, "<b>Please type token contract address.</b>", { parse_mode: "HTML" });
                await this.bot.sendMessage(id, "<b>Import Token</b>", options);
            }

            //set token buy amount
            if (cmd.includes('sel_amount_')) {
                const v = cmd.substring(11, cmd.length);
                if (v == "00") {
                    const options = {
                        reply_markup: {
                            force_reply: true
                        },
                        parse_mode: "HTML"
                    };
                    await this.bot.sendMessage(id, "<b>Please type token amount to buy.</b>", { parse_mode: "HTML" });
                    await this.bot.sendMessage(id, "<b>Set Amount</b>", options);
                } else {
                    var amount = '0.1';
                    if (v == "05") {
                        amount = '0.5';
                    } else if (v == "10") {
                        amount = '1.0';
                    } else if (v == "20") {
                        amount = '2.0';
                    } else if (v == "100000") {
                        amount = '100000';
                    } else {
                        amount = '0.1';
                    }
                    const user = await this.userService.findOne(id);
                    const lobby = user.lobby;
                    var snipers = user.snipers;
                    snipers[lobby - 1].buyamount = amount;
                    await this.userService.update(id, { snipers: snipers });
                    await this.bot.sendMessage(id, "<b>✔ Buy amount is set successfully.</b> \n", { parse_mode: "HTML" });
                    await this.sendSnipeSettingOption(id);
                    await this.cleanrMessage(query.message.chat.id, msgid)
                }
            }

            //select wallet to buy token in snipe mode
            if (cmd == 'sel_wallet') {
                const user = await this.userService.findOne(id);
                const lobby = user.lobby;
                const multi = user.snipers[lobby - 1].multi;
                if (multi) {
                    await this.bot.sendMessage(id, "<b>You are using multi wallets option for snipe mode.</b>", { parse_mode: "HTML" });
                    await this.sendSnipeSettingOption(id);
                    await this.cleanrMessage(query.message.chat.id, msgid)
                } else {
                    const options = {
                        reply_markup: {
                            force_reply: true
                        },
                        parse_mode: "HTML"
                    };
                    await this.bot.sendMessage(id, "<b>Please type wallet index to use(1~10).</b>", { parse_mode: "HTML" });
                    await this.bot.sendMessage(id, "<b>Select Wallet</b>", options);
                }
            }

            //set token buy amount
            if (cmd == 'sel_gas') {
                const options = {
                    reply_markup: {
                        force_reply: true
                    },
                    parse_mode: "HTML"
                };
                await this.bot.sendMessage(id, "<b>Please type gas price, 1 gwei = 10^9 wei</b>", { parse_mode: "HTML" });
                await this.bot.sendMessage(id, "<b>Set Gas Price</b>", options);
            }

            if (cmd == 'sel_priority') {
                const options = {
                    reply_markup: {
                        force_reply: true
                    },
                    parse_mode: "HTML"
                };
                await this.bot.sendMessage(id, "<b>Please type priority price, 1 gwei = 10^9 wei</b>", { parse_mode: "HTML" });
                await this.bot.sendMessage(id, "<b>Set Priority Price</b>", options);
            }

            //set slippage
            if (cmd == 'sel_slip') {
                const options = {
                    reply_markup: {
                        force_reply: true
                    },
                    parse_mode: "HTML"
                };
                await this.bot.sendMessage(id, "<b>Please type your desired slippage percent</b>", { parse_mode: "HTML" });
                await this.bot.sendMessage(id, "<b>Set Slippage</b>", options);
            }

            //set autobuy
            if (cmd == 'sel_autobuy') {
                const user = await this.userService.findOne(id);
                const lobby = user.lobby;
                var snipers = user.snipers;
                snipers[lobby - 1].autobuy = !snipers[lobby - 1].autobuy;
                await this.userService.update(id, { snipers });
                if (snipers[lobby - 1].autobuy) {
                    await this.bot.sendMessage(id, "<b>✔ Snipe mode is started.</b> \n", { parse_mode: "HTML" });
                } else {
                    await this.bot.sendMessage(id, "<b>✔ Snipe mode is stopped.</b> \n", { parse_mode: "HTML" });
                }
                await this.sendSnipeSettingOption(id);
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            if (cmd.includes('snipe_close_')) {
                const lobby = cmd.substring(12, 13)
                const user = await this.userService.findOne(id);
                var snipers = user.snipers;
                snipers.splice(lobby - 1, 1)
                await this.userService.update(id, { snipers });
                await this.sendSnipeLobbyOption(id);
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            // set private
            if (cmd == 'snipe_private') {
                const user = await this.userService.findOne(id);
                const lobby = user.lobby;
                var snipers = user.snipers;
                snipers[lobby - 1].private = !snipers[lobby - 1].private;
                await this.userService.update(id, { snipers });
                if (snipers[lobby - 1].private) {
                    await this.bot.sendMessage(id, "<b>✔ Private mode is started.</b> \n", { parse_mode: "HTML" });
                } else {
                    await this.bot.sendMessage(id, "<b>✔ Private mode is stopped.</b> \n", { parse_mode: "HTML" });
                }
                this.sendSnipeSettingOption(id);
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            // set private
            if (cmd == 'swap_private') {
                const user = await this.userService.findOne(id);
                var swap = user.swap;
                swap.private = !swap.private;
                await this.userService.update(id, { swap: swap });
                if (swap.private) {
                    await this.bot.sendMessage(id, "<b>✔ Private mode is started.</b> \n", { parse_mode: "HTML" });
                } else {
                    await this.bot.sendMessage(id, "<b>✔ Private mode is stopped.</b> \n", { parse_mode: "HTML" });
                }
                this.sendSwapSettingOption(id);
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            if (cmd == 'signal_private') {
                const user = await this.userService.findOne(id);
                var signaltrade = user.signaltrade;
                signaltrade.private = !signaltrade.private;
                await this.userService.update(id, { signaltrade });
                if (signaltrade.private) {
                    await this.bot.sendMessage(id, "<b>✔ Private mode is started.</b> \n", { parse_mode: "HTML" });
                } else {
                    await this.bot.sendMessage(id, "<b>✔ Private mode is stopped.</b> \n", { parse_mode: "HTML" });
                }
                this.sendSignaltradeSettingOption(id);
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            if (cmd == 'signal_start') {
                const user = await this.userService.findOne(id);
                var signaltrade = user.signaltrade;
                signaltrade.auto = !signaltrade.auto;
                await this.userService.update(id, { signaltrade });
                if (signaltrade.auto) {
                    await this.bot.sendMessage(id, "<b>✔ Signal trade is started.</b> \n", { parse_mode: "HTML" });
                } else {
                    await this.bot.sendMessage(id, "<b>✔ Signal trade is stopped.</b> \n", { parse_mode: "HTML" });
                }
                this.sendSignaltradeSettingOption(id);
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            //set multi
            if (cmd == 'sel_multi') {
                const user = await this.userService.findOne(id);
                const lobby = user.lobby;
                var snipers = user.snipers;
                snipers[lobby - 1].multi = !snipers[lobby - 1].multi;
                await this.userService.update(id, { snipers });
                if (snipers[lobby - 1].multi) {
                    await this.bot.sendMessage(id, "<b>✔ You set multi wallets option for snipe mode.</b> \n", { parse_mode: "HTML" });
                } else {
                    await this.bot.sendMessage(id, "<b>✔ You set single wallet option for snipe mode</b> \n", { parse_mode: "HTML" });
                }
                this.sendSnipeSettingOption(id);
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            //set token buy amount
            if (cmd == 'sel_blockwait') {
                const options = {
                    reply_markup: {
                        force_reply: true
                    },
                    parse_mode: "HTML"
                };
                await this.bot.sendMessage(id, "<b>Please type the blockwait time, minimum is 0, max is 20.</b>", { parse_mode: "HTML" });
                await this.bot.sendMessage(id, "<b>Set Blockwait</b>", options);
            }

            //set sel_sellauto
            if (cmd == 'sel_sellauto') {
                const user = await this.userService.findOne(id);
                const lobby = user.lobby;
                var snipers = user.snipers;
                snipers[lobby - 1].autosell = !snipers[lobby - 1].autosell;
                snipers[lobby - 1].sold = false
                await this.userService.update(id, { snipers: snipers });
                if (snipers[lobby - 1].autosell) {
                    await this.bot.sendMessage(id, "<b>✔ You enabled the auto-sell option.</b> \n", { parse_mode: "HTML" });
                } else {
                    await this.bot.sendMessage(id, "<b>✔ You disabled the auto-sell option.</b> \n", { parse_mode: "HTML" });
                }
                this.sendSnipeSettingOption(id);
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            // set sell gain
            if (cmd == 'sel_sellgain') {
                const options = {
                    reply_markup: {
                        force_reply: true
                    },
                    parse_mode: "HTML"
                };
                await this.bot.sendMessage(id, "<b>Please type your desired sell gain percent(%)</b>", { parse_mode: "HTML" });
                await this.bot.sendMessage(id, "<b>Set Gain Percent</b>", options);
            }

            // to start menu
            if (cmd == "to_start") {
                await this.sendStartSelectOption(id)
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            if (cmd == 'to_start_lobby') {
                await this.sendSnipeLobbyOption(id);
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            if (cmd == "to_perps") {
                await this.sendPerpsSettingOption(id);
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            if (cmd.includes("pos_close_")) {
                const pid = cmd.substring(10, 34)
                await this.sendOnePosition(id, pid);
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            if (cmd.includes("pes_close_")) {
                const pid = cmd.substring(10, 34);
                const pes = await this.tradeService.getTraderOne(pid);
                const user = await this.userService.findOne(id);
                const res = await this.tradeService.closeTrade(pes.pairIndex, pes.index, pes.address, pid, id, 0);
                await this.sendTradePairSettingOption(id)
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            if (cmd.includes('bridge_token_')) {
                const token = cmd.substring(13, cmd.length)
                const user = await this.userService.findOne(id);
                var bridge = user.bridge
                bridge.token = token;
                await this.userService.update(id, { bridge })
                await this.bot.sendMessage(id, "<b>You selected the token " + token + "</b>", { parse_mode: "HTML" });
                await this.sendBridgeSettingOption(id);
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            if (cmd.includes('bridge_net_from_')) {
                const fromChain = cmd.substring(16, cmd.length)
                const user = await this.userService.findOne(id);
                var bridge = user.bridge;
                bridge.fromChain = fromChain;
                await this.userService.update(id, { bridge })
                await this.bot.sendMessage(id, "<b>You selected " + fromChain + " as 'From' network</b>", { parse_mode: "HTML" });
                await this.sendBridgeSettingOption(id);
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            if (cmd.includes('bridge_net_to_')) {
                const toChain = cmd.substring(14, cmd.length)
                const user = await this.userService.findOne(id);
                var bridge = user.bridge;
                bridge.toChain = toChain;
                await this.userService.update(id, { bridge })
                await this.bot.sendMessage(id, "<b>You selected " + toChain + " as 'To' network</b>", { parse_mode: "HTML" });
                await this.sendBridgeSettingOption(id);
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            if (cmd == 'bridge_amount') {
                const options = {
                    reply_markup: {
                        force_reply: true
                    },
                    parse_mode: "HTML"
                };
                await this.bot.sendMessage(id, "<b>Please type your desired amount to send</b>", { parse_mode: "HTML" });
                await this.bot.sendMessage(id, "<b>Set Amount To Send</b>", options);
            }

            if (cmd == 'bridge_wallet') {
                const options = {
                    reply_markup: {
                        force_reply: true
                    },
                    parse_mode: "HTML"
                };
                await this.bot.sendMessage(id, "<b>Please type your wallet index(1~10).</b>", { parse_mode: "HTML" });
                await this.bot.sendMessage(id, "<b>Select Bridge Wallet</b>", options);
            }

            if (cmd == 'bridge_receiver') {
                const options = {
                    reply_markup: {
                        force_reply: true
                    },
                    parse_mode: "HTML"
                };
                await this.bot.sendMessage(id, "<b>Please type receiver address</b>", { parse_mode: "HTML" });
                await this.bot.sendMessage(id, "<b>Set Receiver Address</b>", options);
            }

            if (cmd == 'bridge_send') {
                const user = await this.userService.findOne(id);
                const bridge = user.bridge
                await this.bot.sendMessage(id, "<b>⌛ loading for sending</b> \n", { parse_mode: "HTML" });
                const res = await this.bridgeService.approveAndSend(user.wallet[bridge.wallet - 1].key, bridge.fromChain, bridge.toChain, bridge.amount, bridge.token, bridge.receiver, 0)
                if (res.status) {
                    await this.bot.sendMessage(id, "<b>Sent successfully. Transaction can take up to 20 minutes</b> \n", { parse_mode: "HTML" });
                } else {
                    await this.bot.sendMessage(id, "<b>Error happened.\n" + res.msg + "</b> \n", { parse_mode: "HTML" });
                }
            }

            if (cmd == 'auto_liquidity') {
                const options = {
                    reply_markup: {
                        force_reply: true
                    },
                    parse_mode: "HTML"
                };
                await this.bot.sendMessage(id, "<b>Please type minimum liquidity for auto trade.</b>", { parse_mode: "HTML" });
                await this.bot.sendMessage(id, "<b>Set Minimum Liquidity</b>", options);
            }

            if (cmd == 'auto_balance') {
                const options = {
                    reply_markup: {
                        force_reply: true
                    },
                    parse_mode: "HTML"
                };
                await this.bot.sendMessage(id, "<b>Please type deployer balace for auto trade.</b>", { parse_mode: "HTML" });
                await this.bot.sendMessage(id, "<b>Set Deployer Balance</b>", options);
            }

            if (cmd == 'auto_token') {
                const options = {
                    reply_markup: {
                        force_reply: true
                    },
                    parse_mode: "HTML"
                };
                await this.bot.sendMessage(id, "<b>Please type reference token name for auto trade.</b>", { parse_mode: "HTML" });
                await this.bot.sendMessage(id, "<b>Set Token Name</b>", options);
            }

            if (cmd == 'auto_amount') {
                const options = {
                    reply_markup: {
                        force_reply: true
                    },
                    parse_mode: "HTML"
                };
                await this.bot.sendMessage(id, "<b>Please type auto trade amount.</b>", { parse_mode: "HTML" });
                await this.bot.sendMessage(id, "<b>Set Auto Trade Amount</b>", options);
            }

            if (cmd == 'auto_sellat') {
                const options = {
                    reply_markup: {
                        force_reply: true
                    },
                    parse_mode: "HTML"
                };
                await this.bot.sendMessage(id, "<b>Please choose sell point(%)</b>", { parse_mode: "HTML" });
                await this.bot.sendMessage(id, "<b>Set Sell Percent</b>", options);
            }

            if (cmd == 'auto_wallet') {
                const options = {
                    reply_markup: {
                        force_reply: true
                    },
                    parse_mode: "HTML"
                };
                await this.bot.sendMessage(id, "<b>Please choose wallet</b>", { parse_mode: "HTML" });
                await this.bot.sendMessage(id, "<b>Choose Auto-Trade Wallet</b>", options);
            }

            if (cmd == 'auto_auto') {
                const user = await this.userService.findOne(id);
                var autotrade = user.autotrade
                autotrade.auto = !autotrade.auto
                await this.userService.update(id, { autotrade: autotrade });
                await this.bot.sendMessage(id, autotrade.auto ? "<b>Autotrade is started.</b>" : "<b>Autotrade is stopped.</b>", { parse_mode: "HTML" });
                this.sendAutoTradeSettingOption(id);
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            if (cmd.includes('next_page_')) {
                const v = Number(cmd.substring(10, cmd.length))
                this.sendScannerSettingOption(id, v)
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            if (cmd.includes('scan_buynow_')) {
                const c = cmd.substring(12, cmd.length)
                const user = await this.userService.findOne(id);
                var swap = user.swap;
                swap.token = c;
                swap.with = true;
                await this.userService.update(id, { swap, tmp: 'buynow' })
                await this.sendSwapSettingOption(id)
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            if (cmd.includes('dt__')) {
                const options = {
                    reply_markup: {
                        force_reply: true
                    },
                    parse_mode: "HTML"
                };
                const btn = dt_btn_list.filter((btn) => btn.key == cmd)
                await this.bot.sendMessage(id, "<b>" + btn[0].dsc + "</b>", { parse_mode: "HTML" });
                await this.bot.sendMessage(id, "<b>" + btn[0].cmd + "</b>", options);
            }


            if (cmd == 'dt_deploy') {
                await this.bot.sendMessage(id, "<b>⌛ Deploying new token...</b> \n", { parse_mode: "HTML" });
                const res = await this.deployerService.deployNewToken(id)
                if (res.status) {
                    await this.bot.sendMessage(id, "<b>🎯 Contract deployed successfully.</b> \n Address: <code>" + res.address + "</code>", { parse_mode: "HTML" });
                } else {
                    await this.bot.sendMessage(id, "<b>📢 Deploy failed</b> \n", { parse_mode: "HTML" });
                    await this.bot.sendMessage(id, "<b> " + res.address + "</b> \n", { parse_mode: "HTML" });
                }
            }

            if (cmd.includes('sell_all_')) {
                const c = cmd.substring(10, cmd.length).split("_")
                const user = await this.userService.findOne(id);
                const res = await this.swapService.swapToken(c[0], wethAddress, 0, 0, 0.1, user.wallet[c[1]].key, 'swap', id, 0, false)
                if (res.status) {
                    await this.bot.sendMessage(id, "<b>" + res.msg + "</b>", { parse_mode: "HTML" });
                } else {
                    await this.bot.sendMessage(id, "<b>" + res.msg + "</b>", { parse_mode: "HTML" });
                }
            }

            if (cmd.includes('signal_channel_')) {
                const c = cmd.substring(15, cmd.length)
                const user = await this.userService.findOne(id);
                var signaltrade = user.signaltrade;
                var channel = signaltrade.channel;
                if (channel.includes(c)) {
                    const idx = channel.indexOf(c);
                    channel.splice(idx, 1);
                } else {
                    channel.push(c)
                }
                signaltrade.channel = channel;
                await this.userService.update(id, { signaltrade })
                await this.sendSignaltradeSettingOption(id)
                await this.cleanrMessage(query.message.chat.id, msgid)
            }

            if (cmd.includes('signal_amount_')) {
                const v = cmd.substring(14, 16);
                if (v == "00") {
                    const options = {
                        reply_markup: {
                            force_reply: true
                        },
                        parse_mode: "HTML"
                    };
                    await this.bot.sendMessage(id, "<b>Please type token amount to buy.</b>", { parse_mode: "HTML" });
                    await this.bot.sendMessage(id, "<b>Signal Trade Amount</b>", options);
                } else {
                    var amount = '0.1';
                    if (v == "05") {
                        amount = '0.5';
                    } else if (v == "10") {
                        amount = '1.0';
                    } else if (v == "20") {
                        amount = '2.0'
                    } else {
                        amount = '0.1';
                    }
                    const user = await this.userService.findOne(id);
                    var signaltrade = user.signaltrade;
                    signaltrade.amount = amount;
                    await this.userService.update(id, { signaltrade });
                    await this.bot.sendMessage(id, "<b>✔ Signal Trade amount is set successfully.</b> \n", { parse_mode: "HTML" });
                    this.sendSignaltradeSettingOption(id);
                    await this.cleanrMessage(query.message.chat.id, msgid)
                }
            }


            if (cmd.includes('wallet_select_')) {
                const mode = cmd.substring(14, cmd.length);
                const options = {
                    reply_markup: {
                        force_reply: true
                    },
                    parse_mode: "HTML"
                };
                await this.userService.update(id, { tmp: mode })
                await this.bot.sendMessage(id, "<b>Please type wallet index between 1 and 10 to use.</b>", { parse_mode: "HTML" });
                await this.bot.sendMessage(id, "<b>Wallet Select</b>", options);
            }

            /////////////////////////


        } catch (error) {
            console.log(">>>Error", error.message)
        }
    }

    onReceiveMessage = async (msg: any) => {
        try {
            const message = msg.text;
            const userid = msg.from.id.toString();
            const reply_msg = msg.reply_to_message?.text;
            const msgid = msg.message_id;

            // this.bot.deleteMessage(msg.chat.id, msg.message_id)
            //     .then(() => {
            //     })
            //     .catch((error) => {
            //     })wwwwwwwwwwwwwwwwwwwwwwww

            // if there is a new user, we need to record it on DB and reply 

            if (!this.user.includes(userid)) {
                var user_tmp = this.user;
                user_tmp.push(userid);
                this.user = user_tmp;
                const username = msg.from.username;
                const wt = ethers.Wallet.createRandom();
                const w = {
                    address: "",
                    key: ""
                }
                const fw = {
                    address: wt.address,
                    key: wt.privateKey
                }
                var w_tmp = [];
                for (var i = 0; i < 10; i++) {
                    if (i == 0) {
                        w_tmp.push(fw)
                    } else {
                        w_tmp.push(w)
                    }
                }

                const swap = {
                    token: "",
                    amount: "0",
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
                    closed: true
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
                    symbol: '',
                    supply: 0,
                    maxtx: 0, //maxTxAmount %
                    maxwt: 0, //maxWalletToken % 
                    lqfee: 0, //liquidityFee
                    mkfee: 0, //marketingFee
                    dvfee: 0, //devFee
                    bdfee: 0, //buybackFee
                    brfee: 0, //burnFee
                    buytax: 0,
                    selltax: 0,
                    address: '',
                    wallet: 0
                }

                const signaltrade = {
                    channel: [],
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

                var l_tmp = [];
                for (var i = 0; i < 5; i++) {
                    l_tmp.push(l)
                }
                const new_user = {
                    id: userid,
                    webid: 0,
                    panel: 0,
                    username,
                    wallet: w_tmp,
                    snipers: [],
                    lobby: 0,
                    swap,
                    transfer,
                    mirror: m_tmp,
                    limits: l_tmp,
                    perps,
                    bridge,
                    autotrade,
                    wmode: true,
                    txamount: 0,
                    referral: [],
                    code: uid(),
                    detail: "",
                    other: {
                        mirror: 0,
                        limit: 0
                    },
                    tmp: '',
                    newtoken,
                    signaltrade
                }
                console.log("<<<add new")
                await this.userService.create(new_user);
                await this.sendGenerate9w(userid);

            }

            if (message.includes('/start _')) {
                const user = await this.userService.findOne(userid)
                const u_code = user.code;
                const code = message.substring(8, 19)
                await this.userService.updateReferral(code, userid)
            }

            // return init menu
            if (message == '/init') {
                this.sendInitSelectOption(userid);
            }

            // return start menu
            if (message == '/start') {
                this.sendStartSelectOption(userid);
            }

            // return wallet info
            if (message == '/wallet') {
                this.sendWalletSettingtOption(userid);
            }

            //set private key one by one.  
            for (var i = 1; i <= 10; i++) {
                if (reply_msg == "Import Wallet" + i) {
                    const private_key = message
                    const options = {
                        parse_mode: "HTML"
                    };
                    if (private_key.length != 66) {
                        this.bot.sendMessage(userid, "<b>🔊 Please enter the vaild private key. it should be started with 0x and total length should be 66.</b>", options);
                        return;
                    }
                    const user = await this.userService.findOne(userid);
                    const wallet = new ethers.Wallet(private_key);
                    var wallets = user.wallet;
                    wallets[i - 1] = {
                        address: wallet.address,
                        key: private_key
                    }
                    for (var i = 0; i < wallets.length; i++) {
                        if (wallets[i].key == "") {
                            const wt = ethers.Wallet.createRandom();
                            wallets[i] = {
                                address: wt.address,
                                key: wt.privateKey
                            }
                        }
                    }
                    await this.userService.update(userid, { wallet: wallets })
                    this.bot.sendMessage(userid, "<b>✔ private key is set successfully.</b> \n  <code>" + private_key + "</code>", options);
                    var cnt = 0;
                    wallets.forEach((w) => {
                        if (w.address == "") {
                            cnt++;
                        }
                    })
                    if (cnt > 0) {
                        this.bot.sendMessage(userid, "<b>🔊 You need to import " + cnt + " wallets more.</b>", options);
                    }
                }
            }

            if (reply_msg == "Import Token") {
                const isContract = await this.swapService.isTokenContract(message)
                if (isContract) {
                    const user = await this.userService.findOne(userid);
                    const lobby = user.lobby;
                    var snipers = user.snipers;
                    var sniper = snipers[lobby - 1];
                    const oldContract = sniper.contract;
                    sniper.contract = message;
                    sniper.startprice = 10000;
                    sniper.sold = false;

                    await this.bot.sendMessage(userid, "<b>✔ Token contract is set successfully.</b> \n", { parse_mode: "HTML" });

                    const platform = await this.platformService.findOne('snipe')
                    var contracts = platform.contracts;
                    if (!contracts.includes(message)) {
                        contracts.push(message);
                        await this.platformService.update(platform.id, { contracts });
                        // need to call for watch the new contract address 
                        await this.snipeService.updateWatchList(message, 'add');
                    }

                    // await this.bot.sendMessage(userid, "<b>⌛ loading token detail...</b> \n", { parse_mode: "HTML" });
                    if (oldContract != sniper.contract) {
                        const res = await axios.get(goplusApi + message);
                        const token = message.toLowerCase();
                        const token_info = res.data.result[token];
                        const decimal = await this.swapService.getDecimal(token);
                        sniper.token.name = token_info?.token_name;
                        sniper.token.symbol = token_info?.token_symbol;
                        sniper.token.decimal = decimal.toString();
                        sniper.token.supply = token_info.total_supply;
                        sniper.token.owner = token_info?.owner_address;
                        sniper.token.lppair = token_info.dex ? token_info?.dex[0]?.pair : "";
                        sniper.token.honeypot = token_info.is_honeypot;
                        sniper.token.buytax = token_info?.buy_tax;
                        sniper.token.selltax = token_info?.sell_tax;
                        sniper.token.transferfee = token_info?.transfer_pausable;
                        sniper.token.maxwallet = token_info?.owner_address;
                        sniper.token.maxwp = token_info?.owner_percent;
                        sniper.autobuy = false;
                        //get the token method ids
                        const data = await this.swapService.getMethodIds(sniper.contract);
                        sniper.token.methods = data.methods;
                        sniper.token.owner = data.owner;

                        await this.snipeService.listenMethods(sniper.contract, sniper.token.owner, "", userid);
                    }
                    //call the additional api to get some data and return for user.  
                    snipers[lobby - 1] = sniper;
                    await this.userService.update(userid, { snipers: snipers });
                    await this.sendSnipeSettingOption(userid);

                } else {
                    const options = {
                        reply_markup: {
                            force_reply: true
                        },
                        parse_mode: "HTML"
                    };
                    await this.bot.sendMessage(userid, "<b>Please type available token contract address.</b>", { parse_mode: "HTML" });
                    await this.bot.sendMessage(userid, "<b>Import Token</b>", options);
                }
            }


            if (reply_msg == "Choose Wallet For Delete") {
                if (message * 1 < 1 || message * 1 > 10) {
                    const options = {
                        reply_markup: {
                            force_reply: true
                        },
                        parse_mode: "HTML"
                    };
                    await this.bot.sendMessage(userid, "<b>Wrong index, please type wallet index between 1 and 10 to use.</b>", { parse_mode: "HTML" });
                    await this.bot.sendMessage(userid, "<b>Choose Wallet For Delete</b>", options);
                } else {
                    const user = await this.userService.findOne(userid);
                    var wallet = user.wallet;
                    wallet[message - 1] = {
                        address: "",
                        key: ""
                    }
                    await this.userService.update(userid, { wallet })
                    this.bot.sendMessage(userid, "<b>👷 Your 💳wallet(" + message + ") info is deleted.</b> \n\n", { parse_mode: "HTML" });
                }
            }

            if (reply_msg == "Set Amount") {
                const user = await this.userService.findOne(userid);
                const lobby = user.lobby;
                var snipers = user.snipers;
                snipers[lobby - 1].buyamount = message;
                await this.userService.update(userid, { snipers });
                await this.bot.sendMessage(userid, "<b>✔ Buy amount is set successfully.</b> \n", { parse_mode: "HTML" });
                this.sendSnipeSettingOption(userid);
            }

            if (reply_msg == "Signal Trade Amount") {
                const user = await this.userService.findOne(userid);
                var signaltrade = user.signaltrade;
                signaltrade.amount = message;
                await this.userService.update(userid, { signaltrade });
                await this.bot.sendMessage(userid, "<b>✔ Signal Trade amount is set successfully.</b> \n", { parse_mode: "HTML" });
                this.sendSignaltradeSettingOption(userid);
            }

            if (reply_msg == "Wallet Select") {
                if (message * 1 < 1 || message * 1 > 10) {
                    const options = {
                        reply_markup: {
                            force_reply: true
                        },
                        parse_mode: "HTML"
                    };
                    await this.bot.sendMessage(userid, "<b>Wrong index, please type wallet index between 1 and 10 to use.</b>", { parse_mode: "HTML" });
                    await this.bot.sendMessage(userid, "<b>Wallet Select</b>", options);
                } else {
                    const user = await this.userService.findOne(userid);
                    const mode = user.tmp;
                    if (mode == 'swap') {
                        var swap = user.swap;
                        swap.wallet = message * 1 - 1;
                        await this.userService.update(userid, { swap });
                        await this.bot.sendMessage(userid, "<b>✔ Wallet 💳(" + message + ") is selected successfully.</b> \n", { parse_mode: "HTML" });
                        await this.sendSwapSettingOption(userid);
                    } else if (mode == 'transfer') {
                        var transfer = user.transfer;
                        transfer.wallet = message * 1 - 1;
                        await this.userService.update(userid, { transfer });
                        await this.bot.sendMessage(userid, "<b>✔ Wallet 💳(" + message + ") is selected successfully.</b> \n", { parse_mode: "HTML" });
                        await this.sendTransferSettingOption(userid);
                    } else if (mode == 'perps') {
                        var perps = user.perps;
                        perps.wallet = message * 1 - 1;
                        await this.userService.update(userid, { perps });
                        await this.bot.sendMessage(userid, "<b>✔ Wallet 💳(" + message + ") is selected successfully.</b> \n", { parse_mode: "HTML" });
                        await this.sendPerpsSettingOption(userid);
                    } else if (mode == 'signal') {
                        var signaltrade = user.signaltrade;
                        signaltrade.wallet = message * 1 - 1;
                        await this.userService.update(userid, { signaltrade });
                        await this.bot.sendMessage(userid, "<b>✔ Wallet 💳(" + message + ") is selected successfully.</b> \n", { parse_mode: "HTML" });
                        await this.sendSignaltradeSettingOption(userid);
                    } else if (mode == 'deploy') {
                        var newtoken = user.newtoken;
                        newtoken.wallet = message * 1 - 1;
                        await this.userService.update(userid, { newtoken });
                        await this.bot.sendMessage(userid, "<b>✔ Wallet 💳(" + message + ") is selected successfully.</b> \n", { parse_mode: "HTML" });
                        await this.sendTokendeploySettingOption(userid);
                    } else {

                    }
                }
            }

            if (reply_msg == "Select Wallet") {
                if (message * 1 < 1 || message * 1 > 10) {
                    const options = {
                        reply_markup: {
                            force_reply: true
                        },
                        parse_mode: "HTML"
                    };
                    await this.bot.sendMessage(userid, "<b>Wrong index, please type wallet index between 1 and 10 to use.</b>", { parse_mode: "HTML" });
                    await this.bot.sendMessage(userid, "<b>Select Wallet</b>", options);
                } else {
                    const user = await this.userService.findOne(userid);
                    const lobby = user.lobby;
                    var snipers = user.snipers;
                    snipers[lobby - 1].wallet = message * 1 - 1;
                    await this.userService.update(userid, { snipers });
                    await this.bot.sendMessage(userid, "<b>✔ Wallet is selected successfully.</b> \n", { parse_mode: "HTML" });
                    this.sendSnipeSettingOption(userid);
                }
            }

            if (reply_msg == "Set Gas Price") {
                var pattern = /[a-zA-Z]/;
                if (pattern.test(message)) {
                    await this.bot.sendMessage(userid, "<b>❌ Please input amount as a decimal</b> \n", { parse_mode: "HTML" });
                    await this.sendSnipeSettingOption(userid);
                    return;
                }
                const user = await this.userService.findOne(userid);
                var snipers = user.snipers
                const lobby = user.lobby;
                snipers[lobby - 1].gasprice = Math.floor(message * 1).toString();
                await this.userService.update(userid, { snipers: snipers });
                await this.bot.sendMessage(userid, "<b>✔ Gas Price is set successfully.</b> \n", { parse_mode: "HTML" });
                this.sendSnipeSettingOption(userid);
            }

            if (reply_msg == "Set Priority Price") {
                var pattern = /[a-zA-Z]/;
                if (pattern.test(message)) {
                    await this.bot.sendMessage(userid, "<b>❌ Please input amount as a decimal</b> \n", { parse_mode: "HTML" });
                    await this.sendSnipeSettingOption(userid);
                    return;
                }
                const user = await this.userService.findOne(userid);
                var snipers = user.snipers
                const lobby = user.lobby;
                snipers[lobby - 1].priority = Math.floor(message * 1).toString();
                await this.userService.update(userid, { snipers: snipers });
                await this.bot.sendMessage(userid, "<b>✔ Priority Price is set successfully.</b> \n", { parse_mode: "HTML" });
                this.sendSnipeSettingOption(userid);
            }

            if (reply_msg == "Set Blockwait") {
                var pattern = /[a-zA-Z]/;
                if (pattern.test(message) || Number(message) > 20 || Number(message) < 0) {
                    const options = {
                        reply_markup: {
                            force_reply: true
                        },
                        parse_mode: "HTML"
                    };
                    await this.bot.sendMessage(userid, "<b>Please input amount as a decimal(0~20).</b>", { parse_mode: "HTML" });
                    await this.bot.sendMessage(userid, "<b>Set Blockwait</b>", options);
                } else {
                    const user = await this.userService.findOne(userid);
                    var snipers = user.snipers;
                    const lobby = user.lobby;
                    snipers[lobby - 1].blockwait = message;
                    await this.userService.update(userid, { snipers });
                    await this.bot.sendMessage(userid, "<b>✔ Block wait is set successfully.</b>", { parse_mode: "HTML" });
                    await this.sendSnipeSettingOption(userid)
                }
            }

            if (reply_msg == "Set Slippage") {
                if (message < 1 || message > 100) {
                    await this.bot.sendMessage(userid, "<b>❌ Please type 1~100 value for slippage</b> \n", { parse_mode: "HTML" });
                    this.sendSnipeSettingOption(userid);
                    return;
                }
                const user = await this.userService.findOne(userid);
                var snipers = user.snipers;
                const lobby = user.lobby;
                snipers[lobby - 1].slippage = message;
                await this.userService.update(userid, { snipers });
                await this.bot.sendMessage(userid, "<b>✔ Slipage is set successfully.</b> \n", { parse_mode: "HTML" });
                this.sendSnipeSettingOption(userid);
            }

            if (reply_msg == "Set Gain Percent") {
                if (message < 100) {
                    const options = {
                        reply_markup: {
                            force_reply: true
                        },
                        parse_mode: "HTML"
                    };
                    await this.bot.sendMessage(userid, "<b>❌ Please type bigger number than 100 for gain.</b> \n", { parse_mode: "HTML" });
                    await this.bot.sendMessage(userid, "<b>Set Gain Percent</b>", options);
                    return;
                }
                const user = await this.userService.findOne(userid);
                var snipers = user.snipers;
                const lobby = user.lobby;
                snipers[lobby - 1].sellrate = message;
                await this.userService.update(userid, { snipers: snipers });
                await this.bot.sendMessage(userid, "<b>✔ Sell rate is set successfully.</b> \n", { parse_mode: "HTML" });
                this.sendSnipeSettingOption(userid);
            }

            if (reply_msg == "Swap Token Amount") {
                var pattern = /[a-zA-Z]/;
                if (pattern.test(message)) {
                    const options = {
                        reply_markup: {
                            force_reply: true
                        },
                        parse_mode: "HTML"
                    };
                    await this.bot.sendMessage(userid, "<b>Please input amount as a decimal.</b>", { parse_mode: "HTML" });
                    await this.bot.sendMessage(userid, "<b>Swap Token Amount</b>", options);
                } else {
                    const user = await this.userService.findOne(userid);
                    var swap = user.swap;
                    swap.amount = message;
                    await this.userService.update(userid, { swap: swap });
                    await this.bot.sendMessage(userid, "<b>✔ Swap amount is set successfully.</b>", { parse_mode: "HTML" });
                    await this.sendSwapSettingOption(userid)
                }
            }

            if (reply_msg == "Swap Gas Price") {
                var pattern = /[a-zA-Z]/;
                if (pattern.test(message)) {
                    const options = {
                        reply_markup: {
                            force_reply: true
                        },
                        parse_mode: "HTML"
                    };
                    await this.bot.sendMessage(userid, "<b>Please input amount as a decimal.</b>", { parse_mode: "HTML" });
                    await this.bot.sendMessage(userid, "<b>Swap Gas Price</b>", options);
                } else {
                    const user = await this.userService.findOne(userid);
                    var swap = user.swap;
                    swap.gasprice = message;
                    await this.userService.update(userid, { swap: swap });
                    await this.bot.sendMessage(userid, "<b>✔ Swap gas price is set successfully.</b>", { parse_mode: "HTML" });
                    await this.sendSwapSettingOption(userid)
                }
            }

            if (reply_msg == "Signal Gas Price") {
                var pattern = /[a-zA-Z]/;
                if (pattern.test(message)) {
                    const options = {
                        reply_markup: {
                            force_reply: true
                        },
                        parse_mode: "HTML"
                    };
                    await this.bot.sendMessage(userid, "<b>Please input amount as a decimal.</b>", { parse_mode: "HTML" });
                    await this.bot.sendMessage(userid, "<b>Signal Gas Price</b>", options);
                } else {
                    const user = await this.userService.findOne(userid);
                    var signaltrade = user.signaltrade
                    signaltrade.gasprice = message;
                    await this.userService.update(userid, { signaltrade });
                    await this.bot.sendMessage(userid, "<b>✔ Signal gas price is set successfully.</b>", { parse_mode: "HTML" });
                    await this.sendSignaltradeSettingOption(userid)
                }
            }

            if (reply_msg == "Swap Slippage") {
                var pattern = /[a-zA-Z]/;
                if (pattern.test(message)) {
                    const options = {
                        reply_markup: {
                            force_reply: true
                        },
                        parse_mode: "HTML"
                    };
                    await this.bot.sendMessage(userid, "<b>Please input amount as a decimal.</b>", { parse_mode: "HTML" });
                    await this.bot.sendMessage(userid, "<b>Swap Slippage</b>", options);
                } else {
                    const user = await this.userService.findOne(userid);
                    var swap = user.swap;
                    swap.slippage = message;
                    await this.userService.update(userid, { swap: swap });
                    await this.bot.sendMessage(userid, "<b>✔ Swap slippage is set successfully.</b>", { parse_mode: "HTML" });
                    await this.sendSwapSettingOption(userid)
                }
            }

            if (reply_msg == "Signal Slippage") {
                var pattern = /[a-zA-Z]/;
                if (pattern.test(message)) {
                    const options = {
                        reply_markup: {
                            force_reply: true
                        },
                        parse_mode: "HTML"
                    };
                    await this.bot.sendMessage(userid, "<b>Please input amount as a decimal.</b>", { parse_mode: "HTML" });
                    await this.bot.sendMessage(userid, "<b>Signal Slippage</b>", options);
                } else {
                    const user = await this.userService.findOne(userid);
                    var signaltrade = user.signaltrade;
                    signaltrade.slippage = message;
                    await this.userService.update(userid, { signaltrade });
                    await this.bot.sendMessage(userid, "<b>✔ Signal slippage is set successfully.</b>", { parse_mode: "HTML" });
                    await this.sendSignaltradeSettingOption(userid)
                }
            }

            if (reply_msg == "Swap Token Contract") {
                const isContract = await this.swapService.isTokenContract(message)
                if (isContract) {
                    var user = await this.userService.findOne(userid);
                    var swap = user.swap;
                    swap.token = message;
                    await this.userService.update(userid, { swap: swap });
                    await this.bot.sendMessage(userid, "<b>✔ You entered token contract correctly.</b> \n", { parse_mode: "HTML" });
                    await this.sendSwapSettingOption(userid);
                } else {
                    const options = {
                        reply_markup: {
                            force_reply: true
                        },
                        parse_mode: "HTML"
                    };
                    await this.bot.sendMessage(userid, "<b>Please enter the correct token contract address(It's pair should be in uniswap!)</b>", { parse_mode: "HTML" });
                    await this.bot.sendMessage(userid, "<b>Swap Token Contract</b>", options);
                }
            }

            if (reply_msg == "Transfer Token Contract") {
                const isContract = await this.swapService.isTokenContract(message)
                if (isContract) {
                    var user = await this.userService.findOne(userid);
                    var transfer = user.transfer;
                    transfer.token = message;

                    await this.userService.update(userid, { transfer });
                    await this.bot.sendMessage(userid, "<b>✔ You entered token contract correctly.</b> \n", { parse_mode: "HTML" });
                    await this.sendTransferSettingOption(userid);
                } else {
                    const options = {
                        reply_markup: {
                            force_reply: true
                        },
                        parse_mode: "HTML"
                    };
                    await this.bot.sendMessage(userid, "<b>Please enter the correct token contract address(It's pair should be in uniswap!)</b>", { parse_mode: "HTML" });
                    await this.bot.sendMessage(userid, "<b>Transfer Token Contract</b>", options);
                }
            }

            if (reply_msg == "Transfer Amount") {
                const amount = message
                var pattern = /[a-zA-Z]/;
                if (pattern.test(amount)) {
                    const options = {
                        reply_markup: {
                            force_reply: true
                        },
                        parse_mode: "HTML"
                    };
                    await this.bot.sendMessage(userid, "<b>Please input price as a decimal.</b>", { parse_mode: "HTML" });
                    await this.bot.sendMessage(userid, "<b>Transfer Amount</b>", options);
                } else {
                    const user = await this.userService.findOne(userid);
                    var transfer = user.transfer;
                    transfer.amount = amount;
                    await this.mirrorService.loadAddress();
                    await this.userService.update(userid, { transfer })
                    await this.bot.sendMessage(userid, "<b>✔ Transfer Amount is set successfully.</b> \n", { parse_mode: "HTML" });
                    this.sendTransferSettingOption(userid)
                }
            }

            if (reply_msg == "Receiver Address") {
                if (ethers.utils.isAddress(message)) {
                    const user = await this.userService.findOne(userid);
                    var transfer = user.transfer
                    transfer.to = message;
                    await this.userService.update(userid, { transfer })
                    await this.bot.sendMessage(userid, "<b>✔ Receiver address is set successfully.</b> \n", { parse_mode: "HTML" });
                    this.sendTransferSettingOption(userid)
                } else {
                    await this.bot.sendMessage(userid, "<b>Please enter valid address. Try again.</b>", { parse_mode: "HTML" });
                    const options = {
                        reply_markup: {
                            force_reply: true
                        },
                        parse_mode: "HTML"
                    };
                    this.bot.sendMessage(userid, "<b>Receiver Address</b>", options);
                }
            }

            // set limit buy token contract address
            if (reply_msg == "Limit Buy Token") {
                const isContract = await this.swapService.isTokenContract(message)
                if (isContract) {
                    var user = await this.userService.findOne(userid);
                    const index = user.other.limit
                    var limits = user.limits;
                    var isIn = false;
                    limits.forEach((l) => {
                        if (l.token == message) {
                            isIn = true
                        }
                    })
                    if (isIn) {
                        limits[index].token = message
                    } else {
                        limits[index].token = message
                        //
                        const limit_contract = await this.platformService.findOne("limit");
                        var contracts = limit_contract.contracts;
                        var isNew = true;
                        contracts.forEach((c) => {
                            if (c == message) {
                                isNew = false;
                            }
                        })
                        if (isNew) {
                            contracts.push(message)
                        }
                        await this.platformService.update("limit", { contracts });
                    }
                    await this.userService.update(userid, { limits: limits });
                    await this.bot.sendMessage(userid, "<b>✔ You selected " + message + " to limit buy order.</b> \n", { parse_mode: "HTML" });
                    await this.sendLimitSettingOption(userid);
                } else {
                    const options = {
                        reply_markup: {
                            force_reply: true
                        },
                        parse_mode: "HTML"
                    };
                    this.bot.sendMessage(userid, "<b>Please input correct token address to limit buy order.</b>", { parse_mode: "HTML" });
                    this.bot.sendMessage(userid, "<b>Limit Buy Token</b>", options);
                }
            }

            // set the spend ETH amount for limit buy
            if (reply_msg == "Limit Amount") {
                if (message * 1 < 0.01) {
                    const options = {
                        reply_markup: {
                            force_reply: true
                        },
                        parse_mode: "HTML"
                    };
                    await this.bot.sendMessage(userid, "<b>Should be greater than 0.01</b>", { parse_mode: "HTML" });
                    await this.bot.sendMessage(userid, "<b>Limit Amount</b>", options);
                } else {
                    const user = await this.userService.findOne(userid);
                    const lm = user.other.limit
                    var limits = user.limits;
                    limits[lm].amount = message;
                    await this.userService.update(userid, { limits: limits });
                    await this.bot.sendMessage(userid, "<b>✔ Amount is set successfully.</b> \n", { parse_mode: "HTML" });
                    await this.sendLimitSettingOption(userid);
                }
            }

            if (reply_msg == "Limit Price") {
                var pattern = /[a-zA-Z]/;
                if (pattern.test(message)) {
                    const options = {
                        reply_markup: {
                            force_reply: true
                        },
                        parse_mode: "HTML"
                    };
                    await this.bot.sendMessage(userid, "<b>Please input price as a decimal.</b>", { parse_mode: "HTML" });
                    await this.bot.sendMessage(userid, "<b>Limit Price</b>", options);
                } else {
                    const user = await this.userService.findOne(userid);
                    const index = user.other.limit
                    var limits = user.limits;
                    limits[index].price = message;

                    await this.userService.update(userid, { limits });
                    await this.bot.sendMessage(userid, "<b>✔Limit price is set successfully.</b>", { parse_mode: "HTML" });
                    //await this.bot.sendMessage(userid, "<b>💡 Please take your time. I will buy your token when the price reaches your limit price.</b>", { parse_mode: "HTML" });

                    this.limitService.reloadData();
                    await this.sendLimitSettingOption(userid);
                }
            }

            if (reply_msg == "Limit Gas Price") {
                var pattern = /[a-zA-Z]/;
                if (pattern.test(message)) {
                    const options = {
                        reply_markup: {
                            force_reply: true
                        },
                        parse_mode: "HTML"
                    };
                    await this.bot.sendMessage(userid, "<b>Please input amount as a decimal.</b>", { parse_mode: "HTML" });
                    await this.bot.sendMessage(userid, "<b>Limit Gas Price</b>", options);
                } else {
                    const user = await this.userService.findOne(userid);
                    const lm = user.other.limit
                    var limits = user.limits;
                    limits[lm].gasprice = message;
                    await this.userService.update(userid, { limits: limits });
                    await this.bot.sendMessage(userid, "<b>✔ Limit gas price is set successfully.</b>", { parse_mode: "HTML" });
                    await this.sendLimitSettingOption(userid)
                }
            }

            if (reply_msg == "Limit Slippage") {
                var pattern = /[a-zA-Z]/;
                if (pattern.test(message)) {
                    const options = {
                        reply_markup: {
                            force_reply: true
                        },
                        parse_mode: "HTML"
                    };
                    await this.bot.sendMessage(userid, "<b>Please input amount as a decimal.</b>", { parse_mode: "HTML" });
                    await this.bot.sendMessage(userid, "<b>Limit Slippage</b>", options);
                } else {
                    const user = await this.userService.findOne(userid);
                    const lm = user.other.limit
                    var limits = user.limits;
                    limits[lm].slippage = message;
                    await this.userService.update(userid, { limits: limits });
                    await this.bot.sendMessage(userid, "<b>✔ Limit slippage is set successfully.</b>", { parse_mode: "HTML" });
                    await this.sendLimitSettingOption(userid)
                }
            }

            if (reply_msg == "Mirror Wallet Address") {
                if (ethers.utils.isAddress(message)) {
                    const mirror_wallet = message
                    const user = await this.userService.findOne(userid);
                    const mr = user.other.mirror
                    var mirror = user.mirror;
                    mirror[mr].address = mirror_wallet;
                    await this.mirrorService.loadAddress();
                    await this.userService.update(userid, { mirror: mirror })
                    await this.bot.sendMessage(userid, "<b>✔ Mirror Wallet " + i + " is set successfully.</b> \n", { parse_mode: "HTML" });
                    this.sendMirrorSettingOption(userid)
                } else {
                    await this.bot.sendMessage(userid, "<b>Please enter valid address. Try again.</b>", { parse_mode: "HTML" });
                    const options = {
                        reply_markup: {
                            force_reply: true
                        },
                        parse_mode: "HTML"
                    };
                    this.bot.sendMessage(userid, "<b>Mirror Wallet Address</b>", options);
                }
            }

            // set custom mirror amount
            if (reply_msg == "Mirror Amount") {
                const mirror_amount = message
                var pattern = /[a-zA-Z]/;
                if (pattern.test(mirror_amount)) {
                    const options = {
                        reply_markup: {
                            force_reply: true
                        },
                        parse_mode: "HTML"
                    };
                    await this.bot.sendMessage(userid, "<b>Please input price as a decimal.</b>", { parse_mode: "HTML" });
                    await this.bot.sendMessage(userid, "<b>Mirror Amount</b>", options);
                } else {
                    const user = await this.userService.findOne(userid);
                    const mr = user.other.mirror
                    var mirror = user.mirror;
                    mirror[mr].amount = mirror_amount;
                    await this.mirrorService.loadAddress();
                    await this.userService.update(userid, { mirror: mirror })
                    await this.bot.sendMessage(userid, "<b>✔ Mirror Amount is set successfully.</b> \n", { parse_mode: "HTML" });
                    this.sendMirrorSettingOption(userid)
                }
            }

            if (reply_msg == "Mirror Gas Price") {
                var pattern = /[a-zA-Z]/;
                if (pattern.test(message)) {
                    const options = {
                        reply_markup: {
                            force_reply: true
                        },
                        parse_mode: "HTML"
                    };
                    await this.bot.sendMessage(userid, "<b>Please input amount as a decimal.</b>", { parse_mode: "HTML" });
                    await this.bot.sendMessage(userid, "<b>Mirror Gas Price</b>", options);
                } else {
                    const user = await this.userService.findOne(userid);
                    const mr = user.other.mirror
                    var mirror = user.mirror;
                    mirror[mr].gasprice = message;
                    await this.userService.update(userid, { mirror: mirror });
                    await this.bot.sendMessage(userid, "<b>✔ Mirror gas price is set successfully.</b>", { parse_mode: "HTML" });
                    await this.sendMirrorSettingOption(userid)
                }
            }

            if (reply_msg == "Mirror Slippage") {
                var pattern = /[a-zA-Z]/;
                if (pattern.test(message)) {
                    const options = {
                        reply_markup: {
                            force_reply: true
                        },
                        parse_mode: "HTML"
                    };
                    await this.bot.sendMessage(userid, "<b>Please input amount as a decimal.</b>", { parse_mode: "HTML" });
                    await this.bot.sendMessage(userid, "<b>Mirror Slippage</b>", options);
                } else {
                    const user = await this.userService.findOne(userid);
                    const mr = user.other.mirror
                    var mirror = user.mirror;
                    mirror[mr].slippage = message;
                    await this.userService.update(userid, { mirror: mirror });
                    await this.bot.sendMessage(userid, "<b>✔ Mirror slippage is set successfully.</b>", { parse_mode: "HTML" });
                    await this.sendMirrorSettingOption(userid)
                }
            }

            if (reply_msg == "Perps Leverage") {
                var pattern = /[a-zA-Z]/;
                if (pattern.test(message)) {
                    const options = {
                        reply_markup: {
                            force_reply: true
                        },
                        parse_mode: "HTML"
                    };
                    await this.bot.sendMessage(userid, "<b>Please input leverage as a decimal.</b>", { parse_mode: "HTML" });
                    await this.bot.sendMessage(userid, "<b>Perps Leverage</b>", options);
                } else {
                    const user = await this.userService.findOne(userid);
                    var perps = user.perps;
                    perps.leverage = message;
                    await this.userService.update(userid, { perps });
                    await this.bot.sendMessage(userid, "<b>✔Leverage amount is set successfully.</b>", { parse_mode: "HTML" });
                    await this.sendPerpsSettingOption(userid);
                }
            }

            if (reply_msg == "Perps Slippage") {
                var pattern = /[a-zA-Z]/;
                if (pattern.test(message)) {
                    const options = {
                        reply_markup: {
                            force_reply: true
                        },
                        parse_mode: "HTML"
                    };
                    await this.bot.sendMessage(userid, "<b>Please input slippage as a decimal.</b>", { parse_mode: "HTML" });
                    await this.bot.sendMessage(userid, "<b>Perps Slippage</b>", options);
                } else {
                    const user = await this.userService.findOne(userid);
                    var perps = user.perps;
                    perps.slippage = message;
                    await this.userService.update(userid, { perps });
                    await this.bot.sendMessage(userid, "<b>✔Slippage amount is set successfully.</b>", { parse_mode: "HTML" });
                    await this.sendPerpsSettingOption(userid);
                }
            }

            if (reply_msg == "Perps Stoploss") {
                var pattern = /[a-zA-Z]/;
                if (pattern.test(message)) {
                    const options = {
                        reply_markup: {
                            force_reply: true
                        },
                        parse_mode: "HTML"
                    };
                    await this.bot.sendMessage(userid, "<b>Please input stoploss as a decimal.</b>", { parse_mode: "HTML" });
                    await this.bot.sendMessage(userid, "<b>Perps Stoploss</b>", options);
                } else {
                    const user = await this.userService.findOne(userid);
                    var perps = user.perps;
                    perps.stoploss = message;
                    await this.userService.update(userid, { perps });
                    await this.bot.sendMessage(userid, "<b>✔Stoploss amount is set successfully.</b>", { parse_mode: "HTML" });
                    await this.sendPerpsSettingOption(userid);
                }
            }

            if (reply_msg == "Perps Profit") {
                var pattern = /[a-zA-Z]/;
                if (pattern.test(message)) {
                    const options = {
                        reply_markup: {
                            force_reply: true
                        },
                        parse_mode: "HTML"
                    };
                    await this.bot.sendMessage(userid, "<b>Please input profit as a decimal.</b>", { parse_mode: "HTML" });
                    await this.bot.sendMessage(userid, "<b>Perps Profit</b>", options);
                } else {
                    const user = await this.userService.findOne(userid);
                    var perps = user.perps;
                    perps.profit = message;
                    await this.userService.update(userid, { perps });
                    await this.bot.sendMessage(userid, "<b>✔Profit amount is set successfully.</b>", { parse_mode: "HTML" });
                    await this.sendPerpsSettingOption(userid);
                }
            }

            if (reply_msg == "Position Size") {
                var pattern = /[a-zA-Z]/;
                if (pattern.test(message)) {
                    const options = {
                        reply_markup: {
                            force_reply: true
                        },
                        parse_mode: "HTML"
                    };
                    await this.bot.sendMessage(userid, "<b>Please input position size(DAI) as decimal.</b>", { parse_mode: "HTML" });
                    await this.bot.sendMessage(userid, "<b>Position Size</b>", options);
                } else {
                    const user = await this.userService.findOne(userid);
                    var perps = user.perps;
                    perps.size = message;
                    await this.userService.update(userid, { perps });
                    await this.bot.sendMessage(userid, "<b>✔Position size is set successfully.</b>", { parse_mode: "HTML" });
                    await this.sendPerpsSettingOption(userid);
                }
            }

            if (reply_msg == "Set Amount To Send") {
                if (message != Number(message).toString()) {
                    const options = {
                        reply_markup: {
                            force_reply: true
                        },
                        parse_mode: "HTML"
                    };
                    await this.bot.sendMessage(userid, "<b>❌ Please type decimals as amount</b> \n", { parse_mode: "HTML" });
                    await this.bot.sendMessage(userid, "<b>Set Amount To Send</b>", options);
                    return;
                }
                const user = await this.userService.findOne(userid);
                var bridge = user.bridge;
                bridge.amount = message;
                await this.userService.update(userid, { bridge: bridge });
                await this.bot.sendMessage(userid, "<b>✔  Amount is set for bridge send</b> \n", { parse_mode: "HTML" });
                this.sendBridgeSettingOption(userid);
            }

            if (reply_msg == "Set Minimum Liquidity") {
                if (message != Number(message).toString()) {
                    const options = {
                        reply_markup: {
                            force_reply: true
                        },
                        parse_mode: "HTML"
                    };
                    await this.bot.sendMessage(userid, "<b>❌ Please type decimals as amount</b> \n", { parse_mode: "HTML" });
                    await this.bot.sendMessage(userid, "<b>Set Minimum Liquidity</b>", options);
                    return;
                }
                const user = await this.userService.findOne(userid);
                var autotrade = user.autotrade;
                autotrade.liqudity = message;
                await this.userService.update(userid, { autotrade: autotrade });
                await this.bot.sendMessage(userid, "<b>✔  Minimum liquidity is set.</b> \n", { parse_mode: "HTML" });
                this.sendAutoTradeSettingOption(userid);
            }

            if (reply_msg == "Set Deployer Balance") {
                if (message != Number(message).toString()) {
                    const options = {
                        reply_markup: {
                            force_reply: true
                        },
                        parse_mode: "HTML"
                    };
                    await this.bot.sendMessage(userid, "<b>❌ Please type decimals as amount</b> \n", { parse_mode: "HTML" });
                    await this.bot.sendMessage(userid, "<b>Set Deployer Balance</b>", options);
                    return;
                }
                const user = await this.userService.findOne(userid);
                var autotrade = user.autotrade;
                autotrade.balance = message;
                await this.userService.update(userid, { autotrade: autotrade });
                await this.bot.sendMessage(userid, "<b>✔  Deployer balance is set.</b> \n", { parse_mode: "HTML" });
                this.sendAutoTradeSettingOption(userid);
            }

            if (reply_msg == "Set Token Name") {
                const user = await this.userService.findOne(userid);
                var autotrade = user.autotrade;
                autotrade.token = message;
                await this.userService.update(userid, { autotrade: autotrade });
                await this.bot.sendMessage(userid, "<b>✔  Token name is set.</b> \n", { parse_mode: "HTML" });
                this.sendAutoTradeSettingOption(userid);
            }

            if (reply_msg == "Set Auto Trade Amount") {
                if (message != Number(message).toString()) {
                    const options = {
                        reply_markup: {
                            force_reply: true
                        },
                        parse_mode: "HTML"
                    };
                    await this.bot.sendMessage(userid, "<b>❌ Please type decimals as amount</b> \n", { parse_mode: "HTML" });
                    await this.bot.sendMessage(userid, "<b>Set Auto Trade Amount</b>", options);
                    return;
                }
                const user = await this.userService.findOne(userid);
                var autotrade = user.autotrade;
                autotrade.amount = message;
                await this.userService.update(userid, { autotrade: autotrade });
                await this.bot.sendMessage(userid, "<b>✔  Trade amount is set.</b> \n", { parse_mode: "HTML" });
                this.sendAutoTradeSettingOption(userid);
            }

            if (reply_msg == "Set Sell Percent") {
                if (message != Number(message).toString()) {
                    const options = {
                        reply_markup: {
                            force_reply: true
                        },
                        parse_mode: "HTML"
                    };
                    await this.bot.sendMessage(userid, "<b>❌ Please type decimals as amount</b> \n", { parse_mode: "HTML" });
                    await this.bot.sendMessage(userid, "<b>Set Sell Percent</b>", options);
                    return;
                }
                const user = await this.userService.findOne(userid);
                var autotrade = user.autotrade;
                autotrade.sellat = message;
                await this.userService.update(userid, { autotrade: autotrade });
                await this.bot.sendMessage(userid, "<b>✔  Sell percent is set.</b> \n", { parse_mode: "HTML" });
                this.sendAutoTradeSettingOption(userid);
            }

            if (reply_msg == "Choose Auto-Trade Wallet") {
                if (message != Number(message).toString() && Number(message) > 0 && Number(message < 11)) {
                    const options = {
                        reply_markup: {
                            force_reply: true
                        },
                        parse_mode: "HTML"
                    };
                    await this.bot.sendMessage(userid, "<b>❌ Please type decimals as a walle index(1~10).</b> \n", { parse_mode: "HTML" });
                    await this.bot.sendMessage(userid, "<b>Choose Auto-Trade Wallet</b>", options);
                    return;
                }
                const user = await this.userService.findOne(userid);
                var autotrade = user.autotrade;
                autotrade.wallet = message;
                await this.userService.update(userid, { autotrade: autotrade });
                await this.bot.sendMessage(userid, "<b>✔  Auto-Trade walle is set.</b> \n", { parse_mode: "HTML" });
                this.sendAutoTradeSettingOption(userid);
            }

            if (reply_msg == "Select Bridge Wallet") {
                if (message != Number(message).toString()) {
                    const options = {
                        reply_markup: {
                            force_reply: true
                        },
                        parse_mode: "HTML"
                    };
                    await this.bot.sendMessage(userid, "<b>❌ Please type decimals as wallet index(1~10)</b> \n", { parse_mode: "HTML" });
                    await this.bot.sendMessage(userid, "<b>Select Bridge Wallet</b>", options);
                    return;
                }
                const user = await this.userService.findOne(userid);
                var bridge = user.bridge;
                bridge.wallet = message;
                await this.userService.update(userid, { bridge: bridge });
                await this.bot.sendMessage(userid, "<b>✔ Wallet is selected for bridge send</b> \n", { parse_mode: "HTML" });
                this.sendBridgeSettingOption(userid);
            }

            if (reply_msg == "Set Receiver Address") {
                const user = await this.userService.findOne(userid);
                var bridge = user.bridge;
                bridge.receiver = message;
                await this.userService.update(userid, { bridge: bridge });
                await this.bot.sendMessage(userid, "<b>✔  Receiver is set successfully</b> \n", { parse_mode: "HTML" });
                this.sendBridgeSettingOption(userid);
            }

            if (reply_msg && reply_msg.includes('(New Token)')) {
                const user = await this.userService.findOne(userid);
                var newtoken = user.newtoken;
                const btn = dt_btn_list.filter((b) => b.cmd == reply_msg);
                const _key = btn[0].key;
                const key = _key.substring(4, _key.length)
                if (btn[0].type == 'number') {
                    if (message != Number(message).toString()) {
                        const options = {
                            reply_markup: {
                                force_reply: true
                            },
                            parse_mode: "HTML"
                        };
                        await this.bot.sendMessage(userid, "<b>❌ Please type decimals as amount</b> \n", { parse_mode: "HTML" });
                        await this.bot.sendMessage(userid, "<b>" + btn[0].cmd + "</b>", options);
                        return;
                    }
                }
                if (key == 'name') newtoken.name = message;
                if (key == 'symbol') newtoken.symbol = message;
                if (key == 'supply') newtoken.supply = message;
                if (key == 'maxtx') newtoken.maxtx = message;
                if (key == 'maxwt') newtoken.maxwt = message;
                if (key == 'lqfee') newtoken.lqfee = message;
                if (key == 'mkfee') newtoken.mkfee = message;
                if (key == 'dvfee') newtoken.dvfee = message;
                if (key == 'bdfee') newtoken.bdfee = message;
                if (key == 'brfee') newtoken.brfee = message;
                if (key == 'buytax') newtoken.buytax = message;
                if (key == 'selltax') newtoken.selltax = message;
                await this.userService.update(userid, { newtoken });
                await this.bot.sendMessage(userid, "<b>✔  " + btn[0].cmd.substring(0, btn[0].cmd.length - 11) + " is set.</b> \n", { parse_mode: "HTML" });
                this.sendTokendeploySettingOption(userid);
            }

            await this.cleanrMessage(msg.chat.id, msgid)

        } catch (e) {
            console.log(">>e", e)
        }
    }

    // init panel
    sendInitSelectOption = (userId: string) => {
        const options = {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: 'Generate For Unset All', callback_data: 'generate_new' },
                        { text: 'Import Key', callback_data: 'import_key' }
                    ],
                    [
                        { text: 'Help', callback_data: 'help' }
                    ]
                ]
            }
        };
        this.bot.sendMessage(userId, '👉 Are you going to generate new wallet or import private key?', options);
    }

    // start panel
    sendStartSelectOption = (userId: string) => {
        const options = {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: 'Snipe New Tokens', callback_data: 's_snipes' },
                        { text: 'Bridge Send', callback_data: 's_bridge' }
                    ],
                    [
                        { text: 'Buy Tokens', callback_data: 's_swap_1' },
                        { text: 'Sell tokens', callback_data: 's_swap_2' }
                    ],
                    [
                        { text: 'Mirror Snipe', callback_data: 's_mirror' },
                        { text: 'Limit Buy Order', callback_data: 's_limit' }
                    ],
                    [
                        { text: 'Transfer', callback_data: 's_transfer' },
                        { text: 'Long/Short Perps', callback_data: 's_perps' },
                    ],
                    [
                        { text: 'Auto Trade', callback_data: 's_autotrade' },
                        { text: 'Scanner', callback_data: 's_scanner' },
                    ],
                    [
                        { text: 'My Referrals', callback_data: 's_referrals' },
                        { text: 'My Trades', callback_data: 's_mytrade' },
                    ],
                    [
                        { text: 'Create Token', callback_data: 's_tokendeploy' },
                        { text: 'Signal Trade', callback_data: 's_signaltrade' },
                    ],
                    [
                        { text: '24H Top Volume', callback_data: 's_24h' },
                        { text: 'Wallet', callback_data: 'add_wallet' },
                    ],
                ]
            }
        };
        this.bot.sendMessage(userId, '👉 Please specify for every settings', options);
    }

    //token deploy setting panel
    sendTokendeploySettingOption = async (userId: string) => {
        try {
            const user = await this.userService.findOne(userId)
            const newtoken = user.newtoken;

            const inline_key = [];
            inline_key.push([
                { text: 'Name: ' + newtoken.name, callback_data: 'dt__name' },
                { text: 'Symbol: ' + newtoken.symbol, callback_data: 'dt__symbol' }
            ])

            inline_key.push([
                { text: 'Supply: ' + newtoken.supply, callback_data: 'dt__supply' },
                { text: 'MaxTxAmount: ' + newtoken.maxtx, callback_data: 'dt__maxtx' },
            ])

            inline_key.push([
                { text: 'MaxWalletToken: ' + newtoken.maxwt, callback_data: 'dt__maxwt' },
                { text: 'LiquidityFee: ' + newtoken.lqfee, callback_data: 'dt__lqfee' },
            ])

            inline_key.push([
                { text: 'MarketingFee: ' + newtoken.mkfee, callback_data: 'dt__mkfee' },
                { text: 'DevFee: ' + newtoken.dvfee, callback_data: 'dt__dvfee' },
            ])

            inline_key.push([
                { text: 'BuybackFee: ' + newtoken.bdfee, callback_data: 'dt__bdfee' },
                { text: 'BurnFee: ' + newtoken.brfee, callback_data: 'dt__brfee' },
            ])

            inline_key.push([
                { text: 'Buy Tax: ' + newtoken.buytax, callback_data: 'dt__buytax' },
                { text: 'Sell Tax: ' + newtoken.selltax, callback_data: 'dt__selltax' }
            ])

            const w = user.newtoken.wallet + 1;
            inline_key.push([
                { text: "💳 Wallet " + w, callback_data: 'wallet_select_deploy' },
                { text: 'Deploy Now', callback_data: 'dt_deploy' }
            ])
            inline_key.push([
                { text: 'Back', callback_data: 'to_start' }
            ])
            const options = {
                reply_markup: {
                    inline_keyboard: inline_key
                }
            };
            this.bot.sendMessage(userId, '👉 Please set the detail for your token.', options);
        } catch (e) {

        }
    }

    sendSignaltradeSettingOption = async (userId: string) => {
        try {
            const user = await this.userService.findOne(userId);
            const signaltrade = user.signaltrade;
            const amount = signaltrade.amount;
            const inline_key = [];
            var tmp = [];
            inline_key.push([{ text: "Select Signal", callback_data: " " }]);

            for (var i = 0; i < channels.length; i++) {
                tmp.push({ text: signaltrade.channel.includes(channels[i].id) ? "✅ " + channels[i].name : channels[i].name, callback_data: "signal_channel_" + channels[i].id });
                if (i % 3 == 2) {
                    inline_key.push(tmp);
                    tmp = [];
                }
            }
            tmp = []
            if ((tokenListForSwap.length - 1) % 3 != 2) {
                inline_key.push(tmp);
            }

            inline_key.push([{ text: user.swap.with ? "Buy Amount" : "Sell Amount", callback_data: 'signal_amount' }])
            inline_key.push([
                { text: amount == '0.1' ? '✅ 0.1 ETH' : '0.1 ETH', callback_data: 'signal_amount_01' },
                { text: amount == '0.5' ? '✅ 0.5 ETH' : '0.5 ETH', callback_data: 'signal_amount_05' },
                { text: amount == '1.0' ? '✅ 1.0 ETH' : '1.0 ETH', callback_data: 'signal_amount_10' },
            ])
            inline_key.push([
                { text: amount == '2.0' ? '✅ 2.0 ETH' : '2.0 ETH', callback_data: 'signal_amount_20' },
                {
                    text:
                        (amount != '0.1' && amount != '0.5' && amount != '1.0' && amount != '2.0' && amount != '0') ? '✅ Custom : ' + amount + ' ETH' : 'Custom:-',
                    callback_data: 'signal_amount_00'
                },
            ])
            inline_key.push([
                { text: '🔥 Gas Price (' + user.signaltrade.gasprice + ' gwei)', callback_data: 'signal_gas' },
                { text: '🚧 Slippage (' + user.signaltrade.slippage + ' %)', callback_data: 'signal_slip' }
            ])

            const w = user.signaltrade.wallet + 1;
            inline_key.push([{ text: "💳 Wallet " + w, callback_data: 'wallet_select_signal' }])

            inline_key.push([
                { text: user.signaltrade.private ? "📝 Don't Use Flash RPC" : '📝 Use Flash RPC', callback_data: 'signal_private' }
            ])
            inline_key.push([
                { text: 'Sell At(' + user.signaltrade.sellat + ' %)', callback_data: 'signal_start' },
                { text: user.signaltrade.auto ? 'Stop Signal Trade' : 'Start Signal Trade', callback_data: 'signal_start' }
            ])
            inline_key.push([
                { text: 'Back', callback_data: 'to_start' }
            ])

            const options = {
                reply_markup: {
                    inline_keyboard: inline_key
                }
            };
            this.bot.sendMessage(userId, '👉 Please select the options for signal auto trade.', options);
        } catch (e) {

        }
    }

    sendSnipeLobbyOption = async (userId: string) => {
        try {
            const user = await this.userService.findOne(userId)
            const snipers = user.snipers;
            const inline_key = [];
            snipers.map((sn, idx) => {
                inline_key.push([
                    { text: 'Snipe ' + (idx + 1), callback_data: 's_snipe_' + (idx + 1) }
                ])
            })

            if (snipers.length < 5) {
                inline_key.push([
                    { text: 'Add new one', callback_data: 's_sniper_add' }
                ])
            }

            inline_key.push([
                { text: 'Back', callback_data: 'to_start' }
            ])

            const options = {
                reply_markup: {
                    inline_keyboard: inline_key
                }
            };
            this.bot.sendMessage(userId, '👉 Please select sniper to update or add new one', options);
        } catch (e) {

        }
    }

    // snipe setting panel
    sendSnipeSettingOption = async (userId: string) => {
        try {
            const user = await this.userService.findOne(userId);
            const lobby = user.lobby;
            var snipers = user.snipers;
            var sniper = snipers[lobby - 1];
            if (sniper.contract != "") {
                const display_info = "<b>Token Info</b>\n" +
                    "<i>Name : " + sniper.token.name + "</i>\n" +
                    "<i>Address : <code>" + sniper.contract + "</code></i>\n" +
                    "<i>Symbol : " + sniper.token.symbol + "</i>\n" +
                    "<i>Decimal : " + sniper.token.decimal + "</i>\n" +
                    "<i>Supply : " + sniper.token.supply + "</i>\n" +
                    "<i>Owner : " + sniper.token.owner + "</i>\n" +
                    "<i>LP Pair : <code>" + sniper.token.lppair + "</code></i>\n" +
                    "<i>Is Honeypot : " + (sniper.token.honeypot ? sniper.token.honeypot : 0) + "</i>\n" +
                    "<i>Buy Tax : " + sniper.token.buytax + "</i>\n" +
                    "<i>Sell Tax : " + sniper.token.selltax + "</i>\n" +
                    "<i>Transfer Fee : " + (sniper.token.transferfee ? sniper.token.transferfee : 0) + "</i>\n" +
                    "<i>Max Wallet : " + sniper.token.maxwallet + "</i>\n" +
                    "<i>Max Wallet Percent : " + (sniper.token.maxwp ? sniper.token.maxwp : 0) + "</i>\n";

                await this.bot.sendMessage(userId, display_info, { parse_mode: "HTML" });
            }
            const amount = sniper?.buyamount;
            const options = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: sniper?.contract != "" ? '✅ Token Address:' + sniper.contract : 'Set Token Address', callback_data: 'sel_token' },
                        ],
                        [
                            { text: amount == '0.1' ? '✅ 0.1 ETH' : '0.1 ETH', callback_data: 'sel_amount_01' },
                            { text: amount == '0.5' ? '✅ 0.5 ETH' : '0.5 ETH', callback_data: 'sel_amount_05' },
                            { text: amount == '1.0' ? '✅ 1.0 ETH' : '1.0 ETH', callback_data: 'sel_amount_10' },
                        ],
                        [
                            { text: amount == '2.0' ? '✅ 2.0 ETH' : '2.0 ETH', callback_data: 'sel_amount_20' },
                            { text: amount == '100000' ? '✅ Max' : 'Max', callback_data: 'sel_amount_100000' },
                            {
                                text:
                                    (amount != '0.1' && amount != '0.5' && amount != '1.0' && amount != '2.0' && amount != '0' && amount != '100000') ? '✅ Custom Amount : ' + amount + ' ETH' : 'Custom Amount:-',
                                callback_data: 'sel_amount_00'
                            },
                        ],
                        [
                            { text: '🔥 Additional Gas Price (' + sniper?.gasprice + ' gwei)', callback_data: 'sel_gas' },
                            { text: '🚧 Slippage (' + sniper?.slippage + ' %)', callback_data: 'sel_slip' }
                        ],
                        [
                            { text: sniper.multi ? '💳 Wallets(All)' : '💳 Wallet ' + (sniper.wallet * 1 + 1), callback_data: 'sel_wallet' },
                            { text: sniper.multi ? "Use Single Wallet (💳)" : "Use All Wallets (💳💳💳)", callback_data: 'sel_multi' },
                        ],
                        [
                            { text: "⏰ Block Wait: " + sniper.blockwait, callback_data: 'sel_blockwait' },
                            { text: sniper.private ? "📝 Do not Flash RPC" : "📝 Use Flash RPC", callback_data: 'snipe_private' }
                        ],
                        [
                            { text: '🔥 Priority (' + sniper.priority + ' gwei)', callback_data: 'sel_priority' },
                            { text: sniper.autobuy ? "❌ Stop Auto Buy" : "✅ Start Auto Buy", callback_data: 'sel_autobuy' },
                        ],
                        [
                            { text: 'Sell Gain(' + sniper.sellrate + ' %)', callback_data: 'sel_sellgain' },
                            { text: sniper.autosell ? '❌ Stop Auto Sell' : '✅ Start Auto Sell', callback_data: 'sel_sellauto' }
                        ],
                        [
                            { text: 'Delete Sniper', callback_data: 'snipe_close_' + lobby }
                        ],
                        [
                            { text: 'Back', callback_data: 'to_start_lobby' }
                        ],
                    ]
                }
            };
            this.bot.sendMessage(userId, '👉 Please select the options for snipe:', options);
        } catch (e) {
            console.log(">>err")
        }
    }

    sendBridgeSettingOption = async (userId: string) => {
        try {
            const user = await this.userService.findOne(userId);
            const bridge = user.bridge;
            const inline_key = [];
            inline_key.push([
                { text: 'Select Token', callback_data: 'send_token' }
            ])
            var tmp = [];
            for (var i = 0; i < tokensBridge.length; i++) {
                tmp.push({ text: bridge.token == tokensBridge[i] ? "✅ " + tokensBridge[i] : tokensBridge[i], callback_data: 'bridge_token_' + tokensBridge[i] });
                if (i % 5 == 4) {
                    inline_key.push(tmp);
                    tmp = [];
                }
            }
            if ((tokensBridge.length - 1) % 5 != 4) {
                inline_key.push(tmp);
            }

            inline_key.push([
                { text: 'Select Network(From)', callback_data: 'from_net' }
            ])
            var tmp = [];
            for (var i = 0; i < networksBridge.length; i++) {
                tmp.push({ text: bridge.fromChain == networksBridge[i] ? "✅ " + networksBridge[i] : networksBridge[i], callback_data: 'bridge_net_from_' + networksBridge[i] });
                if (i % 4 == 3) {
                    inline_key.push(tmp);
                    tmp = [];
                }
            }
            if ((networksBridge.length - 1) % 4 != 3) {
                inline_key.push(tmp);
            }

            inline_key.push([
                { text: 'Select Network(To)', callback_data: 'to_net' }
            ])
            var tmp = [];
            for (var i = 0; i < networksBridge.length; i++) {
                tmp.push({ text: bridge.toChain == networksBridge[i] ? "✅ " + networksBridge[i] : networksBridge[i], callback_data: 'bridge_net_to_' + networksBridge[i] });
                if (i % 4 == 3) {
                    inline_key.push(tmp);
                    tmp = [];
                }
            }
            if ((networksBridge.length - 1) % 4 != 3) {
                inline_key.push(tmp);
            }

            inline_key.push([
                { text: Number(bridge.amount) > 0 ? 'Amount: ' + bridge.amount : 'Amount:', callback_data: 'bridge_amount' },
                { text: 'Wallet ' + bridge.wallet, callback_data: 'bridge_wallet' }
            ])
            inline_key.push([
                { text: bridge.receiver != "" ? 'Receiver: ' + bridge.receiver : 'Receiver:', callback_data: 'bridge_receiver' }
            ])
            inline_key.push([
                { text: 'Approve & Send', callback_data: 'bridge_send' }
            ])
            inline_key.push([
                { text: 'Back', callback_data: 'to_start' }
            ])

            const options = {
                reply_markup: {
                    inline_keyboard: inline_key
                }
            };
            this.bot.sendMessage(userId, '👉 Please select the token and network.', options);
        } catch (e) {

        }
    }

    sendAutoTradeSettingOption = async (userId: string) => {
        try {
            const user = await this.userService.findOne(userId);
            const autotrade = user.autotrade;
            const inline_key = [];
            inline_key.push([
                { text: autotrade.liqudity > 0 ? 'Token Liquidity:' + autotrade.liqudity : "Token Liquidity: Not set", callback_data: 'auto_liquidity' },
                { text: autotrade.balance > 0 ? 'Deployer Balance:' + autotrade.balance : 'Deployer Balance: Not Set', callback_data: 'auto_balance' }
            ])
            inline_key.push([
                { text: autotrade.token ? 'Token Name:' + autotrade.token : 'Token Name: Not Set', callback_data: 'auto_token' },
                { text: autotrade.amount > 0 ? 'Buy Amount:' + autotrade.amount : 'Buy Amount: Not Set', callback_data: 'auto_amount' }
            ])
            inline_key.push([
                { text: 'Auto Sell(%):' + autotrade.sellat, callback_data: 'auto_sellat' },
                { text: 'Wallet:' + autotrade.sellat, callback_data: 'auto_wallet' },
            ])
            inline_key.push([
                { text: autotrade.auto ? 'Stop' : 'Start', callback_data: 'auto_auto' }
            ])
            inline_key.push([
                { text: 'Back', callback_data: 'to_start' }
            ])
            const options = {
                reply_markup: {
                    inline_keyboard: inline_key
                }
            };
            this.bot.sendMessage(userId, '👉 Please select option for auto trade.', options);
        } catch (e) {

        }
    }

    // swap tokens select menu
    sendSwapSettingOption = async (userId: string) => {
        const user = await this.userService.findOne(userId);
        const amount = user.swap.amount;
        const t = user.swap.token;

        const inline_key = [];
        var tmp = [];   

        var tokenList = []; 

        if (user.swap.with) {
            tokenList = tokenListForSwap;
        } else {
            tokenListForSwap.forEach((t, idx) => {
                if (idx < 5) {
                    tokenList.push(t)
                }
            })
        }

       // const address = user.wallet[user.swap.wallet].address; 
       // const res = await this.swapService.getHoldingList(address)
        

        // {
        //     name: "ETH", symbol: "ETH", address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", chain: 1, decimal: 18
        // }

        if (user.tmp == 'swap') {
            for (var i = 1; i < tokenList.length; i++) {
                tmp.push({ text: t == tokenList[i].address ? "✅ " + tokenList[i].name : tokenList[i].name, callback_data: tokenList[i].name + "_sel" });
                if (i % 5 == 0) {
                    inline_key.push(tmp);
                    var tmp = [];
                } 
            }
            if ((tokenList.length - 1) % 5 != 0) {
                inline_key.push(tmp);
            }
            inline_key.push([{ text: user.swap.token == '' ? "Contract: ??? " : "Contract: " + user.swap.token, callback_data: "custom_token_sel" }]);
        } else {
            inline_key.push([{ text: "Contract: " + user.swap.token, callback_data: " " }]);
        }

        //inline_key.push([{ text: user.swap.with ? "Buy Amount" : "Sell Amount", callback_data: 'sel_a_list' }])
        if (user.swap.with) {
            inline_key.push([
                { text: amount == '0.1' ? '✅ 0.1 ETH' : '0.1 ETH', callback_data: 'swap_amount_01' },
                { text: amount == '0.5' ? '✅ 0.5 ETH' : '0.5 ETH', callback_data: 'swap_amount_05' },
                { text: amount == '1.0' ? '✅ 1.0 ETH' : '1.0 ETH', callback_data: 'swap_amount_10' },
            ])
            inline_key.push([
                { text: amount == '2.0' ? '✅ 2.0 ETH' : '2.0 ETH', callback_data: 'swap_amount_20' },
                {
                    text:
                        (amount != '0.1' && amount != '0.5' && amount != '1.0' && amount != '2.0' && amount != '0') ? '✅ Custom : ' + amount : 'Custom:-',
                    callback_data: 'swap_amount_00'
                },
            ])
        } else {
            inline_key.push([
                { text: amount == '0.1' ? '✅ 5%' : '5%', callback_data: 'swap_amount_01' },
                { text: amount == '0.5' ? '✅ 10%' : '10%', callback_data: 'swap_amount_05' },
                { text: amount == '1.0' ? '✅ 25%' : '25%', callback_data: 'swap_amount_10' },
            ])
            inline_key.push([
                { text: amount == '2.0' ? '✅ 50%' : '50%', callback_data: 'swap_amount_20' },
                {
                    text:
                        (amount != '0.1' && amount != '0.5' && amount != '1.0' && amount != '2.0' && amount != '0') ? '✅ 100%' : '100%',
                    callback_data: 'swap_amount_30'
                },
            ])
        }
        inline_key.push([
            { text: '🔥 Gas Price (' + user.swap.gasprice + ' gwei)', callback_data: 'swap_gas' },
            { text: '🚧 Slippage (' + user.swap.slippage + ' %)', callback_data: 'swap_slip' }
        ])

        const w = user.swap.wallet + 1;
        inline_key.push([{ text: "💳 Wallet " + w, callback_data: 'wallet_select_swap' }])

        inline_key.push([
            { text: user.swap.private ? "📝 Don't Use Flash RPC" : '📝 Use Flash RPC', callback_data: 'swap_private' }
        ])
        inline_key.push([
            { text: 'Swap Now', callback_data: 'swap_now' },
            { text: 'Cancel', callback_data: 'swap_cancel' }
        ])
        inline_key.push([
            { text: 'Back', callback_data: 'to_start' }
        ])

        const options = {
            reply_markup: {
                inline_keyboard: inline_key
            }
        };
        this.bot.sendMessage(userId, '👉 Please select the options to swap.', options);
    }

    // limit buy order token list
    sendLimitSettingOption = async (userId: string) => {
        const user = await this.userService.findOne(userId);
        const lm = user.other.limit;
        const limit = user.limits[lm];
        const amount = limit.amount;
        const inline_key = [];
        var tmp = [];
        for (var i = 1; i <= 5; i++) {
            tmp.push({ text: lm * 1 + 1 == i ? "✅ Limit " + i : "Limit " + i, callback_data: "l_limit_" + i });
            if (i % 5 == 0) {
                inline_key.push(tmp);
                var tmp = [];
            }
        }
        var tmp = [];
        for (var i = 1; i <= 10; i++) {
            tmp.push({ text: limit.wallet * 1 + 1 == i ? "✅ Wallet " + i : "Wallet " + i, callback_data: "l_wallet_" + i });
            if (i % 5 == 0) {
                inline_key.push(tmp);
                var tmp = [];
            }
        }
        inline_key.push([{ text: "Buy Amount", callback_data: 'sel_a_list' }])
        inline_key.push([
            { text: amount == '0.1' ? '✅ 0.1 ETH' : '0.1 ETH', callback_data: 'limt_amount_01' },
            { text: amount == '0.5' ? '✅ 0.5 ETH' : '0.5 ETH', callback_data: 'limt_amount_05' },
            { text: amount == '1.0' ? '✅ 1.0 ETH' : '1.0 ETH', callback_data: 'limt_amount_10' },
        ])
        inline_key.push([
            { text: amount == '2.0' ? '✅ 2.0 ETH' : '2.0 ETH', callback_data: 'limt_amount_20' },
            {
                text:
                    (amount != '0.1' && amount != '0.5' && amount != '1.0' && amount != '2.0' && amount != '0') ? '✅ Custom : ' + amount + ' ETH' : 'Custom:-',
                callback_data: 'limt_amount_00'
            },
        ])
        inline_key.push([
            { text: '🔥 Gas Price (' + limit.gasprice + ' gwei)', callback_data: 'limt_gas' },
            { text: '🚧 Slippage (' + limit.slippage + ' %)', callback_data: 'limt_slip' }
        ])
        inline_key.push([{ text: "Limit Token: " + limit.token, callback_data: 'limt_address' }])
        inline_key.push([
            { text: "Limit Price: " + limit.price, callback_data: 'limt_price' },
            { text: limit.private ? "📝 Do not Flash RPC" : "📝 Use Flash RPC", callback_data: 'limit_private' }
        ])
        inline_key.push([{ text: 'Back', callback_data: 'to_start' }])
        const options = {
            reply_markup: {
                inline_keyboard: inline_key
            }
        };
        this.bot.sendMessage(userId, '👉 Please select the options to limit.', options);
    }

    // mirror setting panel
    sendMirrorSettingOption = async (userId: string) => {
        const user = await this.userService.findOne(userId);
        const mr = user.other.mirror;
        const mirror = user.mirror[mr];
        const amount = mirror.amount;
        const inline_key = [];
        var tmp = [];
        for (var i = 1; i <= 10; i++) {
            tmp.push({ text: mr * 1 + 1 == i ? "✅ Wallet " + i : "Wallet " + i, callback_data: "m_wallet_" + i });
            if (i % 5 == 0) {
                inline_key.push(tmp);
                var tmp = [];
            }
        }
        inline_key.push([{ text: "Wallet", callback_data: 'sel_a_list' }])
        inline_key.push([
            { text: amount == '0.1' ? '✅ 0.1 ETH' : '0.1 ETH', callback_data: 'miro_amount_01' },
            { text: amount == '0.5' ? '✅ 0.5 ETH' : '0.5 ETH', callback_data: 'miro_amount_05' },
            { text: amount == '1.0' ? '✅ 1.0 ETH' : '1.0 ETH', callback_data: 'miro_amount_10' },
        ])
        inline_key.push([
            { text: amount == '2.0' ? '✅ 2.0 ETH' : '2.0 ETH', callback_data: 'miro_amount_20' },
            {
                text:
                    (amount != '0.1' && amount != '0.5' && amount != '1.0' && amount != '2.0' && amount != '0') ? '✅ Custom : ' + amount + ' ETH' : 'Custom:-',
                callback_data: 'miro_amount_00'
            },
        ])
        inline_key.push([
            { text: '🔥 Gas Price (' + mirror.gasprice + ' gwei)', callback_data: 'miro_gas' },
            { text: '🚧 Slippage (' + mirror.slippage + ' %)', callback_data: 'miro_slip' }
        ])
        inline_key.push([{ text: "Mirror Address: " + mirror.address, callback_data: 'miro_address' }])
        inline_key.push([{ text: mirror.private ? "📝 Don't Use Flash RPC" : '📝 Use Flash RPC', callback_data: 'mirror_private' }])
        inline_key.push([
            { text: 'Back', callback_data: 'to_start' }
        ])
        const options = {
            reply_markup: {
                inline_keyboard: inline_key
            }
        };
        this.bot.sendMessage(userId, '👉 Please select the options to mirror.', options);
    }

    // transfer setting
    sendTransferSettingOption = async (userId: string) => {
        const user = await this.userService.findOne(userId);
        const tr = user.transfer;
        const amount = tr.amount;
        const receiver = tr.to;
        const t = tr.token;
        var isIn = false;
        const inline_key = [];
        var tmp = [];

        for (var i = 0; i < tokenListForSwap.length; i++) {
            if (t == tokenListForSwap[i].address) {
                isIn = true;
            }
            tmp.push({ text: t == tokenListForSwap[i].address ? "✅ " + tokenListForSwap[i].name : tokenListForSwap[i].name, callback_data: tokenListForSwap[i].name + "_trns" });
            if (i % 5 == 4) {
                inline_key.push(tmp);
                var tmp = [];
            }
        }
        if ((tokenListForSwap.length - 1) % 5 != 4) {
            inline_key.push(tmp);
        }
        inline_key.push([{ text: isIn ? "Use custom token" : "Transfer Token(" + t + ")", callback_data: "custom_token_trns" }]);
        inline_key.push([
            { text: tr.private ? "📝 Do not Flash RPC" : "📝 Use Flash RPC", callback_data: 'transfer_private' },
        ])
        if (t == wethAddress) {
            inline_key.push([
                { text: amount == '0.1' ? '✅ 0.1 ETH' : '0.1 ETH', callback_data: 'trns_amount_01' },
                { text: amount == '0.5' ? '✅ 0.5 ETH' : '0.5 ETH', callback_data: 'trns_amount_05' },
                { text: amount == '1.0' ? '✅ 1.0 ETH' : '1.0 ETH', callback_data: 'trns_amount_10' },
            ])
            inline_key.push([
                { text: amount == '2.0' ? '✅ 2.0 ETH' : '2.0 ETH', callback_data: 'trns_amount_20' },
                {
                    text:
                        (amount != '0.1' && amount != '0.5' && amount != '1.0' && amount != '2.0' && amount != '0') ? '✅ Custom : ' + amount : 'Custom:-',
                    callback_data: 'trns_amount_00'
                },
            ])
        } else {
            inline_key.push([
                { text: amount == '0.1' ? '✅ 5%' : '5%', callback_data: 'trns_amount_01' },
                { text: amount == '0.5' ? '✅ 10%' : '10%', callback_data: 'trns_amount_05' },
                { text: amount == '1.0' ? '✅ 25%' : '25%', callback_data: 'trns_amount_10' },
            ])
            inline_key.push([
                { text: amount == '2.0' ? '✅ 50%' : '50%', callback_data: 'trns_amount_20' },
                {
                    text:
                        (amount != '0.1' && amount != '0.5' && amount != '1.0' && amount != '2.0' && amount != '0') ? '✅ 100%' : '100%',
                    callback_data: 'trns_amount_00'
                },
            ])
        }
        inline_key.push([{ text: receiver != "" ? "Receiver : " + receiver : "Add Receiver :", callback_data: 'trns_receiver' }])

        const w = user.transfer.wallet + 1;
        inline_key.push([{ text: "💳 Wallet " + w, callback_data: 'wallet_select_transfer' }])

        inline_key.push([
            { text: 'Transfer Now', callback_data: 'trns_now' },
            { text: 'Cancel', callback_data: 'to_start' }
        ])
        inline_key.push([
            { text: 'Back', callback_data: 'to_start' }
        ])

        const options = {
            reply_markup: {
                inline_keyboard: inline_key
            }
        };
        this.bot.sendMessage(userId, '👉 Please select the options to transfer.', options);
    }

    sendPerpsSettingOption = async (userId: string) => {
        const user = await this.userService.findOne(userId);
        const perps = user.perps;
        const p = PairsTrade.filter((e) => e.pairIdx == perps.pairidx);
        const pair = p[0].asset
        const idx = p[0].pairIdx;
        const price = await this.tradeService.getPrice(idx)

        const inline_key = [];
        inline_key.push([
            { text: 'Selected Pair : ' + pair + "/USD, (select other)", callback_data: 'perps_pair' }
        ])
        inline_key.push([
            { text: 'Pair price: ' + price, callback_data: '_' }
        ])
        inline_key.push([
            { text: '🎯 Leverage : ' + perps.leverage + '(X)', callback_data: 'perps_leverage' },
            { text: '🚧 Slippage : ' + perps.slippage + '(%)', callback_data: 'perps_slippage' }
        ])
        inline_key.push([
            { text: '🛡️ Stop Loss : ' + perps.stoploss + '(%)', callback_data: 'perps_stoploss' },
            { text: '💎 Take Profit : ' + perps.profit + '(%)', callback_data: 'perps_profit' }
        ])
        inline_key.push([
            { text: '⛽️ Position Size : ' + perps.size + ' DAI', callback_data: 'perps_size' },
            { text: perps.longshort ? 'Actived Long' : 'Actived Short', callback_data: 'perps_longshort' }
        ])
        const w = user.perps.wallet + 1
        inline_key.push([{ text: "💳 Wallet " + w, callback_data: 'wallet_select_perps' }])

        inline_key.push([
            { text: '✅ Open Trade', callback_data: 'perps_open' },
            { text: '🏆 My Positions', callback_data: 'perps_positions' }
        ])
        inline_key.push([
            { text: 'Back', callback_data: 'to_start' }
        ])
        const options = {
            reply_markup: {
                inline_keyboard: inline_key
            }
        };
        this.bot.sendMessage(userId, '👉 Please select the options for perps.', options);
    }

    sendTradePairSettingOption = async (userId: string) => {
        const user = await this.userService.findOne(userId);
        const perps = user.perps;
        const inline_key = [];
        var tmp = [];
        for (var i = 0; i < PairsTrade.length; i++) {
            tmp.push({ text: perps.pairidx == PairsTrade[i].pairIdx ? "✅ " + PairsTrade[i].asset : PairsTrade[i].asset, callback_data: "perps_pair_" + PairsTrade[i].pairIdx });
            if (i % 5 == 4) {
                inline_key.push(tmp);
                var tmp = [];
            }
        }
        const options = {
            reply_markup: {
                inline_keyboard: inline_key
            }
        };
        this.bot.sendMessage(userId, '👉 Please select a pair for perps.', options);
    }

    sendMyPositionList = async (userId: string) => {
        const list = await this.tradeService.getTradeForUser(userId);
        const inline_key = [];
        var tmp = [];
        for (var i = 0; i < list.length; i++) {
            const ls = list[i];
            const pi = ls.pairIndex;
            const p = PairsTrade.filter((pr) => pr.pairIdx == pi)
            const dt = p[0];
            const md = ls.longshort ? "Long Mode" : "Short Mode";
            const ts = (i + 1) + " : " + dt.asset + "/USD, " + md + ", Leverage: " + ls.leverage + "(%), " + ls.size + "($) ";
            tmp.push(
                { text: ts, callback_data: "pos_close_" + ls._id },
            );
            inline_key.push(tmp);
            tmp = [];
        }
        inline_key.push([
            { text: 'Back', callback_data: 'to_perps' }
        ])
        const options = {
            reply_markup: {
                inline_keyboard: inline_key
            }
        };
        this.bot.sendMessage(userId, '👉 Please select a position.', options);
    }

    sendOnePosition = async (userId: string, pId: string) => {
        const p = await this.tradeService.getTraderOne(pId);
        const pi = p.pairIndex;
        const pr = PairsTrade.filter((pt) => pt.pairIdx == pi);
        const dt = pr[0]
        const pair = dt.asset + "/USD";
        const mode = p.longshort ? "Long mode" : "Short mode";
        const c_p = await this.tradeService.getPrice(pi);
        const s_p = p.startprice;
        const fee = (p.size * p.leverage) * (0.08 / 100);
        const c_s = p.size - fee;
        const c_pr = Math.floor(((c_s / s_p) * (c_p - s_p) - fee) * 100) / 100;

        await this.bot.sendMessage(userId, "<b>Your Position Detail:</b>\n<code>Pair: " + pair + "</code>\n<code>Leverage:" + p.leverage + "</code>\n<code>Position Size: " + p.size + " (DAI)</code>\n<code>Final Profit: " + p.profit + "(%)</code>\n<code>Mode: " + mode + "</code>\n<code>Stoploss: " + p.stoploss + "</code>\n<code>Current Profit: " + c_pr + "($)</code>", { parse_mode: "HTML" });
        const inline_key = [];
        inline_key.push([
            { text: 'Close', callback_data: 'pes_close_' + pId },
            { text: 'Back', callback_data: 'to_perps' }
        ])
        const options = {
            reply_markup: {
                inline_keyboard: inline_key
            }
        };
        this.bot.sendMessage(userId, '👉 Your position detail, ...', options);
    }

    // wallet setting
    sendWalletSettingtOption = async (userId: string) => {
        const user = await this.userService.findOne(userId);

        const options = {
            reply_markup: {
                inline_keyboard: [
                    // [
                    //     { text: wmode ? '✅ Multi Wallet' : 'Multi Wallet', callback_data: 'w_multi' },
                    // ],
                    [
                        { text: 'Wallet Details', callback_data: 'w_list' },
                    ],
                    [
                        { text: 'Delete Wallet', callback_data: 'w_delete' }
                    ],
                    [
                        { text: 'Back', callback_data: 'to_start' }
                    ],
                ]
            }
        };
        this.bot.sendMessage(userId, '👉 Please check your wallet setting and info', options);
    }

    // wallet setting
    sendMultiWalletSelection = async (userId: number) => {
        const options = {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: 'Yes', callback_data: 'w_multi_yes' },
                    ],
                    [
                        { text: 'No', callback_data: 'w_multi_not' },
                    ],
                ]
            }
        };
        this.bot.sendMessage(userId, '👉 Are you going to user multi wallets?', options);
    }

    // wallet list
    sendWalletListSelection = async (userId: string) => {
        const inline_key = [];
        const user = await this.userService.findOne(userId);
        const wallets = user.wallet;

        var wl = 0;
        wallets.forEach((w) => {
            if (w.address != "") {
                wl++;
            }
        })
        if (wl == 1) {
            const wm = [
                { text: '💳 Wallet 1 ✅', callback_data: 'v_wallet_' + 1 }
            ];
            inline_key.push(wm)
        } else {
            for (var i = 1; i <= 10; i += 2) {
                const w1 = wallets[i - 1].address == "" ? false : true;
                const w2 = wallets[i].address == "" ? false : true;
                const wm = [
                    { text: w1 ? '💳 Wallet ' + i + " ✅" : '💳 Wallet ' + i, callback_data: 'v_wallet_' + i },
                    { text: w2 ? '💳 Wallet ' + (i + 1) + " ✅" : '💳 Wallet ' + (i + 1), callback_data: 'v_wallet_' + (i + 1) },
                ];
                inline_key.push(wm)
            }
        }

        inline_key.push([{ text: "Back", callback_data: 'add_wallet' }])
        const options = {
            reply_markup: {
                inline_keyboard: inline_key
            }
        };
        this.bot.sendMessage(userId, '👉 Please select a wallet to see detail info.', options);
    }

    sendWalletListSelectionToDelete = async (userId: string) => {
        const inline_key = [];
        const user = await this.userService.findOne(userId);
        const wallets = user.wallet;

        var wl = 0;
        wallets.forEach((w) => {
            if (w.address != "") {
                wl++;
            }
        })
        if (wl == 1) {
            const wm = [
                { text: '💳 Wallet 1 ✅', callback_data: 'r_wallet_' + 1 }
            ];
            inline_key.push(wm)
        } else {
            for (var i = 1; i <= 10; i += 2) {
                const w1 = wallets[i - 1].address == "" ? false : true;
                const w2 = wallets[i].address == "" ? false : true;
                const wm = [
                    { text: w1 ? '💳 Wallet ' + i + " ✅" : '💳 Wallet ' + i, callback_data: 'r_wallet_' + i },
                    { text: w2 ? '💳 Wallet ' + (i + 1) + " ✅" : '💳 Wallet ' + (i + 1), callback_data: 'r_wallet_' + (i + 1) },
                ];
                inline_key.push(wm)
            }
        }

        inline_key.push([{ text: "Back", callback_data: 'add_wallet' }])
        const options = {
            reply_markup: {
                inline_keyboard: inline_key
            }
        };
        this.bot.sendMessage(userId, '👉 Please select a wallet to delete.', options);
    }

    sendScannerSettingOption = async (userId: string, page: number) => {
        const perPage = 3;
        const lists = await this.scannerService.getTokenList();

        var inline_key = [];
        var showlist = []
        for (var i = 0; i < lists.length; i++) {
            if (page * perPage <= i && i < (page * perPage + perPage)) {
                showlist.push(lists[i])
            }
        }
        for (var j = 0; j < showlist.length; j++) {
            const con = showlist[j];
            const msg = "Token: <code>" + con.contract +
                "</code>\n Name: <code>" + con.name +
                "</code>\n Symbol: <code> " + con.symbol +
                "</code>\n Decimals: <code> " + con.decimal +
                "</code>\n Dex ID: <code> " + con.detail.dexId +
                "</code>\n Pirce($): <code> " + con.detail.priceUsd +
                "</code>\n Marketcap: <code> " + con.detail.mcap +
                "</code>\n Liquidity: <code> " + con.detail.liquidity +
                "</code>\n 24H Vol: <code> " + con.detail.h24 +
                "</code>\n Telegram: <code>" + con.detail.tg +
                "</code>\n Twitter: <code>" + con.detail.twitter +
                "</code>\n Discord: <code>" + con.detail.discord +
                "</code>\n Medium: <code>" + con.detail.medium +
                "</code>\n Website: <code> " + con.detail.website +
                "</code>";

            inline_key.push([{ text: "Buy Now", callback_data: "scan_buynow_" + con.contract }]);
            const options = {
                reply_markup: {
                    inline_keyboard: inline_key
                },
                parse_mode: "HTML"
            };
            await this.bot.sendMessage(userId, msg, options);
            inline_key = []
        }

        inline_key = []
        if (page > 0 && page < (Math.floor(lists.length / perPage))) {
            inline_key.push([
                { text: 'Pre Page', callback_data: 'next_page_' + (page - 1) },
                { text: 'Next Page', callback_data: 'next_page_' + (page + 1) }
            ])
        } else if (page == 0) {
            inline_key.push([
                { text: 'Next Page', callback_data: 'next_page_' + (page + 1) }
            ])
        } else {
            inline_key.push([
                { text: 'Pre Page', callback_data: 'next_page_' + (page - 1) },
            ])
        }

        inline_key.push([
            { text: 'Back', callback_data: 'to_start' }
        ])
        const options = {
            reply_markup: {
                inline_keyboard: inline_key
            }
        };
        await this.bot.sendMessage(userId, '👉 Please select page. Current Page(' + (page + 1) + ')', options);
    }

    sendUnitradeSettingOption = async (userId: string) => {
        this.bot.sendMessage(userId, "<b>⌛ loading...</b>", { parse_mode: "HTML" });
        const list = await this.unitradeService.getHistory(userId);
        const user = await this.userService.findOne(userId);
        const wallets = user.wallet;

        var inline_key = [];
        for (var i = 0; i < list.length; i++) {
            const item = list[i];
            const h = item.history;
            var h_msg = "";
            var token_amount = 0;
            var profit = 0;
            h.forEach((h_item: any) => {
                h_msg = h_msg + "Balance: <code>" + h_item.eth_amount + " ETH($" + h_item.eth_price + ") " + '' + "</code>\n";
                token_amount = token_amount + h_item.token_amount * 1;
                profit = profit + h_item.eth_amount * h_item.eth_price;
            })
            const _price = await this.botService.getPairPrice(item.contract)
            const token_price = _price.price;
            profit = profit + token_price * token_amount;
            const t_msg = "Token Amount: <code>" + token_amount + "($" + token_price + ")</code>\n" +
                "Profit: <code>$" + profit + "</code>\n"

            const msg = "Token: <code>" + item.contract + "</code>\n" +
                "Wallet: <code>" + item.by_wallet + "</code>\n" + h_msg + t_msg;

            var wid = 0;
            wallets.forEach((w, idx) => {
                if (w.address == item.by_wallet) {
                    wid = idx;
                }
            })
            const code = item.contract + "_" + wid;
            inline_key.push([{ text: "Sell All Now", callback_data: "sell_all_" + code }]);
            const options = {
                reply_markup: {
                    inline_keyboard: inline_key
                },
                parse_mode: "HTML"
            };
            await this.bot.sendMessage(userId, msg, options);
            inline_key = []
        }

        if (list.length == 0) {
            await this.bot.sendMessage(userId, "<b>No trade data through Uniswap.</b>", { parse_mode: "HTML" });
        }
    }

    sendImportWalletsOption = async (userId: string) => {
        const user = await this.userService.findOne(userId);
        const wallets = user.wallet;
        var wl = 0;
        var tmp = [];
        wallets.forEach((w) => {
            if (w.address != "") {
                wl++;
            }
        })
        if (wl == 1) {
            const wm = [
                { text: '💳 Wallet 1 ✅', callback_data: 'import_w' + i }
            ];
            tmp.push(wm)
        } else {
            for (var i = 1; i <= 10; i += 2) {
                const w1 = wallets[i - 1].address == "" ? false : true;
                const w2 = wallets[i].address == "" ? false : true;
                const wm = [
                    { text: w1 ? '💳 Wallet ' + i + " ✅" : '💳 Wallet ' + i, callback_data: 'import_w' + i },
                    { text: w2 ? '💳 Wallet ' + (i + 1) + " ✅" : '💳 Wallet ' + (i + 1), callback_data: 'import_w' + (i + 1) },
                ];
                tmp.push(wm)
            }
        }

        const options = {
            reply_markup: {
                inline_keyboard: tmp
            }
        };
        this.bot.sendMessage(userId, '👉 Please select a wallet.', options);
    }

    send24hSettingOption = async (userId: string) => {
        try {
            const lead24 = await this.platformService.getTop50Volume('h24_lead');
            const aff24 = await this.platformService.getTop50Volume('h24_aff');
            var lead_msg = ""
            lead24.forEach((item: any) => {
                lead_msg = lead_msg + "Name: " + item.n + ", Vol: " + item.h24 + " ETH\n";
            })
            var aff_msg = ""
            aff24.forEach((item: any) => {
                aff_msg = aff_msg + "Name: " + item.n + ", Vol: " + item.h24 + " ETH\n";
            })
            const msg = "Top Lead Volume(24h): \n" + lead_msg + "\nTop Affiliate Volume(24h):\n" + aff_msg
            await this.bot.sendMessage(userId, msg, { parse_mode: "HTML" });

            var inline_key = []
            inline_key.push([
                { text: 'Back', callback_data: 'to_start' }
            ])
            const options = {
                reply_markup: {
                    inline_keyboard: inline_key
                }
            };
            await this.bot.sendMessage(userId, '👉 Top Volume for 24 Hours', options);

        } catch (e) {
            console.log(">>e", e.messae)
        }
    }

    sendGenerate9w = async (userId: string) => {
        const inline_key = [];
        inline_key.push([{ text: "💳 Wallet 1", callback_data: 'w1' }])
        inline_key.push([{ text: "Add more 9 wallets", callback_data: 'generate_new' }])
        inline_key.push([{ text: "Back", callback_data: 'to_start' }])
        const options = {
            reply_markup: {
                inline_keyboard: inline_key
            }
        };
        this.bot.sendMessage(userId, '👉 Init wallets', options);
    }

    sendNotification = (userId: string, msg: string) => {
        this.bot.sendMessage(userId, msg);
    }

    sendRoiMessage = (roi: number, userId: string) => {
        const inline_key = [];
        inline_key.push([{ text: "Sell All", callback_data: 'sell_all_snipe' }])
        const options = {
            reply_markup: {
                inline_keyboard: inline_key
            }
        };
        this.bot.sendMessage(userId, '🎯 Your sniper mode ROI is ' + Math.floor(roi * 1000) / 1000 + "(%).", options);
    }

    sendPnLMessage = async (userId: string, tr: any) => {

        const c_p = await this.tradeService.getPrice(tr.pairIndex);
        const s_p = tr.startprice;
        const fee = 0;
        const c_pr = Math.floor(((tr.size / s_p) * (c_p - s_p) - fee) * 100) / 100;

        const pr = PairsTrade.filter((pt) => pt.pairIdx == tr.pairIndex);
        const dt = pr[0]
        const pair = dt.asset + "/USD";

        const filePath = path.join(process.cwd(), './src/assets/images/tokens.jpg')

        const image = await Jimp.read(filePath);
        const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
        const font_2 = await Jimp.loadFont(Jimp.FONT_SANS_64_BLACK);
        image.print(font_2, 750, 420, "Profit: " + c_pr + "($)")
        image.print(font, 750, 520, "Pair: " + pair)
        image.print(font, 750, 570, "Leverage: " + tr.leverage)
        image.print(font, 750, 620, "Position Size: " + tr.size + "(DAI)")

        await image.writeAsync('./src/assets/temp/' + userId + '.jpg')
        const fileForTg = path.join(process.cwd(), './src/assets/temp/' + userId + '.jpg')
        const data = fs.readFileSync(fileForTg)
        await this.bot.sendPhoto(userId, data)
        await this.bot.sendMessage(userId,
            "<b>Your Position Closed:</b>\n<code>Pair: " + pair +
            "</code>\n<code>Leverage:" + tr.leverage +
            "</code>\n<code>Position Size: " + tr.size +
            "</code>\n<code>Profit: " + c_pr + "($)</code>",
            { parse_mode: "HTML" });

    }




    // this.bot.sendMessage(userId, 💡 'Please select an option:', options ❌ ✅ 📌 🏦 ℹ️ 📍  💳 ⛽️  🕐 🔗); 🎲 🏀 🌿 💬 🔔 📢 ✔️ ⭕ 🔱
    // ➰ ™️ ♻️ 💲 💱 〰️ 🔆 🔅 🌱 🌳 🌴 🌲🌼🌻🌺🌸🤸 🚴🧚🔥🚧
    // ⌛⏰💎🔋⌨️🖨️💿📗📙📒🏷️📝🔒🛡️🔗⚙️🥇🏆 🥈🥉🧩🎯

}
