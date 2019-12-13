import * as dotenv from 'dotenv';
import { TransactionHttp, Listener, Account, NetworkType, KeyGenerator, AccountMetadataTransaction, Deadline, AggregateTransaction, UInt64 } from 'nem2-sdk';
import { filter } from 'rxjs/operators';

dotenv.config();

const transactionHttp = new TransactionHttp(process.env.API_ENDPOINT);
const listener = new Listener(process.env.API_ENDPOINT);
const networkType = Number(process.env.NETWORK_TYPE);

const account = Account.createFromPrivateKey(process.env.ACCOUNT_PRIVATE_KEY, networkType);

const key = KeyGenerator.generateUInt64Key('icon');
const value = 'http://placehold.jp/150x150.png';

const accountMetadataTx = AccountMetadataTransaction.create(
  Deadline.create(),
  account.publicKey,
  key,
  value.length,
  value,
  networkType
);

const aggregateTx = AggregateTransaction.createComplete(
  Deadline.create(),
  [accountMetadataTx.toAggregate(account.publicAccount)],
  networkType,
  [],
  UInt64.fromUint(29700),
);

const signedTx = account.sign(aggregateTx, process.env.GENERATION_HASH);

console.log(`txHash: ${signedTx.hash}`);


listener.open().then(() => {
  listener.status(account.address)
  .pipe(filter(error => error.hash === signedTx.hash))
  .subscribe(err => {
    console.error(err);
    listener.close();
  }, err => {
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
  });
});
