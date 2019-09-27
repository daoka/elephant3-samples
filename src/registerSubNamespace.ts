import * as dotenv from 'dotenv';
import { TransactionHttp, Listener, Account, NetworkType, NamespaceRegistrationTransaction, Deadline } from 'nem2-sdk';
import { filter } from 'rxjs/operators';

dotenv.config();

const transactionHttp = new TransactionHttp(process.env.API_ENDPOINT);
const listener = new Listener(process.env.API_ENDPOINT);

const rootNamespaceName = 'daoka';
const subNamespaceName = 'token';

const account = Account.createFromPrivateKey(process.env.ACCOUNT_PRIVATE_KEY, NetworkType.MIJIN_TEST);

const registerChildNamespaceTx = NamespaceRegistrationTransaction.createSubNamespace(
  Deadline.create(),
  subNamespaceName,
  rootNamespaceName,
  NetworkType.MIJIN_TEST
);

const signedTx = account.sign(registerChildNamespaceTx, process.env.GENERATION_HASH);

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
