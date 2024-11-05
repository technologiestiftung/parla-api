import { RegisteredDocument } from "./common.js";

function parseDate(input: string) {
	const parts = input.match(/(\d+)/g);
	if (parts === null) {
		return "";
	}
	return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
}

// eslint-disable-next-line complexity
export function getCleanedMetadata(registeredDocument: RegisteredDocument) {
	const metadata =
		typeof registeredDocument?.metadata === "object" &&
		registeredDocument.metadata !== null
			? registeredDocument.metadata
			: {};
	const type = registeredDocument?.source_type;
	const schriftlicheAnfrageTitle =
		"Titel" in metadata && Array.isArray(metadata.Titel)
			? `${metadata.Titel[0]}`
			: undefined;
	const hauptAusschussProtokollTitle =
		"title" in metadata && typeof metadata.title === "string"
			? `${metadata.title}`
			: undefined;
	const title =
		type === "Hauptausschussprotokoll"
			? hauptAusschussProtokollTitle
			: schriftlicheAnfrageTitle;

	const pdfUrl = registeredDocument?.source_url;
	const documentName =
		type === "Webseite"
			? "title" in metadata &&
				typeof metadata.title === "string" &&
				metadata.title
			: pdfUrl?.split("/").slice(-1)[0];

	const documentDate =
		"DokDat" in metadata && Array.isArray(metadata.DokDat)
			? metadata.DokDat[0]
			: undefined;

	const dateFromTitle =
		type === "Hauptausschussprotokoll"
			? title?.match(/\d{2}\.\d{2}\.\d{4}/)?.[0]
			: "";

	const formattedDate = parseDate(
		String(documentDate ?? dateFromTitle),
	).toLocaleString("de-DE", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});

	return {
		title: title?.replace(/<\/?[^>]+(>|$)/g, " ∙ "),
		pdfUrl,
		documentName,
		type,
		formattedDate,
	};
}
