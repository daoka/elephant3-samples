import * as dotenv from 'dotenv';
import { TransferTransaction, Deadline, Account, NetworkType, PublicAccount, EmptyMessage, AggregateTransaction, HashLockTransaction, NetworkCurrencyMosaic, UInt64, TransactionHttp, Listener } from 'nem2-sdk';
import { filter, mergeMap } from 'rxjs/operators';

dotenv.config();

const transactionHttp = new TransactionHttp(process.env.API_ENDPOINT);
const listener = new Listener(process.env.API_ENDPOINT);

const cosignatoryAccountKey = 'INPUT_COSIGNATORY_PRIVATE_KEY';
const multisigAccountPubKey = 'INPUT_MULTISIG_ACCOUNT_PUBLIC_KEY';

const cosignatoryAccount = Account.createFromPrivateKey(cosignatoryAccountKey, NetworkType.MIJIN_TEST);
const multisigAccount = PublicAccount.createFromPublicKey(multisigAccountPubKey, NetworkType.MIJIN_TEST);

const transferTx = TransferTransaction.create(
  Deadline.create(),
  multisigAccount.address,
  [NetworkCurrencyMosaic.createRelative(10)],
  EmptyMessage,
  NetworkType.MIJIN_TEST
);

const aggregateTx = AggregateTransaction.createBonded(
  Deadline.create(),
  [transferTx.toAggregate(multisigAccount)],
  NetworkType.MIJIN_TEST
);

const signedTx = cosignatoryAccount.sign(aggregateTx, process.env.GENERATION_HASH);

console.log(`txHash: ${signedTx.hash}`);

const hashLockTx = HashLockTransaction.create(
  Deadline.create(),
  NetworkCurrencyMosaic.createRelative(10),
  UInt64.fromUint(480),
  signedTx,
  NetworkType.MIJIN_TEST
);

const hashLockTxSigned = cosignatoryAccount.sign(hashLockTx, process.env.GENERATION_HASH);

listener.open().then(() => {
  transactionHttp.announce(hashLockTxSigned)
  .subscribe(x => console.log(x), err => console.error(err));

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
