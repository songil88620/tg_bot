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
        smartslip: boolean,
        wallet: number,
        result: string,
    };

    @Prop({ type: {} })
    swap: {
        token: string,
        amount: string,
        with: boolean,
        wallet: number,
    }

    @Prop()
    limits: {
        token: string,
        amount: string,
        price: string,
        wallet: number,
        result: boolean,
        except: boolean
    }[]

    @Prop()
    mirror: {
        address: string,
        amount: string, 
    }[]

    @Prop()
    wmode: boolean;

    @Prop()
    detail: string;

    @Prop()
    other: string[]

    @Prop()
    tmp: string;

    @Prop()
    wmp: number;

    @Prop()
    amp: string;


}

export const UserSchema = SchemaFactory.createForClass(User);

