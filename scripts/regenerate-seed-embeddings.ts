// Regenerates the embeddings of the chunks and summaries in supabase/seed.sql with the model set in
// LLM_EMBEDDING_MODEL and writes them back into the file. Needed whenever the embedding model (and with it
// the vector dimension of the embedding columns) changes.
// Run with the target provider's env: LLM_BASE_URL, LLM_API_KEY, LLM_EMBEDDING_MODEL.
// Afterwards regenerate src/tests/util/embeddings.json with src/tests/util/create-embedding.ts.
import { readFile, writeFile } from "fs/promises";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const seedPath = resolve(__dirname, "../supabase/seed.sql");

// Matches seed rows of the form (id, 'text', '[vector]' ...), as used for
// processed_document_chunks (content, embedding) and processed_document_summaries (summary, summary_embedding).
// SQL string literals escape a single quote by doubling it.
const rowWithEmbeddingPattern = /\((\d+), '((?:[^']|'')*)', '\[[^\]]*\]'/g;

interface EmbeddingResponse {
	data: Array<{ index: number; embedding: number[] }>;
}

function getRequiredEnv(name: string): string {
	const value = process.env[name];
	if (!value) {
		throw new Error(`Missing env variable ${name}`);
	}
	return value;
}

async function main() {
	const baseUrl = getRequiredEnv("LLM_BASE_URL");
	const apiKey = getRequiredEnv("LLM_API_KEY");
	const embeddingModel = getRequiredEnv("LLM_EMBEDDING_MODEL");

	const seed = await readFile(seedPath, "utf-8");
	const rows = [...seed.matchAll(rowWithEmbeddingPattern)].map(
		([, id, escapedText]) => ({
			id,
			text: escapedText.replaceAll("''", "'"),
		}),
	);
	if (rows.length === 0) {
		throw new Error("No rows with embeddings found in seed.sql");
	}
	console.log(
		`Embedding ${rows.length} seed rows (ids ${rows.map(({ id }) => id).join(", ")}) with ${embeddingModel} via ${baseUrl}`,
	);

	const response = await fetch(`${baseUrl}/embeddings`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`,
		},
		body: JSON.stringify({
			model: embeddingModel,
			input: rows.map(({ text }) => text),
		}),
	});
	if (!response.ok) {
		throw new Error(
			`Embedding request failed: ${response.status} ${await response.text()}`,
		);
	}
	const { data } = (await response.json()) as EmbeddingResponse;
	const embeddings = [...data]
		.sort((left, right) => left.index - right.index)
		.map(({ embedding }) => embedding);
	if (embeddings.length !== rows.length) {
		throw new Error(
			`Expected ${rows.length} embeddings, got ${embeddings.length}`,
		);
	}

	let rowIndex = 0;
	const updatedSeed = seed.replace(
		rowWithEmbeddingPattern,
		(_match, id: string, escapedText: string) => {
			const embedding = embeddings[rowIndex];
			rowIndex++;
			return `(${id}, '${escapedText}', '[${embedding.join(",")}]'`;
		},
	);

	await writeFile(seedPath, updatedSeed, "utf-8");
	console.log(
		`Wrote ${embeddings.length} embeddings with ${embeddings[0].length} dimensions to ${seedPath}`,
	);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
