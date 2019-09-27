import * as dotenv from 'dotenv';
import { TransactionHttp, Listener, Account, NetworkType, MosaicDefinitionTransaction, Deadline, MosaicNonce, MosaicId, MosaicFlags, UInt64, MosaicSupplyChangeTransaction, MosaicSupplyChangeAction, AggregateTransaction } from 'nem2-sdk';
import { filter } from 'rxjs/operators';

dotenv.config();

const transactionHttp = new TransactionHttp(process.env.API_ENDPOINT);
const listener = new Listener(process.env.API_ENDPOINT);

const account = Account.createFromPrivateKey(process.env.ACCOUNT_PRIVATE_KEY, NetworkType.MIJIN_TEST);

const nonce = MosaicNonce.createRandom();

const mosaicDefinitionTx = MosaicDefinitionTransaction.create(
  Deadline.create(),
  nonce,
  MosaicId.createFromNonce(nonce, account.publicAccount),
  MosaicFlags.create(false, true, false),
  0,
  UInt64.fromUint(0),
  NetworkType.MIJIN_TEST
);

const mosaicSupplyChangeTx = MosaicSupplyChangeTransaction.create(
  Deadline.create(),
  mosaicDefinitionTx.mosaicId,
  MosaicSupplyChangeAction.Increase,
  UInt64.fromUint(10000),
  NetworkType.MIJIN_TEST
);

const aggregateTx = AggregateTransaction.createComplete(
  Deadline.create(),
  [
    mosaicDefinitionTx.toAggregate(account.publicAccount),
    mosaicSupplyChangeTx.toAggregate(account.publicAccount),
  ],
  NetworkType.MIJIN_TEST,
  []
);

const signedTx = account.sign(aggregateTx, process.env.GENERATION_HASH);

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
  });
});
