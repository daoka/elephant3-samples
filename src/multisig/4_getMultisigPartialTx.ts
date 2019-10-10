import * as dotenv from 'dotenv';
import { PublicAccount, NetworkType, Account, AccountHttp } from 'nem2-sdk';
import { } from 'rxjs/operators';

dotenv.config();

const multisigAccountPubKey = 'INPUT_MULTISIG_ACCOUNT_PUBLIC_KEY';
const multisigAccount = PublicAccount.createFromPublicKey(multisigAccountPubKey, NetworkType.MIJIN_TEST);

const accountHttp = new AccountHttp(process.env.API_ENDPOINT);
accountHttp.aggregateBondedTransactions(multisigAccount.address).subscribe(
  x => {
    console.log(x);
  }, err => {
    console.error(err);
  }
)
