import * as dotenv from 'dotenv';
import { Account, NetworkType, AccountHttp, AccountInfo } from 'nem2-sdk';

dotenv.config();

const accountHttp = new AccountHttp(process.env.API_ENDPOINT);

const account = Account.createFromPrivateKey(process.env.ACCOUNT_PRIVATE_KEY, NetworkType.TEST_NET);

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