const puppeteer = require('puppeteer');

let highlightNews = [];
let allNews = [];

async function scrap() {

	//Browser and page config
	const browser = await puppeteer.launch();
	const page = await browser.newPage();

	//What page go
	await page.goto('https://www.cnnbrasil.com.br');
	
	//Getting The highlights divs
	const highlights = await page.$$('.three__highlights__titles');

	//Putting into highlightNnews
	for (i of highlights){

		//Var for store the news
		let news = {
			title: "",
			href: "",
			image: "",
			relatedHref: [],
		}

		//Get the title
		const h2 = await i.$('h2'); 
		news.title = await page.evaluate(h => h.textContent, h2);
		//Get the link
		const a = await i.$('a');
		news.href = await page.evaluate(anchor => anchor.getAttribute('href'), a);
		//Get the image
		const img = await i.$('img');
		news.image = await page.evaluate(imageEl => imageEl.getAttribute('src'), img);

		//Get the related News Href
		const relatedNews = await i.$$('.block__news__related');
		for (aux of relatedNews){
			//Push Links to news
			const relatedA = await aux.$('a');
			news.relatedHref.push(await page.evaluate(relatedAnchor => relatedAnchor.getAttribute('href'), relatedA));
		}


		//Push it
		highlightNews.push(news);
	}

	//Getting the all news divs
	let blockNewsList = await page.$$('.block__news__list');
	blockNewsList = blockNewsList.slice(0, 4);
	
	//Putting into allNews
	for (i of blockNewsList){

		//Getting the news list
		const newsList = await i.$$('.block__news__item');
		//Selecting all single news and putting into allNews
		for (aux of newsList){

			let news = {
				title: "",
				href: "",
				image: "",
			}

			//Getting the title
			const h3 = await aux.$('h3');
			news.title = await page.evaluate( h => h.textContent, h3);
			//Getting the href
			const a = await aux.$('a');
			news.href = await page.evaluate(anchor => anchor.getAttribute('href'), a);
			//Getting the img just if there is
			const img = await aux.$('img');
			if(img){
				news.image = await page.evaluate(imageEl => imageEl.getAttribute('src'), img)
			};

			allNews.push(news);
		}
	}


	for (let i = 0; i < allNews.length; i++){

		await page.goto(allNews[i].href);

		const p = await page.$$('.post__content p');
		
		allNews[i].text = "";
		for (aux of p){
			allNews[i].text += await page.evaluate(paragraph => paragraph.innerText, aux);
		}

	}
	


	await browser.close();
	console.log(allNews);

}



scrap();
