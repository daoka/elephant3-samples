import * as dotenv from 'dotenv';
import { NamespaceHttp, Account, NetworkType, NamespaceInfo, NamespaceId, UInt64, AliasType } from 'nem2-sdk';
import { mergeMap } from 'rxjs/operators';

dotenv.config();

const namespaceHttp = new NamespaceHttp(process.env.API_ENDPOINT);
const account = Account.createFromPrivateKey(process.env.ACCOUNT_PRIVATE_KEY, NetworkType.MIJIN_TEST);

namespaceHttp.getNamespacesFromAccount(account.address)
.pipe(mergeMap((_) => _))
.subscribe(info => {
  console.log(`id: ${info.id.toHex()}`);
  console.log(`active: ${info.active}`);
  console.log(`start: ${info.startHeight}`);
  console.log(`end: ${info.endHeight}`);
  console.log(`isRoot: ${info.isRoot()}`);
  console.log(`isSub: ${info.isSubnamespace()}`);
  console.log(`depth: ${info.depth}`);
  if (info.isSubnamespace()) {
    console.log(`parentId: ${info.parentNamespaceId().toHex()}`);
  }
  console.log(`owner: ${info.owner.address.pretty()}`)
  console.log(`has alias: ${info.hasAlias()}`)
  if (info.hasAlias) {
    console.log('- alias info -');
    console.log(`alias type: ${info.alias.type}`);
    if (info.alias.type == AliasType.Address) {
      console.log(`address alias: ${info.alias.address.pretty()}`);
    }
    if (info.alias.type == AliasType.Mosaic) {
      console.log(`mosaic alias: ${info.alias.mosaicId.toHex()}`);
    }
  }
  console.log('------------------------')
});
