import * as dotenv from 'dotenv';
import { Account, NetworkType, TransferTransaction, Deadline, Address, EmptyMessage, Listener, NetworkCurrencyMosaic, UInt64, TransactionService } from 'nem2-sdk';

dotenv.config();

const listener = new Listener(process.env.API_ENDPOINT);
const transactionService = new TransactionService(process.env.API_ENDPOINT);
const networkType = Number(process.env.NETWORK_TYPE);

const account = Account.createFromPrivateKey(process.env.ACCOUNT_PRIVATE_KEY, networkType);
console.log(account.address.plain());
const distAddress = Address.createFromRawAddress('TB2CDF-L7AY4B-NE5WUB-7U5TEQ-DTTWZB-R2TQT7-WBKH');

const transferTx = TransferTransaction.create(
  Deadline.create(),
  distAddress,
  [NetworkCurrencyMosaic.createRelative(100)],
  EmptyMessage,
  networkType,
  UInt64.fromUint(20000)
);

const signedTx = account.sign(transferTx, process.env.GENERATION_HASH);

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
  )
});
