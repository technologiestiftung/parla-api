import { Model, ResponseDetail, ResponseSectionDocument } from "./common.js";
import { createPrompt } from "./create-prompt.js";
import { ApplicationError } from "./errors.js";
import supabase from "./supabase.js";

export async function similaritySearch(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	embedding: any,
	match_threshold: number,
	match_count: number,
	min_content_length: number,
	num_probes: number,
	sanitizedQuery: string,
	MAX_CONTENT_TOKEN_LENGTH: number,
	OPENAI_MODEL: Model,
	MAX_TOKENS: number,
) {
	// make the similarity search for documents
	const { error: matchSectionError, data: similarDocSections } =
		await supabase.rpc("match_document_chunks", {
			embedding,
			match_threshold,
			match_count,
			min_content_length,
			num_probes,
		});
	if (matchSectionError) {
		throw new ApplicationError(
			"Failed to match page sections",
			matchSectionError,
		);
	}

	// find parsed document sections
	const { error: sectionsError, data: sections } = await supabase
		.from("processed_document_chunks")
		.select("content,id,processed_document_id,page")
		.in(
			"id",
			similarDocSections.map((section) => section.id),
		);

	if (sectionsError) {
		throw new ApplicationError(
			"Failed to match pages to pageSections",
			sectionsError,
		);
	}

	const responseDetail: ResponseDetail = {
		sections: sections.map((section) => {
			const docSection = similarDocSections.find(
				(sec) => section.id === sec.id,
			);
			return {
				similarity: docSection?.similarity ?? 0,
				...section,
			};
		}),
	};

	// match documents to document
	const { error: docsError, data: docs } = await supabase
		.from("processed_documents")
		.select("*")
		.in(
			"id",
			sections.map((section) => section.processed_document_id),
		);
	if (docsError) {
		throw new ApplicationError("Failed to match docsSections to docs");
	}
	responseDetail.sections.forEach((section) => {
		section.processed_documents = docs.filter(
			(doc) => doc.id === section.processed_document_id,
		);
	});

	// match registered documents
	const { error: registered_documents_error, data: registerd_documents } =
		await supabase
			.from("registered_documents")
			.select("*")
			.in(
				"id",
				docs.map((doc) => doc.registered_document_id),
			);
	if (registered_documents_error) {
		throw new ApplicationError(
			"Failed to match processed documents to registered documents",
		);
	}
	responseDetail.sections.forEach((section) => {
		section.registered_documents = registerd_documents.filter(
			(reg_doc) =>
				section.processed_documents
					?.map((doc) => doc.registered_document_id)
					.includes(reg_doc.id),
		);
	});

	const combinedSections: Array<ResponseSectionDocument> =
		responseDetail.sections;
	const sortedSections = combinedSections
		.sort((l, r) => ((l.similarity ?? 0) < (r.similarity ?? 0) ? 1 : -1))
		.slice(0, match_count);

	const bestDocumentSections = sortedSections.filter(
		(s) => (s as ResponseSectionDocument).processed_document_id,
	);

	responseDetail.sections =
		bestDocumentSections as Array<ResponseSectionDocument>;

	const completionOptions = createPrompt({
		sections: sortedSections,
		MAX_CONTENT_TOKEN_LENGTH,
		OPENAI_MODEL,
		sanitizedQuery,
		MAX_TOKENS,
	});
	responseDetail.completionOptions = completionOptions;
	return responseDetail;
}
