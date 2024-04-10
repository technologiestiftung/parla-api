import testEmbeddingResponse from "./embeddings.json" assert { type: "json" };
import testGenAnswerReqBody from "./generate-answer-req-body.json" assert { type: "json" };
import testAnswer from "./answer.json" assert { type: "json" };
const testEmbedding: number[] = testEmbeddingResponse.data[0].embedding;

const testSearchQuery = "Wann kommen die Solaranlagen nach Pankow?";
const testSearchQueryFlagged = "profanity";
const testModerationResponse = {
	id: "modr-8RG0mWuGNr9iNgOS3NOKFy9EOXXTJ",
	model: "text-moderation-006",
	results: [
		{
			flagged: false,
			categories: {
				sexual: false,
				hate: false,
				harassment: false,
				"self-harm": false,
				"sexual/minors": false,
				"hate/threatening": false,
				"violence/graphic": false,
				"self-harm/intent": false,
				"self-harm/instructions": false,
				"harassment/threatening": false,
				violence: false,
			},
			category_scores: {
				sexual: 7.6275423452898394e-6,
				hate: 0.00018050531798508018,
				harassment: 0.00006977801240282133,
				"self-harm": 7.8282550930453e-7,
				"sexual/minors": 9.998919949794072e-7,
				"hate/threatening": 0.00002451168984407559,
				"violence/graphic": 1.8784436406349414e-7,
				"self-harm/intent": 9.122623545465558e-9,
				"self-harm/instructions": 2.8750774205832386e-8,
				"harassment/threatening": 0.00007345735502894968,
				violence: 0.0001552872417960316,
			},
		},
	],
};
const testUserRequestResponse = {
	id: "wR",
	query: "Wann kommen die Solaranlagen nach Pankow?",
	answerResponse: "",
	searchResponse: {
		documentMatches: [
			{
				registered_document: {
					id: 1,
					source_url:
						"https://pardok.parlament-berlin.de/starweb/adis/citat/VT/19/SchrAnfr/S19-10006.pdf",
					source_type: "Schriftliche Anfrage",
					registered_at: "2023-11-08T12:44:58.329",
					metadata: {
						Wp: ["19"],
						Desk: ["Solartechnik"],
						DHerk: ["BLN"],
						DokNr: ["19/10006"],
						Titel: ["Wann kommen die Solaranlagen nach Pankow?"],
						DHerkL: ["Berlin"],
						DokArt: ["Drs"],
						DokDat: ["04.11.2021"],
						DokTyp: ["SchrAnfr"],
						LokURL: [
							"https://pardok.parlament-berlin.de/starweb/adis/citat/VT/19/SchrAnfr/S19-10006.pdf",
						],
						ReihNr: ["0001"],
						DokArtL: ["Drucksache"],
						DokTypL: ["Schriftliche Anfrage"],
						NrInTyp: ["19/10006"],
						Urheber: ["Otto, Andreas (Grüne)"],
					},
				},
				processed_document: {
					id: 5,
					file_checksum: "985b4643bebcc002376dbfe825a04266",
					file_size: 18342,
					num_pages: 4,
					processing_started_at: "2023-11-08T13:01:21.725",
					processing_finished_at: "2023-11-08T13:01:29.302",
					processing_error: "",
					registered_document_id: 1,
				},
				processed_document_summary_match: {
					processed_document_summary: {
						id: 2,
						summary:
							"Das Bezirksamt Pankow plant, bis zum 31. Dezember 2024 Solaranlagen auf allen technisch nutzbaren Dachflächen öffentlicher Gebäude zu installieren. Es gibt etwa 257 solcher Gebäude im Bezirk Pankow. Das Bezirksamt ist für die Umsetzung der Solarpflicht zuständig, aber es gibt auch andere öffentliche Einrichtungen, die Gebäude im Bezirk betreiben und unter die Solarpflicht fallen. Die genaue Größe der Dachflächen ist derzeit nicht bekannt, aber bisher wurden etwa 29.000 m² mit Solaranlagen belegt. Für die Jahre 2021 und 2022 wurden Verträge für 24 PV-Anlagen abgeschlossen, und es werden weitere geeignete Dachflächen gesucht.",
						tags: [
							"Bezirksamt Pankow",
							"Solaranlagen",
							"Dachflächen",
							"öffentliche Gebäude",
							"Solarpflicht",
							"öffentliche Einrichtungen",
							"PV-Anlagen",
							"Verträge",
							"Installation",
							"Bezirk Pankow",
						],
						processed_document_id: 5,
					},
					similarity: 0.900568902492523,
				},
				processed_document_chunk_matches: [
					{
						processed_document_chunk: {
							id: 7,
							content:
								"## 3   Antwort zu 6:   Das Bezirksamt Pankow teilt hierzu mit: „Im Bezirk wurden 2021 Verträge über die Errichtung von 24 PV-Anlagen für die Jahre 2021 und 2022 geschlossen. Parallel dazu werden weitere geeignete Dachflächen eruiert.“   Berlin, den 12.11.2021   In Vertretung   Stefan Tidow Senatsverwaltung für Umwelt, Verkehr und Klimaschutz    ",
							page: 3,
							processed_document_id: 5,
						},
						similarity: 0.886196672916412,
					},
					{
						processed_document_chunk: {
							id: 5,
							content:
								"## 1   Senatsverwaltung für Umwelt, Verkehr und Klimaschutz   Herrn Abgeordneten Andreas Otto (GRÜNE) über den Präsidenten des Abgeordnetenhauses von Berlin   über Senatskanzlei G Sen   **A n t w o r t auf die Schriftliche Anfrage Nr. 19/10006 vom 04.11.2021 über Wann kommen die Solaranlagen nach Pankow?**   Im Namen des Senats von Berlin beantworte ich Ihre Schriftliche Anfrage wie folgt:   Vorbemerkung der Verwaltung: Die Schriftliche Anfrage betrifft Sachverhalte, die der Senat nicht aus eigener Zuständigkeit und Kenntnis beantworten kann. Er ist gleichwohl bemüht, Ihnen eine Antwort auf Ihre Anfrage zukommen zu lassen und hat daher das Bezirksamt Pankow um Stellungnahme gebeten, die von dort in eigener Verantwortung erstellt und dem Senat übermittelt wurde. Sie wird in der Antwort an den entsprechend gekennzeichneten Stellen wiedergegeben.   Frage 1:   Wie ist der Arbeitsstand bei der Umsetzung der Forderung aus dem § 19 des Berliner Klimaschutzund Energiewendegesetzes (EWG Bln), auf Dächern öffentlicher Gebäude spätestens bis zum 31. Dezember 2024 Solaranlagen auf der gesamten technisch nutzbaren Dachfläche zu errichten, im Bezirk Pankow?   Antwort zu 1:   Das Bezirksamt Pankow teilt hierzu mit: „Bei allen Maßnahmen werden entsprechende Vorbereitungen für eine nachträgliche Installation einer PV-Anlage (PV-Readiness) geplant und innerhalb eines Jahres nach Bauabnahme werden die entsprechend geeigneten Dachflächen mit einer Solaranlage versehen. Vereinzelte Maßnahmen werden bereits mit einer PV-Anlage geplant, so dass mit der Bauabnahme auch die PV-Anlage in Betrieb genommen ist.“    ",
							page: 1,
							processed_document_id: 5,
						},
						similarity: 0.884565949440002,
					},
					{
						processed_document_chunk: {
							id: 4,
							content:
								"# Drucksache 19 Schriftliche Anfrage / 10 006   19. Wahlperiode   # Schriftliche Anfrage   ## des Abgeordneten Andreas Otto (GRÜNE)   vom 04. November 2021 (Eingang beim Abgeordnetenhaus am 04. November 2021)   ## zum Thema: Wann kommen die Solaranlagen nach Pankow?   ## und Antwort vom 12. November 2021 (Eingang beim Abgeordnetenhaus am 16. Nov. 2021)    ",
							page: 0,
							processed_document_id: 5,
						},
						similarity: 0.865424394607544,
					},
					{
						processed_document_chunk: {
							id: 6,
							content:
								"## 2   Frage 2:   Welche öffentlichen Gebäude im Sinne des o.g. §19 EWG Bln befinden sich im Bezirk Pankow?   Antwort zu 2:   Das Bezirksamt Pankow teilt hierzu mit: „Es gibt ca. 257 öffentliche Gebäude im Sinne des § 19 EWG Bln im Bezirk Pankow.“   Frage 3:   Welche Verfügungsberechtigten (z.B. Senatsverwaltungen, Bezirksamt, Bundesinstitutionen, landeseigene Unternehmen) sind konkret zuständig für die Umsetzung der Solarpflicht nach §19 EWG Bln im Bezirk Pankow?   Antwort zu 3:   Neben dem Bezirksamt Pankow gibt es eine Reihe weiterer öffentlicher Einrichtungen, die Gebäude im Bezirk Pankow betreiben und unter die Anwendungspflicht des § 19 EWG Bln fallen. Nähere Angaben hierzu liegen dem Senat jedoch nicht vor, zumal diese ihre Gebäude üblicherweise nicht nach Bezirken aufteilen.   Frage 4:   Wie groß schätzt der Senat die Summe der o.g. Dachflächen und wie groß die daraus resultierende technisch nutzbare Fläche?   Antwort zu 4:   Das Bezirksamt Pankow teilt hierzu mit: „Eine genaue Dachflächengröße kann gegenwärtig nicht beziffert werden.“   Frage 5:   Welcher Anteil der o.g. Dachflächen ist bereits heute mit Solaranlagen belegt?   Antwort zu 5:   Das Bezirksamt Pankow teilt hierzu mit: „Es wurden bisher ca. 29.000 m² der Dachflächen mit Solaranlagen belegt.“   Frage 6:   Welcher Anteil der o.g. Dachflächen soll jeweils in den Jahren 2022/2023/2024 mit Solaranlagen belegt werden?    ",
							page: 2,
							processed_document_id: 5,
						},
						similarity: 0.863236784934998,
					},
				],
			},
		],
	},
};

export {
	testEmbedding,
	testSearchQuery,
	testSearchQueryFlagged,
	testModerationResponse,
	testEmbeddingResponse,
	testAnswer,
	testGenAnswerReqBody,
	testUserRequestResponse,
};
