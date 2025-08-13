// import { getMetadata } from '../../scripts/aem.js';
import { isAuthorEnvironment, moveInstrumentation } from '../../scripts/scripts.js';

/**
 *
 * @param {Element} block
 */
export default async function decorate(block) {
  // Note: Hard-coded for demo purposes
  const aemauthorurl = 'https://author-p128727-e1256870.adobeaemcloud.com';
  const aempublishurl = 'https://publish-p128727-e1256870.adobeaemcloud.com';
  const persistedquery = '/graphql/execute.json/united-airlines/teaserByPath';

  const contentPath = block.querySelector(':scope div:nth-child(1) > div a')?.textContent?.trim();

  const variationname =
    block
      .querySelector(':scope div:nth-child(2) > div')
      ?.textContent?.trim()
      ?.toLowerCase()
      ?.replace(' ', '_') || 'master';

  
  block.innerHTML = ``;

  const isAuthor = isAuthorEnvironment();
  const url = window?.location?.origin?.includes('author')
    ? `${aemauthorurl}${persistedquery};path=${contentPath};variation=${variationname};ts=${
        Math.random() * 1000
      }`
    : `${aempublishurl}${persistedquery};path=${contentPath};variation=${variationname};ts=${
        Math.random() * 1000
      }`;
  const options = { credentials: 'include' };

  const cfReq = await fetch(url, options)
    .then((response) => response.json())
    .then((contentfragment) => {
      let data = '';
      if (contentfragment.data) {
        data = contentfragment.data[Object.keys(contentfragment.data)[0]].item;
      }
      return data;
    });
  const itemId = `urn:aemconnection:${contentPath}/jcr:content/data/${variationname}`;

  block.setAttribute('data-aue-type', 'container');
  block.innerHTML = `
  <div class='block' data-aue-resource=${itemId} data-aue-label='Teaser' data-aue-type='reference' data-aue-filter='cf'>
		<div class='card-body-content'>
        <p data-aue-prop='pretitle' data-aue-label='Pre-Title' data-aue-type='text' class='pretitle'>${
          cfReq?.pretitle
        }</p>
        <h2 data-aue-prop='title' data-aue-label='Title' data-aue-type='text' class='title'>${
          cfReq?.title
        }</h2>
        <p data-aue-prop='description' data-aue-label='Description' data-aue-type='richtext' class='description'>${
          cfReq?.description?.plaintext
        }</p>
        <div data-aue-prop='image' data-aue-label='Image' data-aue-type='richtext' class='card-body-image'>
          <img src='${cfReq?.image?._publishUrl}' title='${cfReq?.title}'/>
        </div>
        <p data-aue-prop='ctaLabel' data-aue-label='CTA' data-aue-type='text' class='cta-link'>
          <a class='button' href='${cfReq?.ctaUrl}' target='_blank'>${cfReq?.ctaLabel}</a>
        </p>
    </div>
  </div>
	`;

  if (!isAuthor) {
    moveInstrumentation(block, null);
    block.querySelectorAll('*').forEach((elem) => moveInstrumentation(elem, null));
  }
}