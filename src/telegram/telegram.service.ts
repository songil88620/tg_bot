import { OnModuleInit } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import { TEST_USER_ID } from "./telegram.constants"
import { TG_TOKEN } from 'src/constant';
import { UserService } from 'src/user/user.service';
import { ethers } from 'ethers';
const TelegramBot = require('node-telegram-bot-api');


const Commands = [
    { command: 'init', description: 'Init the wallet' },
    { command: 'start', description: 'Start the work' },
    { command: 'wallet', description: 'Generate or Import key' },
    { command: 'help', description: 'Return help docs' },
];

@Injectable()
export class TelegramService implements OnModuleInit {
    private readonly bot: any
    private logger = new Logger(TelegramService.name)
    private user: number[] = []

    private lastMsg: number = 0;

    constructor(
        private userService: UserService
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
        const users = await this.userService.findAll()
        users.forEach((u) => {
            const id = u.id;
            var user_tmp = [];
            user_tmp.push(id);
            this.user = user_tmp;
        })
    }

    onQueryMessage = async (query: any) => {
        const id = query.message.chat.id;
        const cmd = query.data;

        // this.bot.deleteMessage(query.message.chat.id,  query.message.message_id)
        //     .then(()=>{ 
        //     })
        //     .catch((error)=>{ 
        //     }) 

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
                            { text: 'Wallet 1', callback_data: 'import_w1' },
                            { text: 'Wallet 2', callback_data: 'import_w2' },
                        ],
                        [
                            { text: 'Wallet 3', callback_data: 'import_w3' },
                            { text: 'Wallet 4', callback_data: 'import_w4' },
                        ],
                        [
                            { text: 'Wallet 5', callback_data: 'import_w5' },
                            { text: 'Wallet 6', callback_data: 'import_w6' },
                        ],
                        [
                            { text: 'Wallet 7', callback_data: 'import_w7' },
                            { text: 'Wallet 8', callback_data: 'import_w8' },
                        ],
                        [
                            { text: 'Wallet 9', callback_data: 'import_w9' },
                            { text: 'Wallet 10', callback_data: 'import_w10' },
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
                w_msg = w_msg + "<b>▰ Wallet " + wi + "</b> \n <b>Address:</b> <code>" + address + "</code>\n  <b>Key:</b> <code>" + key + "</code>\n\n";
            })
            this.bot.sendMessage(id, "<b>🎉 New wallet is generated successfully.</b> \n\n" + w_msg, options);
        }

        // return snipe menu
        if (cmd == 's_snipe') {
            this.sendSnipeSettingOption(id);
        }

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

        //set token buy amount
        if (cmd == 'sel_autobuy') {
            const user = await this.userService.findOne(id);
            var sniper = user.sniper;
            sniper.autobuy = !sniper.autobuy;
            const state = sniper.autobuy ? "You checked auto buy mode." : "You unchecked auto buy mode.";
            await this.userService.update(id, { sniper: sniper });
            await this.bot.sendMessage(id, "<b>✔ " + state + "</b> \n", { parse_mode: "HTML" });
            this.sendSnipeSettingOption(id);
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

    }

    onReceiveMessage = async (msg: any) => {

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
                smartslip: false
            }
            const new_user = {
                id: userid,
                username,
                wallet: w_tmp,
                sniper,
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
            const user = await this.userService.findOne(userid);
            const wallet = user.wallet;
            const options = {
                parse_mode: "HTML"
            };
            var w_msg = '';
            wallet.forEach((w, index) => {
                const address = w.address;
                const key = w.key;
                const wi = index + 1;
                w_msg = w_msg + "<b>▰ Wallet " + wi + "</b> \n <b>Address:</b> <code>" + address + "</code>\n  <b>Key:</b> <code>" + key + "</code>\n\n";
            })
            this.bot.sendMessage(userid, "<b>👷 Your wallets are.</b> \n\n" + w_msg, options);
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
            const user = await this.userService.findOne(userid);
            var sniper = user.sniper;
            sniper.contract = message;
            await this.userService.update(userid, { sniper: sniper });
            await this.bot.sendMessage(userid, "<b>✔ Token contract is set successfully.</b> \n", { parse_mode: "HTML" });
            this.sendSnipeSettingOption(userid);
        }

        if (reply_msg == "Set Amount") {
            const user = await this.userService.findOne(userid);
            var sniper = user.sniper;
            sniper.buyamount = message;
            await this.userService.update(userid, { sniper: sniper });
            await this.bot.sendMessage(userid, "<b>✔ Buy amount is set successfully.</b> \n", { parse_mode: "HTML" });
            this.sendSnipeSettingOption(userid);
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

    }



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

    sendSnipeSettingOption = async (userId: string) => {
        const user = await this.userService.findOne(userId);
        var sniper = user?.sniper;
        const options = {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: sniper?.network == 'BSC' ? '📌 BSC' : 'BSC', callback_data: 'sel_bsc' },
                        { text: sniper?.network == 'ETH' ? '📌 ETH' : 'ETH', callback_data: 'sel_eth' }
                    ],
                    [
                        { text: sniper?.contract != "" ? '✅ Token Address' : 'Token Address', callback_data: 'sel_token' },
                    ],
                    [
                        { text: sniper?.contract == "" ? "Token address is not set" : sniper.contract, callback_data: 'token_address' },
                    ],
                    [
                        { text: 'Buy Amount (' + sniper.buyamount + ')', callback_data: 'sel_amount' },
                        { text: sniper?.autobuy ? '✅ Auto Buy' : 'Auto Buy', callback_data: 'sel_autobuy' }
                    ],
                    [
                        { text: 'Gas Price (' + sniper?.gasprice + ' gwei)', callback_data: 'sel_gas' },
                        { text: 'Slippage (' + sniper?.slippage + ' %)', callback_data: 'sel_slip' }
                    ],
                ]
            }
        };
        this.bot.sendMessage(userId, '👉 Please select target properties:', options);
    }



















    sendMessageToUser = (userId: string) => {
        //this.bot.sendMessage(userId, message);
        // this.bot.sendMessage(userId, "Welcome", {
        //     "reply_markup": {
        //         "keyboard": [["Sample text", "Second sample"], ["Keyboard"], ["I'm robot"]]
        //     }
        // });
        // this.bot.sendMessage(userId,"<b>bold</b> \n <i>italic</i> \n <em>italic with em</em> \n <a href=\"http://www.example.com/\">inline URL</a> \n <code>inline fixed-width code</code> \n <pre>pre-formatted fixed-width code block</pre>" , {parse_mode : "HTML"});
        // const options = {
        //     reply_markup: {
        //         inline_keyboard: [
        //             [
        //                 { text: 'Button 1', callback_data: 'button1' },
        //                 { text: 'Button 2', callback_data: 'button2' }
        //             ],
        //             [
        //                 { text: 'Button 3', callback_data: 'button3' }
        //             ]
        //         ]
        //     }
        // };
        // this.bot.sendMessage(userId, 'Please select an option:', options ❌ ✅ 📌 🏦 ℹ️ 📍  💳 ⛽️  🕐 🔗);
    }


}
