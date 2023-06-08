import { OnModuleInit } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import { TEST_USER_ID } from "./telegram.constants"
import { TG_TOKEN } from 'src/constant';
import { UserService } from 'src/user/user.service';
import { ethers } from 'ethers';
const TelegramBot = require('node-telegram-bot-api');


const Commands = [
    { command: 'start', description: 'Start the bot' },
    { command: 'wallet', description: 'Generate or Import key' },
    { command: 'help', description: 'Return help docs' },
];

@Injectable()
export class TelegramService implements OnModuleInit {
    private readonly bot: any
    private logger = new Logger(TelegramService.name)
    private user: number[] = []

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

        // import key command 
        if (cmd == 'import_key') {
            const options = {
                reply_markup: {
                    force_reply: true
                },
                parse_mode: "HTML"
            };
            this.bot.sendMessage(id, "<b>Please type your private key.</b> \n <code> You can import maximum 10 wallets.</code> \n  <code>Start with private_keyXX:</code> \n  <code>For example, private_key01:0xabcdef...</code> ", options);
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

    }

    onReceiveMessage = async (msg: any) => {
        const message = msg.text;
        const userid = msg.from.id
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
            const new_user = {
                id: userid,
                username,
                wallet: w_tmp,
                detail: "",
                other: [],
            }
            await this.userService.create(new_user);
        }
        if (message == '/start') {
            this.sendFirstSelectOption(userid)
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
        if (message.slice(0, 11) == 'private_key') {
            const index = Number(message.substring(11, 13))
            const private_key = message.substring(14, message.length)
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
            wallets[index - 1] = {
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



    sendFirstSelectOption = (userId: string) => {
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
        // this.bot.sendMessage(userId, 'Please select an option:', options);
    }


}
