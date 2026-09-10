export const lengthUnits=Object.freeze({cm:{cm:1,short:'ซม.'},inch:{cm:2.54,short:'นิ้ว'},m:{cm:100,short:'ม.'},ft:{cm:30.48,short:'ฟุต'}});
export function convertLength(value,from,to){return Number.isFinite(value)&&Object.hasOwn(lengthUnits,from)&&Object.hasOwn(lengthUnits,to)?value*lengthUnits[from].cm/lengthUnits[to].cm:NaN;}
export function parseDimension(value){
  if(typeof value==='number')return Number.isFinite(value)?value:NaN;
  if(typeof value!=='string')return NaN;
  const fractions={'¼':'1/4','½':'1/2','¾':'3/4','⅛':'1/8','⅜':'3/8','⅝':'5/8','⅞':'7/8'};
  const text=value.replace(/[¼½¾⅛⅜⅝⅞]/g,c=>' '+fractions[c]).replace(/⁄/g,'/').trim();
  if(/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text))return Number(text);
  const match=text.match(/^(?:(\d+)\s+)?(\d+)\s*\/\s*(\d+)$/);
  if(!match||Number(match[3])===0)return NaN;
  const result=Number(match[1]??0)+Number(match[2])/Number(match[3]);
  return Number.isFinite(result)?result:NaN;
}
export const defaults={mode:'box',boxUnit:'cm',width:32,length:75,height:24,widthAllowance:.4,glueAllowance:3.175,sheetWidth:56.4,sheetLength:217.175,sheetUnit:'cm',boxesPerSheet:1,paperRate:.68,paperVat:7,paperBasis:'ex',paperUnit:'sqft',quantity:1000,paperAllowance:5,costPrice:null,costBasis:'ex',vat:7,discount:0,fee:0,targetMargin:25,profitBasis:'markup'};
export function calculate(s){
  s={paperVat:7,paperBasis:'ex',...s};
  const boxUnit=s.boxUnit??'cm';
  if(s.mode==='box')for(const key of ['width','length','height'])s[key]=parseDimension(s[key]);
  const errors=[];
  const labels={width:'ความกว้างกล่อง',length:'ความยาวกล่อง',height:'ความสูงกล่อง',widthAllowance:'ระยะเผื่อความกว้าง',glueAllowance:'ระยะต่อลิ้นกาว',sheetWidth:'ความกว้างแผ่น',sheetLength:'ความยาวแผ่น',boxesPerSheet:'จำนวนกล่องต่อแผ่น',paperRate:'ราคากระดาษ',paperVat:'VAT กระดาษ',quantity:'จำนวนที่ผลิต',paperAllowance:'ค่าเผื่อเพิ่มต้นทุนกระดาษ',costPrice:'ราคาต้นทุน',vat:'VAT',discount:'ส่วนลด',fee:'ค่าธรรมเนียม',targetMargin:'กำไรเป้าหมาย'};
  const active=s.mode==='box'?['width','length','height','widthAllowance','glueAllowance']:['sheetWidth','sheetLength','boxesPerSheet'];
  const usePaperCost=s.costPrice==null;
  const profitBasis=s.profitBasis??'markup';
  const required=[...active,'paperRate','paperVat','quantity','paperAllowance',...(usePaperCost?[]:['costPrice']),'vat','discount','fee','targetMargin'];
  const positive=['width','length','height','sheetWidth','sheetLength','boxesPerSheet','paperRate','quantity'];
  for(const key of required){const v=s[key];if(typeof v!=='number'||!Number.isFinite(v)||v<0||(positive.includes(key)&&v<=0))errors.push({key,text:`กรอก${labels[key]}${positive.includes(key)?'ให้มากกว่า 0':'เป็นตัวเลขตั้งแต่ 0 ขึ้นไป'}`});}
  for(const key of ['quantity',...(s.mode==='sheet'?['boxesPerSheet']:[])])if(Number.isFinite(s[key])&&!Number.isInteger(s[key]))errors.push({key,text:`${labels[key]}ต้องเป็นจำนวนเต็ม`});
  for(const key of ['discount','fee',...(profitBasis==='margin'?['targetMargin']:[])])if(s[key]>=100)errors.push({key,text:`${labels[key]}ต้องน้อยกว่า 100%`});
  if(s.paperVat>100)errors.push({key:'paperVat',text:'VAT กระดาษต้องไม่เกิน 100%'});
  if(!['ex','inc'].includes(s.paperBasis))errors.push({key:'paperBasis',text:'เลือกฐานราคาซื้อกระดาษ'});
  if(s.vat>100)errors.push({key:'vat',text:'อัตรา VAT ต้องไม่เกิน 100%'});
  if(!['box','sheet'].includes(s.mode)||!['sqft','sqm'].includes(s.paperUnit))errors.push({key:'paperUnit',text:'ตรวจสอบรูปแบบและหน่วยที่เลือก'});
  if(!['ex','inc'].includes(s.costBasis))errors.push({key:'costBasis',text:'เลือกฐานราคาต้นทุน'});
  if(!['markup','margin'].includes(profitBasis))errors.push({key:'profitBasis',text:'เลือกวิธีคิดกำไร'});
  const sheetUnit=s.sheetUnit??'cm';
  if(s.mode==='box'&&!['cm','inch'].includes(boxUnit))errors.push({key:'boxUnit',text:'เลือกหน่วยขนาดกล่องเป็นเซนติเมตรหรือนิ้ว'});
  if(s.mode==='sheet'&&!Object.hasOwn(lengthUnits,sheetUnit))errors.push({key:'sheetUnit',text:'เลือกหน่วยขนาดแผ่นเป็นเซนติเมตร นิ้ว เมตร หรือฟุต'});
  if(errors.length)return{ok:false,errors};
  const blankWidth=s.mode==='box'?convertLength(s.width,boxUnit,'cm')+convertLength(s.height,boxUnit,'cm')+s.widthAllowance:convertLength(s.sheetWidth,sheetUnit,'cm');
  const blankLength=s.mode==='box'?2*(convertLength(s.width,boxUnit,'cm')+convertLength(s.length,boxUnit,'cm'))+s.glueAllowance:convertLength(s.sheetLength,sheetUnit,'cm');
  const boxesPerSheet=s.mode==='box'?1:s.boxesPerSheet;
  const sheets=Math.ceil(s.quantity/boxesPerSheet),areaSqm=blankWidth*blankLength/10000,areaSqft=areaSqm/.09290304;
  const paperRateEx=s.paperRate/(s.paperBasis==='inc'?1+s.paperVat/100:1);
  const paperRateVat=paperRateEx*s.paperVat/100,paperRateInc=paperRateEx+paperRateVat;
  const paperBasePerSheet=(s.paperUnit==='sqft'?areaSqft:areaSqm)*paperRateEx;
  const paperPerSheet=paperBasePerSheet*(1+s.paperAllowance/100),paperTotal=paperPerSheet*sheets,paperPerBox=paperTotal/s.quantity;
  const paperVatTotal=paperTotal*s.paperVat/100,paperTotalInc=paperTotal+paperVatTotal;
  const costPerBox=usePaperCost?paperPerBox:s.costPrice/(s.costBasis==='inc'?1+s.vat/100:1);
  const productCostTotal=costPerBox*s.quantity;
  // Markup targets profit as a share of product cost, after the selling fee.
  // Margin targets profit as a share of discounted revenue before VAT.
  const availableShare=profitBasis==='markup'?(100-s.fee)/100:(100-s.targetMargin-s.fee)/100;
  const costWithProfit=costPerBox*(profitBasis==='markup'?1+s.targetMargin/100:1);
  const denominator=availableShare*(1-s.discount/100);
  const rawTarget=denominator>0?costWithProfit/denominator:null;
  const target=rawTarget===null?null:Math.ceil((rawTarget-Number.EPSILON*Math.abs(rawTarget)*8)*100)/100;
  const targetWithVat=target===null?null:target*(1+s.vat/100);
  const saleNet=target===null?null:target*(1-s.discount/100);
  const saleWithVat=saleNet===null?null:saleNet*(1+s.vat/100);
  const revenue=saleNet===null?null:saleNet*s.quantity;
  const feeTotal=revenue===null?null:revenue*s.fee/100;
  const feePerBox=feeTotal===null?null:feeTotal/s.quantity;
  const totalCost=feeTotal===null?null:productCostTotal+feeTotal;
  const totalPerBox=totalCost===null?null:totalCost/s.quantity;
  const profit=revenue===null?null:revenue-totalCost;
  const profitPerBox=profit===null?null:profit/s.quantity;
  const margin=revenue===null||revenue===0?null:profit/revenue;
  const markup=profit===null||productCostTotal===0?null:profit/productCostTotal;
  const vatTotal=revenue===null?null:revenue*s.vat/100;
  const invoiceTotal=revenue===null?null:revenue+vatTotal;
  const results={paperRateEx,paperRateVat,paperRateInc,paperVatTotal,paperTotalInc,blankWidth,blankLength,boxesPerSheet,sheets,areaSqm,areaSqft,paperBasePerSheet,paperPerSheet,paperTotal,paperPerBox,costPerBox,productCostTotal,totalCost,totalPerBox,saleNet,saleWithVat,revenue,profit,profitPerBox,margin,markup,vatTotal,invoiceTotal,feeTotal,feePerBox,target,targetWithVat};
  if(Object.values(results).some(v=>v!==null&&!Number.isFinite(v)))return{ok:false,errors:[{key:'quantity',text:'ตัวเลขสูงเกินช่วงที่คำนวณได้ กรุณาลดขนาดหรือจำนวน'}]};
  return{ok:true,usePaperCost,profitBasis,...results};
}
