# テスト画像作成

　Indexed Color(ColorType=`3`)。特にビット深度が`8`未満の`4`,`2`,`1`を作成する手順。

# 方法

　3つのツールを使う。[Piskel][]、GIMP、[TinyPNG][]。

　[Piskel][]はドットエディタのくせにColorTypeが`6`(TrueColor)。仕方なくGIMPで`3`(Indexed Color)に変更する。だがビット深度は`8`である。もし256色より少ない色しか使っていないなら、さらに圧縮できる。そこで[TinyPNG][]でビット深度を落として減色する。

# 手順

1. [Piskel][]で作成する
	1. `Export`→`PNG`→`Download`
	1. ColorTypeは`6`(TrueColor)
1. GIMPでColorTypeを`3`(IndexedColor)にする（`bitDepth`=`8`）
	1. PNGファイルをGIMPで開く
	1. メニュー→`画像`→`モード`→`インデックス`を選ぶ
	1. `インデックスカラー変換`ダイアログが表示される
		1. `カラーマップ`のラジオボタンから`Generate optimum palette`を選ぶ
		1. `最大色数`を指定する（`2`〜`256`）
	1. `変換`ボタンを押す
	1. メニュー→`名前を付けてエクスポート`→`エクスポート`→`エクスポート`
1. [TinyPNG][]で圧縮する（使用色数が少なければ`bitDepth`=`8`より小さくなる）

[Piskel]:https://www.piskelapp.com/p/create/sprite
[TinyPNG]:https://tinypng.com/

使用色数|[TinyPNG][]で圧縮後の`bitDepth`
--------|-------------------------------
`2`|`1`
`4`|`2`
`16`|`4`
`256`|`8`

# 作成データ

* ファイル名書式：`{colorType}-{bitDepth}-{width}x{height}.png`
* `3-1-4x4`
* `3-2-4x4`
* `3-4-4x4`
* `3-8-4x4`


* ファイル名書式：`{width}x{height}-{colorType}-{bitDepth}.png`

* `4x4-3-1.png`
* `4x4-3-2.png`
* `4x4-3-4.png`
* `4x4-3-8.png`


ファイル名|幅|高さ|ColorType|BitDepth
----------|--|----|---------|--------
`4x4-3-1.png`|4|4|3|1
`4x4-3-2.png`|4|4|3|2
`4x4-3-4.png`|4|4|3|4
`4x4-3-8.png`|4|4|3|8

# パレットデータ

* [ドットエディタEDGE/EDGE2及びGIMPで使えるPyxel用のパレットファイルを作成][]

[ドットエディタEDGE/EDGE2及びGIMPで使えるPyxel用のパレットファイルを作成]:http://blawat2015.no-ip.com/~mieki256/diary/201902061.html

## `gpl`

　[Piskel][]の`Palettes`で`✎`ボタンを押すと`Edit Palette`ダイアログが出て`Download as file`ボタンが押せる。`Current colors clone.gpl`というファイル名で、その内容は以下。どうやらGIMPのパレットデータ形式らしい。テキストだった。

```
GIMP Palette
Name: Current colors clone
Columns: 0
#
  0   0   0 Untitled
255 255 255 Untitled
255   0   0 Untitled
  0 255   0 Untitled
  0   0 255 Untitled
255 255   0 Untitled
255   0 255 Untitled
  0 255 255 Untitled
128 128 128 Untitled
192 192 192 Untitled
255 128 128 Untitled
128 255 128 Untitled
128 128 255 Untitled
255 255 128 Untitled
255 128 255 Untitled
```

### もっと短く書けるのでは？

　なぜこんな形式なのか。これならCSSの`#FFFFFF`みたいに16進数値にしたほうが短くなるのでは？　以下のように。

```
Palette
Color:RGB888
000000
FFFFFF
FF0000
...
```

　ビット数を減らせば`#FFF`のように短縮できる。

```
Color:RGB444
000
FFF
F00
...
```

　ビット数を増やして透明度も含められる。

```
Color:RGBA8888
00000000
FFFFFFFF
FF0000FF
...
```

　PNGの`tRNS`のように透明度がある色を先頭から順に1バイトデータをセットしていく。透明度がある色数だけで済むのでデータ量が減らせる。

```
Color:A8,RGB888
FF,4F
000000
FFFFFF
FF0000
...
FFFFFF
```

　RGBA,RGBの順で書いていけば透明度ヘッダを書かずに済む。ただ、間違って透明度ありのコードを連番でなく途中に入れてしまいそう。

```
Palette
Color:RGBA8888,RGB888
000000FF
FFFFFF4F
FF0000
...
FFFFFF
```

　`#FFF`,`#FFFFFF`,`#FFFFFFFF`混合。余計なデータを極力減らした。

```
000000FF
FFFFFF4F
FF0000
F00
...
FFFFFF
```


