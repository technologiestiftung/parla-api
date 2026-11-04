import { writeFile } from "fs/promises";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { testSearchQuery } from "./fixtures.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
async function main() {
	const response = await fetch(`${process.env.LLM_BASE_URL}/embeddings`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${process.env.LLM_API_KEY}`,
		},
		body: JSON.stringify({
			input: testSearchQuery,
			model: process.env.LLM_EMBEDDING_MODEL,
		}),
	});
	if (response.ok) {
		const json = await response.json();
		await writeFile(
			resolve(__dirname, "./embeddings.json"),
			JSON.stringify(json),
			"utf-8",
		);
	} else {
		throw new Error(response.statusText);
	}
}

main().catch(console.error);
