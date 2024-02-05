import { Readable } from "stream";

export interface LLMClient {
	requestResponseStream: (payload: object) => Promise<Readable>;
}
