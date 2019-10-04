# マルチシグアカウントサンプル

## サンプル内容

1. 1_createMultisigAccount.ts ... 2of2のマルチシグアカウントの作成
2. 2_sendTxFromMultisigAccount.ts ... マルチシグアカウントからのトランザクションの送信
3. 3_signAggregateTx.ts ... マルチシグアカウントの署名

## 使い方

### 1_createMultisigAccount.ts

マルチシグアカウントと署名者用アカウントを作成、有効化し、cat.currencyを保有しているアカウントからこれらのアカウントに100cat.currencyを送信します。

#### 実行方法

```sh
% ts-node src/multisig/1_createMultisigAccount.ts
```

#### 実行結果例

マルチシグアカウント、署名者1、署名者2のアカウント情報が出力されるのでメモしてください。以降のサンプルで使います。

```
--- account info multisig account ---
address: SA53WLGFCMZJBTPEFTN7DR3LZE4CO4ZULQUIM7JV
public key: 5CAD2275A280ACCF1DCE4BF91D57B044C7A15E8432C36533F06A3219268D8F76
private key: CFDE3DF93CC8CAD3AD82497D9079A5CB788AFE105C55511862A640D477F54A4F

--- account info cosignatory1 ---
address: SCE32RUOH4LSDKV4ENNKSB6HN2VILXM4QSGUVCNI
public key: 431261FB058CE3D7BD605C3BA50716ADA3EDDCF463E291D5ED11C3B2F4A66DB9
private key: EE2A4C6F54369F6E40949E12612EA8225ACB13AED3E1424CFC83F8D19C72DD42

--- account info cosignatory2 ---
address: SDHGG7SID5AMNHZ4IN532TC43WDAH2AAMZS6BJOF
public key: 96BC9BD989BFF701D9A34F22B86DB7DFA99CBC26484779AEF2359B2154F10C73
private key: 687DFF45BBF7563EAD51B7A33E8BF7FDFEA4BD3D0719ABD68A7832F8A20D5536
```

### 2_sendTxFromMultisigAccount.ts

マルチシグアカウントからトランザクションを発生させます。

#### 変更箇所

```typescript
// 10行目
const cosignatoryAccountKey = '署名者1の秘密鍵';
const multisigAccountPubKey = 'マルチシグアカウントの公開鍵';
```

```typescript
// 16行目
const transferTx = TransferTransaction.create(
  Deadline.create(),
  multisigAccount.address, // 必要に応じて送信先アドレスを変更
  [NetworkCurrencyMosaic.createRelative(10)], // 必要に応じて送信量を変更
  EmptyMessage,
  NetworkType.MIJIN_TEST
);
```

#### 実行方法

```sh
% ts-node src/multisig/2_sendTxFromMultisigAccount.ts
```

#### 実行結果例

```
txHash: 7477B01AC78D0A763875E41B04702672DA982DC7FD6AAA4D1D5D6E9498D90356
```

TxHashは次の署名時に必要なので控えておいてください。

### 3_signAggregateTx.ts

マルチシグアカウントから送信されたトランザクションの署名を行います。

#### 変更箇所

```typescript
// 13行目
const multisigAccountPubKey = 'マルチシグアカウントの公開鍵';
// 16行目
const signerAccountKey = '署名者2の秘密鍵';
// 19行目
const targetHash = '2実行時のトランザクションハッシュ';
```

#### 実行方法

```sh
% ts-node src/multisig/3_signAggregateTx.ts
```

## (補足) ts-nodeの導入方法

```
% npm install -g ts-node
```