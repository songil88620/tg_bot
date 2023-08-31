import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type TokenscannerDocument = Tokenscanner & Document;

@Schema()
export class Tokenscanner {

    @Prop()
    id: string;

    @Prop()
    contract: string;

    @Prop()
    name: string;

    @Prop()
    symbol: string;

    @Prop()
    decimal: number;

    @Prop()
    created: number;

    @Prop()
    verified: boolean;

    @Prop({ type: {} })
    detail: {
        tg: string,
        twitter: string,
        discord: string,
        medium: string,
        website: string,
        dexId: string,
        priceUsd: string,
        mcap: string,
        liquidity: string,
        h24: string
    }

}

export const TokenscannerSchema = SchemaFactory.createForClass(Tokenscanner);

