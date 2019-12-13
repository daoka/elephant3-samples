import * as dotenv from 'dotenv';
import { Address, NamespaceHttp, add } from 'nem2-sdk';
import { mergeMap } from 'rxjs/operators';

dotenv.config();

const namespaceHttp = new NamespaceHttp(process.env.API_ENDPOINT);
const address = Address.createFromRawAddress('SAIARB-AF6JDU-2ZGWTT-GMPF3X-3DHJLL-UG2EU7-EEPT');

namespaceHttp.getAccountsNames([address]).pipe(
  mergeMap((_) => _)
).subscribe((x) => {
  console.log(x);
}, (err) => {
  console.error(err);
});
