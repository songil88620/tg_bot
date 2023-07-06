import { Entity, Column, PrimaryColumn, BeforeInsert } from "typeorm";

@Entity('users')    
export class WebUserEntity {
    @PrimaryColumn()
    id: number;

    @Column({length:192})
    name: string;

    @Column({length:382})
    email: string; 

    @Column({length:96})
    password: string;

    @Column()
    banned: number;
    
    @Column({ type: 'timestamp', nullable: true })
    time_reg: Date;

    @Column({length:50})
    login_via: string;

    @Column()
    confirmed_email: number;

    @Column({length:250})
    emailconfirmkey: string;

    @Column({length:150})
    publicid: string;

    @Column({length:100})
    web3: string;

    @Column()
    firstrain: string;
}
