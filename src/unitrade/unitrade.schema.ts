import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type UnitradeDocument = Unitrade & Document;

@Schema()
export class Unitrade {

    @Prop()
    userid: string;

    @Prop()
    contract: string;

    @Prop()
    history: {
        token_amount: number;
        eth_amount: number;
        eth_price: number;
        buy_at: string;
        act: string;
    }[];

    @Prop()
    by_wallet: string;
    
}

export const UnitradeSchema = SchemaFactory.createForClass(Unitrade);

