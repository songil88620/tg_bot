import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type UserDocument = User & Document;

interface Sniper {
    network: string,
    contract: string,
    autobuy: boolean,
    buyamount: string,
    gasprice: string,
    slippage: string,
    smartslip: boolean
}

@Schema()
export class User {

    @Prop()
    id: string;

    @Prop()
    webid: number;

    // web: 1, telegram: 0
    @Prop()
    panel: number;

    @Prop()
    username: string;

    @Prop()
    wallet: {
        address: string;
        key: string;
    }[]

    @Prop({ type: {} })
    sniper: {
        network: string,
        contract: string,
        autobuy: boolean,
        buyamount: string,
        gasprice: string,
        slippage: string,
        smartslip: boolean,
        wallet: number,
        result: string,
        multi: boolean,
        blockwait: number,
        //auto sell
        startprice: number,
        sellrate: number,
        autosell: boolean,
        sold: boolean,
        private: boolean,

        token: {
            name: string,
            symbol: string,
            decimal: string,
            supply: string,
            owner: string,
            lppair: string,
            honeypot: number,
            buytax: number,
            selltax: number,
            transferfee: number,
            maxwallet: string,
            maxwp: number,
            methods: any[]
        }
    };

    @Prop({ type: {} })
    swap: {
        token: string,
        amount: string,
        gasprice: string,
        slippage: string,
        with: boolean,
        wallet: number,
        private: boolean
    }

    @Prop({ type: {} })
    transfer: {
        token: string,
        amount: string,
        wallet: number,
        to: string,
        private: boolean
    }

    @Prop({ type: {} })
    perps: {
        pairidx: number,
        leverage: number,
        slippage: number,
        stoploss: number,
        profit: number,
        autotrade: boolean,
        longshort: boolean,
        size: number,
        wallet: number
    }

    @Prop()
    limits: {
        token: string,
        amount: string,
        price: string,
        wallet: number,
        result: boolean,
        except: boolean,
        gasprice: string,
        slippage: string,
        private: boolean
    }[]

    @Prop()
    mirror: {
        address: string,
        amount: string,
        gasprice: string,
        slippage: string,
        private: boolean
    }[]

    @Prop({ type: {} })
    bridge: {
        fromChain: string,
        toChain: string,
        token: string,
        amount: string,
        receiver: string,
        wallet: number
    }

    @Prop({ type: {} })
    autotrade: {
        liqudity: number,
        balance: number,
        token: string,
        amount: number,
        sellat: number,
        auto: boolean,
        buy: boolean,
        sell: boolean,
        wallet: number,
        contract: string,
        startprice: number
    }

    @Prop()
    wmode: boolean;

    @Prop()
    detail: string;

    @Prop({ type: {} })
    other: {
        mirror: number,
        limit: number
    }

    @Prop()
    referral: string[];

    @Prop()
    code: string;

    @Prop()
    txamount: number;

    @Prop()
    tmp: string;

    @Prop({ type: {} })
    newtoken: {
        name: string,
        supply: number,
        buytax: number,
        selltax: number,
        address: string,
    }

    @Prop({ type: {} })
    signaltrade: {
        channel: string,
        token: string,
        amount: string,
        gasprice: string,
        slippage: string,
        wallet: number,
        private: boolean,
        sellat: number,
        auto: boolean,
        startprice: number,
        sold: boolean,
        buy: boolean
    }
}

export const UserSchema = SchemaFactory.createForClass(User);

