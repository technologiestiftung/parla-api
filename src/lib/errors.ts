export class ApplicationError extends Error {
	constructor(
		message: string,
		public data: Record<string, unknown> = {},
	) {
		super(message);
	}
}

export type OpenAIendpointTypes =
	| "moderation"
	| "embeddings"
	| "chat/completions";

export interface OpenAIErrorData {
	endpoint: OpenAIendpointTypes;
	status: number;
	statusText: string;
	userRequestId?: string;
}

export class OpenAIError extends Error {
	constructor(
		message: string,
		public data: OpenAIErrorData,
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
