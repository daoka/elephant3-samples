import * as dotenv from 'dotenv';
import { TransactionService, Listener, Account, PublicAccount, MosaicId, Mosaic, UInt64, TransferTransaction, Deadline, EmptyMessage, AggregateTransaction, HashLockTransaction, NetworkCurrencyMosaic, TransactionHttp, Address } from 'nem2-sdk';
import { filter, mergeMap } from 'rxjs/operators';

dotenv.config();

const transactionService = new TransactionService(process.env.API_ENDPOINT);
const transactionHttp = new TransactionHttp(process.env.API_ENDPOINT);
const listener = new Listener(process.env.API_ENDPOINT);
const networkType = Number(process.env.NETWORK_TYPE);

const initiatorAccount = Account.createFromPrivateKey(process.env.ACCOUNT_PRIVATE_KEY, networkType);
const anotherPubAccount = PublicAccount.createFromPublicKey('D8FA943C8CEC8B4E9FFD55A9240AED9D162F3D1611545E3CDFEA5CD5BFD20756', networkType);

const mosaic1 = new Mosaic(new MosaicId('6B42A00F3F36F070'), UInt64.fromUint(100));
const mosaic2 = new Mosaic(new MosaicId('3B6EDB5D513D3B95'), UInt64.fromUint(100));

const tx1 = TransferTransaction.create(
  Deadline.create(),
  initiatorAccount.address,
  [],
  EmptyMessage,
  networkType,
);

const tx2 = TransferTransaction.create(
  Deadline.create(),
  Address.createFromRawAddress('TBSZJJ-IW25MG-HODY6Y-YZGRKP-FHAM2S-SZ5PIM-N42E'),
  [mosaic2],
  EmptyMessage,
  networkType
);

const aggregateTx = AggregateTransaction.createBonded(
  Deadline.create(),
  [
    tx1.toAggregate(initiatorAccount.publicAccount),
    tx2.toAggregate(anotherPubAccount)
  ],
  networkType,
  [],
  UInt64.fromUint(50000)
);

const signedTx = initiatorAccount.sign(aggregateTx, process.env.GENERATION_HASH);

console.log(`txHash: ${signedTx.hash}`);

const hashLockTx = HashLockTransaction.create(
  Deadline.create(),
  NetworkCurrencyMosaic.createRelative(10),
  UInt64.fromUint(480),
  signedTx,
  networkType,
  UInt64.fromUint(18400)
);

const hashLockTxSigned = initiatorAccount.sign(hashLockTx, process.env.GENERATION_HASH);

listener.open().then(() => {
  transactionHttp.announce(hashLockTxSigned)
  .subscribe(x => console.log(x), err => console.error(err));

  listener.status(initiatorAccount.address).pipe(
    filter(error => (error.hash === hashLockTxSigned.hash))
  ).subscribe(err  => {
    console.error(err);
    listener.close();
  }, (err) => {
    console.error(err);
    listener.close();
  });

  listener.confirmed(initiatorAccount.address)
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
