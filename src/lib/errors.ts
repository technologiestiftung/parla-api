export class ApplicationError extends Error {
	constructor(
		message: string,
		public data: Record<string, unknown> = {},
	) {
		super(message);
	}
}

export type LLMEndpointTypes = "embeddings" | "chat/completions";

export interface LLMErrorData {
	endpoint: LLMEndpointTypes;
	status: number;
	statusText: string;
	userRequestId?: string;
}

export class LLMError extends Error {
	constructor(
		message: string,
		public data: LLMErrorData,
	) {
		super(message);
	}
}

export class UserError extends ApplicationError {}

export class DatabaseError extends ApplicationError {}

/**
 * Does pretty handling of messages
 */
export class EnvError extends Error {
	constructor(message: string) {
		super(`Env variable "${message}" is not defined`);
	}
}
