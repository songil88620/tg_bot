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
    };

    @Prop({ type: {} })
    swap: {
        token: string,
        amount: string,
        gasprice: string,
        slippage: string,
        with: boolean,
        wallet: number,
    }

    @Prop({ type: {} })
    transfer: {
        token: string,
        amount: string,
        wallet: number,
        to: string
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
    }[]

    @Prop()
    mirror: {
        address: string,
        amount: string,
        gasprice: string,
        slippage: string,
    }[]

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
    txamount: number;

    @Prop()
    tmp: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

