import { writeFile } from "fs/promises";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { testSearchQuery } from "./fixtures.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
async function main() {
	const response = await fetch("https://api.openai.com/v1/embeddings", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${process.env.OPENAI_KEY}`,
		},
		body: JSON.stringify({
			input: testSearchQuery,
			model: "text-embedding-ada-002",
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
