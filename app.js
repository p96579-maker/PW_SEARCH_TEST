(function(){ console.log('placeholder'); })();
function preprocessRemark(s){
  if(!s) return s;
  let t = String(s);

  // 1) Name 與 Management IP 黐行
  t = t.replace(/Name:\s*?\n?\s*("?[^"\n]+?"?)\s+Management\s*IP:\s*/gi,
                (_m, name) => `Name: ${name} | Management IP: `);

  // 2) Remarks: 一律獨立成段（即使黐喺 2) 後面）
  t = t.replace(/\s*Remarks\s*:/gi, " | Remarks: ");

  // 3) 編號清單正規化
  // 3.1) 1)4 -> 1) 4；2)2 -> 2) 2
  t = t.replace(/(\b\d\))\s*(\d)\b/g, '$1 $2');

  // 3.2) 1) 後面如果斷行，與「4 Car Train」合併：1)\n4 Car -> 1) 4 Car
  t = t.replace(/(\b\d\))\s*[\r\n]+\s*(\d)\s*(Car\b)/gi, '$1 $2 $3');

  // 3.3) 缺空格的 4Car -> 4 Car
  t = t.replace(/(\b\d\))\s*(\d)\s*Car/gi, '$1 $2 Car');

  // 3.4) 把行尾的 ") 2"（或 ") 3" 等）矯正為新一段的 "2)"（避免黐返去前一行）
  // 例："... 11-18 ) 2 Car Train" -> "... 11-18 | 2) Car Train"
  t = t.replace(/\)\s*(\d)\b/g, (_m, d) => ` | ${d}) `);

  return t;
}
