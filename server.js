const cheerio = require('cheerio')
const axios = require('axios');
import OpenAI from 'openai';

const client = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY, // This is the default and can be omitted
});

const JSON_SCHEMA = `{
	"matching_publications": {
		"type": "array",
		"items": {
			"type": "object",
    	"properties": {
    		"title": "string",
    		"matching_keywords": {
    			"type": "array",
    			"items": "string"
				}
			}
		}
	}
}`

const express = require('express')
const cors = require('cors');
const app = express();
const port = 8011



const cors_options = {
	origin : ['http://localhost:8010'],
}

app.use(cors(cors_options))
app.use(express.json())

app.post('/find-conference', async (req, res) => {
	const conference_name = req.body.name

	const conferences_response = await axios.get(`https://dblp.org/search/venue/api?q=${conference_name}&format=json`)
	const conferences_response_json = await conferences_response.data

	if (!('hit' in conferences_response_json.result.hits)) {
		res.send([])
		return
	}

	const conferences = conferences_response_json.result.hits.hit.map(conference => conference.info)

	res.send(conferences)
})

app.post('/find-publications', async (req, res) => {
	const conference_acronym = req.body.acronym

	const publications_response = await axios.get(`https://dblp.org/search/publ/api?q=stream%3Astreams%2Fconf%2F${conference_acronym}%3A&h=1000&format=json`)
	const publications_response_json = await publications_response.data

	if (!('hit' in publications_response_json.result.hits)) {
		res.send([])
		return
	}

	const publications = publications_response_json.result.hits.hit.map(publication => publication.info)

	res.send(publications)
})

app.post('/retrieve-abstract', async (req, res) => {
	const doi = req.body.doi

	/*
	const doi_response = await axios.get(
		`https://doi.org/${doi}`,
		{
			withCredentials: true,
			headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
		}
	)
	const doi_response_text = await doi_response.data

	const $ = cheerio.load(doi_response_text)

	let abstract = null

	console.log($('#gs_res_ccl_mid').text())

	if (doi_response.request._redirectable._currentUrl.includes('acm')) {
		const abstract_children = $('#abstract').text()
		console.log(abstract_children)
	}*/

	res.send(doi)
})

app.post('/ask-chat-gpt', async (req, res) => {
	const keywords = req.body.keywords
	const publications = req.body.publications

	const prompt = `Your role is to find scientific publications linked to given keywords. You will only search in the given publication list with the given keyword list.

Keywords:
${keywords}

Scientific publications:
${publications}`

	const chat_completion = await client.chat.completions.create({
		messages: [
			{
				role: 'system',
				content: `You are a helpful assistant designed to output JSON that follows the following json schema:\n${JSON_SCHEMA}`
			},
			{
				role: 'user',
				content: prompt
			}
		],
		model: 'gpt-4o-mini',
		temperature: 0.1,
		top_p: 0.2
	});

	let data = chat_completion.choices[0].message.content

	if (Array.isArray(data)) {
		res.send(data)
	}
	else {
		res.send(data.replace("```json", '').replace('```', ''))
	}

})

app.listen(port, () => {
	console.log(`Example app listening on port ${port}`)
})