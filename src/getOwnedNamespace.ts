import * as dotenv from 'dotenv';
import { NamespaceHttp, Account, NetworkType } from 'nem2-sdk';
import { mergeMap } from 'rxjs/operators';

dotenv.config();

const namespaceHttp = new NamespaceHttp(process.env.API_ENDPOINT);
const account = Account.createFromPrivateKey(process.env.ACCOUNT_PRIVATE_KEY, NetworkType.MIJIN_TEST);

namespaceHttp.getNamespacesFromAccount(account.address)
.pipe(mergeMap((_) => _))
.subscribe(info => {
  console.log(info);
});
