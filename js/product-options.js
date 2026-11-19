/* Размеры и цвета: выбор наличия и собственные варианты. */
function optionState(button){
 const label=button.dataset.sz||button.dataset.col||'';
 const state=button.classList.contains('out')?'mixed':button.classList.contains('on')?'true':'false';
 button.setAttribute('aria-pressed',state);
 button.title=label+': '+(state==='mixed'?'нет в наличии':state==='true'?'есть в наличии':'не добавлен');
}
function chk3(button){
 if(button.classList.contains('out'))button.classList.remove('out','on');
 else if(button.classList.contains('on')){button.classList.remove('on');button.classList.add('out');}
 else button.classList.add('on');
 optionState(button);
 if(button.dataset.col&&typeof refreshVariantColors==='function')refreshVariantColors(button.dataset.col);
}
function productOptions(kind,product){
 const defaults=kind==='sizes'?ALLSIZES:ALLCOLORS;
 return [...new Set([...defaults,...PRODUCTS.flatMap(p=>p[kind]||[]),...(product?.[kind]||[])].filter(x=>typeof x==='string'&&x.trim()))];
}
function addProductOption(kind){
 const size=kind==='sizes',input=document.getElementById(size?'f_new_size':'f_new_color');
 let value=input.value.trim().replace(/\s+/g,' ');if(size)value=value.toUpperCase();
 if(!value){toast(size?'Введите размер':'Введите название цвета');input.focus();return;}
 if(value.length>(size?24:40)){toast('Название слишком длинное');input.focus();return;}
 const box=document.getElementById(size?'f_sizes':'f_colors'),key=size?'sz':'col';
 let button=[...box.querySelectorAll('.chk')].find(x=>x.dataset[key].toLocaleLowerCase('ru')===value.toLocaleLowerCase('ru'));
 if(!button){button=document.createElement('button');button.type='button';button.className='chk';button.dataset[key]=value;button.textContent=value;button.onclick=()=>chk3(button);box.append(button);}
 button.classList.remove('out');button.classList.add('on');optionState(button);input.value='';input.focus();if(kind==='colors'&&typeof refreshVariantColors==='function')refreshVariantColors(value);
}
function colorSwatch(name){
 const palette={...COLORS,'Бордовый':'#742739','Красный':'#b52c36','Синий':'#345c9c','Голубой':'#78b3d3','Бежевый':'#c9b698','Розовый':'#d99caf','Фиолетовый':'#76558e','Оранжевый':'#d88a36','Жёлтый':'#d6b64c'};
 const normalize=v=>String(v).toLocaleLowerCase('ru').replace(/ё/g,'е');
 const found=Object.entries(palette).find(([key])=>normalize(key)===normalize(name));
 return found?found[1]:'#888888';
}
