JavaScriptでPNGのIDATをデコードする（zlib.LZ77.Deflate）

　PNGのデコードで最も重要かつ難しい所。

<!-- more -->

# ブツ

* [DEMO][]
* [リポジトリ][]

[DEMO]:https://ytyaru.github.io/Html.PNG.Decode.IDAT.zlib.LZ77.Deflate.20221205142316
[リポジトリ]:https://github.com/Html.PNG.Decode.IDAT.zlib.LZ77.Deflate.20221205142316

```sh
NAME='Html.PNG.Decode.IDAT.zlib.LZ77.Deflate.20221205142316'
git clone https://github.com/ytyaru/$NAME
cd $NAME/docs
./server.sh
```

1. ターミナルを起動する
1. 上記コマンドを叩く
1. 起動したブラウザでHTTPSを実行する（Chromiumの場合は以下）
	1. `この接続ではプライバシーが保護されません`ページが表示される
	1. `詳細設定`をクリックする
	1. `localhost にアクセスする（安全ではありません）`リンクをクリックする
1. ファイルを選ぶ（次のうちいずれかの方法で）
	* 任意ファイルをドラッグ＆ドロップする
	* ファイル選択ダイアログボタンを押してファイルを選択する
1. PNG判定が実行される
	* もしPNGなら`このファイルはPNG形式です😄`と表示され、PNG画像が表示される
	* もしPNGでないなら`このファイルはPNG形式でない！`と表示される

　テスト用PNG画像はリポジトリの`./docs/asset/image/monar-mark-gold.png`にある。非PNGファイルは適当に`README.md`を使えばいい。

![実行結果例][]

[実行結果例]:memo/eye-catch.png

# zlibのLZ77（Deflate圧縮）

　PNGの`IDAT`チャンクの`data`はzlibのLZ77でDeflate圧縮されたバイナリデータ配列である。今回はPNG画像ファイルの`IDAT`チャンクの`data`をデコードしてピクセルデータを取得する。

　[zlib][]はデータの圧縮・伸張を行うライブラリ。[Deflate][]を実装しておりフリー。

　[Deflate][]とは[LZ77][]と[ハフマン符号化][]を組み合わせた[可逆データ圧縮][][アルゴリズム][]。

　[PNG仕様][PNG Filtering]によると、フィルタリング（[ハフマン符号化]）したあと、[LZ77][]圧縮する。フィルタリングには以下の5種類がある。

type|name
----|----
`0`|`None`
`1`|`Sub`
`2`|`Up`
`3`|`Average`
`4`|`Paeth`

　[PNG Filter-selection][]によると`IHDR.colorType`に応じて適切なフィルタ・タイプが違うらしい。ようするにピクセルあたりのビットサイズが8以下なら`0`(`None`)、それ以上なら`0`〜`4`のいずれかがよいらしい。インデックスカラーは`0`、トゥルーカラーは`0`〜`4`、グレースケールはビット深度`8`以下なら`0`、それより大きい`16`なら`0`〜`4`のいずれか。

`colorType`|`bitDepth`|`filterType`
-----------|----------|------------
GlayScale(`0`,`4`)|`1`,`2`,`4`,`8`|`0`
GlayScale(`0`,`4`)|`16`|`0`,`1`,`2`,`3`,`4`
TrueColor(`2`,`6`)|`8`, `16`|`0`,`1`,`2`,`3`,`4`
IndexedColor(`3`)|`1`,`2`,`4`,`8`|`0`

　細かい話は以下など参考に。

* [PNG イメージを自力でパースしてみる ～2/6 Deflateの基本と固定ハフマン編～][]
* [PNG イメージを自力でパースしてみる ～4/6 非圧縮とzlib編～][]

[zlib]:https://ja.wikipedia.org/wiki/Zlib
[Deflate]:https://ja.wikipedia.org/wiki/Deflate
[LZ77]:https://ja.wikipedia.org/wiki/LZ77
[ハフマン符号化]:https://ja.wikipedia.org/wiki/%E3%83%8F%E3%83%95%E3%83%9E%E3%83%B3%E7%AC%A6%E5%8F%B7
[可逆データ圧縮]:https://ja.wikipedia.org/wiki/%E5%8F%AF%E9%80%86%E5%9C%A7%E7%B8%AE
[アルゴリズム]:https://ja.wikipedia.org/wiki/%E3%82%A2%E3%83%AB%E3%82%B4%E3%83%AA%E3%82%BA%E3%83%A0
[PNG Filtering]:https://www.w3.org/TR/png/#9Filters
[PNG Filter-selection]:https://www.w3.org/TR/png/#12Filter-selection
[PNG イメージを自力でパースしてみる ～2/6 Deflateの基本と固定ハフマン編～]:https://darkcrowcorvus.hatenablog.jp/entry/2016/09/27/222117
[PNG イメージを自力でパースしてみる ～4/6 非圧縮とzlib編～]:https://darkcrowcorvus.hatenablog.jp/entry/2017/01/09/014407

　さすがにこの圧縮アルゴリズムを自分で実装するのは大変そう。なのでライブラリを探す。

## zlibライブラリ

　JavaScript用のzlibライブラリを探す。

* ["zlib" topic-repos github][]
* [nodeca/pako][][]

["zlib" topic-repos github]:https://github.com/topics/zlib?l=javascript
[nodeca/pako]:https://github.com/nodeca/pako
[fast-png PngDecoder.ts]:https://github.com/image-js/fast-png/blob/bae6d935ff0d25228c6b1c7e786f76f3b045abab/src/PngDecoder.ts
[imaya/zlib.js]:https://github.com/imaya/zlib.js/

　このうち執筆時点では[nodeca/pako][]というのが一番上にあった。これは以前参考にしたPNGデコーダ[fast-png PngDecoder.ts][]でも使われていた。

　デコードは[infrate.js][]を使うようだ。READMEには以下のようなコードがあった。察するに`IDAT`チャンクを`push`で追加するのだろう。結果は`result`で取得できるっぽい。

[Infrate]:https://github.com/nodeca/pako/blob/master/lib/inflate.js

```javascript
const pako = require('pako');
...
const inflator = new pako.Inflate();

inflator.push(chunk1);
inflator.push(chunk2);
...
inflator.push(chunk_last); // no second param because end is auto-detected

if (inflator.err) {
  console.log(inflator.msg);
}

const output = inflator.result;
```

　[nodeca/pako][][]の[CDN版][pako CDN]を見つけた。これを使おう。ES Moduleを使うには[pako.esm.mjs][]でいいのかな？

[pako CDN]:https://cdnjs.com/libraries/pako
[pako.esm.mjs]:https://cdnjs.cloudflare.com/ajax/libs/pako/2.1.0/pako.esm.mjs


65792
65536(256*256)


## PNGのおさらい

　PNGはバイナリファイルであり、その構造はシグネチャとチャンクに大別できる。

サイズ|データ種別|値の例
------|----------|------
8|PNGファイルシグネチャ|`89 50 4E 47 0D 0A 1A 0A`
N|チャンク|`...`
N|チャンク|`...`
N|チャンク|`...`

　チャンクは必ず次のようなバイナリ配列である。

種類|サイズ|意味
----|------|----
length|4|このチャンクのデータ長
type|4|チャンク種別（ASCII4字）
data|N|チャンクのデータ
[CRC][]|4|データ破損チェック用（`type`と`data`から算出する）

　`IDAT`チャンクの構造は以下。

種類|サイズ|値
----|------|--
length|4|`0`
type|4|`49 45 4E 44`
data|N|`00`...
[CRC][]|4|計算値

　`IDAT.data`にはzlibのDeflate圧縮されたデータが入っている。

















# CRCとは

　CRCとは[巡回冗長検査][]（Cyclic Redundancy Check）のことで、データ破損チェックのこと。データが破損していないかをチェックするためのデータを計算によって算出する。PNGでは各チャンクの末尾にCRCデータが付与される。これによりチャンクが破損していないかチェックできる。

[巡回冗長検査]:https://ja.wikipedia.org/wiki/%E5%B7%A1%E5%9B%9E%E5%86%97%E9%95%B7%E6%A4%9C%E6%9F%BB

　PNGはバイナリファイルであり、その構造はシグネチャとチャンクに大別できる。

サイズ|データ種別|値の例
------|----------|------
8|PNGファイルシグネチャ|`89 50 4E 47 0D 0A 1A 0A`
N|チャンク|`...`
N|チャンク|`...`
N|チャンク|`...`

　チャンクは必ず次のようなバイナリ配列である。

種類|サイズ|意味
----|------|----
length|4|このチャンクのデータ長
type|4|チャンク種別（ASCII4字）
data|N|チャンクのデータ
[CRC][]|4|データ破損チェック用（`type`と`data`から算出する）

　このうち末尾の[CRC][]が今回のターゲット。PNGをデコードしてチャンクデータを取得するとき、CRCデータがある。このCRCはチャンクの`type`と`data`によって算出される。そこで今回はこのCRC計算を実装し、PNG画像の各チャンクにあるCRCデータと一致するか判定し、不一致ならチャンクデータ破損エラーとして例外発生するようにしてみる。

* [PNGで使うCRC32を計算する][]

[PNGで使うCRC32を計算する]:https://qiita.com/mikecat_mixc/items/e5d236e3a3803ef7d3c5

　なんか難しそう。CRCライブラリを探してみたら[buffer-crc32][]を発見。だいぶ古い。READMEにはCRCのC言語コード例URL（[CRCAppendix][])があった。これをそのままJavaScriptに移植すればよさそう。

[buffer-crc32]:https://github.com/brianloveswords/buffer-crc32
[CRCAppendix]:https://www.w3.org/TR/png/#D-CRCAppendix

```c
/* Table of CRCs of all 8-bit messages. */
unsigned long crc_table[256];

/* Flag: has the table been computed? Initially false. */
int crc_table_computed = 0;

/* Make the table for a fast CRC. */
void make_crc_table(void)
{
  unsigned long c;
  int n, k;

  for (n = 0; n < 256; n++) {
    c = (unsigned long) n;
    for (k = 0; k < 8; k++) {
      if (c & 1)
        c = 0xedb88320L ^ (c >> 1);
      else
        c = c >> 1;
    }
    crc_table[n] = c;
  }
  crc_table_computed = 1;
}
/* Update a running CRC with the bytes buf[0..len-1]--the CRC
   should be initialized to all 1's, and the transmitted value
   is the 1's complement of the final running CRC (see the
   crc() routine below). */

unsigned long update_crc(unsigned long crc, unsigned char *buf,
                         int len)
{
  unsigned long c = crc;
  int n;

  if (!crc_table_computed)
    make_crc_table();
  for (n = 0; n < len; n++) {
    c = crc_table[(c ^ buf[n]) & 0xff] ^ (c >> 8);
  }
  return c;
}

/* Return the CRC of the bytes buf[0..len-1]. */
unsigned long crc(unsigned char *buf, int len)
{
  return update_crc(0xffffffffL, buf, len) ^ 0xffffffffL;
}
```

　次はPNGデコーダのライブラリを探してコードを読んでみる。

* [fast-png PngDecoder.ts#L123][]
* [fast-png common.ts crc()][]

[fast-png PngDecoder.ts#L123]:https://github.com/image-js/fast-png/blob/main/src/PngDecoder.ts#L123
[fast-png common.ts]:https://github.com/image-js/fast-png/blob/main/src/common.ts
[fast-png common.ts crc()]:https://github.com/image-js/fast-png/blob/main/src/common.ts#L29

　TypeScriptで書いてあった。学習したことはないが、何となく雰囲気で読もう。

　[PNGで使うCRC32を計算する][]と[CRCAppendix][]にあるアルゴリズムにそっくりなコードが[fast-png common.ts][]に書いてある。このうちCRCを計算するメソッドは[fast-png common.ts crc()][]。

```typescript
export function crc(data: Uint8Array, length: number): number {
  return (updateCrc(initialCrc, data, length) ^ initialCrc) >>> 0;
}
```

　CRCの算出にはPNGのチャンクにある`type`と`data`のバイナリ配列をもちいる。それらからCRC値を算出して返す。なので`crc()`の引数`data`, `length`はチャンクの`type`と`data`を取得するための値のはず。そして戻り値`number`は`CRC`値のはず。

　`crc()`の呼出元をみてみる。[PngDecoder.ts#L125][]のところで`crc()`を呼び出している。どうやら第二引数`length`にはチャンクの`type`と`data`のデータ長が入っているようだ。以下コードの`length`はそのチャンクの`data`の長さ。`+ 4`は`type`の長さ。これらを加算した値が第二引数に渡されている。

[PngDecoder.ts#L125]:https://github.com/image-js/fast-png/blob/main/src/PngDecoder.ts#L125

```typescript
const length = this.readUint32();
```
```typescript
const crcLength = length + 4; // includes type
```

　`crc()`の第一引数`data`には以下が渡されている。ポイントは`Uint8Array`の第二、第三引数。そのチャンクの`length`, `data`のデータ範囲を指定している。

```typescript
new Uint8Array(
  this.buffer,
  this.byteOffset + this.offset - crcLength - 4,
  crcLength,
),
```

　このコードを[DataView][]形式にあわせたコードにすれば自分のコードに適用できそう。というわけで以下のように書いてみた。

# コード抜粋

## crc.js

　CRC値を算出する。

```javascript
class CRC {
    constructor() {
        this.INIT_CRC = 0xffffffff
        this.#makeTable()
    }
    calc(dataView, offset, length) { // Chunkのtypeとdataのバイナリ配列からCRC値を算出して返す
        return (this.#update(this.INIT_CRC, new Uint8Array(dataView.buffer, offset, length), length) ^ this.INIT_CRC) >>> 0;
    }
    #makeTable() {
        this._table = []
        for (let n = 0; n < 256; n++) {
            let c = n
            for (let k = 0; k < 8; k++) {
                if (c & 1) { c = 0xedb88320 ^ (c >>> 1) }
                else { c = c >>> 1 }
            }
            this._table[n] = c;
        }
    }
    #update(currentCrc, data, length) {
        let c = currentCrc
        for (let n = 0; n < length; n++) {
            c = this._table[(c ^ data[n]) & 0xff] ^ (c >>> 8);
        }
        return c;
    }
}
export default new CRC()
```

## png.js

　`CRC.crc()`を呼び出す。

```javascript
class Chunk {
    ...
    decode(dataView, offset) {
        ...
        const actual = CRC.calc(dataView, offset+4, this.length+4)
        console.log(this.type, 'CRC', this.crc===actual, this.crc, actual)
        if (this.crc !== actual) { throw new Error(`CRCが不正値です`) }
```

　[テスト用PNG画像][]で実行し、ログ出力を確認したところ次のようになった。全チャンクでCRC値が一致している。

```
png.js:57 IHDR CRC true 1806456916 1806456916
png.js:57 PLTE CRC true 852824780 852824780
png.js:57 tRNS CRC true 3857444553 3857444553
png.js:57 IDAT CRC true 1034261794 1034261794
png.js:57 IEND CRC true 2923585666 2923585666
```

## 前回まで

* [Html.Canvas.Image.20221129114736][]
* [Html.Canvas.ImageData.20221129161037][]
* [Html.Canvas.toDataURL.20221129184336][]
* [Html.PNG.Signature.20221202103208][]
* [Html.PNG.Chunk.IHDR.20221202171226][]
* [Html.PNG.Chunk.20221203102217][]
* [Html.PNG.Decode.Chunk.CRC.20221205111145][]

[Html.Canvas.Image.20221129114736]:https://github.com/ytyaru/Html.Canvas.Image.20221129114736
[Html.Canvas.ImageData.20221129161037]:https://github.com/ytyaru/Html.Canvas.ImageData.20221129161037
[Html.Canvas.toDataURL.20221129184336]:https://github.com/ytyaru/Html.Canvas.toDataURL.20221129184336
[Html.PNG.Signature.20221202103208]:https://github.com/ytyaru/Html.PNG.Signature.20221202103208
[Html.PNG.Chunk.IHDR.20221202171226]:https://github.com/ytyaru/Html.PNG.Chunk.IHDR.20221202171226
[Html.PNG.Chunk.20221203102217]:https://github.com/ytyaru/Html.PNG.Chunk.20221203102217
[Html.PNG.Decode.Chunk.CRC.20221205111145]:https://github.com/ytyaru/Html.PNG.Decode.Chunk.CRC.20221205111145

[PNG仕様]:https://www.w3.org/TR/png/
[script要素]:https://developer.mozilla.org/ja/docs/Web/HTML/Element/script

[Drag and Drop API]:https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/File_drag_and_drop
[input type="file" 要素]:https://developer.mozilla.org/ja/docs/Web/HTML/Element/input/file
[File]:https://developer.mozilla.org/ja/docs/Web/API/File
[Blob]:https://developer.mozilla.org/ja/docs/Web/API/Blob
[arrayBuffer()]:https://developer.mozilla.org/ja/docs/Web/API/Blob/arrayBuffer

[JavaScript の型付き配列]:https://developer.mozilla.org/ja/docs/Web/JavaScript/Typed_arrays
[TypedArray]:https://developer.mozilla.org/ja/docs/Web/JavaScript/Typed_arrays
[ArrayBuffer]:https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer
[DataView]:https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/DataView
[Int8Array]:https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Int8Array
[Uint8Array]:https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array
[Uint8ClampedArray]:https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Uint8ClampedArray
[Int16Array]:https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Int16Array
[Uint16Array]:https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Uint16Array
[Int32Array]:https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Int32Array
[Uint32Array]:https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Uint32Array
[Float32Array]:https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Float32Array
[Float64Array]:https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Float64Array
[BigInt64Array]:https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/BigInt64Array
[BigUint64Array]:https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/BigUint64Array
[等価性の比較と同一性]:https://developer.mozilla.org/ja/docs/Web/JavaScript/Equality_comparisons_and_sameness
[DataView]:https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/DataView

[TextDecoder]:https://developer.mozilla.org/ja/docs/Web/API/TextDecoder
[Reflect]:https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Reflect
[Class]:https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Classes

[テスト用PNG画像]:https://github.com/ytyaru/Html.PNG.Signature.20221202103208/blob/master/docs/asset/image/monar-mark-gold.png?raw=true

<!--

# 目標

* [png-file-chunk-inspector][]

[png-file-chunk-inspector]:https://www.nayuki.io/page/png-file-chunk-inspector

　上記のようにPNGファイルのチャンクを読みたい。今回はチャンクの共通部分を読む。

　`IDAT`も解析したいが、zlib圧縮を解析せねばならないため後回し。

# 概要

　PNGファイルは先頭が[シグネチャ][]ではじまり、以降はすべて[チャンク][]とよばれる形式のバイナリデータになる。

* [シグネチャ][]
* [チャンク][]

[PNGファイルシグネチャ]:https://www.w3.org/TR/png/#5PNG-file-signature
[チャンクのレイアウト]:https://www.w3.org/TR/png/#5Chunk-layout

サイズ|データ種別|値の例
------|----------|------
8|PNGファイルシグネチャ|`89 50 4E 47 0D 0A 1A 0A`
N|チャンク|`...`
N|チャンク|`...`
N|チャンク|`...`

　チャンクは必ず次のようなバイナリ配列である。

種類|サイズ|意味
----|------|----
length|4|このチャンクのデータ長
type|4|チャンク種別（ASCII4字）
data|N|チャンクのデータ
[CRC][]|4|データ破損チェック用（`type`と`data`から算出する）

　チャンクにはいくつかの種類があり、それぞれ`type`に固有の識別名がASCIIコードで入る。`data`部分は可変であり、ここにそのチャンク固有のデータが入る。各チャンクについては[チャンク一覧][]を参照。

[チャンク一覧]:https://www.w3.org/TR/png/#4Concepts.FormatTypes
[CRC]:https://ja.wikipedia.org/wiki/%E5%B7%A1%E5%9B%9E%E5%86%97%E9%95%B7%E6%A4%9C%E6%9F%BB

　このうち必須チャンクは`IHDR`,`IDAT`,`IEND`。つまりPNGファイルは次のような順のバイナリ配列となる。

byte|データ
----|------
8|シグネチャ
25|`IHDR`
N|`IDAT`
12|`IEND`

　他にもドット絵などでインデックスカラーを使うなら`PLTE`, `tRNS`といったチャンクがある。各チャンクは順序がある程度指定されており、以下のような順になる。

1. シグネチャ
1. `IHDR`
1. `PLTE`
1. `tRNS`
1. `IDAT`
1. `IEND`

## `IHDR`

種類|サイズ|値
----|------|---
length|4|`13`
type|4|`49 48 44 52`
width|4|`1`〜
height|4|`1`〜
bitDepth|1|`1`,`2`,`4`,`8`,`16`
colorType|1|`0`,`2`,`3`,`4`,`6`
compressionMethod|1|`0`
filterMethod|1|`0`
interlaceMethod|1|`0`,`1`
[CRC][]|4|チェックサム計算値

　`colorType`と`bitDepth`の対応表は以下。

`colorType`|`bitDepth`|意味
-----------|----------|----
`0`|`1`,`2`,`4`,`8`,`16`|グレースケール
`2`|`8`,`16`|トゥルーカラー
`3`|`1`,`2`,`4`,`8`|インデックスカラー
`4`|`8`,`16`|グレースケール＋αチャンネル
`6`|`8`,`16`|トゥルーカラー＋αチャンネル

## `PLET`

種類|サイズ|値
----|------|---
length|4|`0`
type|4|`50 4C 54 45`（`80 76 84 69`）
0-R|1|`00`
0-G|1|`00`
0-B|1|`00`
N-R|1|`00`
N-G|1|`00`
N-B|1|`00`
[CRC][]|4|計算値

　0番目のパレットから順に色をセットしていく。色はRGBの3要素あり、それぞれ1バイトで表現する。

　もし`IHDR`の`colorType`が`3`で`bitDepth`が`8`なら、256色ある。ただしそれより少ない色数のデータであってもよい。色はRGBという3つの要素で表す。`0-R`が0番目のR、`0-G`が0番目のG、`0-B`が0番目のB。以降は同様に1番目の色、2番目の色とつづく。

* [PLTE][]

[PLTE]:https://www.w3.org/TR/png/#11PLTE

## `tRNS`

種類|サイズ|値
----|------|---
length|4|`0`
type|4|`74 52 4E 53`（116 82 78 83）
0-A|1|`00`
N-A|1|`00`
[CRC][]|4|計算値

　0番目のパレットに対して順に透明度をセットしていく。1バイトで表現する。

　`0-A`はパレット0番目の色に対する透明度。`00`は完全透明であり、`FF`は完全不透明。

　`0-A`から順に`1-A`,`2-A`となり、最大で`2**IHDR.bitDepth`数だけ作成できる。8bitなら256個。

　ふつうは`0`番目のパレットだけを完全透明にする使い方をする。これにより背景1色だけを完全透明にした画像が作れる。全ピクセルに透明度をもたせる方式よりもはるかに少ないデータ量で実現できる。

　半透明を用意することもできる。ただし`tRNS`の仕様上、透明度があるパレット色を連番にすることで必要最小限のサイズにできることに注意する。もし飛び飛びのパレット番号に設定する必要があるなら、透明度が必要な最後のパレット番号までのサイズが必要になる。今回もちいた[テスト用PNG画像ファイル][]でも、全20色のうち先頭から10色の`0`〜`9`番までが透明色データをもった構造になっている。

[テスト用PNG画像ファイル]:https://github.com/ytyaru/Html.PNG.Signature.20221202103208/blob/master/docs/asset/image/monar-mark-gold.png?raw=true

## `IDAT`

種類|サイズ|値
----|------|--
length|4|`0`
type|4|`49 45 4E 44`
data|N|`FF`...
[CRC][]|4|計算値

　画像データ。zlibのDeflate圧縮されたデータが入っている。今回は対象外。

## `IEND`

種類|サイズ|値
----|------|--
length|4|`0`
type|4|`49 45 4E 44`
[CRC][]|4|計算値

　`IEND`はデータがない。

# コード

　長いので省略。概要だけ書くと以下の2つ。

* PNGのデコード（[png.js][]）
* デコードしたバイナリデータをHTML表示する（[drop-box.js][]）

[png.js]:
[drop-box.js]:

　次のように呼出して使う。

```javascript
const png = new PNG()
try { await png.load(file) }
catch(e) {}
const chunks = png.decode()
```

　`decode()`の結果は`Chunk`インスタンスの配列である。このデータをもちいて画像情報をHTMLに表示している。

　各チャンクのデータをプロパティ名で参照できる。たとえばチャンク共通のプロパティ`length`, `type`, `crc`がある。ほか、各チャンク独自のデータがある。今回実装したのは次の通り。

* 全チャンク共通
	* `length `
	* `type `
	* `crc`
* `IHDR`
	* `width`
	* `height`
	* `bitDepth`
	* `colorType`
	* `compressionMethod`
	* `filterMethod`
	* `interlaceMethod`
* `PLTE`
	* `palette`
* `tRNS`
	* `alphas`

　`PNG`のインタフェースは以下。

```javascript
class PNG {
    async load(file)
    decode()
}
class Signature() {
    isValid()
}
class Chunk {
    static decode(dataView)
    decode(dataView, offset)
    #decodeData(dataView, offset)
    #decodeIHDR(dataView, offset)
    #decodeIDAT(dataView, offset)
    #decodePLET(dataView, offset)
    #decodeTRNS(dataView, offset, colorType=3)
}
```

　大雑把にいうと次のように処理している。

1. [Drag and Drop API][]や[input type="file" 要素][]で取得されたファイルオブジェクト[File][]を渡す
1. 1から[ArrayBafferを取得する][arrayBuffer()]
1. 2から[DataView][]を取得する
1. 3から[PNG仕様][]に沿ってバイナリデータを取得する
1. 4を[クラス][Class]のインスタンス変数としてセットする
1. 5を全チャンクだけ繰り返して配列として返す

[PNG仕様]:https://www.w3.org/TR/png/
[script要素]:https://developer.mozilla.org/ja/docs/Web/HTML/Element/script

[Drag and Drop API]:https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/File_drag_and_drop
[input type="file" 要素]:https://developer.mozilla.org/ja/docs/Web/HTML/Element/input/file
[File]:https://developer.mozilla.org/ja/docs/Web/API/File
[Blob]:https://developer.mozilla.org/ja/docs/Web/API/Blob
[arrayBuffer()]:https://developer.mozilla.org/ja/docs/Web/API/Blob/arrayBuffer

[JavaScript の型付き配列]:https://developer.mozilla.org/ja/docs/Web/JavaScript/Typed_arrays
[TypedArray]:https://developer.mozilla.org/ja/docs/Web/JavaScript/Typed_arrays
[ArrayBuffer]:https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer
[DataView]:https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/DataView
[Int8Array]:https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Int8Array
[Uint8Array]:https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array
[Uint8ClampedArray]:https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Uint8ClampedArray
[Int16Array]:https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Int16Array
[Uint16Array]:https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Uint16Array
[Int32Array]:https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Int32Array
[Uint32Array]:https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Uint32Array
[Float32Array]:https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Float32Array
[Float64Array]:https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Float64Array
[BigInt64Array]:https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/BigInt64Array
[BigUint64Array]:https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/BigUint64Array
[等価性の比較と同一性]:https://developer.mozilla.org/ja/docs/Web/JavaScript/Equality_comparisons_and_sameness
[DataView]:https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/DataView

[TextDecoder]:https://developer.mozilla.org/ja/docs/Web/API/TextDecoder
[Reflect]:https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Reflect
[Class]:https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Classes

-->

<!--

* 複数パレット所持
* パレット切替
* パレットアニメ
* スプライトシート（テクスチャアトラス）
	* フレーム幅（`width`）
	* フレーム高さ（`height`）
	* フレーム数（フレーム数ビット深度 `1`,`2`,`3`,`4`）
	* フレームリスト

[TexturePackerを自作した]:https://tyfkda.github.io/blog/2013/10/05/texture-pakcer.html
[Canvas から生成した PNG 画像に独自の情報を埋め込む]:https://labs.gree.jp/blog/2013/12/8594/

* [Canvas から生成した PNG 画像に独自の情報を埋め込む][]

プライベートチャンク

SubPalette: spLT
Palette-A: plTA
Palette-B: plTB
Palette-C: plTC
...
Palette-Z: plTZ

Transparent: tRNS
Transparent-A: trSA
Transparent-Z: trSZ

[RPGツクールMV・MZでベストなキャラサイズを探る]:https://zenn.dev/tonbi/articles/4baa9b9f260284

* [RPGツクールMV・MZでベストなキャラサイズを探る][]

-->

