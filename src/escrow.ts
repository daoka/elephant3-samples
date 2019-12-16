import * as dotenv from 'dotenv';
import { TransactionService, Listener, Account, PublicAccount, Mosaic, UInt64, TransferTransaction, Deadline, EmptyMessage, AggregateTransaction, HashLockTransaction, NetworkCurrencyMosaic, TransactionHttp, NamespaceId } from 'nem2-sdk';
import { filter, mergeMap } from 'rxjs/operators';

dotenv.config();

const transactionService = new TransactionService(process.env.API_ENDPOINT);
const listener = new Listener(process.env.API_ENDPOINT);
const networkType = Number(process.env.NETWORK_TYPE);

const gameCompanyAccount = Account.createFromPrivateKey(process.env.ACCOUNT_PRIVATE_KEY, networkType);
const alicePubAccount = PublicAccount.createFromPublicKey('9DA3C6382CA17E655ECB3ACC57D9D4ECEA4D3CB1A3318F1C8196CE8BBA0D3901', networkType);
const bobPubAccount  = PublicAccount.createFromPublicKey('B5A0E98DFD41C3D68B21DF7AEC77C848AF19D0DB15C9269368ECF6A4B0D1328F', networkType);

const gameCurrency = new Mosaic(new NamespaceId('game_company.currency'), UInt64.fromUint(100));
const gameItem = new Mosaic(new NamespaceId('game_company.item'), UInt64.fromUint(1));

const tx1 = TransferTransaction.create(
  Deadline.create(),
  bobPubAccount.address,
  [gameItem],
  EmptyMessage,
  networkType,
);

const tx2 = TransferTransaction.create(
  Deadline.create(),
  alicePubAccount.address,
  [gameCurrency],
  EmptyMessage,
  networkType
);

const dummyTx = TransferTransaction.create(
  Deadline.create(),
  gameCompanyAccount.address,
  [],
  EmptyMessage,
  networkType
);

const aggregateTx = AggregateTransaction.createBonded(
  Deadline.create(),
  [
    tx1.toAggregate(alicePubAccount),
    tx2.toAggregate(bobPubAccount),
    dummyTx.toAggregate(gameCompanyAccount.publicAccount),
  ],
  networkType,
  [],
  UInt64.fromUint(200000)
);

const signedTx = gameCompanyAccount.sign(aggregateTx, process.env.GENERATION_HASH);

console.log(`txHash: ${signedTx.hash}`);

const hashLockTx = HashLockTransaction.create(
  Deadline.create(),
  NetworkCurrencyMosaic.createRelative(10),
  UInt64.fromUint(480),
  signedTx,
  networkType,
  UInt64.fromUint(18400)
);

const hashLockTxSigned = gameCompanyAccount.sign(hashLockTx, process.env.GENERATION_HASH);

listener.open().then(() => {
  transactionService.announceHashLockAggregateBonded(hashLockTxSigned, signedTx, listener).subscribe((x) => {
    console.log(x);
    listener.close()
  }, (err) => {
    console.error(err);
    listener.close();
  });
});
