import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type NotifyDocument = Notify & Document;

@Schema()
export class Notify {

    @Prop()
    id: string;

    @Prop()
    type: string;

    @Prop()
    data: string;

    @Prop()
    created: string;

    @Prop()
    other: string;

    @Prop()
    read: boolean
 
}

export const NotifySchema = SchemaFactory.createForClass(Notify);

