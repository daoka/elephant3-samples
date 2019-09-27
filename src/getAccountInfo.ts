import * as dotenv from 'dotenv';
import { Account, NetworkType, AccountHttp, AccountInfo, NamespaceHttp,NamespaceId, NamespaceInfo } from 'nem2-sdk';
import { mergeMap } from 'rxjs/operators';

dotenv.config();

const accountHttp = new AccountHttp(process.env.API_ENDPOINT);
const namespaceHttp = new NamespaceHttp(process.env.API_ENDPOINT);

const account = Account.createFromPrivateKey(process.env.ACCOUNT_PRIVATE_KEY, NetworkType.MIJIN_TEST);

accountHttp.getAccountInfo(account.address).subscribe(x => {
  showAccountInfo(x);
}, err => {
  console.error(err);
});

function showAccountInfo(accountInfo: AccountInfo) {
  console.log(`address: ${accountInfo.address.plain()}`);
  console.log('--- mosaics ---');
  accountInfo.mosaics[0].id;
  accountInfo.mosaics.forEach(m => {
    console.log(`${m.id.toHex()} : ${m.amount}`)
  });
}