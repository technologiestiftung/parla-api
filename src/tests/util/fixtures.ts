import testEmbeddingResponse from "./embeddings.json" assert { type: "json" };
import testGenAnswerReqBody from "./generate-answer-req-body.json" assert { type: "json" };
import testAnswer from "./answer.json" assert { type: "json" };
const testEmbedding: number[] = testEmbeddingResponse.data[0].embedding;

const testSearchQuery = "Wann kommen die Solaranlagen nach Pankow?";
const testSearchQueryFlagged = "profanity";
const testModerationResponse = {
	id: "modr-8RG0mWuGNr9iNgOS3NOKFy9EOXXTJ",
	model: "text-moderation-006",
	results: [
		{
			flagged: false,
			categories: {
				sexual: false,
				hate: false,
				harassment: false,
				"self-harm": false,
				"sexual/minors": false,
				"hate/threatening": false,
				"violence/graphic": false,
				"self-harm/intent": false,
				"self-harm/instructions": false,
				"harassment/threatening": false,
				violence: false,
			},
			category_scores: {
				sexual: 7.6275423452898394e-6,
				hate: 0.00018050531798508018,
				harassment: 0.00006977801240282133,
				"self-harm": 7.8282550930453e-7,
				"sexual/minors": 9.998919949794072e-7,
				"hate/threatening": 0.00002451168984407559,
				"violence/graphic": 1.8784436406349414e-7,
				"self-harm/intent": 9.122623545465558e-9,
				"self-harm/instructions": 2.8750774205832386e-8,
				"harassment/threatening": 0.00007345735502894968,
				violence: 0.0001552872417960316,
			},
		},
	],
};

export {
	testEmbedding,
	testSearchQuery,
	testSearchQueryFlagged,
	testModerationResponse,
	testEmbeddingResponse,
	testAnswer,
	testGenAnswerReqBody,
};
