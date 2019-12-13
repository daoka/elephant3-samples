import * as dotenv from 'dotenv';
import { Address, MultisigHttp } from 'nem2-sdk';

dotenv.config();

const multisigHttp = new MultisigHttp(process.env.API_ENDPOINT);

const targetAddress = Address.createFromRawAddress('INPUT_TARGET_ADDRESS');

multisigHttp.getMultisigAccountInfo(targetAddress).subscribe(
  x => { console.log(x) },
  err => { console.error(err) }
)