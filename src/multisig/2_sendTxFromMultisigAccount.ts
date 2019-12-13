import * as dotenv from 'dotenv';
import { TransferTransaction, Deadline, Account, NetworkType, PublicAccount, EmptyMessage, AggregateTransaction, HashLockTransaction, NetworkCurrencyMosaic, UInt64, TransactionHttp, Listener } from 'nem2-sdk';
import { filter, mergeMap } from 'rxjs/operators';

dotenv.config();

const transactionHttp = new TransactionHttp(process.env.API_ENDPOINT);
const listener = new Listener(process.env.API_ENDPOINT);
const networkType = Number(process.env.NETWORK_TYPE);

const cosignatoryAccountKey = 'INPUT_COSIGNATORY_PRIVATE_KEY';
const multisigAccountPubKey = 'INPUT_MULTISIG_ACCOUNT_PUBLIC_KEY';

const cosignatoryAccount = Account.createFromPrivateKey(cosignatoryAccountKey, networkType);
const multisigAccount = PublicAccount.createFromPublicKey(multisigAccountPubKey, networkType);

const transferTx = TransferTransaction.create(
  Deadline.create(),
  multisigAccount.address,
  [NetworkCurrencyMosaic.createRelative(10)],
  EmptyMessage,
  networkType
);

const aggregateTx = AggregateTransaction.createBonded(
  Deadline.create(),
  [transferTx.toAggregate(multisigAccount)],
  networkType,
  [],
  UInt64.fromUint(40000),
);

const signedTx = cosignatoryAccount.sign(aggregateTx, process.env.GENERATION_HASH);

console.log(`txHash: ${signedTx.hash}`);

const hashLockTx = HashLockTransaction.create(
  Deadline.create(),
  NetworkCurrencyMosaic.createRelative(10),
  UInt64.fromUint(480),
  signedTx,
  networkType,
  UInt64.fromUint(18400)
);

const hashLockTxSigned = cosignatoryAccount.sign(hashLockTx, process.env.GENERATION_HASH);

listener.open().then(() => {
  transactionHttp.announce(hashLockTxSigned)
  .subscribe(x => console.log(x), err => console.error(err));

  listener.status(cosignatoryAccount.address).pipe(
    filter(error => (error.hash === hashLockTxSigned.hash))
  ).subscribe(err  => {
    console.error(err);
    listener.close();
  }, (err) => {
    console.error(err);
    listener.close();
  });

  listener.confirmed(cosignatoryAccount.address)
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
