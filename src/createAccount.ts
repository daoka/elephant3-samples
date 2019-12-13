import { Account } from 'nem2-sdk';
import * as dotenv from 'dotenv';
import { access } from 'fs';

dotenv.config();

const networkType = Number(process.env.NETWORK_TYPE);
const account = Account.generateNewAccount(networkType);

console.log('--- account info ---');
console.log(`private key : ${account.privateKey}`);
console.log(`public key  : ${account.publicKey}`);
console.log(`address     : ${account.address.pretty()}`);
