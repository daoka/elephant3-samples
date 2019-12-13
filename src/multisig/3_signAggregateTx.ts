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

const multisigAccountPubKey = 'INPUT_MULTISIG_ACCOUNT_PUBLIC_KEY';
const multisigAccount = PublicAccount.createFromPublicKey(multisigAccountPubKey, networkType);

const signerAccountKey = 'INPUT_OTHER_COSIGNATORY_PRIVATE_KEY';
const signerAccount = Account.createFromPrivateKey(signerAccountKey, networkType);

const targetHash = 'INPUT_TARGET_MULTISIG_TRANSACTION_HASH';

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
