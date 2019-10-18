import * as dotenv from 'dotenv';
import { AccountHttp, Account, NetworkType, Address } from 'nem2-sdk';

dotenv.config();

const accountHttp = new AccountHttp(process.env.API_ENDPOINT);

const targetAddress = Address.createFromRawAddress('INPUT_TARGET_ADDRESS');

accountHttp.getMultisigAccountInfo(targetAddress).subscribe(
  x => { console.log(x) },
  err => { console.error(err) }
)