import fs from "fs";

enum Algorithms {
	ChunksAndSummaries = "chunks-and-summaries",
	ChunksOnly = "chunks-only",
	SummariesThenChunks = "summaries-then-chunks",
}

const availableAlgorithms = [
	{
		temperature: 0,
		match_threshold: 0.85,
		num_probes: 8,
		openai_model: "gpt-3.5-turbo-16k",
		document_limit: 3,
		search_algorithm: Algorithms.ChunksOnly,
		match_count: 64,
		include_summary_in_response_generation: false,
	},
	{
		temperature: 0,
		match_threshold: 0.85,
		num_probes: 8,
		openai_model: "gpt-3.5-turbo-16k",
		chunk_limit: 128,
		summary_limit: 16,
		document_limit: 3,
		search_algorithm: Algorithms.ChunksAndSummaries,
		include_summary_in_response_generation: false,
	},
	{
		temperature: 0,
		match_threshold: 0.85,
		num_probes: 8,
		openai_model: "gpt-3.5-turbo-16k",
		document_limit: 3,
		search_algorithm: Algorithms.SummariesThenChunks,
		match_count: 64,
		include_summary_in_response_generation: false,
	},
];

interface AlgorithmCount {
	algorithm: Algorithms;
	count: number;
}

let counts: Array<AlgorithmCount> = availableAlgorithms.map((alg) => {
	return { algorithm: alg.search_algorithm, count: 0 } as AlgorithmCount;
});

const testQuestions = fs.readFileSync("tests/example_questions.json", "utf-8");
const questions = JSON.parse(testQuestions); //.slice(0, 2);

for (let algIdx = 0; algIdx < availableAlgorithms.length; algIdx++) {
	const algorithm = availableAlgorithms[algIdx];
	console.log(
		`Testing search algorithm "${algorithm.search_algorithm}" with configuration...`,
	);
	console.log(algorithm);

	for (let idx = 0; idx < questions.length; idx++) {
		const question: string = questions[idx].question;
		const groundTruthUrl: string = questions[idx].document;
		const data = await fetch("http://0.0.0.0:8080/vector-search", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ ...algorithm, query: question }),
		});
		const res = await data.json();

		if (res.documentMatches) {
			const foundDocument = res.documentMatches.filter((d: any) => {
				return d.registered_document.source_url.includes(groundTruthUrl);
			})[0];
			if (foundDocument) {
				console.log(
					`✅ Found the expected document ${groundTruthUrl} in search results, documentId=${foundDocument.registered_document.id} with similarity=${foundDocument.similarity}.`,
				);
				counts[algIdx] = {
					algorithm: algorithm.search_algorithm,
					count: counts[algIdx].count + 1,
				};
			} else {
				console.log(
					`❌ Did not find the expected document ${groundTruthUrl} in search results.`,
				);
			}
		} else {
			console.log(
				`❌ Did not find the expected document ${groundTruthUrl} in search results.`,
			);
		}
	}

	console.log(`Tests completed for ${algorithm.search_algorithm}....\n\n`);
}

console.log(`All tests completed, summary:`);
counts.forEach((c) => {
	console.log(
		`Algorithm "${c.algorithm}" has match rate = ${(
			(c.count / questions.length) *
			100
		).toFixed(2)}% on test set of ${questions.length} questions.`,
	);
});
