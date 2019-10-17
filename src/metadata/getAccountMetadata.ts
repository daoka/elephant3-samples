import * as dotenv from 'dotenv';
import { MetadataHttp, Account, NetworkType, Metadata, KeyPair, KeyGenerator, UInt64 } from 'nem2-sdk';

dotenv.config();

const metadataHttp = new MetadataHttp(process.env.API_ENDPOINT);
const account = Account.createFromPrivateKey(process.env.ACCOUNT_PRIVATE_KEY, NetworkType.MIJIN_TEST);

metadataHttp.getAccountMetadata(account.address).subscribe(
  metadata => {
    if (metadata.length > 0) {
      metadata.map((entry: Metadata) => {
        const metadataEntry = entry.metadataEntry;
        console.log(`key: ${metadataEntry.scopedMetadataKey}\n`);
        console.log(`value: ${metadataEntry.value}\n`);
        console.log(`senderPubKey: ${metadataEntry.senderPublicKey}\n`);
        console.log(`targetPubKey: ${metadataEntry.targetPublicKey}\n`);
        console.log('--------------------------');
      })
    }
  }
)