import {
	Model,
	ResponseDetail,
	ResponseSectionDocument,
	ResponseSectionReport,
} from "./common.js";
import { createPrompt } from "./create-prompt.js";
import { ApplicationError } from "./errors.js";
import supabase from "./supabase.js";

export async function similaritySearch(
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
		await supabase.rpc("match_parsed_dokument_sections", {
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

	// make the similarity search for red reports
	const { error: matchReportSectionError, data: similarReportSections } =
		await supabase.rpc("match_parsed_red_number_report_sections", {
			embedding,
			match_threshold,
			match_count,
			min_content_length,
			num_probes,
		});
	if (matchReportSectionError) {
		throw new ApplicationError(
			"Failed to match page sections",
			matchReportSectionError,
		);
	}

	// find parsed document sections
	const { error: sectionsError, data: sections } = await supabase
		.from("parsed_document_sections")
		.select("content,id,parsed_document_id,page,token_count")
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

	// find parsed report sections
	const { error: reportSectionsError, data: reportSections } = await supabase
		.from("parsed_red_number_report_sections")
		.select("content,id,parsed_red_number_report_id,page,token_count")
		.in(
			"id",
			similarReportSections.map((section) => section.id),
		);

	if (reportSectionsError) {
		throw new ApplicationError(
			"Failed to match pages to pageSections",
			reportSectionsError,
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
		reportSections: reportSections.map((section) => {
			const docSection = similarReportSections.find(
				(sec) => section.id === sec.id,
			);
			return {
				similarity: docSection?.similarity ?? 0,
				...section,
			};
		}),
	};

	// match documents to document pdfs
	const { error: docsError, data: docs } = await supabase
		.from("parsed_documents")
		.select("*")
		.in(
			"id",
			sections.map((section) => section.parsed_document_id),
		);
	if (docsError) {
		throw new ApplicationError("Failed to match docsSections to docs");
	}
	responseDetail.sections.forEach((section) => {
		section.parsed_documents = docs.filter(
			(doc) => doc.id === section.parsed_document_id,
		);
	});

	// match documents to report pdfs
	const { error: reportDocsError, data: reportDocs } = await supabase
		.from("parsed_red_number_reports")
		.select("*")
		.in(
			"id",
			reportSections.map((section) => section.parsed_red_number_report_id),
		);

	if (reportDocsError) {
		throw new ApplicationError("Failed to match docsSections to docs");
	}
	responseDetail.reportSections.forEach((section) => {
		section.parsed_red_number_reports = reportDocs.filter(
			(doc) => doc.id === section.parsed_red_number_report_id,
		);
	});

	// match pdfs
	const { error: pdfError, data: pdfs } = await supabase
		.from("dokument")
		.select("*")
		.in(
			"id",
			docs.map((doc) => doc.dokument_id),
		);
	if (pdfError) {
		throw new ApplicationError("Failed to match docs to pdfs");
	}
	responseDetail.sections.forEach((section) => {
		section.pdfs = pdfs.filter(
			(pdf) =>
				section.parsed_documents
					?.map((doc) => doc.dokument_id)
					.includes(pdf.id),
		);
	});

	// match pdfs for reports
	const { error: pdfReportError, data: reportPdfs } = await supabase
		.from("red_number_reports")
		.select("*")
		.in(
			"id",
			reportDocs.map((doc) => doc.red_number_report_id),
		);
	if (pdfReportError) {
		throw new ApplicationError("Failed to match docs to pdfs");
	}
	responseDetail.reportSections.forEach((section) => {
		section.pdfs = reportPdfs.filter(
			(pdf) =>
				section.parsed_red_number_reports
					?.map((doc) => doc.red_number_report_id)
					.includes(pdf.id),
		);
	});

	const combinedSections: Array<
		ResponseSectionDocument | ResponseSectionReport
	> = responseDetail.sections.concat(responseDetail.reportSections as any);
	const sortedSections = combinedSections
		.sort((l, r) => ((l.similarity ?? 0) < (r.similarity ?? 0) ? 1 : -1))
		.slice(0, match_count);

	const bestDocumentSections = sortedSections.filter(
		(s) => (s as ResponseSectionDocument).parsed_document_id,
	);
	const bestReportSections = sortedSections.filter(
		(s) => (s as ResponseSectionReport).parsed_red_number_report_id,
	);

	responseDetail.sections =
		bestDocumentSections as Array<ResponseSectionDocument>;
	responseDetail.reportSections =
		bestReportSections as Array<ResponseSectionReport>;

	console.log(responseDetail);

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
