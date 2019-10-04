import * as dotenv from 'dotenv';
import { Account, NetworkType, TransferTransaction, Deadline, Address, EmptyMessage, TransactionHttp, Listener, NetworkCurrencyMosaic } from 'nem2-sdk';
import { filter } from 'rxjs/operators';

dotenv.config();

const transactionHttp = new TransactionHttp(process.env.API_ENDPOINT);
const listener = new Listener(process.env.API_ENDPOINT);

const account = Account.createFromPrivateKey(process.env.ACCOUNT_PRIVATE_KEY, NetworkType.MIJIN_TEST);
console.log(account.address.plain());
const distAddress = Address.createFromRawAddress('SAZWJ2-J75NPY-S2OF6V-4NR6Z6-A5EKPD-A6CR45-VVFK');

const transferTx = TransferTransaction.create(
  Deadline.create(),
  distAddress,
  [NetworkCurrencyMosaic.createRelative(100)],
  EmptyMessage,
  NetworkType.MIJIN_TEST
);

const signedTx = account.sign(transferTx, process.env.GENERATION_HASH);

console.log(`txHash: ${signedTx.hash}`);

listener.open().then(() => {
  listener.status(account.address)
  .pipe(filter(error => error.hash === signedTx.hash))
  .subscribe(err => {
    console.error(err);
    listener.close();
  },
  err => {
    console.error(err);
  });
  listener.unconfirmedAdded(account.address)
  .pipe(
    filter(transaction => (transaction.transactionInfo !== undefined)
    && transaction.transactionInfo.hash === signedTx.hash)
  ).subscribe(ignored => {
    console.log('transaction status changed unconfirmed');
    listener.close();
  });

  transactionHttp.announce(signedTx).subscribe(x => {
    console.log(x);
  }, err => {
    console.error(err);
  })
});
