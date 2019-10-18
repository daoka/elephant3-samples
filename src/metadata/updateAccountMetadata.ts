import * as dotenv from 'dotenv';
import { TransactionHttp, Listener, Account, NetworkType, KeyGenerator, MetadataTransactionService, MetadataHttp, Deadline, MetadataType, AggregateTransaction } from 'nem2-sdk';
import { mergeMap, filter } from 'rxjs/operators';
import { of } from 'rxjs';

dotenv.config();

const transactionHttp = new TransactionHttp(process.env.API_ENDPOINT);
const listener= new Listener(process.env.API_ENDPOINT);
const metadataHttp = new MetadataHttp(process.env.API_ENDPOINT);
const metadataService = new MetadataTransactionService(metadataHttp);

const account = Account.createFromPrivateKey(process.env.ACCOUNT_PRIVATE_KEY, NetworkType.MIJIN_TEST);

const keyStr = 'icon';
const key = KeyGenerator.generateUInt64Key(keyStr);
const newValue = 'http://placehold.jp/110x110.png'


const accountMetadataTx = metadataService.createMetadataTransaction(
  Deadline.create(),
  NetworkType.MIJIN_TEST,
  MetadataType.Account,
  account.publicAccount,
  key,
  newValue,
  account.publicAccount
);

const signedTx = accountMetadataTx.pipe(
  mergeMap(transaction => {
    const aggregateTx = AggregateTransaction.createComplete(
      Deadline.create(),
      [transaction.toAggregate(account.publicAccount)],
      NetworkType.MIJIN_TEST,
      []
    );
    const signedTx = account.sign(aggregateTx, process.env.GENERATION_HASH);
    return of(signedTx);
  })
);

let txHash = '';
const announceTx = signedTx.pipe(
  mergeMap(signedTx => {
    txHash = signedTx.hash;
    console.log(`txHash: ${txHash}`);
    const announceTx = transactionHttp.announce(signedTx);
    return announceTx;
  })
);

listener.open().then(() => {
  listener.status(account.address)
  .pipe(filter(error => error.hash === txHash))
  .subscribe(err => {
    console.error(err);
    listener.close();
  }, err => {
    console.error(err);
  });
  listener.unconfirmedAdded(account.address)
  .pipe(
    filter(transaction => (transaction.transactionInfo !== undefined)
    && transaction.transactionInfo.hash === txHash)
  ).subscribe(ignored => {
    console.log('transaction status changed unconfirmed');
    listener.close();
  });

  announceTx.subscribe(x => {
    console.log(x);
  }, err => {
    console.error(err);
  });
});
