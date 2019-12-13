import * as dotenv from 'dotenv';
import { TransactionHttp, Listener, PublicAccount, Account, TransferTransaction, Deadline, EmptyMessage, MosaicNonce, MosaicDefinitionTransaction, MosaicId, MosaicFlags, UInt64, MosaicSupplyChangeTransaction, MosaicSupplyChangeAction, AggregateTransaction, HashLockTransaction, NetworkCurrencyMosaic } from 'nem2-sdk';
import { filter, mergeMap } from 'rxjs/operators';

dotenv.config();

const transactionHttp = new TransactionHttp(process.env.API_ENDPOINT);
const listener = new Listener(process.env.API_ENDPOINT);
const networkType = Number(process.env.NETWORK_TYPE);

const cashierAccount = Account.createFromPrivateKey(process.env.ACCOUNT_PRIVATE_KEY, networkType);
const creatorPublicAccount = PublicAccount.createFromPublicKey('D8FA943C8CEC8B4E9FFD55A9240AED9D162F3D1611545E3CDFEA5CD5BFD20756', networkType);

const mosaicFeeTx = TransferTransaction.create(
  Deadline.create(),
  creatorPublicAccount.address,
  [NetworkCurrencyMosaic.createRelative(500)],
  EmptyMessage,
  networkType
);

const nonce = MosaicNonce.createRandom();

const mosaicDefinitionTx = MosaicDefinitionTransaction.create(
  Deadline.create(),
  nonce,
  MosaicId.createFromNonce(nonce, creatorPublicAccount),
  MosaicFlags.create(true, true, false),
  0,
  UInt64.fromUint(0),
  networkType
);

const mosaicSupplyChangeTx = MosaicSupplyChangeTransaction.create(
  Deadline.create(),
  mosaicDefinitionTx.mosaicId,
  MosaicSupplyChangeAction.Increase,
  UInt64.fromUint(50000),
  networkType
);

const aggregateTx = AggregateTransaction.createBonded(
  Deadline.create(),
  [
    mosaicFeeTx.toAggregate(cashierAccount.publicAccount),
    mosaicDefinitionTx.toAggregate(creatorPublicAccount),
    mosaicSupplyChangeTx.toAggregate(creatorPublicAccount),
  ],
  networkType,
  [],
  UInt64.fromUint(60000),
);

console.log(aggregateTx.size);

const signedTx = cashierAccount.sign(aggregateTx, process.env.GENERATION_HASH);

console.log(`txHash: ${signedTx.hash}`);

const hashLockTx = HashLockTransaction.create(
  Deadline.create(),
  NetworkCurrencyMosaic.createRelative(10),
  UInt64.fromUint(480),
  signedTx,
  networkType,
  UInt64.fromUint(18400)
);

const hashLockTxSigned = cashierAccount.sign(hashLockTx, process.env.GENERATION_HASH);

listener.open().then(() => {
  transactionHttp.announce(hashLockTxSigned)
  .subscribe(x => console.log(x), err => console.error(err));

  listener.status(cashierAccount.address).pipe(
    filter(error => (error.hash === hashLockTxSigned.hash))
  ).subscribe(err  => {
    console.error(err);
    listener.close();
  }, (err) => {
    console.error(err);
    listener.close();
  });

  listener.confirmed(cashierAccount.address)
  .pipe(
    filter((transaction) => transaction.transactionInfo !== undefined &&
      transaction.transactionInfo.hash === hashLockTxSigned.hash),
    mergeMap(ignored => transactionHttp.announceAggregateBonded(signedTx))
  )
  .subscribe(announcedAggregateBonded => {
    console.log(announcedAggregateBonded);
    listener.close();
  }, err => {
    console.error(err);
    listener.close();
  })
});

