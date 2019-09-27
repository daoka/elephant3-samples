import * as dotenv from 'dotenv';
import { Account, NetworkType, TransferTransaction, Deadline, Address, Mosaic, MosaicId, UInt64, EmptyMessage, TransactionHttp, Listener } from 'nem2-sdk';
import { filter } from 'rxjs/operators';

dotenv.config();

const transactionHttp = new TransactionHttp(process.env.API_ENDPOINT);
const listener = new Listener(process.env.API_ENDPOINT);

const account = Account.createFromPrivateKey(process.env.ACCOUNT_PRIVATE_KEY, NetworkType.MIJIN_TEST);
console.log(account.address.plain());
const catCurrency = new MosaicId(process.env.CAT_CURRENCY_ID);
const distAddress = Address.createFromRawAddress('SCO3VK-XYR2X3-ZRIDKZ-SZQ53H-RAVIRK-G6L4B2-USYH');

const transferTx = TransferTransaction.create(
  Deadline.create(),
  distAddress,
  [new Mosaic(catCurrency, UInt64.fromUint(10))],
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
