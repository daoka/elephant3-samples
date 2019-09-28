import * as dotenv from 'dotenv';
import { Account, NetworkType, AccountHttp, AggregateTransaction, CosignatureSignedTransaction, CosignatureTransaction, TransactionHttp } from 'nem2-sdk';
import { filter, mergeMap, map } from 'rxjs/operators';

dotenv.config();

// Replace convert multisig account transaction's hash
const targetHash = '3F5A3674B8D784292C2B5E60474F482153E6FF3B6ECF2507D17293791224AA67';

const multisigAccount = Account.createFromPrivateKey(process.env.MULTISIG_ACCOUNT_PRIVATE_KEY, NetworkType.MIJIN_TEST);

const cosignatoryAccount1 = Account.createFromPrivateKey(process.env.MULTISIG_COSIGNATORY1_PRIVATE_KEY, NetworkType.MIJIN_TEST);

const cosignatoryAccount2 = Account.createFromPrivateKey(process.env.MULTISIG_COSIGNATORY2_PRIVATE_KEY, NetworkType.MIJIN_TEST);

const transactionHttp = new TransactionHttp(process.env.API_ENDPOINT);
const accountHttp = new AccountHttp(process.env.API_ENDPOINT);

const cosignAggregateBoundedTxs = (transaction: AggregateTransaction): CosignatureSignedTransaction[] => {
  const cosignatureTransaction = CosignatureTransaction.create(transaction);

  const accounts = [cosignatoryAccount1, cosignatoryAccount2];
  const txs = [];
  accounts.forEach((a) => {
    const tx = a.signCosignatureTransaction(cosignatureTransaction);
    console.log(tx);
    txs.push(tx);
  })
  return txs;
}

accountHttp.aggregateBondedTransactions(multisigAccount.address)
.pipe(
  mergeMap((_) => _),
  filter((aggregateTx) => aggregateTx.transactionInfo !== undefined
  && aggregateTx.transactionInfo.hash === targetHash),
  map(tx => cosignAggregateBoundedTxs(tx)),
  mergeMap((_) => _),
  map((cosignatureSignedTransaction) => transactionHttp.announceAggregateBondedCosignature(cosignatureSignedTransaction)),
  mergeMap((_) => _)
).subscribe((x) => {
  console.log(x);
}, err => {
  console.error(err);
});
