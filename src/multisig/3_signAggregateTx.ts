import * as dotenv from 'dotenv';
import { AggregateTransaction, CosignatureTransaction, Account, CosignatureSignedTransaction, AccountHttp, TransactionHttp, NetworkType, PublicAccount } from 'nem2-sdk';
import { mergeMap, filter, map } from 'rxjs/operators';

dotenv.config();

const networkType = Number(process.env.NETWORK_TYPE);

const cosignAggregateBondedTx = (transaction: AggregateTransaction, account: Account): CosignatureSignedTransaction => {
  console.log(transaction);
  const cosignatureTx = CosignatureTransaction.create(transaction);
  return account.signCosignatureTransaction(cosignatureTx);
};

const multisigAccountPubKey = 'D8FA943C8CEC8B4E9FFD55A9240AED9D162F3D1611545E3CDFEA5CD5BFD20756';
const multisigAccount = PublicAccount.createFromPublicKey(multisigAccountPubKey, networkType);

const signerAccountKey = 'DE5BB846A4B3B9E8DC9EAA585116833928F0515B4BCEEDBA211BFB7DDCF6F62E';
const signerAccount = Account.createFromPrivateKey(signerAccountKey, networkType);

const targetHash = 'F55BB7EEA820ECE403AAD45BB401A121D7D3B5C5D8479AF6BFC2EF8B13672045';

const accountHttp = new AccountHttp(process.env.API_ENDPOINT);
const transactionHttp = new TransactionHttp(process.env.API_ENDPOINT);

accountHttp.getAccountPartialTransactions(multisigAccount.address)
.pipe(
  mergeMap((_) => _),
  filter((_) => !_.signedByAccount(signerAccount.publicAccount) &&
  _.transactionInfo.hash === targetHash),
  map(transaction => cosignAggregateBondedTx(transaction, signerAccount)),
  mergeMap(cosignatureSignedTx => transactionHttp.announceAggregateBondedCosignature(cosignatureSignedTx))
).subscribe(announcedTx => {
  console.log(announcedTx)
}, err => {
  console.error(err);
});
