import * as dotenv from 'dotenv';
import { Listener, Account, NamespaceRegistrationTransaction, Deadline, UInt64, TransactionService } from 'nem2-sdk';

dotenv.config();

const listener = new Listener(process.env.API_ENDPOINT);
const transactionService = new TransactionService(process.env.API_ENDPOINT);

const networkType = Number(process.env.NETWORK_TYPE);

// Replace Your root namespace name
const namespaceName = 'yamada';

const duration = 10000;

const account = Account.createFromPrivateKey(process.env.ACCOUNT_PRIVATE_KEY, networkType);

const registerRootNamespaceTx = NamespaceRegistrationTransaction.createRootNamespace(
  Deadline.create(),
  namespaceName,
  UInt64.fromUint(duration),
  networkType,
  UInt64.fromUint(15200)
);

const signedTx = account.sign(registerRootNamespaceTx, process.env.GENERATION_HASH);

console.log(`txHash: ${signedTx.hash}`);

listener.open().then(() => {
  transactionService.announce(signedTx, listener).subscribe(
    (x) => {
      console.log(x);
      listener.close();
    }, (err) => {
      console.error(err);
      listener.close();
    }
  );
});
