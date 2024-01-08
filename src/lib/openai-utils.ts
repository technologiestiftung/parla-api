import {
	createParser,
	ParsedEvent,
	ReconnectInterval,
} from "eventsource-parser";
import { OpenAIChatCompletionRequest } from "./common.js";

export async function OpenAIStream(
	payload: OpenAIChatCompletionRequest,
	openAiKey: string,
) {
	const encoder = new TextEncoder();
	const decoder = new TextDecoder();
	let counter = 0;
	const response = await fetch("https://api.openai.com/v1/chat/completions", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${openAiKey}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify(payload),
	});

	const stream = new ReadableStream({
		async start(controller) {
			function onParse(event: ParsedEvent | ReconnectInterval) {
				if (event.type === "event") {
					const data = event.data;
					if (data === "[DONE]") {
						controller.close();
						return;
					}
					try {
						const json = JSON.parse(data);
						const text = json.choices[0].delta?.content ?? "";
						console.log(text);
						if (counter < 2 && (text.match(/\n/) || []).length) {
							// this is a prefix character (i.e., "\n\n"), do nothing
							return;
						}
						const queue = encoder.encode(text);
						controller.enqueue(queue);
						counter++;
					} catch (err) {
						controller.error(err);
					}
				}
			} // end onParse

			const parser = createParser(onParse);
			for await (const chunk of response.body as any) {
				parser.feed(decoder.decode(chunk));
			}
		}, // end start
	});
	return stream;
}
