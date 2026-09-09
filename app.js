import {calculate,lengthUnits,convertLength} from './math.mjs?v=20260909-profit2';
const form=document.getElementById('calculator');
let mode='box',sheetUnit='cm',result;
const money=new Intl.NumberFormat('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2});
const unitMoney=new Intl.NumberFormat('th-TH',{minimumFractionDigits:2,maximumFractionDigits:4});
const decimal=new Intl.NumberFormat('th-TH',{maximumFractionDigits:4});
const integer=new Intl.NumberFormat('th-TH',{maximumFractionDigits:0});
const el=id=>document.getElementById(id);
const text=(id,value)=>{el(id).textContent=value;};
const baht=value=>value===null?'—':`${money.format(value)} บาท`;
const unitBaht=value=>value===null?'—':`${unitMoney.format(value)} บาท`;
const outputIds=['paper-per-box','paper-total','blank-size','area','area-ft','cost-per-box','fee-per-box','all-total','all-per-box','profit-total','profit-margin','revenue','vat-total','invoice-total','target-price','mobile-cost','cost-profit-price','cost-profit-vat-price','cost-profit-discounted-price','pricing-cost','pricing-fee','pricing-profit'];
function state(){const out={mode};for(const item of form.elements){if(!item.name)continue;out[item.name]=item.type==='number'?(item.validity.badInput?NaN:item.value.trim()===''?(item.name==='costPrice'?null:NaN):Number(item.value)):item.value;}return out;}
function update(){
  const s=state();result=calculate(s);
  const markupMode=s.profitBasis==='markup';
  const profitInput=form.elements.namedItem('targetMargin');
  if(markupMode)profitInput.removeAttribute('max');else profitInput.setAttribute('max','99.9999');
  text('profit-basis-help',markupMode?'ตัวอย่าง: ต้นทุน 100 บาท บวกกำไร 25% = 125 บาท เมื่อไม่มีส่วนลด ค่าธรรมเนียม และ VAT':'ตัวอย่าง: ต้นทุน 100 บาท ต้องการกำไร 25% ของยอดขาย = 133.34 บาท เมื่อไม่มีส่วนลด ค่าธรรมเนียม และ VAT');
  el('discounted-price-row').hidden=!(s.discount>0);
  for(const id of ['sheet-width-unit','sheet-length-unit'])text(id,lengthUnits[s.sheetUnit]?.short??'');
  el('blank-cm').hidden=true;
  for(const item of form.elements)if(item.name)item.removeAttribute('aria-invalid');
  el('input-error').hidden=result.ok;
  if(!result.ok){text('input-error',result.errors[0].text);for(const error of result.errors){const item=form.elements.namedItem(error.key);if(item)item.setAttribute('aria-invalid','true');}for(const id of outputIds)text(id,'—');text('quantity-label','ตรวจข้อมูล');text('paper-scope','กรอกข้อมูลให้ครบเพื่อคำนวณ');text('cost-scope','ผลคำนวณจะแสดงเมื่อข้อมูลครบ');text('target-note','');text('target-label','');text('pricing-note',result.errors[0].text);form.elements.namedItem('costPrice').placeholder='ใช้ต้นทุนกระดาษ';document.querySelector('.profit-box').className='profit-box neutral';return;}
  const r=result;
  text('paper-per-box',money.format(r.paperPerBox));text('mobile-cost',r.target===null?'—':`฿${money.format(r.target)}`);text('paper-total',baht(r.paperTotal));text('quantity-label',`${integer.format(s.quantity)} กล่อง`);
  text('paper-scope',`รวมค่าเผื่อเพิ่ม ${decimal.format(s.paperAllowance)}%${mode==='sheet'?` · ใช้ ${integer.format(r.sheets)} แผ่น`:''}`);
  const sheetMode=mode==='sheet';
  text('blank-size',sheetMode?`${decimal.format(s.sheetWidth)} × ${decimal.format(s.sheetLength)} ${lengthUnits[s.sheetUnit].short}`:`${decimal.format(r.blankWidth)} × ${decimal.format(r.blankLength)} ซม.`);
  if(sheetMode&&s.sheetUnit!=='cm'){text('blank-cm',`${decimal.format(r.blankWidth)} × ${decimal.format(r.blankLength)} ซม.`);el('blank-cm').hidden=false;}
  text('area',`${decimal.format(r.areaSqm)} ตร.ม.`);text('area-ft',`${decimal.format(r.areaSqft)} ตร.ฟุต`);
  const profitRatio=markupMode?r.markup:r.margin;
  text('cost-per-box',baht(r.costPerBox));text('fee-per-box',baht(r.feePerBox));text('all-total',baht(r.totalCost));text('all-per-box',baht(r.totalPerBox));text('profit-total',r.profit===null?'—':`${r.profit<0?'−':''}฿${money.format(Math.abs(r.profit))}`);text('profit-title','กำไรเมื่อขายตามราคาแนะนำ');text('profit-margin',profitRatio===null?'—':`${decimal.format(profitRatio*100)}% ${markupMode?'ของต้นทุน':'ของยอดขาย'}`);document.querySelector('.profit-box').className=`profit-box${r.profit===null?' neutral':r.profit<0?' loss':''}`;
  const suggestedInputCost=r.paperPerBox*(s.costBasis==='inc'?1+s.vat/100:1);
  form.elements.namedItem('costPrice').placeholder=money.format(suggestedInputCost);
  text('cost-scope',r.usePaperCost?'ใช้ค่ากระดาษเป็นฐาน หากมีต้นทุนอื่น ให้กรอกต้นทุนรวมจริงในส่วนที่ 3':`ใช้ต้นทุนสินค้าที่กรอก ${baht(r.costPerBox)}/กล่อง ก่อน VAT เป็นฐานคำนวณราคาขาย`);
  text('revenue',baht(r.revenue));text('vat-total',baht(r.vatTotal));text('invoice-total',baht(r.invoiceTotal));text('target-price',r.target===null?'คำนวณไม่ได้':baht(r.target));text('target-label',`กำไร ${decimal.format(s.targetMargin)}% ${markupMode?'จากต้นทุน':'ของยอดขาย'}`);text('target-note',r.target===null?'กำไรเป้าหมายรวมกับค่าธรรมเนียมต้องน้อยกว่า 100%':'ราคาต่อกล่องก่อนส่วนลดและก่อน VAT ปัดขึ้นเป็นสตางค์ กำไรคำนวณเมื่อขายตามราคานี้ ก่อนภาษีเงินได้');
  text('cost-profit-price',r.target===null?'คำนวณไม่ได้':money.format(r.target));
  text('cost-profit-vat-price',unitBaht(r.targetWithVat));
  text('cost-profit-discounted-price',unitBaht(r.saleWithVat));
  text('pricing-cost',unitBaht(r.costPerBox));
  text('pricing-fee',unitBaht(r.feePerBox));
  text('pricing-profit',unitBaht(r.profitPerBox));
  text('pricing-note',r.target===null?'กำไรเป็นเปอร์เซ็นต์ของยอดขายรวมกับค่าธรรมเนียมต้องน้อยกว่า 100%':`ราคานี้เผื่อส่วนลดและค่าธรรมเนียมแล้ว เพื่อให้ได้กำไรอย่างน้อย ${decimal.format(s.targetMargin)}% ${markupMode?'จากต้นทุนสินค้า':'ของยอดขายหลังส่วนลด'} ก่อนภาษีเงินได้`);
}
function setMode(next,focus=false){mode=next;for(const tab of document.querySelectorAll('[data-mode]')){const selected=tab.dataset.mode===next;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;if(selected&&focus)tab.focus();}for(const panelMode of ['box','sheet']){const panel=el(`${panelMode}-fields`);panel.hidden=next!==panelMode;for(const input of panel.querySelectorAll('input,select'))input.disabled=next!==panelMode;}update();}
for(const tab of document.querySelectorAll('[data-mode]')){tab.addEventListener('click',()=>setMode(tab.dataset.mode));tab.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();setMode(event.key==='Home'?'box':event.key==='End'?'sheet':mode==='box'?'sheet':'box',true);}});}
function onFormChange(event){
  if(event.target.name==='sheetUnit'&&event.target.value!==sheetUnit){
    const next=event.target.value;
    if(Object.hasOwn(lengthUnits,next)){
      for(const key of ['sheetWidth','sheetLength']){const input=form.elements.namedItem(key);if(input.value.trim()==='')continue;const converted=convertLength(Number(input.value),sheetUnit,next);if(Number.isFinite(converted))input.value=String(Number(converted.toPrecision(14)));}
      sheetUnit=next;
    }
  }
  update();
}
form.addEventListener('input',onFormChange);form.addEventListener('change',onFormChange);form.addEventListener('submit',event=>{event.preventDefault();showResults();});
function showResults(){update();if(!result.ok){const field=form.elements.namedItem(result.errors[0].key);if(field){for(let node=field.parentElement;node;node=node.parentElement)if(node.tagName==='DETAILS')node.open=true;field.focus();}return;}el('cost-details').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});el('cost-details').focus({preventScroll:true});}
el('calculate-button').addEventListener('click',showResults);
let toastTimer;el('reset').addEventListener('click',()=>{form.reset();sheetUnit='cm';setMode('box');el('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{el('toast').hidden=true;},2200);});
update();
