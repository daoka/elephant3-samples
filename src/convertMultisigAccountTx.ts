import * as dotenv from 'dotenv';
import { Account, NetworkType, PublicAccount, MultisigAccountModificationTransaction, Deadline, MultisigCosignatoryModification, CosignatoryModificationAction, AggregateTransaction, HashLockTransaction, NetworkCurrencyMosaic, UInt64, TransactionHttp, Listener } from 'nem2-sdk';
import { filter, mergeMap } from 'rxjs/operators';

dotenv.config();

const transactionHttp = new TransactionHttp(process.env.API_ENDPOINT);
const listener = new Listener(process.env.API_ENDPOINT);

const multisigAccount = Account.createFromPrivateKey(process.env.MULTISIG_ACCOUNT_PRIVATE_KEY, NetworkType.MIJIN_TEST);
const cosignatoryAccount1 = PublicAccount.createFromPublicKey(process.env.MULTISIG_COSIGNATORY1_PUBLIC_KEY, NetworkType.MIJIN_TEST);

const cosignatoryAccount2 = PublicAccount.createFromPublicKey(process.env.MULTISIG_COSIGNATORY2_PUBLIC_KEY, NetworkType.MIJIN_TEST);

const convertIntoMultisigTransaction = MultisigAccountModificationTransaction.create(
  Deadline.create(),
  2,
  1,
  [
    new MultisigCosignatoryModification(
      CosignatoryModificationAction.Add,
      cosignatoryAccount1
    ),
    new MultisigCosignatoryModification(
      CosignatoryModificationAction.Add,
      cosignatoryAccount2
    ),
  ],
  NetworkType.MIJIN_TEST
);

const aggregateTx = AggregateTransaction.createBonded(
  Deadline.create(),
  [convertIntoMultisigTransaction.toAggregate(multisigAccount.publicAccount)],
  NetworkType.MIJIN_TEST
);

const signedTx = multisigAccount.sign(aggregateTx, process.env.GENERATION_HASH);

console.log(signedTx.hash);

const hashLockTx = HashLockTransaction.create(
  Deadline.create(),
  NetworkCurrencyMosaic.createRelative(10),
  UInt64.fromUint(480),
  signedTx,
  NetworkType.MIJIN_TEST
);

const hashLockTxSigned = multisigAccount.sign(hashLockTx, process.env.GENERATION_HASH);

listener.open().then(() => {
  transactionHttp.announce(hashLockTxSigned)
  .subscribe(x => console.log(x), err => console.error(err));

  listener.status(multisigAccount.address)
  .subscribe(err => {
    console.error(`${err.hash} : ${err.status}`);
    listener.close();
  });

  listener.confirmed(multisigAccount.address)
  .pipe(
    filter((transaction) => transaction.transactionInfo !== undefined
    && transaction.transactionInfo.hash === hashLockTxSigned.hash),
    mergeMap(ignored => transactionHttp.announceAggregateBonded(signedTx))
  ).subscribe(announcedAggregateTx => {
    console.log(announcedAggregateTx);
    listener.close();
  }, err => {
    console.error(err);
    listener.close();
  });
});
