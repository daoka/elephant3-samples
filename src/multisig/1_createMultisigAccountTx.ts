import * as dotenv from 'dotenv';
import { TransactionHttp, NetworkType, Account, MultisigAccountModificationTransaction, Deadline, MultisigCosignatoryModification, CosignatoryModificationAction, AggregateTransaction, Listener, TransferTransaction, EmptyMessage, NetworkCurrencyMosaic, Address } from 'nem2-sdk';
import { filter } from 'rxjs/operators';

dotenv.config();

const transactionHttp = new TransactionHttp(process.env.API_ENDPOINT);
const listener = new Listener(process.env.API_ENDPOINT);

const sendCurrencyTx = (dist: Address) => {
  const tx = TransferTransaction.create(
    Deadline.create(),
    dist,
    [NetworkCurrencyMosaic.createRelative(100)],
    EmptyMessage,
    NetworkType.MIJIN_TEST
  );
  return tx;
}

const generateAccount = (tag: string) => {
  const account = Account.generateNewAccount(NetworkType.MIJIN_TEST);
  console.log(`--- account info ${tag} ---`);
  console.log(`address: ${account.address.plain()}`);
  console.log(`public key: ${account.publicKey}`);
  console.log(`private key: ${account.privateKey}\n`);
  return account;
}

const currencySenderAccount = Account.createFromPrivateKey(process.env.ACCOUNT_PRIVATE_KEY, NetworkType.MIJIN_TEST);
const multisigAccount = generateAccount('multisig account');
const cosignatory1 = generateAccount('cosignatory1');
const cosignatory2 = generateAccount('cosignatory2');

const emptyTransaction = TransferTransaction.create(
  Deadline.create(),
  multisigAccount.address,
  [],
  EmptyMessage,
  NetworkType.MIJIN_TEST,
);

const convertIntoMultisigTx = MultisigAccountModificationTransaction.create(
  Deadline.create(),
  2,
  1,
  [
    new MultisigCosignatoryModification(
      CosignatoryModificationAction.Add,
      cosignatory1.publicAccount
    ),
    new MultisigCosignatoryModification(
      CosignatoryModificationAction.Add,
      cosignatory2.publicAccount
    ),
  ],
  NetworkType.MIJIN_TEST
);

const sendCurrencyToMultisigAccount = sendCurrencyTx(multisigAccount.address);
const sendCurrencyToCosignatory1 = sendCurrencyTx(cosignatory1.address);
const sendCurrencyToCosignatory2 = sendCurrencyTx(cosignatory2.address);

const aggregateTx = AggregateTransaction.createComplete(
  Deadline.create(),
  [
    sendCurrencyToMultisigAccount.toAggregate(currencySenderAccount.publicAccount),
    sendCurrencyToCosignatory1.toAggregate(currencySenderAccount.publicAccount),
    sendCurrencyToCosignatory2.toAggregate(currencySenderAccount.publicAccount),
    emptyTransaction.toAggregate(cosignatory1.publicAccount),
    emptyTransaction.toAggregate(cosignatory2.publicAccount),
    convertIntoMultisigTx.toAggregate(multisigAccount.publicAccount),
  ],
  NetworkType.MIJIN_TEST,
  []
);

const signedTx = currencySenderAccount.signTransactionWithCosignatories(
  aggregateTx,
  [cosignatory1, cosignatory2, multisigAccount],
  process.env.GENERATION_HASH
);

console.log(`txHash: ${signedTx.hash}`);

listener.open().then(() => {
  listener.status(currencySenderAccount.address)
  .pipe(filter(error => error.hash === signedTx.hash))
  .subscribe(err => {
    console.error(err);
    listener.close();
  },
  err => {
    console.error(err);
  });
  listener.unconfirmedAdded(currencySenderAccount.address)
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
