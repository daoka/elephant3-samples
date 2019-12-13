import * as dotenv from 'dotenv';
import { NamespaceHttp, MosaicId } from 'nem2-sdk';
import { mergeMap } from 'rxjs/operators';

dotenv.config();

const namespaceHttp = new NamespaceHttp(process.env.API_ENDPOINT);
const mosaicId = new MosaicId('496725B74AAD7DDE');

namespaceHttp.getMosaicsNames([mosaicId]).pipe(
  mergeMap((_) => _),
).subscribe((x) => {
  console.log(x);
}, (err) => {
  console.error(err);
});
