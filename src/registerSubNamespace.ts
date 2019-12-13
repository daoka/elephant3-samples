import * as dotenv from 'dotenv';
import { Listener, Account, NetworkType, NamespaceRegistrationTransaction, Deadline, UInt64, TransactionService } from 'nem2-sdk';

dotenv.config();

const listener = new Listener(process.env.API_ENDPOINT);
const transactionService = new TransactionService(process.env.API_ENDPOINT);
const networkType = Number(process.env.NETWORK_TYPE);

const rootNamespaceName = 'daoka';
const subNamespaceName = 'token';

const account = Account.createFromPrivateKey(process.env.ACCOUNT_PRIVATE_KEY, networkType);

const registerChildNamespaceTx = NamespaceRegistrationTransaction.createSubNamespace(
  Deadline.create(),
  subNamespaceName,
  rootNamespaceName,
  networkType,
  UInt64.fromUint(15200),
);

const signedTx = account.sign(registerChildNamespaceTx, process.env.GENERATION_HASH);

console.log(`txHash: ${signedTx.hash}`);

listener.open().then(() => {
  transactionService.announce(signedTx, listener).subscribe(
    (x) => {
      console.log(x);
      listener.close();
    }, (err) => {
      console.log(err);
      listener.close();
    }
  );
  /*
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
  */
});

