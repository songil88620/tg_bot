import { Inject, OnModuleInit, forwardRef } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import { TG_TOKEN } from 'src/constant';
import { UserService } from 'src/user/user.service';
import { ethers } from 'ethers';
import { tokenListForSwap, wethAddress } from 'src/abi/constants';
import { SwapService } from 'src/swap/swap.service';
import { standardABI } from 'src/abi/standard';
import { PlatformService } from 'src/platform/platform.service';
import { SnipeService } from 'src/snipe/snipe.service';
import { LimitService } from 'src/limit/limit.service';
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
    private user: number[] = []

    private lastMsg: number = 0;

    constructor(
        @Inject(forwardRef(() => UserService)) private userService: UserService,
        @Inject(forwardRef(() => SwapService)) private swapService: SwapService,
        @Inject(forwardRef(() => PlatformService)) private platformService: PlatformService,
        @Inject(forwardRef(() => SnipeService)) private snipeService: SnipeService,
        @Inject(forwardRef(() => LimitService)) private limitService: LimitService
    ) {
        this.bot = new TelegramBot(TG_TOKEN, { polling: true });
        this.bot.setMyCommands(Commands)

        this.bot.on("message", this.onReceiveMessage)

        // this.bot.on('callback_query', (query) => {
        //     const chatId = query.message.chat.id;
        //     console.log(">>cid", chatId)
        //     const buttonPressed = query.data;  
        // });

        this.bot.on('callback_query', this.onQueryMessage)

    }

    async onModuleInit() {
        //this.provider = new EtherscanProvider("homestead", 'F6DXNJTHGNNY9GA1PDA5A7PNH11HGY8BHP')
        this.provider = this.swapService.provider;

        const users = await this.userService.findAll()
        users.forEach((u) => {
            const id = u.id;
            var user_tmp = [];
            user_tmp.push(id);
            this.user = user_tmp;
        })
    }

    onQueryMessage = async (query: any) => {
        try {
            const id = query.message.chat.id;
            const cmd = query.data;

            // this.bot.deleteMessage(query.message.chat.id,  query.message.message_id)
            //     .then(()=>{ 
            //     })
            //     .catch((error)=>{ 
            //     }) 

            // select and import private key
            for (var i = 1; i <= 10; i++) {
                if (cmd == 'import_w' + i) {
                    const options = {
                        reply_markup: {
                            force_reply: true
                        },
                        parse_mode: "HTML"
                    };
                    this.bot.sendMessage(id, "<b>Please type your private key.</b>", { parse_mode: "HTML" });
                    this.bot.sendMessage(id, "<b>Import Wallet" + i + "</b>", options);
                }
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

            // wallet detail
            if (cmd == 'w_detail') {
                const user = await this.userService.findOne(id);
                const wmode = user.wmode;
                const wallet = user.wallet;
                if (wmode) {
                    const options = {
                        reply_markup: {
                            force_reply: true
                        },
                        parse_mode: "HTML"
                    };
                    await this.bot.sendMessage(id, "<b>Please type wallet index to check detail(1~10).</b>", { parse_mode: "HTML" });
                    await this.bot.sendMessage(id, "<b>Choose Wallet For Detail</b>", options);
                } else {
                    const options = {
                        parse_mode: "HTML"
                    };
                    const address = wallet[0].address;
                    const key = wallet[0].key;
                    if (address != "") {
                        this.bot.sendMessage(id, "<b>loading...</b>", { parse_mode: "HTML" });
                        const balance = await this.swapService.getBalanceOfWallet(address);
                        var w_msg = "<b>💳 Wallet 1</b> \n <b>Address:</b> <code>" + address + "</code>\n  <b>Key:</b> <code>" + key + "</code>\n<b>Balance:</b> <code>" + balance + " ETH</code>\n\n";
                        this.bot.sendMessage(id, "<b>👷 Your wallet info:</b> \n\n" + w_msg, options);
                    } else {
                        this.bot.sendMessage(id, "<b>👷 Your wallet info is not set</b> \n\n", options);
                    }
                }
            }

            // wallet delete
            if (cmd == 'w_delete') {
                const user = await this.userService.findOne(id);
                const wmode = user.wmode;
                const wallet = user.wallet;
                if (wmode) {
                    const options = {
                        reply_markup: {
                            force_reply: true
                        },
                        parse_mode: "HTML"
                    };
                    await this.bot.sendMessage(id, "<b>Please type wallet index to delete(1~10).</b>", { parse_mode: "HTML" });
                    await this.bot.sendMessage(id, "<b>Choose Wallet For Delete</b>", options);
                } else {
                    wallet[0] = {
                        address: "",
                        key: ""
                    }
                    await this.userService.update(id, { wallet })
                    this.bot.sendMessage(id, "<b>👷 Your 💳wallet 1 info is deleted.</b> \n\n", { parse_mode: "HTML" });
                }

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

            // return token list menu
            if (cmd == 's_swap') {
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
                    this.sendSwapDirectionOption(id);
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

            // swap mode selection
            if (cmd == 'swap_d_1' || cmd == 'swap_d_2') {
                const user = await this.userService.findOne(id);
                var swap = user.swap;
                swap.with = cmd == 'swap_d_1' ? true : false;
                await this.userService.update(id, { swap: swap });
                await this.bot.sendMessage(id, "<b>✔Ok, you selected the swap mode.</b> \n", { parse_mode: "HTML" });
                const options = {
                    reply_markup: {
                        force_reply: true
                    },
                    parse_mode: "HTML"
                };
                await this.bot.sendMessage(id, "<b>Please type wallet index to use(1~10).</b>", { parse_mode: "HTML" });
                await this.bot.sendMessage(id, "<b>Choose Wallet</b>", options);
            }

            //swap now
            if (cmd == "swap_now") {
                console.log(">>>swap process..")
                await this.bot.sendMessage(id, "<b>Swap processing...</b>", { parse_mode: "HTML" });
                const user = await this.userService.findOne(id);
                const swap = user.swap;
                const token = swap.token;
                const wallet = user.wallet[swap.wallet].key;
                const gas = Number(swap.gasprice) * 1;
                const slippage = Number(swap.slippage) * 1;
                var res = { status: false, msg: '' }
                if (swap.with) {
                    res = await this.swapService.swapToken(wethAddress, token, Number(swap.amount), gas, slippage, wallet, "swap", id)
                } else {
                    res = await this.swapService.swapToken(token, wethAddress, Number(swap.amount), gas, slippage, wallet, "swap", id)
                }
                if (res.status) {
                    await this.bot.sendMessage(id, "<b>" + res.msg + "</b>", { parse_mode: "HTML" });
                } else {
                    await this.bot.sendMessage(id, "<b>" + res.msg + "</b>", { parse_mode: "HTML" });
                }
            }

            // ---------------------------------------

            // return mirror menu
            if (cmd == 's_mirror') {
                this.sendMirrorSettingOption(id)
            }

            // select and import mirror wallet
            for (var i = 1; i <= 10; i++) {
                if (cmd == 'm_wallet_' + i) {
                    const options = {
                        reply_markup: {
                            force_reply: true
                        },
                        parse_mode: "HTML"
                    };
                    this.bot.sendMessage(id, "<b>Please input wallet address to mirror.</b>", { parse_mode: "HTML" });
                    this.bot.sendMessage(id, "<b>Mirror Wallet" + i + "</b>", options);
                }
            }


            // ---------------------------------------

            // return limit menu
            if (cmd == 's_limit') {
                // this.sendLimitSettingOption(id)
                const options = {
                    reply_markup: {
                        force_reply: true
                    },
                    parse_mode: "HTML"
                };
                this.bot.sendMessage(id, "<b>Please input token address to limit buy order.</b>", { parse_mode: "HTML" });
                this.bot.sendMessage(id, "<b>Limit Buy Token</b>", options);
            }

            for (var i = 0; i < tokenListForSwap.length; i++) {
                if (cmd == tokenListForSwap[i].name + "_limit") {
                    // temp is for saving temporary data
                    await this.userService.update(id, { tmp: tokenListForSwap[i].name });
                    await this.bot.sendMessage(id, "<b>✔ You selected " + tokenListForSwap[i].name + " to limit buy order.</b> \n", { parse_mode: "HTML" });
                    const options = {
                        reply_markup: {
                            force_reply: true
                        },
                        parse_mode: "HTML"
                    };
                    await this.bot.sendMessage(id, "<b>Please type wallet index to use(1~10).</b>", { parse_mode: "HTML" });
                    await this.bot.sendMessage(id, "<b>Select Wallet to Buy</b>", options);
                    // await this.bot.sendMessage(id, "<b>Please input token price to limit buy order</b>", { parse_mode: "HTML" });
                    // await this.bot.sendMessage(id, "<b>Limit Price</b>", options);
                }
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
            if (cmd == 'sel_amount') {
                const options = {
                    reply_markup: {
                        force_reply: true
                    },
                    parse_mode: "HTML"
                };
                await this.bot.sendMessage(id, "<b>Please type token amount to buy.</b>", { parse_mode: "HTML" });
                await this.bot.sendMessage(id, "<b>Set Amount</b>", options);
            }

            //select wallet to buy token in snipe mode
            if (cmd == 'sel_wallet') {
                const user = await this.userService.findOne(id);
                const multi = user.sniper.multi;
                if (multi) {
                    await this.bot.sendMessage(id, "<b>You are using multi wallets mode for snipe.</b>", { parse_mode: "HTML" });
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



            //set token to swap
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
                    gasprice: "3",
                    slippage: "0",
                    smartslip: false,
                    wallet: 0,
                    result: "",
                    multi: false,
                }
                const swap = {
                    token: "",
                    amount: "",
                    gasprice: "",
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
                await this.userService.create(new_user);
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
                    await this.userService.update(userid, { sniper: sniper });
                    await this.bot.sendMessage(userid, "<b>✔ Token contract is set successfully.</b> \n", { parse_mode: "HTML" });

                    const platform = await this.platformService.findOne('snipe')
                    var contracts = platform.contracts;
                    if (!contracts.includes(message)) {
                        contracts.push(message);
                        await this.platformService.update(platform.id, { contracts });

                        // need to call for watch the new contract address
                        this.snipeService.watchContract(message);
                    }

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

            if (reply_msg == "Choose Wallet For Detail") {
                if (message * 1 < 1 || message * 1 > 10) {
                    const options = {
                        reply_markup: {
                            force_reply: true
                        },
                        parse_mode: "HTML"
                    };
                    await this.bot.sendMessage(userid, "<b>Wrong index, please type wallet index between 1 and 10 to use.</b>", { parse_mode: "HTML" });
                    await this.bot.sendMessage(userid, "<b>Choose Wallet For Detail</b>", options);
                } else {
                    const user = await this.userService.findOne(userid);
                    const wallet = user.wallet;
                    const options = {
                        parse_mode: "HTML"
                    };
                    const address = wallet[message - 1].address;
                    const key = wallet[message - 1].key;
                    const wi = message;
                    if (address != "") {
                        this.bot.sendMessage(userid, "<b>loading...</b>", { parse_mode: "HTML" });
                        const balance = await this.swapService.getBalanceOfWallet(address);
                        var w_msg = "<b>💳 Wallet " + wi + "</b> \n <b>Address:</b> <code>" + address + "</code>\n  <b>Key:</b> <code>" + key + "</code>\n<b>Balance:</b> <code>" + balance + " ETH</code>\n\n";
                        this.bot.sendMessage(userid, "<b>👷 Your wallet info:</b> \n\n" + w_msg, options);
                    } else {
                        this.bot.sendMessage(userid, "<b>👷 Your wallet info is not set</b> \n\n", options);
                    }
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
                    const options = {
                        reply_markup: {
                            force_reply: true
                        },
                        parse_mode: "HTML"
                    };
                    await this.bot.sendMessage(userid, "<b>Please set the additional gas price(gwei) as default+(1~20)</b>", { parse_mode: "HTML" });
                    await this.bot.sendMessage(userid, "<b>Swap Gas Price</b>", options);
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
                    const options = {
                        reply_markup: {
                            force_reply: true
                        },
                        parse_mode: "HTML"
                    };
                    await this.bot.sendMessage(userid, "<b>Please set the slippage percent for swap</b>", { parse_mode: "HTML" });
                    await this.bot.sendMessage(userid, "<b>Swap Slippage</b>", options);
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
                    const options = {
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    { text: 'Swap Now', callback_data: 'swap_now' },
                                    { text: 'Cancel', callback_data: 'swap_cancel' }
                                ],
                            ]
                        }
                    };
                    this.bot.sendMessage(userid, '👉 Please confirm swap.', options);
                }
            }

            if (reply_msg == "Choose Wallet") {
                if (message * 1 < 1 || message * 1 > 10) {
                    const options = {
                        reply_markup: {
                            force_reply: true
                        },
                        parse_mode: "HTML"
                    };
                    await this.bot.sendMessage(userid, "<b>Wrong index, please type wallet index between 1 and 10 to use.</b>", { parse_mode: "HTML" });
                    await this.bot.sendMessage(userid, "<b>Choose Wallet</b>", options);
                } else {
                    const user = await this.userService.findOne(userid);
                    var swap = user.swap;
                    swap.wallet = message * 1 - 1;
                    await this.userService.update(userid, { swap: swap });
                    await this.bot.sendMessage(userid, "<b>✔ Wallet 💳(" + message + ") is selected successfully.</b> \n", { parse_mode: "HTML" });
                    const options = {
                        reply_markup: {
                            force_reply: true
                        },
                        parse_mode: "HTML"
                    };
                    await this.bot.sendMessage(userid, "<b>Please input token amount to swap</b>", { parse_mode: "HTML" });
                    await this.bot.sendMessage(userid, "<b>Swap Token Amount</b>", options);
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
                    await this.sendSwapDirectionOption(userid);
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

            if (reply_msg == "Limit Buy Token") {
                const isContract = await this.swapService.isTokenContract(message)
                if (isContract) {
                    var user = await this.userService.findOne(userid);
                    var limits = user.limits;
                    var isIn = false;
                    limits.forEach((l) => {
                        if (l.token == message) {
                            isIn = true
                        }
                    })
                    if (isIn) {
                        limits[limits.length - 1].token = message
                    } else {
                        const limitItem = {
                            token: message,
                            amount: "0",
                            wallet: 0,
                            price: "0",
                            result: false,
                            except: false,
                        }
                        limits.push(limitItem)

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
                    const options = {
                        reply_markup: {
                            force_reply: true
                        },
                        parse_mode: "HTML"
                    };
                    await this.bot.sendMessage(userid, "<b>Please type wallet index to use(1~10).</b>", { parse_mode: "HTML" });
                    await this.bot.sendMessage(userid, "<b>Select Wallet to Buy</b>", options);
                }
            }

            // select wallet to buy limit price
            if (reply_msg == "Select Wallet to Buy") {
                if (message * 1 < 1 || message * 1 > 10) {
                    const options = {
                        reply_markup: {
                            force_reply: true
                        },
                        parse_mode: "HTML"
                    };
                    await this.bot.sendMessage(userid, "<b>Wrong index, please type wallet index between 1 and 10 to use.</b>", { parse_mode: "HTML" });
                    await this.bot.sendMessage(userid, "<b>Select Wallet to Buy</b>", options);
                } else {
                    const user = await this.userService.findOne(userid);
                    var limits = user.limits;
                    limits[limits.length - 1].wallet = message * 1 - 1;
                    await this.userService.update(userid, { limits: limits });
                    await this.bot.sendMessage(userid, "<b>✔ Wallet is selected successfully.</b> \n", { parse_mode: "HTML" });
                    const options = {
                        reply_markup: {
                            force_reply: true
                        },
                        parse_mode: "HTML"
                    };
                    await this.bot.sendMessage(userid, "<b>How much ETH are you goint to use to buy</b>", { parse_mode: "HTML" });
                    await this.bot.sendMessage(userid, "<b>Set ETH Amount</b>", options);

                    // await this.bot.sendMessage(userid, "<b>Please input token price to limit buy order</b>", { parse_mode: "HTML" });
                    // await this.bot.sendMessage(userid, "<b>Limit Price</b>", options);
                }
            }

            // set the spend ETH amount for limit buy
            if (reply_msg == "Set ETH Amount") {
                if (message * 1 < 0.01) {
                    const options = {
                        reply_markup: {
                            force_reply: true
                        },
                        parse_mode: "HTML"
                    };
                    await this.bot.sendMessage(userid, "<b>Should be greater than 0.01</b>", { parse_mode: "HTML" });
                    await this.bot.sendMessage(userid, "<b>Set ETH Amount</b>", options);
                } else {
                    const user = await this.userService.findOne(userid);
                    var limits = user.limits;
                    limits[limits.length - 1].amount = message;
                    await this.userService.update(userid, { limits: limits });
                    await this.bot.sendMessage(userid, "<b>✔ Amount is set successfully.</b> \n", { parse_mode: "HTML" });
                    const options = {
                        reply_markup: {
                            force_reply: true
                        },
                        parse_mode: "HTML"
                    };
                    await this.bot.sendMessage(userid, "<b>Please input token price to limit buy order</b>", { parse_mode: "HTML" });
                    await this.bot.sendMessage(userid, "<b>Limit Price</b>", options);
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
                    var limits = user.limits;
                    limits[limits.length - 1].price = message;

                    // const token = user.tmp;
                    // const wallet = user.wmp;
                    // const amount = user.amp;
                    // var limits = user.limits;
                    // var isIn = false;
                    // for (var i = 0; i < limits.length; i++) {
                    //     if (limits[i].token == token) {
                    //         limits[i].amount = amount;
                    //         limits[i].wallet = wallet;
                    //         limits[i].price = message;
                    //         limits[i].result = false;
                    //         limits[i].except = false;
                    //         isIn = true;
                    //     }
                    // }
                    // if (!isIn) {
                    //     limits.push({ token: token, amount: amount, wallet: wallet, price: message, result: false, except: false });
                    // }

                    await this.userService.update(userid, { limits });
                    await this.bot.sendMessage(userid, "<b>✔Limit price is set successfully.</b>", { parse_mode: "HTML" });
                    await this.bot.sendMessage(userid, "<b>💡 Please take your time. I will buy your token when the price reaches your limit price.</b>", { parse_mode: "HTML" });

                    this.limitService.reloadData();
                }
            }

            //set mirror wallet one by one.  
            for (var i = 1; i <= 10; i++) {
                if (reply_msg == "Mirror Wallet" + i) {
                    if (ethers.utils.isAddress(message)) {
                        const mirror_wallet = message
                        const user = await this.userService.findOne(userid);
                        var mirror = user.mirror;
                        mirror[i - 1].address = mirror_wallet;
                        await this.userService.update(userid, { mirror: mirror })
                        await this.bot.sendMessage(userid, "<b>✔ Mirror Wallet " + i + " is set successfully.</b> \n", { parse_mode: "HTML" });
                        await this.bot.sendMessage(userid, "<b>Please enter the your desired amount for mirror.</b>", { parse_mode: "HTML" });
                        const options = {
                            reply_markup: {
                                force_reply: true
                            },
                            parse_mode: "HTML"
                        };
                        await this.bot.sendMessage(userid, "<b>Mirror Amount" + i + "</b>", options);
                    } else {
                        console.log(">>hi")
                        await this.bot.sendMessage(userid, "<b>Please enter valid address. Try again.</b>", { parse_mode: "HTML" });
                        this.sendMirrorSettingOption(userid)
                    }
                }
            }

            for (var i = 1; i <= 10; i++) {
                if (reply_msg == "Mirror Amount" + i) {
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
                        await this.bot.sendMessage(userid, "<b>Mirror Amount" + i + "</b>", options);
                    } else {
                        const user = await this.userService.findOne(userid);
                        var mirror = user.mirror;
                        mirror[i - 1].amount = mirror_amount;
                        await this.userService.update(userid, { mirror: mirror })
                        await this.bot.sendMessage(userid, "<b>✔ Mirror Amount " + i + " is set successfully.</b> \n", { parse_mode: "HTML" });
                        await this.bot.sendMessage(userid, "<b>You can set other wallets</b>", { parse_mode: "HTML" });
                        this.sendMirrorSettingOption(userid)
                    }
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
                        { text: 'Swap tokens', callback_data: 's_swap' }
                    ],
                    [
                        { text: 'Mirror sniper', callback_data: 's_mirror' },
                        { text: 'Limit buy order', callback_data: 's_limit' }
                    ],
                ]
            }
        };
        this.bot.sendMessage(userId, '👉 Please specify for every settings', options);
    }

    // snipe setting panel
    sendSnipeSettingOption = async (userId: number) => {
        try {
            const user = await this.userService.findOne(userId);
            var sniper = user?.sniper;
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
                            { text: 'Buy Amount (' + sniper.buyamount + ')', callback_data: 'sel_amount' },
                            { text: sniper?.multi ? '💳 Wallets(All)' : '💳 Wallet ' + (sniper.wallet * 1 + 1), callback_data: 'sel_wallet' }
                        ],
                        [
                            { text: 'Gas Price (' + sniper?.gasprice + ' gwei)', callback_data: 'sel_gas' },
                            { text: 'Slippage (' + sniper?.slippage + ' %)', callback_data: 'sel_slip' }
                        ],
                        [
                            { text: sniper?.multi ? "Use Single Wallet (💳)" : "Use All Wallets (💳💳💳)", callback_data: 'sel_multi' },
                        ],
                        [
                            { text: sniper?.autobuy ? "❌ Stop" : "✅ Start", callback_data: 'sel_autobuy' },
                        ],
                    ]
                }
            };
            this.bot.sendMessage(userId, '👉 Please select target properties:', options);
        } catch (e) {
            console.log(">>err")
        }

    }

    // swap tokens select menu
    sendSwapSettingOption = async (userId: number) => {
        const user = await this.userService.findOne(userId);
        const inline_key = [];
        var tmp = [];
        for (var i = 0; i < tokenListForSwap.length; i++) {
            tmp.push({ text: tokenListForSwap[i].name, callback_data: tokenListForSwap[i].name + "_sel" });
            if (i % 5 == 4) {
                inline_key.push(tmp);
                var tmp = [];
            }
        }
        if ((tokenListForSwap.length - 1) % 5 != 4) {
            inline_key.push(tmp);
        }
        inline_key.push([{ text: "Add custom token", callback_data: "custom_token_sel" }]);
        const options = {
            reply_markup: {
                inline_keyboard: inline_key
            }
        };
        this.bot.sendMessage(userId, '👉 Please select token to swap.', options);
    }

    // swap direction select menu
    sendSwapDirectionOption = async (userId: number) => {
        const user = await this.userService.findOne(userId);
        const swapToken = user.swap.token;
        const options = {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: 'ETH => Your Selection Token', callback_data: 'swap_d_1' },
                    ],
                    [
                        { text: 'Your Selection Token => ETH', callback_data: 'swap_d_2' },
                    ],
                ]
            }
        };
        this.bot.sendMessage(userId, '👉 Please select swap mode.', options);
    }

    // limit buy order token list
    sendLimitSettingOption = async (userId: number) => {
        const user = await this.userService.findOne(userId);
        const inline_key = [];
        var tmp = [];
        for (var i = 0; i < tokenListForSwap.length; i++) {
            tmp.push({ text: tokenListForSwap[i].name, callback_data: tokenListForSwap[i].name + "_limit" });
            if (i % 5 == 4) {
                inline_key.push(tmp);
                var tmp = [];
            }
        }
        if ((tokenListForSwap.length - 1) % 5 != 4) {
            inline_key.push(tmp);
        }
        const options = {
            reply_markup: {
                inline_keyboard: inline_key
            }
        };
        this.bot.sendMessage(userId, '👉 Please select token to limit buy order.', options);
    }

    // mirror setting panel
    sendMirrorSettingOption = async (userId: number) => {
        const user = await this.userService.findOne(userId);
        const inline_key = [];
        var tmp = [];
        for (var i = 1; i <= 10; i++) {
            tmp.push({ text: "Wallet " + i, callback_data: "m_wallet_" + i });
            if (i % 5 == 0) {
                inline_key.push(tmp);
                var tmp = [];
            }
        }

        const options = {
            reply_markup: {
                inline_keyboard: inline_key
            }
        };
        this.bot.sendMessage(userId, '👉 Please select wallet and input address to mirror.', options);
    }

    // wallet setting
    sendWalletSettingtOption = async (userId: number) => {
        const user = await this.userService.findOne(userId);
        const wmode = user.wmode;
        const options = {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: wmode ? '✅ Multi Wallet' : 'Multi Wallet', callback_data: 'w_multi' },
                    ],
                    [
                        { text: 'Wallet Detail', callback_data: 'w_detail' },
                    ],
                    [
                        { text: 'Delete Wallet', callback_data: 'w_delete' }
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

    sendNotification = (userId: number, msg: string) => {
        this.bot.sendMessage(userId, msg);
    }



    // this.bot.sendMessage(userId, 💡 'Please select an option:', options ❌ ✅ 📌 🏦 ℹ️ 📍  💳 ⛽️  🕐 🔗);



}
