import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export interface TokenData {
    contract: string,
    name: string,
    symbol: string,
    decimals: string,
    price?: string,
    image_url?: string,
    mcap?: string,
    h24?: string,
    api?: string,
    network:string
}

export type TokenlistDocument = Tokenlist & Document;

@Schema()
export class Tokenlist {

    @Prop()
    contract: string;

    @Prop()
    name: string;

    @Prop()
    symbol: string;

    @Prop()
    decimals: number;

    @Prop()
    price: string;

    @Prop()
    image_url: string;

    @Prop()
    mcap: string;

    @Prop()
    h24: string;

    @Prop()
    api: string;

    @Prop()
    network: string;


}

export const TokenlistSchema = SchemaFactory.createForClass(Tokenlist);

