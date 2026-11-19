/* Наличие и фотографии отдельного цвета. Старые карточки используют общие данные. */
function colorVariant(product,color){return Array.isArray(product?.variants)?product.variants.find(v=>v&&v.color===color)||null:null;}
function colorSizes(product,color){const variant=colorVariant(product,color);return variant?(Array.isArray(variant.sizes)?variant.sizes:[]):(product.sizes||[]);}
function variantSizeAvailable(product,size,color){
 if(!product||(product.colorsOut||[]).includes(color)||!(product.colors||[]).includes(color)||!colorSizes(product,color).includes(size))return false;
 const stock=colorVariant(product,color)?.stock||product.stock||{};
 return !Object.prototype.hasOwnProperty.call(stock,size)||Number(stock[size])>0;
}
function variantColorAvailable(product,color){return colorSizes(product,color).some(size=>variantSizeAvailable(product,size,color));}
function variantImages(product,color){
 const variant=colorVariant(product,color),images=(variant?.images||[]).filter(src=>typeof src==='string'&&src&&src!==PLACEHOLDER);
 if(images.length)return images;
 if(variant?.useProductImages===false)return [PLACEHOLDER];
 const shared=(product.images||[]).filter(src=>src&&src!==PLACEHOLDER);
 return shared.length?shared:[PLACEHOLDER];
}
function productCover(product,index=0){
 const shared=(product.images||[]).filter(src=>src&&src!==PLACEHOLDER);
 const images=shared.length?shared:variantImages(product,firstColor(product));
 return images[index]||images[0]||PLACEHOLDER;
}
let VARIANT_EDITOR=null;
function variantEditorStart(product){
 const sizeField=document.getElementById('f_sizes')?.closest('.fld');if(sizeField)sizeField.hidden=true;
 VARIANT_EDITOR={product:clone(product),variants:[],color:null,busy:0,generation:PHOTO_GEN};
 refreshVariantColors();
}
function editorVariant(color){
 let variant=VARIANT_EDITOR.variants.find(v=>v.color===color);if(variant)return variant;
 const product=VARIANT_EDITOR.product,existing=colorVariant(product,color),legacy=(product.colors||[]).includes(color);
 variant={color,sizes:[...(existing?existing.sizes||[]:legacy?product.sizes||[]:[])],stock:clone(existing?existing.stock||{}:legacy?product.stock||{}:{}),images:[...(existing?.images||[])],originalImages:(existing?.images||[]).map((src,i)=>existing?.originalImages?.[i]||src),useProductImages:existing?existing.useProductImages!==false:legacy};
 VARIANT_EDITOR.variants.push(variant);return variant;
}
function selectedEditorColors(){return [...document.querySelectorAll('#f_colors .chk.on,#f_colors .chk.out')].map(button=>button.dataset.col);}
function refreshVariantColors(preferred){
 const root=document.getElementById('variantEditor');if(!root||!VARIANT_EDITOR)return;
 const colors=selectedEditorColors();colors.forEach(editorVariant);
 if(preferred&&colors.includes(preferred))VARIANT_EDITOR.color=preferred;
 else if(!colors.includes(VARIANT_EDITOR.color))VARIANT_EDITOR.color=colors[0]||null;
 const active=VARIANT_EDITOR.color;
 root.innerHTML=`<h3>Размеры и фото по цветам</h3><p class="adm-hint">Выберите цвет. Его размеры и фотографии сохраняются отдельно. В конце нажмите «Сохранить» в карточке.</p><div class="variant-tabs">${colors.map(color=>`<button type="button" class="chk${color===active?' on':''}" aria-pressed="${color===active}" onclick="selectEditorColor(${jsq(color)})">${esc(color)}</button>`).join('')}</div><div id="variantPanel"></div>`;
 renderVariantPanel();
}
function selectEditorColor(color){if(!VARIANT_EDITOR||!selectedEditorColors().includes(color))return;VARIANT_EDITOR.color=color;refreshVariantColors();}
function renderVariantPanel(){
 const panel=document.getElementById('variantPanel');if(!panel||!VARIANT_EDITOR)return;
 const color=VARIANT_EDITOR.color;if(!color){panel.innerHTML='<p class="adm-hint">Сначала добавьте или выберите цвет выше.</p>';return;}
 const variant=editorVariant(color),busy=VARIANT_EDITOR.busy>0;
 const sizes=[...new Set([...productOptions('sizes',VARIANT_EDITOR.product),...variant.sizes])];
 panel.innerHTML=`<h4>${esc(color)}</h4><div class="fld"><label>Размеры этого цвета</label><div class="chkwrap" id="variantSizes">${sizes.map(size=>{const on=variant.sizes.includes(size),out=on&&Object.prototype.hasOwnProperty.call(variant.stock,size)&&variant.stock[size]<=0;return `<button type="button" class="chk${out?' out':on?' on':''}" data-sz="${esc(size)}" aria-pressed="${out?'mixed':on?'true':'false'}" onclick="toggleVariantSize(this)">${esc(size)}</button>`;}).join('')}</div><div class="option-add"><input class="inp" id="variantNewSize" aria-label="Новый размер выбранного цвета" placeholder="Например, 42 или 4XL" maxlength="24" onkeydown="if(event.key==='Enter'){event.preventDefault();addVariantSize()}"><button type="button" class="adm-mini" onclick="addVariantSize()">Добавить размер</button></div><span class="chk-hint">Есть в наличии. Ещё нажатие: закончился. Ещё нажатие: убрать.</span></div><div class="fld"><label>Фото цвета «${esc(color)}»</label><p class="adm-hint">${variant.images.length?'Первый снимок главный. Снимки можно менять и удалять.':variant.useProductImages?'Пока используются общие фото товара. Загрузите отдельные снимки этого цвета.':'Снимков этого цвета пока нет. Покупатель увидит заглушку.'}</p><div class="variant-photos">${variant.images.map((src,i)=>`<div class="variant-photo"><img id="variantPhoto${i}" alt="${esc(color)}, фото ${i+1}"><div class="variant-photo-actions"><label class="filepick">Заменить<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden ${busy?'disabled':''} onchange="uploadVariantPhotos(this,${i})"></label><button type="button" class="adm-mini" ${busy||i===0?'disabled':''} onclick="mainVariantPhoto(${i})">${i===0?'Главное':'Сделать главным'}</button><button type="button" class="adm-mini" ${busy?'disabled':''} onclick="deleteVariantPhoto(${i})">Удалить</button></div><input class="inp" aria-label="Ссылка на фото ${i+1} цвета ${esc(color)}" value="${esc(src.startsWith('data:')?IMG_MARK:src)}" ${busy?'disabled':''} onchange="replaceVariantURL(this,${i})"></div>`).join('')}</div><label class="filepick">${busy?'Загружаю фото...':'Добавить фотографии'}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple hidden ${busy||variant.images.length>=8?'disabled':''} onchange="uploadVariantPhotos(this)"></label><div class="option-add"><input class="inp" id="variantNewURL" aria-label="Ссылка на новое фото выбранного цвета" placeholder="https://..." ${busy?'disabled':''}><button type="button" class="adm-mini" ${busy?'disabled':''} onclick="addVariantURL()">Добавить ссылку</button></div><span class="chk-hint">До 8 снимков на цвет. Фотографии загружаются без удаления фона и обрезки.</span>${!variant.images.length?`<button type="button" class="adm-mini" onclick="toggleSharedVariantPhotos()">${variant.useProductImages?'Не использовать общие фото':'Использовать общие фото'}</button>`:''}</div>`;
 variant.images.forEach((src,i)=>{const image=document.getElementById('variantPhoto'+i);if(image)image.src=src;});
}
function toggleVariantSize(button){
 chk3(button);const variant=editorVariant(VARIANT_EDITOR.color),size=button.dataset.sz;
 if(button.classList.contains('on')||button.classList.contains('out')){if(!variant.sizes.includes(size))variant.sizes.push(size);variant.stock[size]=button.classList.contains('out')?0:Math.max(1,Number(variant.stock[size])||1);}
 else{variant.sizes=variant.sizes.filter(value=>value!==size);delete variant.stock[size];}
}
function addVariantSize(){
 const input=document.getElementById('variantNewSize'),size=input.value.trim().replace(/\s+/g,' ').toUpperCase();if(!size||size.length>24){toast('Введите размер, до 24 символов');return;}
 const variant=editorVariant(VARIANT_EDITOR.color);if(!variant.sizes.includes(size))variant.sizes.push(size);variant.stock[size]=1;renderVariantPanel();
}
function variantPhotoTarget(){return VARIANT_EDITOR&&VARIANT_EDITOR.color?editorVariant(VARIANT_EDITOR.color):null;}
function allowedVariantURL(value){return /^https:\/\/[^\s<>"']+$/i.test(value)||/^images\/[a-zA-Z0-9_./-]+$/.test(value)&&!value.includes('..');}
function addVariantURL(){const variant=variantPhotoTarget(),input=document.getElementById('variantNewURL'),src=input?.value.trim();if(!variant||VARIANT_EDITOR.busy)return;if(variant.images.length>=8){toast('Для этого цвета уже добавлено 8 фото');return;}if(!allowedVariantURL(src||'')){toast('Вставьте ссылку https:// или загрузите фото файлом');return;}variant.images.push(src);variant.originalImages.push(src);variant.useProductImages=false;renderVariantPanel();}
function replaceVariantURL(input,index){const variant=variantPhotoTarget();if(!variant||VARIANT_EDITOR.busy)return;const src=input.value.trim();if(src===IMG_MARK)return;if(!allowedVariantURL(src)){toast('Вставьте ссылку https:// или замените фото файлом');renderVariantPanel();return;}variant.images[index]=src;variant.originalImages[index]=src;variant.useProductImages=false;renderVariantPanel();}
function deleteVariantPhoto(index){const variant=variantPhotoTarget();if(!variant||VARIANT_EDITOR.busy)return;variant.images.splice(index,1);variant.originalImages.splice(index,1);variant.useProductImages=false;renderVariantPanel();}
function mainVariantPhoto(index){const variant=variantPhotoTarget();if(!variant||VARIANT_EDITOR.busy||index<1||index>=variant.images.length)return;variant.images.unshift(variant.images.splice(index,1)[0]);variant.originalImages.unshift(variant.originalImages.splice(index,1)[0]);renderVariantPanel();}
function toggleSharedVariantPhotos(){const variant=variantPhotoTarget();if(!variant)return;variant.useProductImages=!variant.useProductImages;renderVariantPanel();}
async function uploadVariantPhotos(input,replaceIndex){
 const editor=VARIANT_EDITOR,variant=variantPhotoTarget(),files=[...(input.files||[])];input.value='';if(!editor||!variant||!files.length||editor.busy)return;
 const replacing=Number.isInteger(replaceIndex),remaining=8-variant.images.length;
 if(!replacing&&files.length>remaining){toast('Можно добавить ещё '+remaining+' фото. Выберите меньше файлов.');return;}
 const generation=PHOTO_GEN;editor.busy++;mediaBusy(1);renderVariantPanel();
 try{for(const file of replacing?files.slice(0,1):files){const url=URL.createObjectURL(file);try{const canvas=await canvasImage(url,1400);if(generation!==PHOTO_GEN||VARIANT_EDITOR!==editor)return;const src=canvasURL(canvas);if(replacing){variant.images[replaceIndex]=src;variant.originalImages[replaceIndex]=src;}else{variant.images.push(src);variant.originalImages.push(src);}variant.useProductImages=false;}finally{URL.revokeObjectURL(url);}}if(generation===PHOTO_GEN)toast('Фотографии цвета загружены');}
 catch(_){if(generation===PHOTO_GEN)toast('Не удалось загрузить часть фото. Успешно загруженные снимки сохранены в редакторе.');}
 finally{editor.busy=Math.max(0,editor.busy-1);if(generation===PHOTO_GEN){mediaBusy(-1);if(VARIANT_EDITOR===editor)renderVariantPanel();}}
}
function serializeColorVariants(){
 if(!VARIANT_EDITOR)return null;
 const colors=selectedEditorColors(),variants=colors.map(color=>clone(editorVariant(color))),out=[...document.querySelectorAll('#f_colors .chk.out')].map(button=>button.dataset.col);
 const sizes=[...new Set(variants.flatMap(variant=>variant.sizes))],stock=Object.create(null);
 sizes.forEach(size=>stock[size]=Math.max(0,...variants.filter(variant=>!out.includes(variant.color)&&variant.sizes.includes(size)).map(variant=>Number(variant.stock[size]??1)||0)));
 return {variants,sizes,stock};
}
