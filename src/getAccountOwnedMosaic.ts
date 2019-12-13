import * as dotenv from 'dotenv';
import { MosaicHttp, Account, NetworkType, MosaicService, AccountHttp } from 'nem2-sdk';
import { mergeMap } from 'rxjs/operators';

dotenv.config();

const endpoint = process.env.API_ENDPOINT;
const accountHttp = new AccountHttp(endpoint);
const mosaicHttp = new MosaicHttp(endpoint);
const mosaicService = new MosaicService(accountHttp, mosaicHttp);
const networkType = Number(process.env.NETWORK_TYPE);

const account = Account.createFromPrivateKey(process.env.ACCOUNT_PRIVATE_KEY, networkType);

mosaicService.mosaicsAmountViewFromAddress(account.address).pipe(
  mergeMap((_) => _),
).subscribe((x) => {
  console.log('-- mosaic info --');
  console.log(`mosaic id : ${x.mosaicInfo.id.toHex()}`);
  console.log(`divisibility: ${x.mosaicInfo.divisibility}`);
  console.log(`Absolute Amount: ${x.amount}`);
  console.log(`Relative Amount: ${x.relativeAmount()}`);
}, (err) => {
  console.log(err);
});
