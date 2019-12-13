import * as dotenv from 'dotenv';
import { PublicAccount, NetworkType, Account, AccountHttp } from 'nem2-sdk';
import { } from 'rxjs/operators';

dotenv.config();

const networkType = Number(process.env.NETWORK_TYPE);

const multisigAccountPubKey = 'INPUT_MULTISIG_ACCOUNT_PUBLIC_KEY';
const multisigAccount = PublicAccount.createFromPublicKey(multisigAccountPubKey, networkType);

const accountHttp = new AccountHttp(process.env.API_ENDPOINT);
accountHttp.getAccountPartialTransactions(multisigAccount.address).subscribe(
  x => {
    console.log(x);
  }, err => {
    console.error(err);
  }
)
