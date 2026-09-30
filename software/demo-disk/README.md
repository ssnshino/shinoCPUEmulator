# SHINO-80 Demo Software Disk

`SHINO80_DEMOS_CLASSIC_256K.s80d`は、標準のSHINO-80 S80B v2 / CLASSIC
環境でそのままB:へIMPORTできる、256,256 byteのCP/M data diskである。

## Quick start

1. SHINO-80をPOWER OFFにする。
2. I/O → VIRTUAL DISK Bを選ぶ。
3. `IMPORT / REPLACE DISK IMAGE`から
   `SHINO80_DEMOS_CLASSIC_256K.s80d`を選ぶ。
4. `CONFIRM IMPORT`後、Mediaが`INSERTED`であることを確認する。
5. POWER ONし、次を入力する。

```text
B:
DIR
BALLS
```

## Files on disk

|File|Purpose|
|---|---|
|`BALLS.COM`|6個のglyphが80×25画面の端で反射する。`C`または`c`で終了。|
|`MONX.COM`|DUMP / EDIT / FILL / MOVE / SEARCH / GO / CLEARを備えた拡張memory monitor。|
|`BEEP.COM`|one-bit beeper port 40hを3回triggerする。|
|`ABOUT.COM`|diskの短い案内を表示する。|
|`README.TXT`|CP/M画面内で読める操作説明。|
|`BALLS.ASM`|BALLSの実装方式を説明するCP/M text。|
|`MONX.ASM`|MONXのcommand contractを説明するCP/M text。|

`BALLS.COM`はVRAM `C000h–C7CFh`とkeyboard ports `20h–21h`を直接使う。
終了時は画面とCBIOS cursorを整合させ、current driveを保持したままCCPへ戻る。

`MONX.COM`のcommandは次のとおり。addressとdataは16進数で、addressは4桁、
byteは2桁を正確に入力する。

```text
D aaaa              dump 128 bytes
E aaaa dd           edit one byte
F aaaa bbbb dd      fill inclusive range
M aaaa bbbb cccc    move range forward
S aaaa bbbb dd      search byte
G aaaa              go / execute address
C                   clear screen
H                   help
Q                   return to CP/M
```

`E` / `F` / `M` / `G`はlive RAMを変更する。特に`G`は有効な実行codeがある
addressだけに使うこと。失敗時はPOWERまたはRESETで復帰する。

## Rebuild

Repository rootから、Codex desktop runtimeまたは通常のNode.jsで実行する。

```bash
export PATH="/Users/shino/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:/Users/shino/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback:$PATH"
pnpm run build:demo-disk
pnpm run test:demo-disk
```

Builderは外部assemblerやbinary blobを使わない。`build-demo-disk.cjs`内の小さな
label/fixup assemblerでZ80 COM bytesを生成し、repositoryの
`createBlankBlockImage()`と`buildFilesystem()`でCLASSIC imageへ格納する。

`test:demo-disk`は次を検証する。

- committed `.s80d`がbuilder出力とbyte-exactで一致
- directory 7 files
- real CCP / BDOS / CBIOS pathでB:、DIR、TYPE、COM loadを実行
- BALLSがframe間で移動し、`C`でB:へ復帰
- MONXのD/E/F/M/S/G/Qをlive RAMで実行
- BEEPがport 40hを3回trigger

## Integrity

```text
File:   SHINO80_DEMOS_CLASSIC_256K.s80d
Bytes:  256256
SHA256: f1612300700d4a959b18a7bbe3dcd52d157ef8901b53010a712d873202ab56f1
```

disk image、COM programs、build source、documentationはすべてオリジナルの
SHINO-80 workである。このdata diskにはCP/M本体や第三者ROMを収録しない。
