import { Inject, OnModuleInit, forwardRef } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import { TG_TOKEN } from 'src/constant';
import { UserService } from 'src/user/user.service';
import { ethers } from 'ethers';
import { PairsArbitrum, PairsTrade, goplusApi, myName, tokenListForSwap, wethAddress } from 'src/abi/constants';
import { SwapService } from 'src/swap/swap.service';
import { standardABI } from 'src/abi/standard';
import { PlatformService } from 'src/platform/platform.service';
import { SnipeService } from 'src/snipe/snipe.service';
import { LimitService } from 'src/limit/limit.service';
import { MirrorService } from 'src/mirror/mirror.service';
import axios from 'axios';
import { uid } from 'uid';
import { TradeService } from 'src/trade/trade.service';
import { pid } from 'process';

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
    private user: string[] = []

    private lastMsg: number = 0;

    constructor(
        @Inject(forwardRef(() => UserService)) private userService: UserService,
        @Inject(forwardRef(() => SwapService)) private swapService: SwapService,
        @Inject(forwardRef(() => PlatformService)) private platformService: PlatformService,
        @Inject(forwardRef(() => SnipeService)) private snipeService: SnipeService,
        @Inject(forwardRef(() => LimitService)) private limitService: LimitService,
        @Inject(forwardRef(() => MirrorService)) private mirrorService: MirrorService,
        @Inject(forwardRef(() => TradeService)) private tradeService: TradeService,

    ) {
        this.bot = new TelegramBot(TG_TOKEN, { polling: true });
        this.bot.setMyCommands(Commands)
        this.bot.on("message", this.onReceiveMessage)
        this.bot.on('callback_query', this.onQueryMessage)

    }

    async onModuleInit() {
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





    onQueryMessage = async (query: any) => {
        try {
            const id = query.message.chat.id;
            const cmd = query.data;

            //https://t.me/bot898982342_bot?id=ghost

            // this.bot.deleteMessage(query.message.chat.id,  query.message.message_id)
            //     .then(()=>{ 
            //     })
            //     .catch((error)=>{ 
            //     }) 

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
                this.sendWalletSettingtOption(id);
            }

            // import key command 
            if (cmd == 'import_key') {
                const options = {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: '💳 Wallet 1', callback_data: 'import_w1' },
                                { text: '💳 Wallet 2', callback_data: 'import_w2' },
                            ],
                            [
                                { text: '💳 Wallet 3', callback_data: 'import_w3' },
                                { text: '💳 Wallet 4', callback_data: 'import_w4' },
                            ],
                            [
                                { text: '💳 Wallet 5', callback_data: 'import_w5' },
                                { text: '💳 Wallet 6', callback_data: 'import_w6' },
                            ],
                            [
                                { text: '💳 Wallet 7', callback_data: 'import_w7' },
                                { text: '💳 Wallet 8', callback_data: 'import_w8' },
                            ],
                            [
                                { text: '💳 Wallet 9', callback_data: 'import_w9' },
                                { text: '💳 Wallet 10', callback_data: 'import_w10' },
                            ],
                        ]
                    }
                };
                this.bot.sendMessage(id, '👉 Please select a wallet.', options);
            }

            // generate new 10 wallet command
            if (cmd == 'generate_new') {
                const wallets = [];
                for (var i = 0; i < 10; i++) {
                    const wallet = ethers.Wallet.createRandom();
                    const w = {
                        address: wallet.address,
                        key: wallet.privateKey
                    };
                    wallets.push(w);
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
                            w_msg = w_msg + "<b>Name: " + tn + ":</b>\n <i>Address: " + ta + "</i>\n<i>Balance: " + ba + " " + ts + "</i>\n\n";
                        })
                    } else {
                        w_msg = w_msg + "sorry, can't read data..."
                    }
                    await this.bot.sendMessage(id, w_msg, options);
                } else {
                    await this.bot.sendMessage(id, "<b>👷 Your wallet info is not set</b> \n\n", options);
                }
                await this.sendWalletListSelection(id)
            }

            // wallet delete
            if (cmd == 'w_delete') {
                await this.sendWalletListSelectionToDelete(id)
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
                await this.bot.sendMessage(id, "<b>👷 Your 💳wallet(" + v + ") info is deleted.</b> \n\n", { parse_mode: "HTML" });
                await this.sendWalletListSelectionToDelete(id)
            }

            // wallet mode single or multi
            if (cmd == 'w_multi') {
                this.sendMultiWalletSelection(id);
            }

            if (cmd == 'w_multi_yes') {
                await this.userService.update(id, { wmode: true });
                this.bot.sendMessage(id, "<b>You have selected the multi wallet mode.</b>", { parse_mode: "HTML" });
                this.sendWalletSettingtOption(id);
            }

            if (cmd == 'w_multi_not') {
                await this.userService.update(id, { wmode: false });
                this.bot.sendMessage(id, "<b>You will use only one(1st) wallet for transaction.</b>", { parse_mode: "HTML" });
                this.sendWalletSettingtOption(id);
            }

            // return snipe menu
            if (cmd == 's_snipe') {
                this.sendSnipeSettingOption(id);
            }

            // ----------------------------------

            

            if (cmd.includes("s_swap_")) {
                const mode = Number(cmd.substring(7, 8))
                const user = await this.userService.findOne(id);
                var swap = user.swap;
                swap.with = mode == 1 ? true : false;
                await this.userService.update(id, { swap });
                this.sendSwapSettingOption(id); 
            }

            // keep swap token to db
            for (var i = 0; i < tokenListForSwap.length; i++) {
                if (cmd == tokenListForSwap[i].name + "_sel") {
                    const user = await this.userService.findOne(id);
                    var swap = user.swap;
                    swap.token = tokenListForSwap[i].address;
                    await this.userService.update(id, { swap: swap });
                    await this.bot.sendMessage(id, "<b>✔ You selected " + tokenListForSwap[i].name + " to swap.</b> \n", { parse_mode: "HTML" });
                    this.sendSwapSettingOption(id)
                }

                if (cmd == tokenListForSwap[i].name + "_trns") {
                    const user = await this.userService.findOne(id);
                    var transfer = user.transfer;
                    transfer.token = tokenListForSwap[i].address;
                    await this.userService.update(id, { transfer: transfer });
                    await this.bot.sendMessage(id, "<b>✔ You selected " + tokenListForSwap[i].name + " to transfer.</b> \n", { parse_mode: "HTML" });
                    this.sendTransferSettingOption(id)
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
            }

            // swap mode selection
            if (cmd == 'swap_d_1' || cmd == 'swap_d_2') {
                const user = await this.userService.findOne(id);
                var swap = user.swap;
                swap.with = cmd == 'swap_d_1' ? true : false;
                await this.userService.update(id, { swap: swap });
                await this.bot.sendMessage(id, "<b>✔Ok, you selected the swap mode.</b> \n", { parse_mode: "HTML" });
                await this.sendSwapSettingOption(id);
            }

            if (cmd.includes('swap_wallet_')) {
                const w = cmd.substring(12, 14)
                const user = await this.userService.findOne(id);
                var swap = user.swap;
                swap.wallet = w * 1 - 1;
                await this.userService.update(id, { swap: swap });
                await this.bot.sendMessage(id, "<b>✔ Wallet 💳(" + w + ") is selected successfully.</b> \n", { parse_mode: "HTML" });
                await this.sendSwapSettingOption(id);
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
                    const options = {
                        reply_markup: {
                            force_reply: true
                        },
                        parse_mode: "HTML"
                    };
                    await this.bot.sendMessage(id, "<b>Please input your amount to swap</b>", { parse_mode: "HTML" });
                    await this.bot.sendMessage(id, "<b>Swap Token Amount</b>", options);
                    return;
                }
                const user = await this.userService.findOne(id);
                var swap = user.swap;
                swap.amount = amount;
                await this.userService.update(id, { swap: swap });
                await this.bot.sendMessage(id, "<b>✔ Swap amount is set successfully.</b>", { parse_mode: "HTML" });
                await this.sendSwapSettingOption(id)
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
                    res = await this.swapService.swapToken(token, wethAddress, Number(swap.amount), gas, slippage, wallet, "swap", id, user.panel, pv)
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
            }

            if (cmd == "s_perps") {
                await this.sendPerpsSettingOption(id)
            }

            if (cmd == 's_referrals') {
                const user = await this.userService.findOne(id);
                const code = user.code;
                const referr_len = user.referral.length;
                await this.bot.sendMessage(id, "<b>Your referral link : </b><code>" + myName + "?start=_" + code + "</code>\n<b>Referral Users : " + referr_len + "</b>", { parse_mode: "HTML" });
                this.sendStartSelectOption(id);
            }

            if (cmd == 'perps_pair') {
                this.sendTradePairSettingOption(id)
            }

            if (cmd == 'perps_positions') {
                await this.sendMyPositionList(id);
            }

            if (cmd.includes('perps_pair_')) {
                const pair_idx = Number(cmd.substring(11, 14));
                const user = await this.userService.findOne(id);
                var perps = user.perps;
                perps.pairidx = pair_idx;
                await this.userService.update(id, { perps });
                await this.bot.sendMessage(id, "<b>✔Pair is set successfully.</b>", { parse_mode: "HTML" });
                await this.sendPerpsSettingOption(id);
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
                await this.bot.sendMessage(id, "⌛ loading...")
                const res = await this.tradeService.openTrade(perps.pairidx, perps.leverage, perps.slippage, perps.stoploss, perps.profit, perps.size, perps.longshort, user.wallet[0].key, id, 0);
                if (res) {
                    await this.userService.update(id, { perps });
                    await this.bot.sendMessage(id, perps.autotrade ? "<b>✔Perps is opened.</b>" : "<b>✔Perps is closed.</b>", { parse_mode: "HTML" });
                }
                await this.sendPerpsSettingOption(id);
            }

            if (cmd == 'perps_longshort') {
                const user = await this.userService.findOne(id);
                var perps = user.perps;
                perps.longshort = !perps.longshort;
                await this.userService.update(id, { perps });
                await this.bot.sendMessage(id, perps.longshort ? "<b>✔Buy mode is set.</b>" : "<b>✔Sell mode is set.</b>", { parse_mode: "HTML" });
                await this.sendPerpsSettingOption(id);
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
            }

            if (cmd.includes('trns_wallet_')) {
                const w = cmd.substring(12, 14)
                const user = await this.userService.findOne(id);
                var transfer = user.transfer;
                transfer.wallet = w * 1 - 1;
                await this.userService.update(id, { transfer: transfer });
                await this.bot.sendMessage(id, "<b>✔ Wallet 💳(" + w + ") is selected successfully.</b> \n", { parse_mode: "HTML" });
                await this.sendTransferSettingOption(id);
            }

            if (cmd.includes('perps_wallet_')) {
                const w = Number(cmd.substring(13, 15))
                const user = await this.userService.findOne(id);
                var perps = user.perps;
                perps.wallet = w * 1 - 1;
                await this.userService.update(id, { perps: perps });
                await this.bot.sendMessage(id, "<b>✔ Wallet 💳(" + w + ") is selected successfully.</b> \n", { parse_mode: "HTML" });
                await this.sendPerpsSettingOption(id);
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
                const res = await this.swapService.transferTo(token, to, amount, pk, id, user.panel, 'direct');
            }

            // ---------------------------------------

            // return mirror menu
            if (cmd == 's_mirror') {
                this.sendMirrorSettingOption(id)
            }

            if (cmd.includes('m_wallet_')) {
                const v = cmd.substring(9, 11);
                const user = await this.userService.findOne(id);
                var other = user.other;
                other.mirror = v * 1 - 1;
                await this.userService.update(id, { other: other })
                await this.sendMirrorSettingOption(id)
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
                this.sendLimitSettingOption(id)
            }

            if (cmd.includes('l_limit_')) {
                const v = cmd.substring(8, 9)
                const user = await this.userService.findOne(id);
                var other = user.other;
                other.limit = v * 1 - 1;
                await this.userService.update(id, { other: other })
                await this.bot.sendMessage(id, "<b>✔ You selected the limit option " + v + "</b>", { parse_mode: "HTML" });
                await this.sendLimitSettingOption(id)
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
                var sniper = user.sniper;
                const network = cmd == 'sel_bsc' ? 'BSC' : 'ETH';
                sniper.network = network;
                await this.userService.update(id, { sniper: sniper });
                await this.bot.sendMessage(id, "<b>✔ Network set as " + network + ".</b> \n", { parse_mode: "HTML" });
                this.sendSnipeSettingOption(id);
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
                const v = cmd.substring(11, 13);
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
                        amount = '2.0'
                    } else {
                        amount = '0.1';
                    }
                    const user = await this.userService.findOne(id);
                    var sniper = user.sniper;
                    sniper.buyamount = amount;
                    await this.userService.update(id, { sniper: sniper });
                    await this.bot.sendMessage(id, "<b>✔ Buy amount is set successfully.</b> \n", { parse_mode: "HTML" });
                    this.sendSnipeSettingOption(id);
                }
            }

            //select wallet to buy token in snipe mode
            if (cmd == 'sel_wallet') {
                const user = await this.userService.findOne(id);
                const multi = user.sniper.multi;
                if (multi) {
                    await this.bot.sendMessage(id, "<b>You are using multi wallets option for snipe mode.</b>", { parse_mode: "HTML" });
                    this.sendSnipeSettingOption(id);
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
                await this.bot.sendMessage(id, "<b>Please type gas price, minimum is 3 gwei. 1 gwei = 10^9 wei</b>", { parse_mode: "HTML" });
                await this.bot.sendMessage(id, "<b>Set Gas Price</b>", options);
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
                var sniper = user.sniper;
                sniper.autobuy = !sniper.autobuy;
                await this.userService.update(id, { sniper: sniper });
                if (sniper.autobuy) {
                    await this.bot.sendMessage(id, "<b>✔ Snipe mode is started.</b> \n", { parse_mode: "HTML" });
                } else {
                    await this.bot.sendMessage(id, "<b>✔ Snipe mode is stopped.</b> \n", { parse_mode: "HTML" });
                }
                this.sendSnipeSettingOption(id);
            }

            // set private
            if (cmd == 'snipe_private') {
                const user = await this.userService.findOne(id);
                var sniper = user.sniper;
                sniper.private = !sniper.private;
                await this.userService.update(id, { sniper: sniper });
                if (sniper.private) {
                    await this.bot.sendMessage(id, "<b>✔ Private mode is started.</b> \n", { parse_mode: "HTML" });
                } else {
                    await this.bot.sendMessage(id, "<b>✔ Private mode is stopped.</b> \n", { parse_mode: "HTML" });
                }
                this.sendSnipeSettingOption(id);
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
            }

            //set multi
            if (cmd == 'sel_multi') {
                const user = await this.userService.findOne(id);
                var sniper = user.sniper;
                sniper.multi = !sniper.multi;
                await this.userService.update(id, { sniper: sniper });
                if (sniper.multi) {
                    await this.bot.sendMessage(id, "<b>✔ You set multi wallets option for snipe mode.</b> \n", { parse_mode: "HTML" });
                } else {
                    await this.bot.sendMessage(id, "<b>✔ You set single wallet option for snipe mode</b> \n", { parse_mode: "HTML" });
                }
                this.sendSnipeSettingOption(id);
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
                var sniper = user.sniper;
                sniper.autosell = !sniper.autosell;
                sniper.sold = false;
                await this.userService.update(id, { sniper: sniper });
                if (sniper.autosell) {
                    await this.bot.sendMessage(id, "<b>✔ You enabled the auto-sell option.</b> \n", { parse_mode: "HTML" });
                } else {
                    await this.bot.sendMessage(id, "<b>✔ You disabled the auto-sell option.</b> \n", { parse_mode: "HTML" });
                }
                this.sendSnipeSettingOption(id);
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
                this.sendStartSelectOption(id)
            }

            if (cmd == "to_perps") {
                this.sendPerpsSettingOption(id)
            }

            if (cmd.includes("pos_close_")) {
                const pid = cmd.substring(10, 34)
                await this.sendOnePosition(id, pid)
            }

            if (cmd.includes("pes_close_")) {
                const pid = cmd.substring(10, 34);
                const pes = await this.tradeService.getTraderOne(pid);
                const user = await this.userService.findOne(id);
                const res = await this.tradeService.closeTrade(pes.pairIndex, pes.index, user.wallet[user.perps.wallet].address, pid, id, 0);
                await this.sendTradePairSettingOption(id)
            }

        } catch (error) {
            console.log(">>>Error")
        }
    }

    onReceiveMessage = async (msg: any) => {
        try {
            const message = msg.text;
            const userid = msg.from.id
            const reply_msg = msg.reply_to_message?.text;

            // this.bot.deleteMessage(msg.chat.id, msg.message_id)
            //     .then(() => {
            //     })
            //     .catch((error) => {
            //     })

            // if there is a new user, we need to record it on DB and reply
            if (!this.user.includes(userid)) {
                var user_tmp = this.user;
                user_tmp.push(userid);
                this.user = user_tmp;
                const username = msg.from.username;
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
                    slippage: "0",
                    smartslip: false,
                    wallet: 0,
                    result: "",
                    multi: false,
                    blockwait: 0,
                    startprice: 10000,
                    sellrate: 1000,
                    autosell: false,
                    sold: false,
                    private: false
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
                    wallet: 0
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
                    sniper,
                    swap,
                    transfer,
                    mirror: m_tmp,
                    limits: l_tmp,
                    perps,
                    wmode: true,
                    txamount: 0,
                    referral: [],
                    code: uid(),
                    detail: "",
                    other: {
                        mirror: 0,
                        limit: 0
                    },
                }
                await this.userService.create(new_user);
            }

            if (message.includes('/start _')) {
                const user = await this.userService.findOne(userid)
                const u_code = user.code;
                const code = message.substring(8, 19)
                await this.userService.updateReferral(code, u_code)
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
                        this.bot.sendMessage(userid, "<b>🔊 Please enter the vaild private key.</b>", options);
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
                    var sniper = user.sniper;
                    sniper.contract = message;
                    sniper.startprice = 10000;
                    sniper.sold = false;
                    await this.userService.update(userid, { sniper: sniper });
                    await this.bot.sendMessage(userid, "<b>✔ Token contract is set successfully.</b> \n", { parse_mode: "HTML" });

                    const platform = await this.platformService.findOne('snipe')
                    var contracts = platform.contracts;
                    if (!contracts.includes(message)) {
                        contracts.push(message);
                        await this.platformService.update(platform.id, { contracts });

                        // need to call for watch the new contract address 
                        this.snipeService.updateWatchList(message, 'add');
                    }

                    await this.bot.sendMessage(userid, "<b>⌛ loading token detail...</b> \n", { parse_mode: "HTML" });
                    //call the additional api to get some data and return for user.
                    const res = await axios.get(goplusApi + message);
                    const token_info = res.data.result[message];
                    const decimal = await this.swapService.getDecimal(message);
                    const display_info = `
                        <b>Token Info</b>
                        <i>Name : ` + token_info.token_name + `</i>
                        <i>Symbol : ` + token_info.token_symbol + `</i>         
                        <i>Decimal : ` + decimal.toString() + `</i>
                        <i>Supply : ` + token_info.total_supply + `</i>         
                        <i>Owner : ` + token_info.owner_address + `</i>
                        <i>LP Pair : ` + token_info.is_honeypot + `</i> 
                        <i>Is Honeypot : ` + token_info.is_honeypot + `</i>
                        <i>Buy Tax : ` + token_info.buy_tax + `</i>
                        <i>Sell Tax : ` + token_info.sell_tax + `</i>
                        <i>Transfer Fee : ` + token_info.is_honeypot + `</i>
                        <i>Max Wallet : ` + token_info.owner_address + `</i>
                        <i>Max Wallet Percent : ` + token_info.owner_percent + `</i>\n                        
                    `;
                    await this.bot.sendMessage(userid, display_info, { parse_mode: "HTML" });
                    this.sendSnipeSettingOption(userid);

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
                var sniper = user.sniper;
                sniper.buyamount = message;
                await this.userService.update(userid, { sniper: sniper });
                await this.bot.sendMessage(userid, "<b>✔ Buy amount is set successfully.</b> \n", { parse_mode: "HTML" });
                this.sendSnipeSettingOption(userid);
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
                    var sniper = user.sniper;
                    sniper.wallet = message * 1 - 1;
                    await this.userService.update(userid, { sniper: sniper });
                    await this.bot.sendMessage(userid, "<b>✔ Wallet is selected successfully.</b> \n", { parse_mode: "HTML" });
                    this.sendSnipeSettingOption(userid);
                }
            }

            if (reply_msg == "Set Gas Price") {
                if (message < 3) {
                    await this.bot.sendMessage(userid, "<b>❌ Minimum is 3, type bigger value than 3</b> \n", { parse_mode: "HTML" });
                    this.sendSnipeSettingOption(userid);
                    return;
                }
                const user = await this.userService.findOne(userid);
                var sniper = user.sniper;
                sniper.gasprice = Math.floor(message * 1).toString();
                await this.userService.update(userid, { sniper: sniper });
                await this.bot.sendMessage(userid, "<b>✔ Gas Price is set successfully.</b> \n", { parse_mode: "HTML" });
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
                    var sniper = user.sniper;
                    sniper.blockwait = message;
                    await this.userService.update(userid, { sniper });
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
                var sniper = user.sniper;
                sniper.slippage = message;
                await this.userService.update(userid, { sniper: sniper });
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
                var sniper = user.sniper;
                sniper.sellrate = message;
                await this.userService.update(userid, { sniper: sniper });
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
                        { text: 'Generate New', callback_data: 'generate_new' },
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
                        { text: 'Snipe new tokens launch', callback_data: 's_snipe' },
                        // { text: 'Swap tokens', callback_data: 's_swap' }
                    ],
                    [
                        { text: 'Buy Tokens', callback_data: 's_swap_1' },
                        { text: 'Sell tokens', callback_data: 's_swap_2' }
                    ],
                    [
                        { text: 'Mirror sniper', callback_data: 's_mirror' },
                        { text: 'Limit buy order', callback_data: 's_limit' }
                    ],
                    [
                        { text: 'Transfer', callback_data: 's_transfer' },
                        { text: 'Long/Short Perps', callback_data: 's_perps' },
                    ],
                    [
                        { text: 'My referrals', callback_data: 's_referrals' },
                        { text: 'Wallet', callback_data: 'add_wallet' },
                    ],
                ]
            }
        };
        this.bot.sendMessage(userId, '👉 Please specify for every settings', options);
    }

    // snipe setting panel
    sendSnipeSettingOption = async (userId: string) => {
        try {
            const user = await this.userService.findOne(userId);
            var sniper = user?.sniper;
            const amount = sniper?.buyamount;
            const options = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: sniper?.contract != "" ? '✅ Token Address' : 'Token Address', callback_data: 'sel_token' },
                        ],
                        [
                            { text: sniper?.contract == "" ? "Token address is not set" : sniper.contract, callback_data: 'token_address' },
                        ],
                        [
                            { text: "Buy Amount", callback_data: 'sel_a_list' },
                        ],
                        [
                            { text: amount == '0.1' ? '✅ 0.1 ETH' : '0.1 ETH', callback_data: 'sel_amount_01' },
                            { text: amount == '0.5' ? '✅ 0.5 ETH' : '0.5 ETH', callback_data: 'sel_amount_05' },
                            { text: amount == '1.0' ? '✅ 1.0 ETH' : '1.0 ETH', callback_data: 'sel_amount_10' },
                        ],
                        [
                            { text: amount == '2.0' ? '✅ 2.0 ETH' : '2.0 ETH', callback_data: 'sel_amount_20' },
                            {
                                text:
                                    (amount != '0.1' && amount != '0.5' && amount != '1.0' && amount != '2.0' && amount != '0') ? '✅ Custom : ' + amount + ' ETH' : 'Custom:-',
                                callback_data: 'sel_amount_00'
                            },
                        ],
                        [

                            { text: '🔥 Gas Price (' + sniper?.gasprice + ' gwei)', callback_data: 'sel_gas' },
                            { text: '🚧 Slippage (' + sniper?.slippage + ' %)', callback_data: 'sel_slip' }
                        ],
                        [
                            { text: sniper?.multi ? '💳 Wallets(All)' : '💳 Wallet ' + (sniper.wallet * 1 + 1), callback_data: 'sel_wallet' },
                            { text: sniper?.multi ? "Use Single Wallet (💳)" : "Use All Wallets (💳💳💳)", callback_data: 'sel_multi' },
                        ],
                        [
                            { text: "⏰ Block Wait: " + sniper?.blockwait, callback_data: 'sel_blockwait' },
                            { text: sniper.private ? "📝 Private Stop" : "📝 Private Start", callback_data: 'snipe_private' }
                        ],
                        [
                            { text: sniper?.autobuy ? "❌ Stop Auto Buy" : "✅ Start Auto Buy", callback_data: 'sel_autobuy' },
                        ],
                        [

                            { text: 'Sell Gain(' + sniper?.sellrate + ' %)', callback_data: 'sel_sellgain' },
                            { text: sniper?.autosell ? '❌ Stop Auto Sell' : '✅ Start Auto Sell', callback_data: 'sel_sellauto' }
                        ],
                        [
                            { text: 'Back', callback_data: 'to_start' }
                        ],
                    ]
                }
            };
            this.bot.sendMessage(userId, '👉 Please select the options for snipe:', options);
        } catch (e) {
            console.log(">>err")
        }
    }

    // swap tokens select menu
    sendSwapSettingOption = async (userId: string) => {
        const user = await this.userService.findOne(userId);
        const amount = user.swap.amount;
        const t = user.swap.token;

        const inline_key = [];
        var tmp = [];
        for (var i = 0; i < tokenListForSwap.length; i++) {
            tmp.push({ text: t == tokenListForSwap[i].address ? "✅ " + tokenListForSwap[i].name : tokenListForSwap[i].name, callback_data: tokenListForSwap[i].name + "_sel" });
            if (i % 5 == 4) {
                inline_key.push(tmp);
                var tmp = [];
            }
        }
        if ((tokenListForSwap.length - 1) % 5 != 4) {
            inline_key.push(tmp);
        }
        inline_key.push([{ text: "Use custom token", callback_data: "custom_token_sel" }]);
        inline_key.push([{ text: user.swap.with ?"Buy Amount":"Sell Amount", callback_data: 'sel_a_list' }])
        inline_key.push([
            { text: amount == '0.1' ? '✅ 0.1 ETH' : '0.1 ETH', callback_data: 'swap_amount_01' },
            { text: amount == '0.5' ? '✅ 0.5 ETH' : '0.5 ETH', callback_data: 'swap_amount_05' },
            { text: amount == '1.0' ? '✅ 1.0 ETH' : '1.0 ETH', callback_data: 'swap_amount_10' },
        ])
        inline_key.push([
            { text: amount == '2.0' ? '✅ 2.0 ETH' : '2.0 ETH', callback_data: 'swap_amount_20' },
            {
                text:
                    (amount != '0.1' && amount != '0.5' && amount != '1.0' && amount != '2.0' && amount != '0') ? '✅ Custom : ' + amount + ' ETH' : 'Custom:-',
                callback_data: 'swap_amount_00'
            },
        ])
        inline_key.push([
            { text: '🔥 Gas Price (' + user.swap.gasprice + ' gwei)', callback_data: 'swap_gas' },
            { text: '🚧 Slippage (' + user.swap.slippage + ' %)', callback_data: 'swap_slip' }
        ])
        // inline_key.push([
        //     { text: user.swap.with ? '✅ Buy Token' : 'Buy Token', callback_data: 'swap_d_1' },
        //     { text: user.swap.with ? 'Sell Token' : '✅ Sell Token', callback_data: 'swap_d_2' }
        // ])
        inline_key.push([{ text: "Select Wallet", callback_data: 'sel_a_list' }])

        const w = user.swap.wallet + 1;
        var tmp = [];
        for (var i = 1; i <= 10; i++) {
            tmp.push({ text: w == i ? "✅ Wallet " + i : "Wallet " + i, callback_data: "swap_wallet_" + i });
            if (i % 5 == 0) {
                inline_key.push(tmp);
                tmp = [];
            }
        }
        inline_key.push([
            { text: user.swap.private ? '📝 Private Stop' : '📝 Private Start', callback_data: 'swap_private' }
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
            { text: limit.private ? "📝 Private Stop" : "📝 Private Start", callback_data: 'limit_private' }
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
        inline_key.push([{ text: "Buy Amount", callback_data: 'sel_a_list' }])
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
        inline_key.push([{ text: mirror.private ? '📝 Private Stop' : '📝 Private Start', callback_data: 'mirror_private' }])
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
            { text: "Transfer Amount", callback_data: 'trns_amounts' },
            { text: tr.private ? "📝 Private Stop" : "📝 Private Start", callback_data: 'transfer_private' },
        ])
        inline_key.push([
            { text: amount == '0.1' ? '✅ 0.1 ETH' : '0.1 ETH', callback_data: 'trns_amount_01' },
            { text: amount == '0.5' ? '✅ 0.5 ETH' : '0.5 ETH', callback_data: 'trns_amount_05' },
            { text: amount == '1.0' ? '✅ 1.0 ETH' : '1.0 ETH', callback_data: 'trns_amount_10' },
        ])
        inline_key.push([
            { text: amount == '2.0' ? '✅ 2.0 ETH' : '2.0 ETH', callback_data: 'trns_amount_20' },
            {
                text:
                    (amount != '0.1' && amount != '0.5' && amount != '1.0' && amount != '2.0' && amount != '0') ? '✅ Custom : ' + amount + ' ETH' : 'Custom:-',
                callback_data: 'trns_amount_00'
            },
        ])
        inline_key.push([{ text: receiver != "" ? "Receiver : " + receiver : "Add Receiver", callback_data: 'trns_receiver' }])
        inline_key.push([{ text: "Select Wallet", callback_data: 'trns_a_list' }])

        const w = user.transfer.wallet + 1;
        var tmp = [];
        for (var i = 1; i <= 10; i++) {
            tmp.push({ text: w == i ? "✅ Wallet " + i : "Wallet " + i, callback_data: "trns_wallet_" + i });
            if (i % 5 == 0) {
                inline_key.push(tmp);
                tmp = [];
            }
        }
        inline_key.push([
            { text: 'Transfer Now', callback_data: 'trns_now' },
            { text: 'Cancel', callback_data: 'trns_cancel' }
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
        const inline_key = [];
        inline_key.push([
            { text: 'Selected Pair : ' + pair + "/USD, (select other)", callback_data: 'perps_pair' }
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
        var tmps = [];
        for (var j = 1; j <= 10; j++) {
            tmps.push({ text: w == j ? "✅ Wallet " + j : "Wallet " + j, callback_data: "perps_wallet_" + j });
            if (j % 5 == 0) {
                inline_key.push(tmps);
                tmps = [];
            }
        }
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
        console.log(">>>list", list)
        const inline_key = [];
        var tmp = [];
        for (var i = 0; i < list.length; i++) {
            const ls = list[i];
            const pi = ls.pairIndex;
            const md = ls.longshort ? "Long Mode" : "Short Mode";
            const ts = PairsTrade[pi].asset + "/USD, " + md + ", Leverage: " + ls.leverage + "(%), " + ls.size + "($) ❌";
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
        console.log(">>>>DDD", p)
        const pair = PairsTrade[pi].asset + "/USD";
        const mode = p.longshort ? "Long mode" : "Short mode";

        await this.bot.sendMessage(userId, "<b>Your Position Detail:</b>\n<code>Pair: " + pair + "</code>\n<code>Leverage:" + p.leverage + "</code>\n<code>Position Size: " + p.size + " (DAI)</code>\n<code>Profit: " + p.profit + "</code>\n<code>Mode: " + mode + "</code>\n<code>Stoploss: " + p.stoploss + "</code>", { parse_mode: "HTML" });
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
    sendWalletListSelection = async (userId: number) => {
        const inline_key = [];
        var tmp = []
        for (var i = 1; i <= 10; i++) {
            tmp.push({ text: "💳 Wallet" + i, callback_data: "v_wallet_" + i });
            if (i % 4 == 0) {
                inline_key.push(tmp);
                tmp = [];
            }
            if (i == 10) {
                inline_key.push(tmp)
                tmp = []
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

    sendWalletListSelectionToDelete = async (userId: number) => {
        const inline_key = [];
        var tmp = []
        for (var i = 1; i <= 10; i++) {
            tmp.push({ text: "💳 Wallet" + i, callback_data: "r_wallet_" + i });
            if (i % 4 == 0) {
                inline_key.push(tmp);
                tmp = [];
            }
            if (i == 10) {
                inline_key.push(tmp)
                tmp = []
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





    // this.bot.sendMessage(userId, 💡 'Please select an option:', options ❌ ✅ 📌 🏦 ℹ️ 📍  💳 ⛽️  🕐 🔗); 🎲 🏀 🌿 💬 🔔 📢 ✔️ ⭕ 🔱
    // ➰ ™️ ♻️ 💲 💱 〰️ 🔆 🔅 🌱 🌳 🌴 🌲🌼🌻🌺🌸🤸 🚴🧚🔥🚧
    // ⌛⏰💎🔋⌨️🖨️💿📗📙📒🏷️📝🔒🛡️🔗⚙️🥇🏆 🥈🥉🧩🎯

}
