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
    id: number;

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
        smartslip: boolean
    };

    @Prop({ type: {} })
    swap: {
        token: string,
        amount: string,
        with: boolean
    }

    @Prop()
    limits: {
        token: string,
        amount: string,
    }[]

    @Prop()
    mirror: {
        address: string,
        amount: string,
    }[]

    @Prop()
    detail: string;

    @Prop()
    other: string[]

    @Prop()
    tmp: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

