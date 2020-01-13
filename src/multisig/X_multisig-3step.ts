import { NetworkType, Account, PublicAccount, Address, MosaicId, TransferTransaction, Deadline, Mosaic, UInt64, PlainMessage, AggregateTransaction, HashLockTransaction, Listener, TransactionHttp, ReceiptHttp, TransactionService, NamespaceId } from 'nem2-sdk';


const toAddr: string = 'TB256C-FKWN2X-6JDS4R-BZJHTD-E5Y25S-RWPP3E-QBBS';
const amount: number = 1 / Math.pow(10, 6);
const message: string = 'test';

const networkType = NetworkType.TEST_NET;
const cosignatoryPrivateKey = '2256E213ABDBB2317B3F232DDB75B1307999B37FB91F6A520F148863108F71F4';
const cosignatoryAccount = Account.createFromPrivateKey(cosignatoryPrivateKey, networkType);

const multisigAccountPublicKey = '4B7D775D91884736286E5161C2C2D2E8EBD6A2BA1EFEDFCC674FA8CC63D4BFF2';
const multisigAccount = PublicAccount.createFromPublicKey(multisigAccountPublicKey, networkType);

const recipientAddress = Address.createFromRawAddress(toAddr);

const networkCurrencyMosaicId = new MosaicId('75AF035421401EF0');
const networkCurrencyDivisibility = 6;

const xem = new NamespaceId('nem.xem');

const transferTransaction = TransferTransaction.create(
  Deadline.create(),
  recipientAddress,
  [new Mosaic(xem, UInt64.fromUint(1_000_000))],
  PlainMessage.create(message),
  networkType);

const aggregateTransaction = AggregateTransaction.createBonded(
  Deadline.create(),
  [transferTransaction.toAggregate(multisigAccount)],
  networkType,
  [],
  UInt64.fromUint(40000));

const networkGenerationHash = 'CC42AAD7BD45E8C276741AB2524BC30F5529AF162AD12247EF9A98D6B54A385B';
const signedTransaction = cosignatoryAccount.sign(aggregateTransaction, networkGenerationHash);
console.log(signedTransaction.hash);

const hashLockTransaction = HashLockTransaction.create(
  Deadline.create(),
  new Mosaic(xem, UInt64.fromUint(10_000_000)),
  UInt64.fromUint(480),
  signedTransaction,
  networkType,
  UInt64.fromUint(20000));

const signedHashLockTransaction = cosignatoryAccount.sign(hashLockTransaction, networkGenerationHash);

console.log(signedHashLockTransaction.hash);

const nodeUrl = 'https://jp5.nemesis.land:3001/';
const wsEndpoint = nodeUrl.replace('https', 'wss');

const listener = new Listener(wsEndpoint);
const transactionHttp = new TransactionHttp(nodeUrl);
const receiptHttp = new ReceiptHttp(nodeUrl);
const transactionService = new TransactionService(transactionHttp, receiptHttp);

listener.open().then(() => {
  transactionService.announceHashLockAggregateBonded(signedHashLockTransaction, signedTransaction, listener).subscribe(x => {
    console.log(x);
    listener.close();
  }, err => {
    console.error(err);
    listener.close();
  });
});
