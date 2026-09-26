'use strict';
// Authored explanations, independent from the decoder's formatting/timing fields.
// Order of documented flags: S Z H P/V N C. — preserved, 0/1 forced, other = rule.
const unchanged=['—','—','—','—','—','—'];
const notes={
 NOP:['何も変更せず、次の命令へ進みます。'],
 HALT:['割込みが受理されるまで命令実行を停止します。停止中も4Tごとのリフレッシュが続きます。'],
 DI:['IFF1/IFF2を0にしてマスク可能割込みを禁止します。NMIは禁止しません。'],
 EI:['IFF1/IFF2を1にします。INTの受理は、次の1命令が終わるまで抑止されます。'],
 LD_DD_NN:['16bitの即値をレジスタペアへ読み込みます。機械語中の即値は下位バイトが先です。'],
 LD_R_N:['8bitの即値を宛先レジスタへ読み込みます。'],
 LD_R_R:['右側のレジスタを左側へコピーします。右側の値は変わりません。'],
 LD_R_MEM_HL:['括弧内のアドレスから1バイトを読み、レジスタへ格納します。'],
 LD_MEM_HL_R:['レジスタの1バイトを括弧内のアドレスへ書き込みます。'],
 LD_MEM_HL_N:['即値1バイトを括弧内のアドレスへ書き込みます。'],
 LD_A_MEM_BC:['BCの指すアドレスからAへ1バイトを読み込みます。'],
 LD_A_MEM_DE:['DEの指すアドレスからAへ1バイトを読み込みます。'],
 LD_MEM_BC_A:['Aの値をBCの指すアドレスへ書き込みます。'],
 LD_MEM_DE_A:['Aの値をDEの指すアドレスへ書き込みます。'],
 LD_A_MEM_NN:['16bit絶対アドレスnnのメモリからAへ1バイトを読み込みます。'],
 LD_MEM_NN_A:['Aを16bit絶対アドレスnnへ書き込みます。'],
 LD_MEM_NN_HL:['16bitレジスタペアをnnとnn+1へ、下位・上位の順で書き込みます。'],
 LD_HL_MEM_NN:['nnとnn+1から下位・上位を読み、16bitレジスタペアへ格納します。'],
 LD_SP_HL:['HL（またはIX/IY）をSPへコピーします。スタックの内容自体は読み書きしません。'],
 INC_DD:['16bitレジスタペアを1増やします。FFFFhの次は0000h。フラグは変更しません。'],
 DEC_DD:['16bitレジスタペアを1減らします。0000hの前はFFFFh。フラグは変更しません。'],
 INC_R:['8bitの値を1増やします。Cは保持します。',['結果','結果','桁上り','7F→80','0','—']],
 DEC_R:['8bitの値を1減らします。Cは保持します。',['結果','結果','桁借り','80→7F','1','—']],
 INC_MEM_HL:['メモリの1バイトを読み、1増やして同じ場所へ書き戻します。',['結果','結果','桁上り','7F→80','0','—']],
 DEC_MEM_HL:['メモリの1バイトを読み、1減らして同じ場所へ書き戻します。',['結果','結果','桁借り','80→7F','1','—']],
 ADD_HL_DD:['右側の16bitペアを左側へ加算します。S/Z/P/Vは保持します。',['—','—','bit11','—','0','bit15']],
 ROT_A:['Aを1bit回転します。RLCA/RRCAは端のbitを反対端へ、RLA/RRAは旧Cを空いたbitへ入れます。',['—','—','0','—','0','押出bit']],
 DAA:['直前のAとH/N/Cを使い、BCD演算後のAを10進補正します。',['結果','結果','補正','偶数パリティ','—','補正']],
 CPL:['Aの全bitを反転します。H/Nを1にします。',['—','—','1','—','1','—']],
 SCF:['Cを1にします。H/Nは0。',['—','—','0','—','0','1']],
 CCF:['Cを反転します。旧CはHに入り、Nは0になります。',['—','—','旧C','—','0','反転']],
 EX_AF_ALT:["AFとAF′を交換します。Fも交換されるので、各フラグはF′の値になります。",['F′','F′','F′','F′','F′','F′']],
 EXX:["BC/DE/HLとそれぞれの副レジスタBC′/DE′/HL′を交換します。AFは対象外です。"],
 EX_DE_HL:['DEとHLの16bit値を交換します。DD/FDを付けてもこの命令のHLは置換されません。'],
 EX_SP_HL:['SPとSP+1の16bit値をHL（またはIX/IY）と交換します。SPは変わりません。'],
 JP_NN:['PCを16bit絶対アドレスnnへ変更します。'],
 JP_CC_NN:['条件成立時だけPCをnnへ変更します。命令の即値は不成立時にも読みます。'],
 JP_HL:['レジスタペアの値をPCへコピーします。括弧表記ですが、その番地のメモリは読みません。'],
 JR_E:['命令の直後のPCへ、符号付き8bit変位e（−128〜127）を加えて分岐します。'],
 JR_CC_E:['条件成立時のみ、命令直後のPCに符号付き変位eを加えます。'],
 DJNZ_E:['Bを1減らし、0でなければ相対分岐します。フラグは変わりません。'],
 CALL_NN:['命令直後のPCをスタックへ退避し、nnへサブルーチン呼出しします。SPは2減ります。'],
 CALL_CC_NN:['条件成立時のみ、戻り先PCをスタックへ退避してnnへ呼び出します。'],
 RET:['スタックから下位・上位の順にPCを取り出して戻ります。SPは2増えます。'],
 RET_CC:['条件成立時のみスタックからPCを取り出して戻ります。'],
 RST:['命令直後のPCをスタックへ退避し、指定された固定ベクタへ呼び出します。'],
 PUSH_QQ:['16bitレジスタペアをスタックへ退避します。SPを減らして上位、さらに減らして下位を書きます。'],
 POP_QQ:['スタックから下位・上位の順に16bitレジスタペアを取り出します。SPは2増えます。'],
 IN_A_N:['ポートからAへ入力します。16bit I/Oアドレスの上位は入力前のA、下位はnです。フラグは保持します。'],
 OUT_N_A:['Aをポートへ出力します。16bit I/Oアドレスの上位はA、下位はnです。'],
 CB_ROTATE:['対象を1bit回転／シフトします。メモリ対象では読み書きが発生します。',['結果','結果','0','偶数パリティ','0','押出bit']],
 CB_BIT:['指定bitを検査します。値は変更せず、bitが0ならZ/P/Vを1にします。',['bit7のみ','bit=0','1','bit=0','0','—']],
 CB_RES:['指定bitを0にします。その他のbitとフラグは保持します。'],
 CB_SET:['指定bitを1にします。その他のbitとフラグは保持します。'],
 ED_NOP:['未使用のEDエンコーディングです。このCPU候補では8TのNOPとして動作します。'],
 ED_IN:['BCを16bit I/Oアドレスとして1バイトを読みます。IN (C)は値を捨て、フラグだけ更新します。',['結果','結果','0','偶数パリティ','0','—']],
 ED_OUT:['BCを16bit I/Oアドレスとしてレジスタを出力します。OUT (C),0はNMOS方針で00hを出力します。'],
 ED_ARITH16:['旧Cも含めた16bit加減算を行い、HLへ結果を格納します。',['結果','結果','bit11','符号付overflow','演算','桁上り/借り']],
 ED_LD16:['nnとnn+1のメモリと16bitペアの間で値を転送します。メモリ上は下位バイトが先です。'],
 ED_NEG:['Aを0から減算し、2の補数の符号反転を行います。',['結果','結果','桁借り','旧A=80','1','旧A≠0']],
 ED_RETURN:['スタックからPCへ戻り、IFF2をIFF1へ復元します。RETI（ED 4D）だけが周辺機器向け復帰イベントも発生させます。'],
 ED_IM:['以後のマスク可能割込みの応答モードをIM0/1/2に設定します。割込みの許可・禁止自体は変えません。'],
 ED_SPECIAL:['Aと特殊レジスタI/Rの間で1バイトを転送します。LD A,Rでは命令自身のM1によるR増加後の値を読みます。'],
 ED_NIBBLE:['Aの下位4bitと(HL)の上下4bitを回転します。Aの上位4bitは保持します。',['A結果','A結果','0','A偶数パリティ','0','—']],
 ED_BLOCK:['メモリ／ポートのブロック操作です。リピート版は1回ごとに終了条件を判定します。']
};
const aluText=['Aに値を加算します。','Aに値と旧Cを加算します。','Aから値を減算します。','Aから値と旧Cを減算します。','Aと値のbitごとのANDをAへ格納します。','Aと値のbitごとのXORをAへ格納します。','Aと値のbitごとのORをAへ格納します。','Aから値を引いたときのフラグだけを更新します。A自体は保持します。'];
function describe(d){
 let item=notes[d.kind];
 if(d.kind==='ALU_R'||d.kind==='ALU_N'){
  const logical=d.aluCode>=4&&d.aluCode<=6,sub=[2,3,7].includes(d.aluCode);
  item=[aluText[d.aluCode],['結果','結果',logical?(d.aluCode===4?'1':'0'):'桁上り/借り',logical?'偶数パリティ':'符号付overflow',sub?'1':'0',logical?'0':'桁上り/借り']];
 }
 if(!item)throw Error('Missing manual description: '+d.kind);
 let [action,flag=unchanged]=item;flag=[...flag];let xy='保持';
 const flagWrites=['INC_R','DEC_R','INC_MEM_HL','DEC_MEM_HL','ROT_A','DAA','CPL','ALU_R','ALU_N','CB_ROTATE','ED_IN','ED_NEG','ED_NIBBLE'];
 if(flagWrites.includes(d.kind))xy='結果のbit5/bit3（Aを扱う命令はA）';
 if((d.kind==='ALU_R'||d.kind==='ALU_N')&&d.aluCode===7)xy='比較する相手のbit5/bit3。減算結果ではありません。';
 if(['ADD_HL_DD','ED_ARITH16'].includes(d.kind))xy='16bit結果の上位バイトのbit5/bit3';
 if(d.kind==='ED_ARITH16')flag[4]=d.subtract?'1':'0';
 if(['SCF','CCF'].includes(d.kind))xy='((Q XOR F) OR A) のbit5/bit3。Qは前命令のフラグ更新履歴。DD/FD接頭辞で履歴は0。';
 if(d.kind==='CB_BIT')xy=d.index?'実効アドレスの上位バイトのbit5/bit3':d.targetCode===6?'WZの上位バイトのbit5/bit3。HLそのものではありません。':'検査する値のbit5/bit3';
 if(d.kind==='EX_AF_ALT')xy='F′から交換';
 if(d.kind==='POP_QQ'&&d.pairCode===3){flag=Array(6).fill('復元');xy='スタックからF全体を復元';}
 if(d.kind==='ED_SPECIAL'&&d.loadA){flag=['A結果','A結果','0','IFF2','0','—'];xy='Aのbit5/bit3。直後のINT受理によるP/V消失をNMOS方針でモデル化。';}
 if(d.kind==='ED_BLOCK'){
  const direction=d.direction===1?'増やす':'減らす';
  action=[`(HL)を(DE)へ転送し、HL/DEを1${direction}。BCを1減らす。`, `Aと(HL)を比較し、HLを1${direction}。BCを1減らす。Aは保持。`, `旧BCポートから(HL)へ入力し、Bを1減らし、HLを1${direction}。`, `(HL)を読み、Bを1減らした後のBCポートへ出力。HLを1${direction}。`][d.operation];
  if(d.repeat)action+=' '+(d.operation===0?'BC≠0':d.operation===1?'BC≠0かつZ=0':'B≠0')+'ならPCを2戻して反復。反復境界で割込みを受理できます。';
  flag=d.operation===0?['—','—','0','BC≠0','0','—']:d.operation===1?['比較','比較','桁借り','BC≠0','1','—']:['新B','新B','特殊式','特殊式','入力/出力bit7','特殊式'];
  xy=d.operation===0?'A+転送値のbit1→Y、bit3→X':d.operation===1?'A−読出値−Hのbit1→Y、bit3→X':'新Bのbit5/bit3';
  if(d.repeat)xy+='。継続回ではED接頭辞のPCのbit13→Y、bit11→X。';
 }
 let extra=[];
 if(d.kind==='ED_BLOCK'&&d.operation>=2){
  extra.push('特殊式: v=転送バイト、b=減算後B、dir=+1または−1。入力はk=v+((C+dir)&FFh)、出力はk=v+(更新後HLの下位)。終了回はH=C=(k>255)、P/V=parity((k&7) XOR b)、N=vのbit7。');
  if(d.repeat)extra.push('継続回の補正: c=(k>255)、n=vのbit7、u=c ? b+(n ? −1 : +1) : b。P/Vはparity((k&7) XOR b)とparity(u&7)が等しければ1。Hはcかつ(b&15)=(n ? 0 : 15)で1。CとNは終了回の式と同じ。');
 }
 if(d.kind==='CB_ROTATE')extra.push({RLC:'bit7→bit0/C',RRC:'bit0→bit7/C',RL:'bit7→C、旧C→bit0',RR:'bit0→C、旧C→bit7',SLA:'bit7→C、bit0=0',SRA:'bit0→C、bit7保持',SLL:'bit7→C、bit0=1（非公式）',SRL:'bit0→C、bit7=0'}[d.rotate]);
 if(d.indexedMemory||d.family==='DDCB'||d.family==='FDCB')extra.push('dは符号付き8bit。実効アドレスは(index+d)を16bitに丸めます。');
 if(['DDCB','FDCB'].includes(d.family))extra.push(d.kind==='CB_BIT'?'BITはメモリを検査するだけ。下位レジスタ指定は無視され、レジスタコピーはありません。':d.targetCode!==6?'メモリへの書き戻しに加え、結果を末尾の通常レジスタへコピーします。H/LはIXH/IXL等ではありません。':'結果はメモリへ書き戻します。');
 if(d.index&&d.affected===false)extra.push('DD/FDはこの命令の対象を変えません。接頭辞分だけ長さ+1、時間+4T、R+1。SCF/CCFのQ履歴には影響します。');
 if(d.condition)extra.push('条件: '+({NZ:'Z=0',Z:'Z=1',NC:'C=0',C:'C=1',PO:'P/V=0',PE:'P/V=1',P:'S=0',M:'S=1','B!=0':'減算後のB≠0'}[d.condition]));
 return {action,flags:flag,xy,extra};
}
module.exports={describe};
