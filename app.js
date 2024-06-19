import { saveToMongoDb, client } from './connect.js';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ path: 'secure-key.env' });




const searchEngineKey = process.env.search_engine_key;
const searchEngineId = process.env.search_engine_id;
let news;




// Get NewsAPI response
axios.get('https://newsapi.org/v2/top-headlines?sources=google-news-br&apiKey=6c2697ed284441fd8e4be93de4eda90c')
  .then(async function (response) {
    // Call getLinks
    await getLinks(response.data.articles);
    // News string treatment
    await newsTreatment()
    await searchImage();
    await saveToMongoDb(news);
  })
  .catch(async function (error) {
    // Error
    console.log(error);
  })


// Getting links from NewsAPI url
async function getLinks(newsapi){

  news = newsapi; // Setting NewsAPI articles into news

  // Repeat for all articles
  for (let i = 0; i < newsapi.length; i++) {
      try {
          // Go to Google News url
          const response = await axios.get(newsapi[i].url);

          // Get the real news url
          const $ = cheerio.load(response.data);
          news[i].url = $('[data-n-au]').attr('data-n-au');

          // Get all the text from the url and set it to news content
          news[i].content = await getText(news[i].url);
          // Rewrite all the text with Gemini AI and set it to news content
          news[i].content = await rewriteAI(news[i].content);
      } catch (error) {
          // Error handling
          console.log('Error: ', error);
      }
  }
}

// Getting all text from url
async function getText(url) {
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        let allPText = "";
        $('p').each(function() {
            allPText += $(this).text().trim() + ' '; // Concatenate text with space separator
        });
        return allPText.trim(); // Ensure trailing space is removed
    } catch (error) {
        return "Não escreva absolutamente nada.";
    }
}

// Re write the news from the fullText
async function rewriteAI(fullText, retry = false) {

  // Initialize GoogleGenerativeAI with the API key from environment variables
  const genAI = new GoogleGenerativeAI(process.env.gemini_key);

  // Get the generative model
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  // Define a prompt for the AI
  const prompt = `Você é uma IA encarregada de reescrever o texto de uma notícia encontrada em um documento HTML. Seu objetivo é preservar todas as informações da notícia original enquanto reformula o conteúdo de maneira clara e gramaticalmente correta. Utilize o documento fornecido para extrair o texto da notícia, assegurando que a versão reescrita seja completa e precise em todos os detalhes, sem deixar lacunas como [mês] ou outras informações a serem preenchidas. Formate o texto em parágrafos e ajuste o estilo para refletir o tom e o contexto da notícia original: ${fullText}`;

  try {
    // Generate content based on the prompt
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return text;
  } catch (error) {
    if (error.status == 500 && !retry){
      console.log('Error 500, retrying...');
      await delay(5000); // Wait for 2 seconds before retrying
      return await rewriteAI(fullText, true);// Retrying if error 500
    }else {
      return "Error 500";
    }
  }
}

function newsTreatment(){

  for (let i = 0; i < news.length; i++){
    try{
      // Treating the news title
      news[i].title = news[i].title.slice(0, news[i].title.lastIndexOf('-')).trim();
      
      if (news[i].content.length < 20){
        news.splice(i, 1);
      }
    } catch (error) {
      console.log('Error: ', error);
    }
    
  }
}

async function searchImage() {

  for (let i = 0; i < news.length; i++){

    const query = news[i].title;
    const relatedSite = news[i].url;

    try{

      const url = `https://www.googleapis.com/customsearch/v1?key=${searchEngineKey}&cx=${searchEngineId}&q=${query}&num=1&searchType=image`;
      try {
        const response = await axios.get(url);
        const results = response.data.items;

        console.log(news[i].title);
        console.log(results[0].link);
        news[i].urlToImage = results[0].link;

      } catch (error) {
        console.error('Error making search request:', error);
      }

    }catch (error) {
      console.log('For error: ', error);
    }

  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
