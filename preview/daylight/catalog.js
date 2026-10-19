const catalogEscape = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

/** A keyboard-accessible product index; copy comes from the approved product data. */
export function catalogMarkup(products, en, glyph, sceneArt) {
  const language = en ? 1 : 0;
  const learn = en ? 'Explore product' : '了解产品';
  const illustration = en ? 'WORKFLOW ILLUSTRATION' : '场景示意';

  return `<div class="catalog" aria-label="${en ? 'Product family' : '产品家族'}">${products.map((product, index) => {
    const features = en ? product.featuresEn : product.features;
    return `<details class="catalog-entry" name="product-family" id="${catalogEscape(product.id)}"${index === 0 ? ' open' : ''}>
      <summary class="catalog-summary">
        <span class="catalog-number">${String(index + 1).padStart(2, '0')}</span>
        <span class="catalog-identity"><strong>${catalogEscape(product.name)}</strong><span>${catalogEscape(product.label[language])}</span></span>
        <span class="catalog-value">${catalogEscape(product.short[language])}</span>
        <span class="catalog-glyph" aria-hidden="true">${glyph(index)}</span>
        <span class="catalog-toggle" aria-hidden="true"></span>
      </summary>
      <div class="catalog-body">
        <div class="catalog-content">
          <p class="catalog-description">${catalogEscape(product.description[language])}</p>
          <div class="catalog-tags" aria-label="${en ? 'Key capabilities' : '主要能力'}">${product.tags[language].map(tag => `<span>${catalogEscape(tag)}</span>`).join('')}</div>
          <div class="catalog-features">${features.map(([title, description]) => `<article><h3>${catalogEscape(title)}</h3><p>${catalogEscape(description)}</p></article>`).join('')}</div>
          <button class="catalog-link" type="button" data-product="${index}" aria-label="${learn} ${catalogEscape(product.name)}">${learn}<span aria-hidden="true">↗</span></button>
        </div>
        <div class="catalog-art compact"><span class="catalog-art-label">${illustration}</span>${sceneArt(product.kind, en)}</div>
      </div>
    </details>`;
  }).join('')}</div>`;
}
