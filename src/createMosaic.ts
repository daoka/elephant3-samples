import * as dotenv from 'dotenv';
import { Listener, Account, MosaicDefinitionTransaction, Deadline, MosaicNonce, MosaicId, MosaicFlags, UInt64, MosaicSupplyChangeTransaction, MosaicSupplyChangeAction, AggregateTransaction, TransactionService } from 'nem2-sdk';

dotenv.config();

const listener = new Listener(process.env.API_ENDPOINT);
const transactionService = new TransactionService(process.env.API_ENDPOINT);
const networkType = Number(process.env.NETWORK_TYPE);

const account = Account.createFromPrivateKey(process.env.ACCOUNT_PRIVATE_KEY, networkType);

const nonce = MosaicNonce.createRandom();

const mosaicDefinitionTx = MosaicDefinitionTransaction.create(
  Deadline.create(),
  nonce,
  MosaicId.createFromNonce(nonce, account.publicAccount),
  MosaicFlags.create(false, true, false),
  0,
  UInt64.fromUint(0),
  networkType
);

const mosaicSupplyChangeTx = MosaicSupplyChangeTransaction.create(
  Deadline.create(),
  mosaicDefinitionTx.mosaicId,
  MosaicSupplyChangeAction.Increase,
  UInt64.fromUint(10000),
  networkType
);

const aggregateTx = AggregateTransaction.createComplete(
  Deadline.create(),
  [
    mosaicDefinitionTx.toAggregate(account.publicAccount),
    mosaicSupplyChangeTx.toAggregate(account.publicAccount),
  ],
  networkType,
  [],
  UInt64.fromUint(31200)
);

const signedTx = account.sign(aggregateTx, process.env.GENERATION_HASH);

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
