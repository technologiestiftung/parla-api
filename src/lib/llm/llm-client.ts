import { Readable } from "stream";

export interface LLMClient {
	requestResponseStream: (
		payload: object,
		deltaCallback: (delta: string) => void,
	) => Promise<Readable>;
}
